import { useEffect, useRef } from 'react';

interface PRConfettiProps {
  active: boolean;
  onFinish?: () => void;
}

export function PRConfetti({ active, onFinish }: PRConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active || !canvasRef.current) return;

    const canvas = canvasRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Gerar 120 partículas amarelas / douradas
    const colors = ['#FFD700', '#FFEA00', '#FFA500', '#FFFFFF', '#FFE082'];
    const particles = Array.from({ length: 120 }).map(() => ({
      x: window.innerWidth / 2 + (Math.random() - 0.5) * 150,
      y: window.innerHeight * 0.4 + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 18,
      vy: (Math.random() - 0.7) * 20 - 4,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 15,
      shape: Math.random() > 0.4 ? 'rect' : 'circle',
    }));

    let animationFrame: number;
    let startTime = Date.now();

    const render = () => {
      const elapsed = Date.now() - startTime;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let alive = 0;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.4; // gravidade
        p.vx *= 0.98; // atrito
        p.rotation += p.vRot;
        p.alpha = Math.max(0, 1 - elapsed / 3000);

        if (p.alpha > 0.01) {
          alive++;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.shadowColor = '#FFD700';
          ctx.shadowBlur = 10;

          if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      });

      if (alive > 0 && elapsed < 3500) {
        animationFrame = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        onFinish?.();
      }
    };

    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [active, onFinish]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  );
}
