/**
 * WeatherGPT Dynamic Canvas Animation Engine
 * Supports 5 interactive weather particle modes:
 * - 'thunder': Lightning flashes, dark storm rain
 * - 'rain': Falling raindrops with splash ripples
 * - 'snow': Gentle crystalline snowflake physics
 * - 'sun': Radiant solar glare, solar dust particles, glowing rays
 * - 'clouds': Drifting atmospheric cloud mist
 */

class WeatherCanvasEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.ripples = [];
    this.mode = 'sun'; // Default mode
    this.animationId = null;
    this.lightningTimer = 0;
    this.lightningFlashAlpha = 0;

    this.initCanvas();
    window.addEventListener('resize', () => this.initCanvas());
  }

  initCanvas() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
    this.createParticles();
  }

  setMode(mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    this.particles = [];
    this.ripples = [];
    this.createParticles();
  }

  createParticles() {
    this.particles = [];
    const count = this.mode === 'rain' || this.mode === 'thunder' ? 140 : this.mode === 'snow' ? 100 : 45;

    for (let i = 0; i < count; i++) {
      if (this.mode === 'rain' || this.mode === 'thunder') {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          length: Math.random() * 20 + 15,
          speed: Math.random() * 12 + 10,
          weight: Math.random() * 1.5 + 0.5,
          color: 'rgba(186, 230, 253, 0.65)'
        });
      } else if (this.mode === 'snow') {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 3 + 1,
          speedY: Math.random() * 1.5 + 0.5,
          speedX: Math.sin(Math.random() * Math.PI) * 0.5,
          opacity: Math.random() * 0.7 + 0.3
        });
      } else if (this.mode === 'sun') {
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height,
          radius: Math.random() * 6 + 2,
          speedY: -(Math.random() * 0.6 + 0.2),
          speedX: (Math.random() - 0.5) * 0.4,
          opacity: Math.random() * 0.5 + 0.2,
          pulse: Math.random() * 0.02 + 0.005
        });
      } else { // clouds / fog
        this.particles.push({
          x: Math.random() * this.width,
          y: Math.random() * this.height * 0.6,
          radius: Math.random() * 120 + 80,
          speedX: Math.random() * 0.3 + 0.1,
          opacity: Math.random() * 0.15 + 0.05
        });
      }
    }
  }

  drawLightning() {
    if (this.mode !== 'thunder') return;
    this.lightningTimer++;

    if (this.lightningTimer > 180 && Math.random() < 0.03) {
      this.lightningTimer = 0;
      this.lightningFlashAlpha = 0.85;

      // Draw lightning bolt
      this.ctx.beginPath();
      let startX = Math.random() * this.width;
      let startY = 0;
      this.ctx.moveTo(startX, startY);

      let curX = startX;
      let curY = startY;

      while (curY < this.height * 0.7) {
        curX += (Math.random() - 0.5) * 45;
        curY += Math.random() * 30 + 15;
        this.ctx.lineTo(curX, curY);
      }

      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 3;
      this.ctx.shadowBlur = 20;
      this.ctx.shadowColor = '#a855f7';
      this.ctx.stroke();
      this.ctx.shadowBlur = 0;
    }

    if (this.lightningFlashAlpha > 0) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.lightningFlashAlpha})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.lightningFlashAlpha -= 0.08;
    }
  }

  drawSunRays() {
    if (this.mode !== 'sun') return;
    const sunX = this.width * 0.85;
    const sunY = this.height * 0.15;

    // Solar gradient center
    const radialGrad = this.ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, 350);
    radialGrad.addColorStop(0, 'rgba(253, 224, 71, 0.35)');
    radialGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.12)');
    radialGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    this.ctx.fillStyle = radialGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    if (this.mode === 'sun') {
      this.drawSunRays();
    }

    // Update and render particles
    for (let p of this.particles) {
      if (this.mode === 'rain' || this.mode === 'thunder') {
        this.ctx.beginPath();
        this.ctx.moveTo(p.x, p.y);
        this.ctx.lineTo(p.x - p.length * 0.15, p.y + p.length);
        this.ctx.strokeStyle = p.color;
        this.ctx.lineWidth = p.weight;
        this.ctx.stroke();

        p.y += p.speed;
        p.x -= p.speed * 0.15;

        if (p.y > this.height) {
          p.y = -20;
          p.x = Math.random() * this.width;
          // Add splash ripple
          if (Math.random() < 0.25) {
            this.ripples.push({ x: p.x, y: this.height - 10, r: 1, maxR: 12, alpha: 0.6 });
          }
        }
      } else if (this.mode === 'snow') {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`;
        this.ctx.fill();

        p.y += p.speedY;
        p.x += Math.sin(p.y * 0.02) * p.speedX;

        if (p.y > this.height) {
          p.y = -10;
          p.x = Math.random() * this.width;
        }
      } else if (this.mode === 'sun') {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(251, 191, 36, ${p.opacity})`;
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#fbbf24';
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        p.y += p.speedY;
        p.x += p.speedX;
        p.opacity += p.pulse;
        if (p.opacity > 0.6 || p.opacity < 0.1) p.pulse = -p.pulse;

        if (p.y < -10) {
          p.y = this.height + 10;
          p.x = Math.random() * this.width;
        }
      } else { // clouds
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(148, 163, 184, ${p.opacity})`;
        this.ctx.fill();

        p.x += p.speedX;
        if (p.x - p.radius > this.width) {
          p.x = -p.radius;
        }
      }
    }

    // Render raindrops ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      let rip = this.ripples[i];
      this.ctx.beginPath();
      this.ctx.ellipse(rip.x, rip.y, rip.r, rip.r * 0.3, 0, 0, Math.PI * 2);
      this.ctx.strokeStyle = `rgba(186, 230, 253, ${rip.alpha})`;
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      rip.r += 0.5;
      rip.alpha -= 0.03;

      if (rip.alpha <= 0 || rip.r >= rip.maxR) {
        this.ripples.splice(i, 1);
      }
    }

    // Lightning Flash check
    this.drawLightning();

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  start() {
    if (!this.animationId) {
      this.animate();
    }
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
}

// Global instance
window.WeatherAnimation = null;
document.addEventListener('DOMContentLoaded', () => {
  window.WeatherAnimation = new WeatherCanvasEngine('weather-canvas');
  window.WeatherAnimation.start();
});
