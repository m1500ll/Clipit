/** Pricing — single source of truth for UI and billing. 1 credit = 1 minute of source video analysed. */
export const creditsFor = (durationSeconds: number) => Math.max(1, Math.ceil(durationSeconds / 60));

/** Plans differ only by minutes today — perks must stay true to what the product does. */
export const PLANS = [
  { id: 'free', name: 'Free', price: 0, credits: 30, period: 'once', perks: ['30 minutes of video on signup, no card', 'Unlimited edits and exports', 'All caption styles'] },
  { id: 'creator', name: 'Creator', price: 19, credits: 300, period: 'month', perks: ['5 hours of video every month', 'Unlimited edits and exports', 'Top up anytime'], featured: true },
  { id: 'pro', name: 'Pro', price: 49, credits: 1200, period: 'month', perks: ['20 hours of video every month', 'Lowest cost per minute', 'Built for agencies and daily posting'] },
] as const;

export const CREDIT_PACKS = [
  { id: 'pack_120', credits: 120, price: 9 },
  { id: 'pack_600', credits: 600, price: 39, badge: 'Best value' },
] as const;

export type ProductKey = 'creator' | 'pro' | (typeof CREDIT_PACKS)[number]['id'];

export const formatMinutes = (credits: number) =>
  credits >= 120 && credits % 60 === 0 ? `${credits / 60} hours` : `${credits} min`;
