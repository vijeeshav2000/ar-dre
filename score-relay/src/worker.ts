export interface Env {
  SCORE_ROOM: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/ws') {
      const roomId = url.searchParams.get('room') || 'default';
      const id = env.SCORE_ROOM.idFromName(roomId);
      const room = env.SCORE_ROOM.get(id);
      return room.fetch(request);
    }

    return new Response('AR-DRE Score Relay Service Running', { status: 200 });
  },
};

export class ScoreRoom {
  state: DurableObjectState;
  sessions: Set<WebSocket>;
  scores: Record<string, { ice: number; fire: number }>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Set();
    this.scores = {};
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const role = url.searchParams.get('role') || 'player';
    const name = url.searchParams.get('name') || 'Player';

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    this.state.acceptWebSocket(server);
    this.sessions.add(server);

    // Store socket metadata
    (server as any).role = role;
    (server as any).playerName = name;

    server.addEventListener('message', async (event) => {
      try {
        const data = JSON.parse(event.data as string);

        if (data.type === 'score') {
          const { name, ice, fire } = data;
          if (name) {
            this.scores[name] = { ice: ice || 0, fire: fire || 0 };
          }
          // Broadcast score state to all connected clients
          this.broadcast(JSON.stringify({ type: 'state', scores: this.scores }));
        } else if (data.type === 'universe') {
          // Calculate authoritative winner
          let totalIce = 0;
          let totalFire = 0;
          for (const s of Object.values(this.scores)) {
            totalIce += s.ice || 0;
            totalFire += s.fire || 0;
          }
          let winner = 'tie';
          if (totalIce > totalFire) winner = 'ice';
          else if (totalFire > totalIce) winner = 'fire';

          this.broadcast(JSON.stringify({ type: 'universe', winner, totalIce, totalFire }));
        }
      } catch (err) {
        console.error('Error handling WebSocket message:', err);
      }
    });

    server.addEventListener('close', () => {
      this.sessions.delete(server);
    });

    // Send initial score state on connection
    server.send(JSON.stringify({ type: 'state', scores: this.scores }));

    return new Response(null, { status: 101, webSocket: client });
  }

  broadcast(message: string) {
    for (const session of this.sessions) {
      try {
        session.send(message);
      } catch (e) {
        this.sessions.delete(session);
      }
    }
  }
}
