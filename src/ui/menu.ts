export interface MenuViewModel {
  best: number;
  muted: boolean;
}

export function renderMenu(ctx: CanvasRenderingContext2D, width: number, height: number, model: MenuViewModel): void {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f8fafc';
  ctx.font = '700 58px Inter, system-ui, sans-serif';
  ctx.fillText('Sky Climber', width / 2, height * 0.32);

  ctx.fillStyle = '#bae6fd';
  ctx.font = '500 22px Inter, system-ui, sans-serif';
  ctx.fillText('Leap upward through an endless neon tower.', width / 2, height * 0.39);

  ctx.fillStyle = '#ffffff';
  ctx.font = '700 26px Inter, system-ui, sans-serif';
  ctx.fillText('Press Space / Tap to start', width / 2, height * 0.52);

  ctx.fillStyle = 'rgba(248, 250, 252, 0.76)';
  ctx.font = '500 18px Inter, system-ui, sans-serif';
  ctx.fillText('Arrow keys or A/D to run - Space/W/Up to jump', width / 2, height * 0.59);
  ctx.fillText('P or Esc pauses - touch buttons appear in play', width / 2, height * 0.63);
  ctx.fillText(`Best score: ${model.best} - Sound: ${model.muted ? 'Muted' : 'On'}`, width / 2, height * 0.71);
  ctx.restore();
}
