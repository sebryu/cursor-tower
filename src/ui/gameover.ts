import type { ScoreTracker } from '../scoring';

export function renderGameOver(ctx: CanvasRenderingContext2D, width: number, height: number, score: ScoreTracker): void {
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 48px Inter, system-ui, sans-serif';
  ctx.fillText('Run Over', width / 2, height * 0.35);

  ctx.fillStyle = '#bae6fd';
  ctx.font = '700 26px Inter, system-ui, sans-serif';
  ctx.fillText(`Score ${score.score}`, width / 2, height * 0.45);
  ctx.fillText(`Best ${score.best}`, width / 2, height * 0.5);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 24px Inter, system-ui, sans-serif';
  ctx.fillText('Press Space / Tap to restart', width / 2, height * 0.62);
  ctx.restore();
}
