import type { Party } from '@/hooks/useParties';

// In-memory store for demo mode when Supabase isn't configured
const demoParties: Party[] = [];

export function addDemoParty(party: Party) {
  demoParties.push(party);
}

export function getDemoPartyByCode(code: string): Party | undefined {
  return demoParties.find((p) => p.code.toUpperCase() === code.toUpperCase());
}
