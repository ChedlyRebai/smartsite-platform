import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

// Type simplifié pour éviter les conflits de typage
type RabbitMQConnection = any;
type RabbitMQChannel = any;

@Injectable()
export class RabbitMQService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: RabbitMQConnection = null;
  private channel: RabbitMQChannel = null;
  private readonly uri: string;
  private readonly exchangeName = 'chat.exchange';
  private readonly notificationExchange = 'notification.exchange';
  private readonly deadLetterExchange = 'dead.letter.exchange';

  constructor(private configService: ConfigService) {
    this.uri = this.configService.get('RABBITMQ_URI') || 'amqp://localhost:5672';
  }

  async onModuleInit() {
    await this.connect();
    await this.setupExchanges();
    await this.setupQueues();
  }

  async onModuleDestroy() {
    await this.close();
  }

  private async connect() {
    try {
      this.connection = await amqp.connect(this.uri);
      this.channel = await this.connection.createChannel();
      this.logger.log('✅ Connected to RabbitMQ');
      
      this.connection.on('error', (error: Error) => {
        this.logger.error('RabbitMQ connection error:', error);
        setTimeout(() => this.connect(), 5000);
      });
      
      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed, reconnecting...');
        setTimeout(() => this.connect(), 5000);
      });
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
      setTimeout(() => this.connect(), 5000);
    }
  }

  private async setupExchanges() {
    if (!this.channel) return;
    
    try {
      await this.channel.assertExchange(this.exchangeName, 'topic', {
        durable: true,
        arguments: {
          'alternate-exchange': this.deadLetterExchange
        }
      });
      
      await this.channel.assertExchange(this.notificationExchange, 'fanout', {
        durable: true
      });
      
      await this.channel.assertExchange(this.deadLetterExchange, 'direct', {
        durable: true
      });
      
      this.logger.log('✅ Exchanges configured');
    } catch (error) {
      this.logger.error('Failed to setup exchanges:', error);
    }
  }

  private async setupQueues() {
    if (!this.channel) return;
    
    try {
      const supplierQueue = await this.channel.assertQueue('supplier.notifications', {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': this.deadLetterExchange,
          'x-message-ttl': 86400000
        }
      });
      
      await this.channel.bindQueue(supplierQueue.queue, this.notificationExchange, '');
      
      const siteQueue = await this.channel.assertQueue('site.notifications', {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': this.deadLetterExchange,
          'x-message-ttl': 86400000
        }
      });
      
      await this.channel.bindQueue(siteQueue.queue, this.notificationExchange, '');
      
      const chatPersistenceQueue = await this.channel.assertQueue('chat.persistence', {
        durable: true
      });
      
      await this.channel.bindQueue(chatPersistenceQueue.queue, this.exchangeName, 'chat.message.*');
      
      this.logger.log('✅ Queues configured');
    } catch (error) {
      this.logger.error('Failed to setup queues:', error);
    }
  }

  async publishMessage(routingKey: string, message: any): Promise<boolean> {
    if (!this.channel) {
      this.logger.error('Cannot publish message: channel not available');
      return false;
    }
    
    try {
      const success = this.channel.publish(
        this.exchangeName,
        routingKey,
        Buffer.from(JSON.stringify(message)),
        {
          persistent: true,
          timestamp: Date.now(),
          contentType: 'application/json',
          messageId: this.generateMessageId()
        }
      );
      
      this.logger.debug(`📤 Published message to ${routingKey}`);
      return success;
    } catch (error) {
      this.logger.error(`Failed to publish message: ${error.message}`);
      return false;
    }
  }

  async publishNotification(notification: any): Promise<boolean> {
    if (!this.channel) return false;
    
    try {
      const success = this.channel.publish(
        this.notificationExchange,
        '',
        Buffer.from(JSON.stringify(notification)),
        {
          persistent: true,
          timestamp: Date.now(),
          contentType: 'application/json'
        }
      );
      
      this.logger.debug(`📢 Published notification`);
      return success;
    } catch (error) {
      this.logger.error(`Failed to publish notification: ${error.message}`);
      return false;
    }
  }

  async consume(queueName: string, onMessage: (message: any) => void): Promise<void> {
    if (!this.channel) return;
    
    await this.channel.consume(queueName, (message: any) => {
      if (message) {
        try {
          onMessage(message);
          if (this.channel) {
            this.channel.ack(message);
          }
        } catch (error) {
          this.logger.error(`Error processing message: ${error.message}`);
          if (this.channel) {
            this.channel.nack(message, false, true);
          }
        }
      }
    }, { noAck: false });
    
    this.logger.log(`✅ Consuming from queue: ${queueName}`);
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async close() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.logger.log('RabbitMQ connection closed');
    } catch (error) {
      this.logger.error('Error closing RabbitMQ connection:', error);
    }
  }

  async getChannel(): Promise<any> {
    return this.channel;
  }

  async getConnection(): Promise<any> {
    return this.connection;
  }

  async isConnected(): Promise<boolean> {
    return this.channel !== null && this.connection !== null;
  }
}