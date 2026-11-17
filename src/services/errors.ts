export class InsufficientCreditsError extends Error {
  constructor(public required: number, public available: number) {
    super(`Not enough credits: ${required} needed, ${available} available.`);
  }
}
