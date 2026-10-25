// loose on purpose: catches typos like "name@email" without rejecting real addresses.
export const looksLikeEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
