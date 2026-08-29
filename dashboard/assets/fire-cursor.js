/**
 * Hyper-Fast 120FPS Fire & Ice Cursor Engine
 * 100% zero-reflow event architecture (no elementFromPoint).
 * Ultra-responsive, snappy, lightweight particle trail.
 */
(() => {
  const canvas = document.createElement('canvas');
  canvas.id = 'fire-cursor-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:999999;transform:translateZ(0);will-change:transform;';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }, { passive: true });

  const particles = [];
  const MAX_PARTICLES = 40; // Lean, hyper-responsive pool

  // Vibrant, glowing color constants
  const COLOR_FIRE_CORE = 'rgba(255, 240, 160, ';
  const COLOR_FIRE_GOLD = 'rgba(255, 170, 30, ';
  const COLOR_FIRE_FLAME = 'rgba(255, 80, 10, ';
  const COLOR_FIRE_EMBER = 'rgba(230, 40, 0, ';
  const COLOR_ICE_SPARK = 'rgba(90, 200, 255, ';
  const COLOR_ICE_WHITE = 'rgba(220, 250, 255, ';

  const FIRE_COLORS = [COLOR_FIRE_CORE, COLOR_FIRE_GOLD, COLOR_FIRE_FLAME, COLOR_FIRE_EMBER];
  const ICE_COLORS = [COLOR_ICE_SPARK, COLOR_ICE_WHITE, COLOR_FIRE_CORE];

  let mouseX = -100;
  let mouseY = -100;
  let lastX = -100;
  let lastY = -100;
  let isOverIce = false;
  let animId = null;

  // Zero-reflow hover detection via delegated mouseover
  document.addEventListener('mouseover', (e) => {
    if (e.target && e.target.closest) {
      isOverIce = !!e.target.closest('.got-btn, .throne-btn, .home-btn, button, a');
    }
  }, { passive: true });

  class Spark {
    constructor(x, y, vx, vy, size, colorBase, isAnnihilation) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.size = size;
      this.colorBase = colorBase;
      this.isAnnihilation = isAnnihilation;
      this.life = 1.0;
      // Snappy, energetic decay for instant responsiveness
      this.decay = isAnnihilation ? 0.065 : (Math.random() * 0.045 + 0.04);
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy -= 0.08; // Quick upward buoyant rise
      this.vx *= 0.94;
      this.size *= 0.93;
      this.life -= this.decay;
    }

    draw(ctx) {
      if (this.life <= 0 || this.size < 0.3) return;
      const alpha = this.life;

      ctx.fillStyle = this.colorBase + (alpha * 0.95) + ')';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, 6.2831853);
      ctx.fill();

      // Sharp radiant white-hot micro-center
      if (this.size > 1.2 && alpha > 0.4) {
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (alpha * 0.95) + ')';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.4, 0, 6.2831853);
        ctx.fill();
      }
    }
  }

  function addParticle(p) {
    if (particles.length >= MAX_PARTICLES) {
      particles.shift();
    }
    particles.push(p);
  }

  let lastMoveTime = 0;

  function onPointerMove(e) {
    const x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : mouseX);
    const y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : mouseY);
    if (x === undefined || y === undefined) return;

    mouseX = x;
    mouseY = y;

    if (lastX === -100) {
      lastX = mouseX;
      lastY = mouseY;
    }

    const now = performance.now();
    const dt = now - lastMoveTime;
    const dx = mouseX - lastX;
    const dy = mouseY - lastY;
    const distSq = dx * dx + dy * dy;

    // Minimum movement threshold for ultra-clean response
    if (distSq > 9 && dt > 10) {
      lastMoveTime = now;
      const dist = Math.sqrt(distSq);
      const count = isOverIce ? 3 : 2;

      for (let i = 0; i < count; i++) {
        const t = (i + 1) / count;
        const px = lastX + dx * t + (Math.random() - 0.5) * 3;
        const py = lastY + dy * t + (Math.random() - 0.5) * 3;

        if (isOverIce) {
          // Annihilation sparks on Ice buttons
          const col = Math.random() > 0.5 
            ? FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)]
            : ICE_COLORS[Math.floor(Math.random() * ICE_COLORS.length)];
          const angle = Math.random() * 6.2831853;
          const spd = Math.random() * 3.2 + 1.5;
          addParticle(new Spark(px, py, Math.cos(angle) * spd, Math.sin(angle) * spd - 1, Math.random() * 2.2 + 1.2, col, true));
        } else {
          // Normal Fire Embers (Snappy, fast and delicate)
          const col = FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)];
          const vx = (Math.random() - 0.5) * 1.8 + dx * 0.08;
          const vy = (Math.random() - 0.5) * 1.8 + dy * 0.08 - (1.0 + Math.random() * 1.5);
          addParticle(new Spark(px, py, vx, vy, Math.random() * 2.5 + 1.2, col, false));
        }
      }

      lastX = mouseX;
      lastY = mouseY;
    }

    if (!animId) {
      animId = requestAnimationFrame(loop);
    }
  }

  window.addEventListener('mousemove', onPointerMove, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });

  // Quick energetic click burst
  function onPointerDown(e) {
    const x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : mouseX);
    const y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : mouseY);
    if (x === undefined || y === undefined) return;

    const count = isOverIce ? 16 : 10;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * 6.2831853;
      const speed = Math.random() * 4.5 + 2;
      const col = isOverIce && Math.random() > 0.5
        ? ICE_COLORS[Math.floor(Math.random() * ICE_COLORS.length)]
        : FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)];
      addParticle(new Spark(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 1.2, Math.random() * 2.5 + 1.2, col, isOverIce));
    }

    if (!animId) {
      animId = requestAnimationFrame(loop);
    }
  }

  window.addEventListener('mousedown', onPointerDown, { passive: true });
  window.addEventListener('touchstart', onPointerDown, { passive: true });

  function loop() {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.life <= 0 || p.size < 0.3) {
        particles.splice(i, 1);
      }
    }

    if (particles.length > 0) {
      animId = requestAnimationFrame(loop);
    } else {
      animId = null;
      lastX = -100;
      lastY = -100;
    }
  }
})();
