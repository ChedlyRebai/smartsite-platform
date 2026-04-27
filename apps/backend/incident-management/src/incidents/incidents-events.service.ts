import { Injectable, Logger } from '@nestjs/common';

export interface IncidentEventListener {
  onIncidentAssigned(userCin: string, incident: any): void;
  onIncidentUpdated(userCin: string, incident: any, action: string): void;
  onIncidentBroadcast(incident: any, action: string): void;
}

@Injectable()
export class IncidentEventsService {
  private logger = new Logger('IncidentEventsService');
  private listeners: IncidentEventListener[] = [];

  registerListener(listener: IncidentEventListener) {
    this.logger.log('📌 Registering incident event listener');
    this.listeners.push(listener);
  }

  unregisterListener(listener: IncidentEventListener) {
    this.logger.log('📌 Unregistering incident event listener');
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  notifyIncidentAssigned(userCin: string, incident: any) {
    this.logger.log(`📢 Emitting incident:assigned event for user ${userCin}`);
    this.listeners.forEach((listener) => {
      try {
        listener.onIncidentAssigned(userCin, incident);
      } catch (error) {
        this.logger.error('Error in listener:', error);
      }
    });
  }

  notifyIncidentUpdated(userCin: string, incident: any, action: string) {
    this.logger.log(`📢 Emitting incident:${action} event for user ${userCin}`);
    this.listeners.forEach((listener) => {
      try {
        listener.onIncidentUpdated(userCin, incident, action);
      } catch (error) {
        this.logger.error('Error in listener:', error);
      }
    });
  }

  broadcastIncidentUpdate(incident: any, action: string) {
    this.logger.log(`📢 Broadcasting incident:${action} event`);
    this.listeners.forEach((listener) => {
      try {
        listener.onIncidentBroadcast(incident, action);
      } catch (error) {
        this.logger.error('Error in listener:', error);
      }
    });
  }
}
