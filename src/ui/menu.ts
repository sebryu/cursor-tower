import { CONFIG } from '../config';
import { THEME } from '../theme';
import { drawMuteIcon, panel } from './common';

export interface MenuViewModel {
  best: number;
  muted: boolean;
  timeMs: number;
  isTouch: boolean;
}

export function renderMenu(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  model: MenuViewModel,
): void {
  ctx.save();
  ctx.textAlign = 'center';

  // Title with subtle bob.
  const bob = Math.sin(model.timeMs / 480) * 4;
  ctx.fillStyle = THEME.accent;
  ctx.font = '900 72px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  ctx.shadowColor = THEME.accent2;
  ctx.shadowBlur = 18;
  ctx.fillText('SKY', width / 2 - 78, height * 0.28 + bob);
  ctx.fillStyle = THEME.accent3;
  ctx.fillText('CLIMBER', width / 2 + 60, height * 0.28 + bob);
  ctx.shadowBlur = 0;

  ctx.fillStyle = THEME.textDim;
  ctx.font = '500 18px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('An endless neon climb. Chain combos, beat your best.', width / 2, height * 0.34);

  // Big play call-to-action.
  panel(ctx, width / 2 - 150, height * 0.42, 300, 76, 18);
  ctx.fillStyle = THEME.text;
  ctx.font = '800 26px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(model.isTouch ? 'TAP TO PLAY' : 'PRESS SPACE TO PLAY', width / 2, height * 0.42 + 50);

  // Controls cheat sheet.
  ctx.fillStyle = THEME.textDim;
  ctx.font = '500 16px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('Move with arrow keys or A/D. Hold jump for height.', width / 2, height * 0.56);
  ctx.fillText('P or Esc to pause. M to mute. Touch buttons appear in play.', width / 2, height * 0.59);

  // Best card.
  panel(ctx, width / 2 - 110, height * 0.66, 220, 70, 14);
  ctx.fillStyle = THEME.textDim;
  ctx.font = '600 13px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('BEST CLIMB', width / 2, height * 0.66 + 22);
  ctx.fillStyle = THEME.accent;
  ctx.font = '900 32px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  ctx.fillText(String(model.best), width / 2, height * 0.66 + 56);

  // Sound toggle hint.
  drawMuteIcon(ctx, width - 56, 28, model.muted);

  // Originality footer.
  ctx.fillStyle = 'rgba(248, 250, 252, 0.42)';
  ctx.font = '500 12px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('Original procedural game. No third-party assets.', width / 2, height - 20);

  ctx.restore();
  void CONFIG;
}
