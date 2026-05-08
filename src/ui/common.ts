import { THEME } from '../theme';

export function panel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.save();
  ctx.fillStyle = THEME.panel;
  ctx.strokeStyle = THEME.panelBorder;
  ctx.lineWidth = 2;
  roundRect(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function drawMuteIcon(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  muted: boolean,
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = THEME.panel;
  ctx.strokeStyle = THEME.panelBorder;
  ctx.lineWidth = 2;
  roundRect(ctx, -22, -22, 44, 44, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = THEME.text;
  ctx.beginPath();
  ctx.moveTo(-10, -7);
  ctx.lineTo(-3, -7);
  ctx.lineTo(4, -13);
  ctx.lineTo(4, 13);
  ctx.lineTo(-3, 7);
  ctx.lineTo(-10, 7);
  ctx.closePath();
  ctx.fill();

  if (!muted) {
    ctx.strokeStyle = THEME.accent3;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(8, 0, 6, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(8, 0, 11, -Math.PI / 4, Math.PI / 4);
    ctx.stroke();
  } else {
    ctx.strokeStyle = THEME.accent2;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8, -10);
    ctx.lineTo(18, 10);
    ctx.moveTo(18, -10);
    ctx.lineTo(8, 10);
    ctx.stroke();
  }
  ctx.restore();
}

export function muteHitBox(width: number): { x: number; y: number; r: number } {
  return { x: width - 56, y: 28, r: 26 };
}

export function pointInMute(width: number, x: number, y: number): boolean {
  const { x: cx, y: cy, r } = muteHitBox(width);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}
