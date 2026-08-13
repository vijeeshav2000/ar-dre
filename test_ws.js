const WebSocket = require('ws');

console.log('--- Testing WebSocket Relay ---');
console.log('Connecting viewer...');

const viewer = new WebSocket('wss://score-relay.iceandfire.workers.dev/ws?room=quantum1&name=dashboard&role=viewer');

viewer.on('open', () => {
  console.log('VIEWER: connected');

  // Wait a beat, then connect player
  setTimeout(() => {
    console.log('Connecting player...');
    const player = new WebSocket('wss://score-relay.iceandfire.workers.dev/ws?room=quantum1&name=Ice&role=player');

    player.on('open', () => {
      console.log('PLAYER: connected');
      const msg = { type: 'score', name: 'Ice', ice: 7, fire: 0 };
      console.log('PLAYER: sending', JSON.stringify(msg));
      player.send(JSON.stringify(msg));

      // Wait then close
      setTimeout(() => {
        console.log('PLAYER: closing');
        player.close();
      }, 3000);
    });

    player.on('message', (data) => {
      console.log('PLAYER received:', data.toString().substring(0, 200));
    });

    player.on('error', (e) => console.log('PLAYER ERROR:', e.message));
  }, 1000);
});

viewer.on('message', (data) => {
  console.log('VIEWER received:', data.toString().substring(0, 500));
});

viewer.on('error', (e) => console.log('VIEWER ERROR:', e.message));
viewer.on('close', () => console.log('VIEWER: closed'));

// Timeout after 10 seconds
setTimeout(() => {
  console.log('\n--- TIMEOUT after 10s ---');
  console.log('If viewer received nothing, the relay is NOT forwarding messages.');
  viewer.close();
  process.exit(0);
}, 10000);
