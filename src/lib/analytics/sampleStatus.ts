export function trafficSampleStatus(sessions: number) {
  return sessions >= 10 ? 'sufficient' as const : sessions > 0 ? 'small_sample' as const : 'no_data' as const;
}

export function shouldCreateZeroBookingAction(sessions: number, bookingStarts: number) {
  return trafficSampleStatus(sessions) === 'sufficient' && bookingStarts === 0;
}

export function growthSignal(input: { currentSessions: number; previousSessions: number; currentImpressions: number; previousImpressions: number }) {
  const analyticsReady = input.currentSessions + input.previousSessions >= 10;
  const gscReady = input.currentImpressions + input.previousImpressions >= 20;
  const analyticsPositive = analyticsReady && input.currentSessions > input.previousSessions;
  const gscPositive = gscReady && input.currentImpressions > input.previousImpressions;
  return {
    growing: analyticsPositive || gscPositive,
    confidence: analyticsPositive && gscPositive ? 'high' as const : analyticsPositive || gscPositive ? 'medium' as const : analyticsReady || gscReady ? 'neutral' as const : 'small_sample' as const,
  };
}
