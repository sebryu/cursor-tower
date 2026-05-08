import type { ScoreTracker } from '../scoring';

export interface HudViewModel {
  score: ScoreTracker;
  muted: boolean;
}

export function renderHud(ctx: CanvasRenderingContext2D, width: number, model: HudViewModel): void {
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.56)';
  ctx.fillRect(16, 16, width - 32, 64);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 22px Inter, system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Score ${model.score.score}`, 34, 56);

  ctx.textAlign = 'center';
  ctx.fillText(`Combo x${model.score.combo}`, width / 2, 56);

  ctx.textAlign = 'right';
  ctx.fillText(`${model.muted ? 'Muted' : 'Sound'} - Best ${model.score.best}`, width - 34, 56);
  ctx.restore();
}
