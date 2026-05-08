import { THEME } from '../theme';
import type { ScoreTracker } from '../scoring';
import { panel } from './common';

export interface GameOverViewModel {
  score: ScoreTracker;
  newBest: boolean;
  isTouch: boolean;
}

export function renderGameOver(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  model: GameOverViewModel,
): void {
  ctx.save();
  ctx.fillStyle = 'rgba(8, 8, 31, 0.78)';
  ctx.fillRect(0, 0, width, height);

  panel(ctx, width / 2 - 200, height * 0.22, 400, height * 0.55, 24);

  ctx.textAlign = 'center';
  ctx.fillStyle = THEME.accent2;
  ctx.font = '900 48px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  ctx.fillText('RUN OVER', width / 2, height * 0.32);

  if (model.newBest) {
    ctx.fillStyle = THEME.accent;
    ctx.font = '800 22px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
    ctx.fillText('NEW BEST!', width / 2, height * 0.36);
  }

  ctx.fillStyle = THEME.textDim;
  ctx.font = '600 13px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('SCORE', width / 2 - 100, height * 0.45);
  ctx.fillText('HEIGHT', width / 2 + 100, height * 0.45);
  ctx.fillText('BEST COMBO', width / 2, height * 0.56);

  ctx.fillStyle = THEME.text;
  ctx.font = '900 32px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  ctx.fillText(String(model.score.score), width / 2 - 100, height * 0.5);
  ctx.fillStyle = THEME.accent3;
  ctx.fillText(`${Math.round(model.score.height)}m`, width / 2 + 100, height * 0.5);

  ctx.fillStyle = THEME.accent;
  ctx.font = '900 26px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  ctx.fillText(`x${(1 + model.score.comboMax * 0.25).toFixed(2)}`, width / 2, height * 0.61);

  ctx.fillStyle = THEME.textDim;
  ctx.font = '600 14px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(`Best score: ${model.score.best}`, width / 2, height * 0.66);

  ctx.fillStyle = THEME.text;
  ctx.font = '800 22px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText(model.isTouch ? 'TAP TO RESTART' : 'PRESS SPACE OR R TO RESTART', width / 2, height * 0.73);

  ctx.restore();
}
