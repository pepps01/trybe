import { onboardingRequired, type Member } from '@/auth/protocol';

/** Where a signed-in member belongs: finish onboarding first, otherwise Today. */
export function homeFor(member: Member): '/confirm' | '/today' {
  return onboardingRequired(member) ? '/confirm' : '/today';
}
