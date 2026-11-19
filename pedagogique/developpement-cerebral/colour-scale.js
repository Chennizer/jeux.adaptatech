// A display scale, never a measured percentage of maturity.
export const BRAIN_PALETTE = Object.freeze(['#e84335', '#f49a38', '#e7cc4b', '#58b56b', '#36b9b4', '#367dce', '#4056ad']);

export function setScaleColour(colour, stage, palette) {
  const p = Math.max(0, Math.min(1, stage)) * (palette.length - 1);
  const lower = Math.min(palette.length - 2, Math.floor(p));
  return colour.copy(palette[lower]).lerp(palette[lower + 1], p - lower);
}
