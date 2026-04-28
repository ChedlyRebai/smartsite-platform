import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, Optional } from '@nestjs/common';
import { IncidentEventsService, IncidentEventListener } from './incidents-events.service';
import { IncidentsService } from './incidents.service';

interface ConnectedClient {
  socket: Socket;
  userCin?: string;
}

@WebSocketGateway(3004, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class IncidentsGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, IncidentEventListener
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('IncidentsGateway');
  private connectedClients: Map<string, ConnectedClient> = new Map();
  private userSubscriptions: Map<string, Set<string>> = new Map(); // userCin -> Set<socketId>

  constructor(
    @Optional()
    private readonly eventsService: IncidentEventsService,
    private readonly incidentsService: IncidentsService,
  ) {}

  afterInit() {
    if (this.eventsService) {
      this.logger.log('📌 Gateway registering as incident event listener');
      this.eventsService.registerListener(this);
    }
  }

  handleConnection(socket: Socket) {
    this.logger.log(`🔌 Client connected: ${socket.id}`);
  }

  handleDisconnect(socket: Socket) {
    this.logger.log(`❌ Client disconnected: ${socket.id}`);
    this.connectedClients.delete(socket.id);

    // Remove user subscription
    this.userSubscriptions.forEach((socketIds) => {
      socketIds.delete(socket.id);
    });
  }

  @SubscribeMessage('subscribe')
  async handleSubscribe(socket: Socket, data: { userCin: string }) {
    const socketId = socket.id;
    const { userCin } = data;

    this.logger.log(`👤 User subscribed: ${userCin} on socket ${socketId}`);

    // Store client info
    this.connectedClients.set(socketId, {
      socket,
      userCin,
    });

    // Subscribe user to notifications
    if (!this.userSubscriptions.has(userCin)) {
      this.userSubscriptions.set(userCin, new Set());
    }
    this.userSubscriptions.get(userCin)!.add(socketId);

    // Send confirmation
    socket.emit('subscribed', {
      message: `Subscribed to incident notifications for ${userCin}`,
      userCin,
    });

    // Send unresolved incidents already assigned before this user connected.
    const pendingIncidents = await this.incidentsService.findOpenByAssignedUserCin(userCin);
    pendingIncidents.forEach((incident) => {
      socket.emit('incident:assigned', {
        incidentId: (incident as any)._id,
        incidentName: (incident as any).incidentName || (incident as any).title,
        description: (incident as any).description,
        priority: (incident as any).priority,
        severity: (incident as any).severity,
        type: (incident as any).type,
        assignedToCin: userCin,
        timestamp: new Date().toISOString(),
      });
    });

    this.logger.log(`📬 Sent ${pendingIncidents.length} pending incidents to ${userCin}`);
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(socket: Socket, data: { userCin: string }) {
    const socketId = socket.id;
    const { userCin } = data;

    this.logger.log(`👤 User unsubscribed: ${userCin}`);

    // Remove subscription
    if (this.userSubscriptions.has(userCin)) {
      this.userSubscriptions.get(userCin)!.delete(socketId);
    }
  }

  /**
   * Implementation of IncidentEventListener
   */
  onIncidentAssigned(userCin: string, incident: any) {
    this.notifyIncidentAssignment(userCin, incident);
  }

  onIncidentUpdated(userCin: string, incident: any, action: string) {
    this.notifyIncidentUpdate(userCin, incident, action);
  }

  onIncidentBroadcast(incident: any, action: string) {
    this.broadcastIncidentUpdate(incident, action);
  }

  /**
   * Notify a specific user about an incident assignment
   */
  notifyIncidentAssignment(userCin: string, incident: any) {
    this.logger.log(`📢 Notifying user ${userCin} about incident assignment: ${incident._id}`);

    const socketIds = this.userSubscriptions.get(userCin);
    if (socketIds && socketIds.size > 0) {
      socketIds.forEach((socketId) => {
        const client = this.connectedClients.get(socketId);
        if (client) {
          client.socket.emit('incident:assigned', {
            incidentId: incident._id,
            incidentName: incident.incidentName || incident.title,
            description: incident.description,
            priority: incident.priority,
            severity: incident.severity,
            type: incident.type,
            assignedToCin: userCin,
            timestamp: new Date().toISOString(),
          });
        }
      });
    }
  }

  /**
   * Notify about incident update
   */
  notifyIncidentUpdate(userCin: string, incident: any, action: string) {
    this.logger.log(`📢 Notifying user ${userCin} about incident ${action}: ${incident._id}`);

    const socketIds = this.userSubscriptions.get(userCin);
    if (socketIds && socketIds.size > 0) {
      socketIds.forEach((socketId) => {
        const client = this.connectedClients.get(socketId);
        if (client) {
          client.socket.emit(`incident:${action}`, {
            incidentId: incident._id,
            incidentName: incident.incidentName || incident.title,
            status: incident.status,
            timestamp: new Date().toISOString(),
          });
        }
      });
    }
  }

  /**
   * Broadcast to all connected clients
   */
  broadcastIncidentUpdate(incident: any, action: string) {
    this.logger.log(`📢 Broadcasting incident ${action}: ${incident._id}`);

    this.server.emit(`incident:${action}`, {
      incidentId: incident._id,
      incidentName: incident.incidentName || incident.title,
      status: incident.status,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Get subscription status
   */
  getSubscriptionStatus(): Record<string, number> {
    const status: Record<string, number> = {};
    this.userSubscriptions.forEach((socketIds, userCin) => {
      status[userCin] = socketIds.size;
    });
    return status;
  }
}
