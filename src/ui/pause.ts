export function renderPause(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
  ctx.fillRect(0, 0, width, height);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 50px Inter, system-ui, sans-serif';
  ctx.fillText('Paused', width / 2, height * 0.42);

  ctx.fillStyle = '#bae6fd';
  ctx.font = '600 22px Inter, system-ui, sans-serif';
  ctx.fillText('Press P / Esc to resume', width / 2, height * 0.5);
  ctx.restore();
}
