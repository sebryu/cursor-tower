import { CONFIG } from '../config';
import { THEME } from '../theme';
import type { ScoreTracker } from '../scoring';
import { drawMuteIcon, panel } from './common';

export interface HudViewModel {
  score: ScoreTracker;
  muted: boolean;
  hint?: string;
  hintAlpha?: number;
}

export function renderHud(
  ctx: CanvasRenderingContext2D,
  width: number,
  model: HudViewModel,
): void {
  ctx.save();
  ctx.textBaseline = 'alphabetic';

  // Top-left score / multiplier card.
  panel(ctx, 14, 14, 224, 78, 14);
  ctx.fillStyle = THEME.textDim;
  ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('SCORE', 30, 36);
  ctx.fillStyle = THEME.text;
  ctx.font = '800 28px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  ctx.fillText(String(model.score.score).padStart(1, '0'), 30, 64);

  ctx.fillStyle = THEME.textDim;
  ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('HEIGHT', 138, 36);
  ctx.fillStyle = THEME.accent3;
  ctx.font = '800 22px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  ctx.fillText(`${Math.round(model.score.height)}`, 138, 62);
  ctx.fillStyle = THEME.textDim;
  ctx.font = '500 12px ui-sans-serif, system-ui, sans-serif';
  ctx.fillText('m', 138 + ctx.measureText(`${Math.round(model.score.height)}`).width + 4, 62);

  // Top-right best card.
  panel(ctx, width - 14 - 156, 14, 156, 50, 12);
  ctx.fillStyle = THEME.textDim;
  ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('BEST', width - 30, 32);
  ctx.fillStyle = THEME.accent;
  ctx.font = '800 22px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
  ctx.fillText(String(model.score.best), width - 30, 56);

  // Combo bar.
  if (model.score.combo > 0) {
    const t = model.score.comboTimerMs / CONFIG.comboWindowMs;
    panel(ctx, 14, 100, 224, 36, 12);
    ctx.fillStyle = THEME.textDim;
    ctx.font = '700 12px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('COMBO', 26, 122);
    ctx.fillStyle = THEME.accent;
    ctx.font = '900 18px ui-rounded, "SF Pro Rounded", system-ui, sans-serif';
    ctx.fillText(`x${model.score.multiplier.toFixed(2)}`, 80, 124);
    ctx.fillStyle = THEME.comboBarTrack;
    ctx.fillRect(150, 116, 76, 8);
    ctx.fillStyle = THEME.comboBar;
    ctx.fillRect(150, 116, 76 * Math.max(0, Math.min(1, t)), 8);
  }

  // Mute icon top right (round button).
  drawMuteIcon(ctx, width - 56, 96, model.muted);

  // Optional control hint.
  if (model.hint && (model.hintAlpha ?? 1) > 0.01) {
    ctx.globalAlpha = model.hintAlpha ?? 1;
    panel(ctx, width / 2 - 200, 140, 400, 44, 12);
    ctx.fillStyle = THEME.textDim;
    ctx.font = '500 14px ui-sans-serif, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(model.hint, width / 2, 168);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}
