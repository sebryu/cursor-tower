import { CONFIG } from '../config';
import { THEME } from '../theme';
import { roundRect } from './common';

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
    { id: 'left', x: pad, y: bottom, width: size, height: size, label: '◀' },
    { id: 'right', x: pad * 2 + size, y: bottom, width: size, height: size, label: '▶' },
    { id: 'jump', x: width - pad - size * 1.4, y: bottom, width: size * 1.4, height: size, label: 'JUMP' },
    { id: 'pause', x: width - pad - 44, y: pad + 130, width: 44, height: 44, label: '||' },
  ];
}

export function hitTestTouchButton(
  width: number,
  height: number,
  x: number,
  y: number,
): TouchControl | undefined {
  return getTouchButtons(width, height).find((button) => {
    return (
      x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height
    );
  })?.id;
}

export function renderTouchControls(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  active: Set<TouchControl>,
  show: boolean,
  baseAlpha: number = 1,
): void {
  if (!show) return;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const button of getTouchButtons(width, height)) {
    const isActive = active.has(button.id);
    ctx.globalAlpha = isActive ? 1 : baseAlpha;
    ctx.fillStyle = isActive ? 'rgba(250, 204, 21, 0.32)' : 'rgba(248, 250, 252, 0.12)';
    ctx.strokeStyle = isActive ? THEME.accent : 'rgba(248, 250, 252, 0.5)';
    ctx.lineWidth = 2;
    roundRect(ctx, button.x, button.y, button.width, button.height, 18);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isActive ? THEME.accent : 'rgba(248, 250, 252, 0.92)';
    ctx.font =
      button.id === 'jump'
        ? '800 18px ui-sans-serif, system-ui, sans-serif'
        : button.id === 'pause'
          ? '700 18px ui-sans-serif, system-ui, sans-serif'
          : '700 26px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText(button.label, button.x + button.width / 2, button.y + button.height / 2);
  }
  ctx.restore();
}
