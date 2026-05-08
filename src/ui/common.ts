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
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(8, 0, 6, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(8, 0, 11, -Math.PI / 4, Math.PI / 4);
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(8, -12);
    ctx.lineTo(20, 12);
    ctx.moveTo(20, -12);
    ctx.lineTo(8, 12);
    ctx.stroke();
  }

  ctx.fillStyle = muted ? '#f43f5e' : THEME.textDim;
  ctx.font = '700 9px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(muted ? 'MUTED' : 'SOUND', 0, 30);
  ctx.restore();
}

export function muteHitBoxes(width: number): { x: number; y: number; r: number }[] {
  return [
    { x: width - 56, y: 28, r: 26 },
    { x: width - 56, y: 96, r: 26 },
  ];
}

export function pointInMute(width: number, x: number, y: number): boolean {
  for (const box of muteHitBoxes(width)) {
    const dx = x - box.x;
    const dy = y - box.y;
    if (dx * dx + dy * dy <= box.r * box.r) return true;
  }
  return false;
}
