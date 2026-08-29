/**
 * Ultra-Smooth & Lightweight Fire & Ice Annihilation Cursor Engine
 * Optimized for silky 60-120fps performance with crisp, tiny ember sparks.
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

  const ctx = canvas.getContext('2d', { alpha: true });
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }, { passive: true });

  const particles = [];
  const maxParticles = 65; // Lightweight limit prevents frame drops

  // Crisp, radiant ember colors
  const fireColors = [
    '255, 235, 140', // brilliant core
    '255, 175, 40',  // radiant gold
    '255, 95, 15',   // vivid flame
    '235, 45, 5',    // crisp ember
  ];

  const iceColors = [
    '210, 245, 255', // glacial frost
    '80, 190, 255',  // cyan antimatter
    '255, 255, 255', // pure spark
  ];

  class Ember {
    constructor(x, y, vx, vy, size, colorStr, isAnnihilation = false) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.size = size;
      this.colorStr = colorStr;
      this.isAnnihilation = isAnnihilation;
      this.life = 1.0;
      // Fast, snappy decay for clean visuals and low overhead
      this.decay = isAnnihilation ? 0.045 : (Math.random() * 0.035 + 0.03);
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.vy -= 0.05; // Gentle upward thermal draft
      this.vx *= 0.96; // Air resistance
      this.size *= 0.94; // Smooth shrink
      this.life -= this.decay;
    }

    draw(ctx) {
      if (this.life <= 0 || this.size < 0.2) return;
      const alpha = this.life;

      // Ultra-fast drawing using composite mode without CPU-heavy shadowBlur
      ctx.fillStyle = `rgba(${this.colorStr}, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();

      // Sharp white-hot center for incandescent spark realism
      if (this.size > 1.2 && alpha > 0.35) {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.95})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  let mouseX = -100;
  let mouseY = -100;
  let lastX = -100;
  let lastY = -100;
  let animRunning = false;
  let lastSpawnTime = 0;

  function pushParticle(p) {
    if (particles.length >= maxParticles) {
      particles.shift();
    }
    particles.push(p);
  }

  function checkHover(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return false;
    return !!el.closest('.got-btn, .throne-btn, .home-btn, button, a');
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

    const dist = Math.hypot(mouseX - lastX, mouseY - lastY);
    const now = performance.now();

    // Spawn at most every 14ms and only if cursor moved sufficiently
    if (dist > 4 && now - lastSpawnTime > 14) {
      lastSpawnTime = now;
      const isOverIce = checkHover(mouseX, mouseY);
      const spawnCount = isOverIce ? 3 : 2; // Very lightweight

      for (let i = 0; i < spawnCount; i++) {
        const t = (i + 1) / spawnCount;
        const px = lastX + (mouseX - lastX) * t + (Math.random() - 0.5) * 4;
        const py = lastY + (mouseY - lastY) * t + (Math.random() - 0.5) * 4;

        if (isOverIce) {
          // Annihilation micro-sparks (Fire + Ice collision)
          const isFire = Math.random() > 0.5;
          const col = isFire 
            ? fireColors[Math.floor(Math.random() * fireColors.length)]
            : iceColors[Math.floor(Math.random() * iceColors.length)];
          const angle = Math.random() * Math.PI * 2;
          const spd = Math.random() * 3.5 + 1.2;
          const size = Math.random() * 2.2 + 1.2; // Small & sharp
          pushParticle(new Ember(px, py, Math.cos(angle) * spd, Math.sin(angle) * spd - 0.8, size, col, true));
        } else {
          // Normal Fire Embers (Tiny & crisp)
          const col = fireColors[Math.floor(Math.random() * fireColors.length)];
          const vx = (Math.random() - 0.5) * 1.5 + (mouseX - lastX) * 0.06;
          const vy = (Math.random() - 0.5) * 1.5 - (0.8 + Math.random() * 1.2);
          const size = Math.random() * 2.6 + 1.2; // Delicate 1.2 - 3.8px
          pushParticle(new Ember(px, py, vx, vy, size, col, false));
        }
      }

      lastX = mouseX;
      lastY = mouseY;
    }

    if (!animRunning) {
      animRunning = true;
      requestAnimationFrame(animate);
    }
  }

  window.addEventListener('mousemove', handleMove, { passive: true });
  window.addEventListener('touchmove', handleMove, { passive: true });

  // Crisp, fast spark burst on click
  function handleClick(e) {
    const x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : mouseX);
    const y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : mouseY);
    if (x === undefined || y === undefined) return;

    const onIce = checkHover(x, y);
    const count = onIce ? 18 : 12;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 4 + 1.5;
      const col = onIce && Math.random() > 0.5
        ? iceColors[Math.floor(Math.random() * iceColors.length)]
        : fireColors[Math.floor(Math.random() * fireColors.length)];
      const size = Math.random() * 2.8 + 1.2;
      pushParticle(new Ember(x, y, Math.cos(angle) * speed, Math.sin(angle) * speed - 0.8, size, col, onIce));
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
    ctx.globalCompositeOperation = 'lighter';

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw(ctx);
      if (p.life <= 0 || p.size < 0.2) {
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
