import { THEME } from '../theme';
import { drawMuteIcon, panel } from './common';

export interface PauseViewModel {
  muted: boolean;
}

export function renderPause(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  model: PauseViewModel,
): void {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 8, 31, 0.7)';
  ctx.fillRect(0, 0, width, height);

  panel(ctx, width / 2 - 160, height / 2 - 110, 320, 220, 22);

  ctx.textAlign = 'center';
  ctx.fillStyle = THEME.text;
  ctx.font = '900 44px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  ctx.fillText('PAUSED', width / 2, height / 2 - 40);

  ctx.fillStyle = THEME.textDim;
  ctx.font = '600 16px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('Press P or Esc to resume', width / 2, height / 2);
  ctx.fillText('Tap mute icon to silence', width / 2, height / 2 + 22);
  ctx.fillText('Press R to restart this run', width / 2, height / 2 + 44);

  drawMuteIcon(ctx, width - 56, 96, model.muted);

  ctx.restore();
}
