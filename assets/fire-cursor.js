/**
 * Fire Mouse Trail - Game of Thrones: A Song of Ice and Fire
 * Generates an incandescent, rising fire ember & magic spark particle trail behind the cursor.
 */
(() => {
  const canvas = document.createElement('canvas');
  canvas.id = 'fire-cursor-canvas';
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const maxParticles = 180;

  // Fire palette with subtle ice/magic sparks
  const fireColors = [
    { r: 255, g: 230, b: 120 }, // bright core / yellow-white
    { r: 255, g: 170, b: 30 },  // gold flame
    { r: 255, g: 90,  b: 10 },  // intense orange
    { r: 255, g: 45,  b: 0 },   // crimson flame
    { r: 210, g: 20,  b: 0 },   // deep red ember
    { r: 79,  g: 179, b: 255 }, // blue ice spark accent
  ];

  class FireParticle {
    constructor(x, y, vx, vy, size, color) {
      this.x = x;
      this.y = y;
      this.vx = vx || (Math.random() - 0.5) * 2.2;
      this.vy = vy || (Math.random() - 0.5) * 2.2 - (1.2 + Math.random() * 1.8); // Natural upward heat draft
      this.size = size || (Math.random() * 7 + 4);
      this.color = color || fireColors[Math.floor(Math.random() * (Math.random() < 0.08 ? fireColors.length : fireColors.length - 1))];
      this.life = 1.0;
      this.decay = Math.random() * 0.03 + 0.02; // Fades smoothly in ~30-50 frames
      this.spin = (Math.random() - 0.5) * 0.1;
      this.angle = Math.random() * Math.PI * 2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy -= 0.06; // Heat buoyance: accelerates upward as it burns
      this.vx *= 0.98; // Air resistance
      this.size *= 0.95; // Shrink as it burns out
      this.life -= this.decay;
      this.angle += this.spin;
    }

    draw(ctx) {
      if (this.life <= 0 || this.size <= 0.2) return;
      const alpha = Math.max(0, this.life);
      
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`;
      ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.8)`;
      ctx.shadowBlur = this.size * 2.5;

      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.1, this.size), 0, Math.PI * 2);
      ctx.fill();

      // Inner white-hot glowing core
      if (this.size > 2.5 && alpha > 0.4) {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }

  let mouseX = -100;
  let mouseY = -100;
  let lastX = -100;
  let lastY = -100;
  let isMoving = false;
  let animRunning = false;

  function spawnFire(x, y, count = 4, speedMultiplier = 1) {
    for (let i = 0; i < count; i++) {
      if (particles.length >= maxParticles) {
        particles.shift();
      }
      const jitterX = (Math.random() - 0.5) * 8;
      const jitterY = (Math.random() - 0.5) * 8;
      const vx = ((Math.random() - 0.5) * 2.5 + (x - lastX) * 0.15) * speedMultiplier;
      const vy = ((Math.random() - 0.5) * 2.5 + (y - lastY) * 0.15 - (1.5 + Math.random() * 2)) * speedMultiplier;
      const size = Math.random() * 7 + 4;
      particles.push(new FireParticle(x + jitterX, y + jitterY, vx, vy, size));
    }
    if (!animRunning) {
      animRunning = true;
      requestAnimationFrame(animate);
    }
  }

  function handleMove(e) {
    const x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : mouseX);
    const y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : mouseY);
    if (x === undefined || y === undefined) return;

    mouseX = x;
    mouseY = y;

    if (lastX === -100) {
      lastX = mouseX;
      lastY = mouseY;
    }

    // Spawn sparks based on distance moved
    const dist = Math.hypot(mouseX - lastX, mouseY - lastY);
    const numToSpawn = Math.min(8, Math.max(2, Math.floor(dist / 4)));
    
    // Interpolate between last position and current for seamless trailing
    for (let i = 0; i < numToSpawn; i++) {
      const t = i / numToSpawn;
      const interpX = lastX + (mouseX - lastX) * t;
      const interpY = lastY + (mouseY - lastY) * t;
      spawnFire(interpX, interpY, 1);
    }

    lastX = mouseX;
    lastY = mouseY;
  }

  window.addEventListener('mousemove', handleMove, { passive: true });
  window.addEventListener('touchmove', handleMove, { passive: true });

  // Burst on click
  function handleClick(e) {
    const x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : mouseX);
    const y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : mouseY);
    if (x === undefined || y === undefined) return;

    for (let i = 0; i < 24; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 1.5;
      const size = Math.random() * 8 + 3;
      particles.push(new FireParticle(x, y, vx, vy, size));
    }
    if (!animRunning) {
      animRunning = true;
      requestAnimationFrame(animate);
    }
  }

  window.addEventListener('mousedown', handleClick, { passive: true });
  window.addEventListener('touchstart', handleClick, { passive: true });

  function animate() {
    ctx.clearRect(0, 0, width, height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.life <= 0 || p.size <= 0.2) {
        particles.splice(i, 1);
      }
    }

    if (particles.length > 0) {
      requestAnimationFrame(animate);
    } else {
      animRunning = false;
      lastX = -100;
      lastY = -100;
    }
  }
})();
