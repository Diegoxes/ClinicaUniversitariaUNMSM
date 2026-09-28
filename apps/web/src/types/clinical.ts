import type { PatientSummary } from '@clinica/shared';

export type { PatientSummary };

export interface TimelineSession {
  id: string;
  sessionDate: string;
  painIn: number | null;
  painOut: number | null;
  note: string | null;
  professional: { fullName: string };
  treatments: Array<{ catalogItem: { name: string } | null; otherText: string | null }>;
}

export interface PatientTimeline {
  visits: unknown[];
  plans: unknown[];
  sessions: TimelineSession[];
}
