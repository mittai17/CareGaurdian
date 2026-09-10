import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * Minimal WebSocket gateway for real-time push notifications.
 *
 * Clients authenticate then join a room `user:<userId>`. The
 * NotificationsService (or any caller) can emit to this gateway via
 * `gateway.emitToUser(userId, payload)`.
 *
 * NOTE: This gateway does NOT enforce auth at the socket level — that is
 * handled by the REST endpoints. For production, add the JWT guard on
 * `handleConnection`.
 */
@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: '*' },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server!: Server;

  afterInit() {
    this.logger.log('NotificationsGateway initialised');
  }

  handleConnection(client: Socket) {
    this.logger.debug(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  /**
   * Emit a `notification` event to the user's room.
   */
  emitToUser(userId: string, payload: Record<string, unknown>) {
    const room = `user:${userId}`;
    this.server?.to(room).emit('notification', payload);
  }

  /**
   * Let a client join its user room.
   */
  joinUserRoom(client: Socket, userId: string) {
    const room = `user:${userId}`;
    client.join(room);
    this.logger.debug(`Client ${client.id} joined room ${room}`);
  }
}
