export type JourneyStep = {
  at: string;
  event: string;
  page: string;
  label: string;
  detail: string | null;
  tone: 'info' | 'success' | 'warning' | 'error';
};

export type SessionJourney = {
  sessionId: string;
  startedAt: string;
  lastSeenAt: string;
  siteHost: string;
  landingPage: string;
  pageViews: number;
  bookingVisited: boolean;
  bookingStarted: boolean;
  clientConversion: boolean;
  source: string;
  device: string;
  browser: string;
  path: JourneyStep[];
  totalSteps: number;
  omittedSteps: number;
  issueCount: number;
  fieldStates: Array<{ field: string; label: string; state: 'filled' | 'empty' | 'invalid' | 'checked' | 'unchecked' }>;
  choices: Array<{ label: string; value: string }>;
  bookingIds: number[];
};
