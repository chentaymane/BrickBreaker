(function () {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const COLORS = ['#00d4ff', '#ff3b3b', '#ffe44d', '#44dd44', '#cc44ff', '#ff9933', '#ff66aa', '#3b8bff'];
  const COUNT = 90;

  const particles = Array.from({ length: COUNT }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    r: Math.random() * 2 + 0.5,
    dx: (Math.random() - 0.5) * 0.3,
    dy: -(Math.random() * 0.5 + 0.15),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    alpha: Math.random() * 0.55 + 0.15,
  }));

  function loop() {
    // Slight fade trail instead of full clear — gives a soft comet effect
    ctx.fillStyle = 'rgba(0, 0, 40, 0.18)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      p.x += p.dx;
      p.y += p.dy;

      if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
      if (p.x < -10) p.x = canvas.width + 10;
      if (p.x > canvas.width + 10) p.x = -10;
    }

    requestAnimationFrame(loop);
  }

  loop();
})();
