import { GlobalRole, UnitRole } from './enums';

export interface JwtPayload {
  sub: string;
  username: string;
  clinicId: string;
  globalRole: GlobalRole;
  unitIds: string[];
  unitRoles: Record<string, UnitRole>;
}

export interface AuthUser {
  id: string;
  username: string;
  fullName: string;
  clinicId: string;
  globalRole: GlobalRole;
  units: Array<{ id: string; code: string; name: string; role: UnitRole }>;
}

export interface PatientSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  age: number;
  district: string;
  tariffType: string;
  lastVisitDate: string | null;
}

export interface PatientSummary {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    age: number;
    district: string;
    phone: string | null;
    tariffType: string;
  };
  activePlan: {
    id: string;
    plannedSessions: number;
    completedSessions: number;
    status: string;
  } | null;
  lastSession: {
    date: string;
    painIn: number | null;
    painOut: number | null;
    treatments: string[];
  } | null;
}
