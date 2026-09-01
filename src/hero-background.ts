type Offset = { x: number; y: number };
type Direction = "right" | "left" | "up" | "down" | "diagonal";

const BRAND = {
  base: "#14121b",
  border: "rgba(255, 255, 255, 0.12)",
  hoverFill: "rgba(199, 154, 82, 0.08)",
  hoverStroke: "rgba(199, 154, 82, 0.35)",
  hoverGlow: "rgba(199, 154, 82, 0.22)",
  vignette: "#14121b",
} as const;

function setHiDPICanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
  const parent = canvas.parentElement;
  const cw = (parent?.clientWidth ?? window.innerWidth) | 0;
  const ch = (parent?.clientHeight ?? window.innerHeight) | 0;
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

  canvas.width = Math.floor(cw * dpr);
  canvas.height = Math.floor(ch * dpr);
  canvas.style.width = `${cw}px`;
  canvas.style.height = `${ch}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function originFromOffset(offset: Offset, cell: number): Offset {
  return {
    x: -((offset.x % cell) + cell) % cell,
    y: -((offset.y % cell) + cell) % cell,
  };
}

function initNoiseCanvas(canvas: HTMLCanvasElement, refresh = 2, alpha = 18): () => void {
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return () => undefined;

  let frame = 0;
  let rafId = 0;
  const size = 1024;

  const resize = (): void => {
    canvas.width = size;
    canvas.height = size;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
  };

  const draw = (): void => {
    const img = ctx.createImageData(size, size);
    const data = img.data;
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255;
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = alpha;
    }
    ctx.putImageData(img, 0, 0);
  };

  const loop = (): void => {
    if (frame % refresh === 0) draw();
    frame += 1;
    rafId = requestAnimationFrame(loop);
  };

  resize();
  loop();
  window.addEventListener("resize", resize);

  return () => {
    window.removeEventListener("resize", resize);
    cancelAnimationFrame(rafId);
  };
}

function initMovingGrid(
  canvas: HTMLCanvasElement,
  gridOffsetRef: { current: Offset },
  squareSize: number,
  animate: boolean,
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => undefined;

  let rafId = 0;

  const draw = (): void => {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    ctx.clearRect(0, 0, cw, ch);

    const origin = originFromOffset(gridOffsetRef.current, squareSize);

    ctx.strokeStyle = BRAND.border;
    for (let x = origin.x; x < cw + squareSize; x += squareSize) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, ch);
      ctx.stroke();
    }
    for (let y = origin.y; y < ch + squareSize; y += squareSize) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(cw, y + 0.5);
      ctx.stroke();
    }

    const grad = ctx.createRadialGradient(cw / 2, ch / 2, 0, cw / 2, ch / 2, Math.hypot(cw, ch) / 2);
    grad.addColorStop(0, "rgba(0, 0, 0, 0)");
    grad.addColorStop(1, BRAND.vignette);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cw, ch);

    if (animate) rafId = requestAnimationFrame(draw);
  };

  const resize = (): void => {
    setHiDPICanvas(canvas, ctx);
  };

  resize();
  draw();
  window.addEventListener("resize", resize);

  return () => {
    window.removeEventListener("resize", resize);
    cancelAnimationFrame(rafId);
  };
}

function initHoverGrid(
  canvas: HTMLCanvasElement,
  hero: HTMLElement,
  gridOffsetRef: { current: Offset },
  squareSize: number,
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => undefined;

  let rafId = 0;
  let hovered: { x: number; y: number } | null = null;

  const draw = (): void => {
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    ctx.clearRect(0, 0, cw, ch);

    if (hovered) {
      const { x: gx, y: gy } = hovered;
      const origin = originFromOffset(gridOffsetRef.current, squareSize);
      const cellX = origin.x + gx * squareSize;
      const cellY = origin.y + gy * squareSize;

      ctx.save();
      ctx.shadowBlur = 18;
      ctx.shadowColor = BRAND.hoverGlow;
      ctx.fillStyle = BRAND.hoverFill;
      ctx.fillRect(cellX, cellY, squareSize, squareSize);
      ctx.restore();

      ctx.lineWidth = 1.25;
      ctx.strokeStyle = BRAND.hoverStroke;
      ctx.strokeRect(cellX + 0.5, cellY + 0.5, squareSize - 1, squareSize - 1);

      const sheen = ctx.createLinearGradient(cellX, cellY, cellX, cellY + squareSize);
      sheen.addColorStop(0, "rgba(255, 255, 255, 0.2)");
      sheen.addColorStop(1, "rgba(255, 255, 255, 0.05)");
      ctx.fillStyle = sheen;
      ctx.fillRect(cellX, cellY, squareSize, squareSize);
    }

    rafId = requestAnimationFrame(draw);
  };

  const onMouseMove = (event: MouseEvent): void => {
    const rect = hero.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    const origin = originFromOffset(gridOffsetRef.current, squareSize);
    hovered = {
      x: Math.floor((mouseX - origin.x) / squareSize),
      y: Math.floor((mouseY - origin.y) / squareSize),
    };
  };

  const onMouseLeave = (): void => {
    hovered = null;
  };

  const resize = (): void => {
    setHiDPICanvas(canvas, ctx);
  };

  resize();
  draw();
  window.addEventListener("resize", resize);
  hero.addEventListener("mousemove", onMouseMove);
  hero.addEventListener("mouseleave", onMouseLeave);

  return () => {
    window.removeEventListener("resize", resize);
    hero.removeEventListener("mousemove", onMouseMove);
    hero.removeEventListener("mouseleave", onMouseLeave);
    cancelAnimationFrame(rafId);
  };
}

function initOffsetAnimation(
  gridOffsetRef: { current: Offset },
  direction: Direction,
  speed: number,
  squareSize: number,
  animate: boolean,
): () => void {
  if (!animate) return () => undefined;

  let rafId = 0;

  const tick = (): void => {
    const velocity = Math.max(speed, 0.1);
    const cell = squareSize;

    switch (direction) {
      case "right":
        gridOffsetRef.current.x = (gridOffsetRef.current.x - velocity + cell) % cell;
        break;
      case "left":
        gridOffsetRef.current.x = (gridOffsetRef.current.x + velocity + cell) % cell;
        break;
      case "up":
        gridOffsetRef.current.y = (gridOffsetRef.current.y + velocity + cell) % cell;
        break;
      case "down":
        gridOffsetRef.current.y = (gridOffsetRef.current.y - velocity + cell) % cell;
        break;
      case "diagonal":
      default:
        gridOffsetRef.current.x = (gridOffsetRef.current.x - velocity + cell) % cell;
        gridOffsetRef.current.y = (gridOffsetRef.current.y - velocity + cell) % cell;
        break;
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(rafId);
  };
}

export function initHeroBackground(): void {
  const hero = document.querySelector<HTMLElement>(".hero");
  const root = document.querySelector<HTMLElement>("[data-hero-bg]");
  if (!hero || !root) return;

  const gridCanvas = root.querySelector<HTMLCanvasElement>(".hero__bg-grid");
  const hoverCanvas = root.querySelector<HTMLCanvasElement>(".hero__bg-hover");
  const noiseCanvas = root.querySelector<HTMLCanvasElement>(".hero__bg-noise");
  if (!gridCanvas || !hoverCanvas || !noiseCanvas) return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const squareSize = 44;
  const gridOffsetRef = { current: { x: 0, y: 0 } };

  initOffsetAnimation(gridOffsetRef, "diagonal", 0.6, squareSize, !reducedMotion);
  initMovingGrid(gridCanvas, gridOffsetRef, squareSize, !reducedMotion);
  initHoverGrid(hoverCanvas, hero, gridOffsetRef, squareSize);
  initNoiseCanvas(noiseCanvas, reducedMotion ? 12 : 2, reducedMotion ? 10 : 18);
}
