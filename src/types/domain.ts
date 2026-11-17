/** One on-screen caption chunk. Times are in seconds on the SOURCE video timeline. */
export interface Caption { start: number; end: number; text: string }

export type CaptionStyleId = 'bold' | 'pop' | 'clean';
export type LayoutId = 'fill' | 'fit';
export type ClipLengthId = 'short' | 'medium' | 'long';

export const CLIP_LENGTHS: Record<ClipLengthId, { label: string; min: number; max: number }> = {
  short: { label: '15–30 s', min: 15, max: 30 },
  medium: { label: '30–60 s', min: 30, max: 60 },
  long: { label: '60–90 s', min: 60, max: 90 },
};

export const CAPTION_STYLES: Record<CaptionStyleId, { label: string; description: string }> = {
  bold: { label: 'Bold', description: 'White, thick outline, uppercase' },
  pop: { label: 'Pop', description: 'Yellow, thick outline, uppercase' },
  clean: { label: 'Clean', description: 'Sentence case on a dark box' },
};

export const LAYOUTS: Record<LayoutId, { label: string; description: string }> = {
  fill: { label: 'Fill', description: 'Crops the centre to fill the vertical frame' },
  fit: { label: 'Fit', description: 'Whole frame on a blurred background' },
};

/** Longest source video accepted (seconds). Keeps the AI step under the server time limit. */
export const MAX_SOURCE_SECONDS = 30 * 60;
