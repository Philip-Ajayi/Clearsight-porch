import { WebSocket } from 'ws';
import { DoorbellEventPayload } from '../types/index.js';

export class EventBroadcaster {
  private static clients: Set<WebSocket> = new Set();

  public static registerClient(ws: WebSocket) {
    this.clients.add(ws);
    ws.on('close', () => {
      this.clients.delete(ws);
    });
  }

  public static broadcastEvent(payload: DoorbellEventPayload) {
    const serialized = JSON.stringify({ type: 'DOORBELL_EVENT', data: payload });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    }
  }

  public static broadcastChimeAck(deviceId: string, audioRef: string) {
    const serialized = JSON.stringify({
      type: 'CHIME_PLAYED',
      data: { deviceId, audioRef, timestamp: new Date().toISOString() }
    });
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(serialized);
      }
    }
  }

  public static getActiveClientCount(): number {
    return this.clients.size;
  }
}
