/**
 * Continuous Fire & Ice Mouse Trail
 * - Spawns continuous glowing flame embers on mouse movement.
 * - Particles have a 1.5 to 3.0 second lifespan with upward heat drift and gentle flickering.
 * - Stops creating particles when stationary, resumes immediately when mouse moves.
 * - Triggers Matter & Antimatter annihilation sparks when interacting with Ice buttons.
 */
(() => {
  const canvas = document.createElement('canvas');
  canvas.id = 'fire-cursor-canvas';
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:999999;transform:translateZ(0);';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }, { passive: true });

  const particles = [];
  const MAX_PARTICLES = 160;

  // Fire palette (warm embers)
  const FIRE_COLORS = [
    { r: 255, g: 240, b: 150 }, // White-hot core
    { r: 255, g: 180, b: 40 },  // Brilliant gold
    { r: 255, g: 90,  b: 15 },  // Vivid flame orange
    { r: 240, g: 45,  b: 5 },   // Deep crimson ember
    { r: 200, g: 25,  b: 0 },   // Smoldering red
  ];

  // Ice palette (antimatter sparks)
  const ICE_COLORS = [
    { r: 220, g: 250, b: 255 }, // Glacial white
    { r: 80,  g: 190, b: 255 }, // Cyan frost
    { r: 35,  g: 140, b: 240 }, // Deep blue spark
  ];

  class FireEmber {
    constructor(x, y, vx, vy, size, color, maxLifeSeconds = 2.2, isAnnihilation = false) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.initSize = size;
      this.size = size;
      this.color = color;
      this.isAnnihilation = isAnnihilation;
      
      // Target life between 1.5 and 3.0 seconds (60fps -> ~90 to 180 frames)
      const totalFrames = maxLifeSeconds * 60;
      this.life = 1.0;
      this.decay = 1.0 / totalFrames; // Exact 1.5 - 3.0s lifespan
      
      this.flickerSpeed = Math.random() * 0.15 + 0.05;
      this.flickerOffset = Math.random() * Math.PI * 2;
      this.wobbleSpeed = Math.random() * 0.08 + 0.03;
      this.wobbleAmp = Math.random() * 0.6 + 0.2;
    }

    update(frame) {
      // Natural thermal buoyancy (drifts upward and gently slows down horizontally)
      this.x += this.vx + Math.sin(frame * this.wobbleSpeed + this.flickerOffset) * this.wobbleAmp;
      this.y += this.vy;

      this.vy -= 0.025; // Gentle upward lift as heat rises
      this.vx *= 0.985; // Very low drag for smooth drifting

      this.life -= this.decay;
      // Shrink gently over the 1.5 - 3.0s lifetime
      this.size = Math.max(0.2, this.initSize * Math.pow(this.life, 0.65));
    }

    draw(ctx, frame) {
      if (this.life <= 0 || this.size <= 0.1) return;

      // Realistic flame flicker
      const flicker = 0.85 + Math.sin(frame * this.flickerSpeed + this.flickerOffset) * 0.15;
      const alpha = Math.max(0, this.life * flicker);

      ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha * 0.9})`;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();

      // Incandescent bright core
      if (this.size > 1.2 && alpha > 0.3) {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.85})`;
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
  let isOverIce = false;
  let animId = null;
  let frameCount = 0;

  // Zero-reflow hover detection for Ice buttons
  document.addEventListener('mouseover', (e) => {
    if (e.target && e.target.closest) {
      isOverIce = !!e.target.closest('.got-btn, .throne-btn, .home-btn, button, a');
    }
  }, { passive: true });

  function spawnEmber(x, y, dx, dy, isIce) {
    if (particles.length >= MAX_PARTICLES) {
      particles.shift();
    }

    // 1.5 to 3.0 seconds duration
    const lifeDuration = 1.5 + Math.random() * 1.5;
    
    if (isIce) {
      // Annihilation particles (Matter + Antimatter clash)
      const color = (Math.random() > 0.5) 
        ? FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)]
        : ICE_COLORS[Math.floor(Math.random() * ICE_COLORS.length)];
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 2.2 + 0.8;
      const size = Math.random() * 2.2 + 1.2;
      particles.push(new FireEmber(
        x + (Math.random() - 0.5) * 4,
        y + (Math.random() - 0.5) * 4,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 0.5,
        size,
        color,
        lifeDuration * 0.8,
        true
      ));
    } else {
      // Normal Fiery Embers
      const color = FIRE_COLORS[Math.floor(Math.random() * FIRE_COLORS.length)];
      const vx = (Math.random() - 0.5) * 1.2 + dx * 0.05;
      const vy = (Math.random() - 0.5) * 1.2 + dy * 0.05 - (0.6 + Math.random() * 1.2); // Upward flame drift
      const size = Math.random() * 2.6 + 1.2; // 1.2px - 3.8px fine embers
      particles.push(new FireEmber(
        x + (Math.random() - 0.5) * 4,
        y + (Math.random() - 0.5) * 4,
        vx,
        vy,
        size,
        color,
        lifeDuration,
        false
      ));
    }
  }

  function handlePointer(clientX, clientY) {
    if (clientX === undefined || clientY === undefined) return;

    mouseX = clientX;
    mouseY = clientY;

    if (lastX === -100) {
      lastX = mouseX;
      lastY = mouseY;
      return;
    }

    const dx = mouseX - lastX;
    const dy = mouseY - lastY;
    const dist = Math.hypot(dx, dy);

    // If mouse moved, spawn embers along the trail smoothly
    if (dist > 1.5) {
      const steps = Math.min(6, Math.max(1, Math.floor(dist / 6)));
      for (let i = 0; i < steps; i++) {
        const t = (i + 1) / steps;
        const px = lastX + dx * t;
        const py = lastY + dy * t;
        spawnEmber(px, py, dx, dy, isOverIce);
      }
      lastX = mouseX;
      lastY = mouseY;
    }

    if (!animId) {
      animId = requestAnimationFrame(animate);
    }
  }

  // Listen to mouse movement and touch drags
  window.addEventListener('mousemove', (e) => {
    handlePointer(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (e.touches && e.touches[0]) {
      handlePointer(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  // Reset pointer anchor on leave
  window.addEventListener('mouseleave', () => {
    lastX = -100;
    lastY = -100;
  }, { passive: true });

  function animate() {
    frameCount++;
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update(frameCount);
      p.draw(ctx, frameCount);
      if (p.life <= 0 || p.size <= 0.1) {
        particles.splice(i, 1);
      }
    }

    if (particles.length > 0) {
      animId = requestAnimationFrame(animate);
    } else {
      animId = null;
    }
  }
})();
