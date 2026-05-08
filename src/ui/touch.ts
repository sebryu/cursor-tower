import { CONFIG } from '../config';

export type TouchControl = 'left' | 'right' | 'jump' | 'pause';

export interface TouchButtonBounds {
  id: TouchControl;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export function getTouchButtons(width: number, height: number): TouchButtonBounds[] {
  const size = CONFIG.touchButtonSize;
  const pad = CONFIG.touchButtonPadding;
  const bottom = height - pad - size;

  return [
    { id: 'left', x: pad, y: bottom, width: size, height: size, label: '<' },
    { id: 'right', x: pad * 2 + size, y: bottom, width: size, height: size, label: '>' },
    { id: 'jump', x: width - pad - size, y: bottom, width: size, height: size, label: 'JUMP' },
    { id: 'pause', x: width - pad - size * 0.78, y: pad, width: size * 0.78, height: size * 0.58, label: 'II' },
  ];
}

export function hitTestTouchButton(width: number, height: number, x: number, y: number): TouchControl | undefined {
  return getTouchButtons(width, height).find((button) => {
    return x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height;
  })?.id;
}

export function renderTouchControls(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const button of getTouchButtons(width, height)) {
    ctx.fillStyle = 'rgba(248, 250, 252, 0.12)';
    ctx.strokeStyle = 'rgba(248, 250, 252, 0.42)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(button.x, button.y, button.width, button.height, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(248, 250, 252, 0.86)';
    ctx.font = button.id === 'jump' ? '700 16px Inter, system-ui, sans-serif' : '700 22px Inter, system-ui, sans-serif';
    ctx.fillText(button.label, button.x + button.width / 2, button.y + button.height / 2);
  }

  ctx.restore();
}
