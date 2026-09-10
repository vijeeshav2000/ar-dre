export interface Env {
  SCORE_ROOM: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' };

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: cors });
    }

    const roomId = url.searchParams.get('room') || 'default';
    const id = env.SCORE_ROOM.idFromName(roomId);
    const room = env.SCORE_ROOM.get(id);

    if (url.pathname === '/ws' || url.pathname === '/state' || url.pathname === '/score' || url.pathname === '/universe' || url.pathname === '/reset') {
      const res = await room.fetch(request);
      // Attach CORS headers to non-websocket responses
      if (res.status !== 101) {
        const newHeaders = new Headers(res.headers);
        Object.entries(cors).forEach(([k, v]) => newHeaders.set(k, v));
        return new Response(res.body, { status: res.status, headers: newHeaders });
      }
      return res;
    }

    return new Response('AR-DRE Score Relay Service Running', { status: 200, headers: cors });
  },
};

export class ScoreRoom {
  state: DurableObjectState;
  sessions: Set<WebSocket>;
  scores: Record<string, { ice: number; fire: number; reveal?: boolean }>;

  constructor(state: DurableObjectState) {
    this.state = state;
    this.sessions = new Set();
    this.scores = {};
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const cors = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    // --- HTTP REST handlers ---
    if (url.pathname === '/state') {
      return new Response(JSON.stringify({ type: 'state', scores: this.scores }), { headers: cors });
    }

    if (url.pathname === '/score' && request.method === 'POST') {
      try {
        const body: any = await request.json();
        const { name, ice, fire, reveal } = body;
        if (name) {
          this.scores[name] = { ice: ice || 0, fire: fire || 0 };
          if (reveal) (this.scores[name] as any).reveal = true;
        }
        this.broadcast(JSON.stringify({ type: 'state', scores: this.scores }));
        return new Response(JSON.stringify({ success: true, scores: this.scores }), { headers: cors });
      } catch(e) {
        return new Response(JSON.stringify({ error: 'bad request' }), { status: 400, headers: cors });
      }
    }

    if (url.pathname === '/reset') {
      this.scores = {};
      this.broadcast(JSON.stringify({ type: 'state', scores: this.scores }));
      return new Response(JSON.stringify({ success: true }), { headers: cors });
    }

    if (url.pathname === '/universe') {
      let totalIce = 0, totalFire = 0;
      for (const s of Object.values(this.scores)) { totalIce += s.ice || 0; totalFire += s.fire || 0; }
      let winner = 'tie';
      if (totalIce > totalFire) winner = 'ice';
      else if (totalFire > totalIce) winner = 'fire';
      this.broadcast(JSON.stringify({ type: 'universe', winner, totalIce, totalFire }));
      return new Response(JSON.stringify({ winner, totalIce, totalFire }), { headers: cors });
    }

    // --- WebSocket upgrade ---
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
          const { name, ice, fire, reveal } = data;
          if (name) {
            this.scores[name] = { ice: ice || 0, fire: fire || 0 };
            if (reveal) this.scores[name].reveal = true;
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
    const sockets = typeof this.state.getWebSockets === 'function' ? this.state.getWebSockets() : Array.from(this.sessions);
    for (const session of sockets) {
      try {
        session.send(message);
      } catch (e) {
        this.sessions.delete(session);
      }
    }
  }
}
