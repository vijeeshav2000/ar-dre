/**
 * Fire & Ice Annihilation Cursor Engine
 * Game of Thrones: A Song of Ice and Fire
 * 
 * - Emits fiery incandescent heat trail from cursor.
 * - Detects interaction with Ice buttons (.got-btn, .throne-btn, .home-btn).
 * - Triggers thermodynamic Matter & Antimatter annihilation: violent plasma sparks,
 *   vaporizing steam clouds, and thermal shockwave on click.
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
  const maxParticles = 260;

  // Colors: Fire (Matter) + Ice (Antimatter) + Annihilation Plasma / Steam
  const fireColors = [
    { r: 255, g: 230, b: 120 }, // bright core
    { r: 255, g: 170, b: 30 },  // gold flame
    { r: 255, g: 85,  b: 10 },  // intense orange
    { r: 255, g: 40,  b: 0 },   // crimson flame
    { r: 210, g: 20,  b: 0 },   // deep red ember
  ];

  const iceColors = [
    { r: 190, g: 240, b: 255 }, // glacial white
    { r: 79,  g: 179, b: 255 }, // crystal cyan
    { r: 30,  g: 130, b: 230 }, // deep frost blue
    { r: 230, g: 250, b: 255 }, // cold spark
  ];

  const steamColors = [
    { r: 220, g: 235, b: 255 }, // vapor white
    { r: 180, g: 210, b: 240 }, // misty steam
    { r: 255, g: 220, b: 180 }, // thermal vapor
  ];

  class Particle {
    constructor(x, y, vx, vy, size, color, type = 'fire') {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.size = size;
      this.color = color;
      this.type = type; // 'fire', 'ice', 'steam', 'plasma'
      this.life = 1.0;
      this.decay = type === 'steam' ? 0.018 : (type === 'plasma' ? 0.045 : (Math.random() * 0.028 + 0.02));
      this.spin = (Math.random() - 0.5) * 0.15;
      this.angle = Math.random() * Math.PI * 2;
    }

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.type === 'steam') {
        this.vy -= 0.08; // Steam billows upward
        this.vx *= 0.96;
        this.size += 0.35; // Steam expands as it cools
      } else if (this.type === 'plasma') {
        this.vx *= 0.92;
        this.vy *= 0.92;
        this.size *= 0.92;
      } else {
        // Fire / Ice
        this.vy -= 0.06; // Buoyant upward heat
        this.vx *= 0.98;
        this.size *= 0.95;
      }

      this.life -= this.decay;
      this.angle += this.spin;
    }

    draw(ctx) {
      if (this.life <= 0 || this.size <= 0.1) return;
      const alpha = Math.max(0, this.life);

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';

      if (this.type === 'steam') {
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha * 0.35})`;
        ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha * 0.2})`;
        ctx.shadowBlur = this.size * 1.8;
      } else if (this.type === 'plasma') {
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`;
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = this.size * 4;
      } else {
        ctx.fillStyle = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, ${alpha})`;
        ctx.shadowColor = `rgba(${this.color.r}, ${this.color.g}, ${this.color.b}, 0.85)`;
        ctx.shadowBlur = this.size * 2.5;
      }

      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.1, this.size), 0, Math.PI * 2);
      ctx.fill();

      // Glowing white core for intense sparks
      if ((this.type === 'fire' || this.type === 'plasma') && this.size > 2.2 && alpha > 0.4) {
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
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
  let animRunning = false;
  let isHoveringIce = false;

  function pushParticle(p) {
    if (particles.length >= maxParticles) {
      particles.shift();
    }
    particles.push(p);
  }

  // Check if hovering an ice button
  function checkHover(x, y) {
    const el = document.elementFromPoint(x, y);
    if (!el) return false;
    return !!el.closest('.got-btn, .throne-btn, .home-btn, button, .ice-target');
  }

  function spawnNormalFire(x, y, vx, vy) {
    const jitterX = (Math.random() - 0.5) * 8;
    const jitterY = (Math.random() - 0.5) * 8;
    const color = fireColors[Math.floor(Math.random() * fireColors.length)];
    const size = Math.random() * 7 + 4;
    pushParticle(new Particle(x + jitterX, y + jitterY, vx, vy, size, color, 'fire'));
  }

  // Matter + Antimatter (Fire + Ice) Annihilation Reaction
  function spawnAnnihilation(x, y, intensity = 1) {
    const num = Math.floor(4 * intensity);
    for (let i = 0; i < num; i++) {
      // 1. Sizzling plasma burst (matter colliding with antimatter)
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 5 + 2) * intensity;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 1.2;
      
      const isFire = Math.random() > 0.5;
      const color = isFire 
        ? fireColors[Math.floor(Math.random() * fireColors.length)]
        : iceColors[Math.floor(Math.random() * iceColors.length)];

      pushParticle(new Particle(x, y, vx, vy, Math.random() * 6 + 3, color, 'plasma'));

      // 2. Expanding vapor steam puff
      if (Math.random() < 0.6) {
        const steamAngle = Math.random() * Math.PI * 2;
        const steamSpeed = Math.random() * 2 + 0.5;
        const svx = Math.cos(steamAngle) * steamSpeed;
        const svy = Math.sin(steamAngle) * steamSpeed - 1.5;
        const steamColor = steamColors[Math.floor(Math.random() * steamColors.length)];
        pushParticle(new Particle(x, y, svx, svy, Math.random() * 10 + 6, steamColor, 'steam'));
      }
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

    const dist = Math.hypot(mouseX - lastX, mouseY - lastY);
    const numToSpawn = Math.min(10, Math.max(2, Math.floor(dist / 3.5)));
    
    isHoveringIce = checkHover(mouseX, mouseY);

    for (let i = 0; i < numToSpawn; i++) {
      const t = i / numToSpawn;
      const interpX = lastX + (mouseX - lastX) * t;
      const interpY = lastY + (mouseY - lastY) * t;
      const vx = (Math.random() - 0.5) * 2 + (mouseX - lastX) * 0.12;
      const vy = (Math.random() - 0.5) * 2 + (mouseY - lastY) * 0.12 - (1.2 + Math.random() * 1.8);

      if (isHoveringIce) {
        spawnAnnihilation(interpX, interpY, 1.2);
      } else {
        spawnNormalFire(interpX, interpY, vx, vy);
      }
    }

    lastX = mouseX;
    lastY = mouseY;

    if (!animRunning) {
      animRunning = true;
      requestAnimationFrame(animate);
    }
  }

  window.addEventListener('mousemove', handleMove, { passive: true });
  window.addEventListener('touchmove', handleMove, { passive: true });

  // Violent Annihilation Explosion on Click
  function handleClick(e) {
    const x = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : mouseX);
    const y = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : mouseY);
    if (x === undefined || y === undefined) return;

    const onIce = checkHover(x, y);
    const count = onIce ? 48 : 28;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = onIce ? (Math.random() * 9 + 3) : (Math.random() * 6 + 2);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed - 1.5;
      
      if (onIce) {
        // Dual Fire + Ice annihilation fragments
        const isFire = Math.random() > 0.5;
        const color = isFire 
          ? fireColors[Math.floor(Math.random() * fireColors.length)]
          : iceColors[Math.floor(Math.random() * iceColors.length)];
        pushParticle(new Particle(x, y, vx, vy, Math.random() * 9 + 3, color, 'plasma'));

        // Billowing thermal steam
        if (i % 2 === 0) {
          const steamColor = steamColors[Math.floor(Math.random() * steamColors.length)];
          pushParticle(new Particle(x, y, vx * 0.4, vy * 0.4 - 2, Math.random() * 14 + 8, steamColor, 'steam'));
        }
      } else {
        const color = fireColors[Math.floor(Math.random() * fireColors.length)];
        pushParticle(new Particle(x, y, vx, vy, Math.random() * 8 + 3, color, 'fire'));
      }
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
      if (p.life <= 0 || p.size <= 0.1) {
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
