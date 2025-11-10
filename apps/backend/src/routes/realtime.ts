import { FastifyInstance } from 'fastify';
import type { SocketStream } from '@fastify/websocket';
import { z } from 'zod';

const querySchema = z.object({
  token: z.string()
});

interface SessionClient {
  sessionId: string;
  participantId: string;
  socket: SocketStream['socket'];
}

const sessionClients = new Map<string, Set<SessionClient>>();

export const registerRealtimeGateway = (app: FastifyInstance) => {
  app.get('/ws', { websocket: true }, (connection, request) => {
    const { token } = querySchema.parse(request.query);

    let payload: { sessionId: string; participantId: string };
    try {
      payload = app.jwt.verify(token) as { sessionId: string; participantId: string };
    } catch (error) {
      request.log.error({ err: error }, 'invalid session token');
      connection.socket.close();
      return;
    }

    const client: SessionClient = {
      sessionId: payload.sessionId,
      participantId: payload.participantId,
      socket: connection.socket
    };

    const clients = sessionClients.get(payload.sessionId) ?? new Set<SessionClient>();
    clients.add(client);
    sessionClients.set(payload.sessionId, clients);

    request.log.info({ sessionId: payload.sessionId, participantId: payload.participantId }, 'participant connected');

    connection.socket.on('message', async (raw) => {
      const message = raw.toString();
      request.log.info({ message }, 'received chat message');

      await app.prisma.message.create({
        data: {
          sessionId: payload.sessionId,
          senderType: 'PARTICIPANT',
          senderId: payload.participantId,
          payload: { text: message }
        }
      });

      const peers = sessionClients.get(payload.sessionId);
      peers?.forEach((peer) => {
        if (peer.socket.readyState === peer.socket.OPEN) {
          peer.socket.send(JSON.stringify({ senderId: payload.participantId, message }));
        }
      });
    });

    connection.socket.on('close', () => {
      const peers = sessionClients.get(payload.sessionId);
      peers?.delete(client);
      request.log.info({ sessionId: payload.sessionId, participantId: payload.participantId }, 'participant disconnected');
    });
  });
};
