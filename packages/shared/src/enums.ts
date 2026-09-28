export enum GlobalRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
}

export enum UnitRole {
  THERAPIST = 'THERAPIST',
  SUPERVISOR = 'SUPERVISOR',
}

export enum UnitModuleType {
  REHABILITATION = 'REHABILITATION',
  CONSULTATION = 'CONSULTATION',
}

export enum UserTariffType {
  PARTICULAR = 'PARTICULAR',
  WORKER = 'WORKER',
  STUDENT = 'STUDENT',
}

export enum IntakePath {
  EXTERNAL = 'EXTERNAL',
  REFERRED = 'REFERRED',
}

export enum PatientVisitType {
  NEW = 'NEW',
  RETURNING = 'RETURNING',
}

export enum RehabPlanStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  DISCHARGE = 'DISCHARGE',
  MEDICAL_REEVAL = 'MEDICAL_REEVAL',
}

export enum PlanOrigin {
  THERAPIST_EVAL = 'THERAPIST_EVAL',
  MEDICAL_INDICATION = 'MEDICAL_INDICATION',
}

export enum PlanClosureReason {
  DISCHARGE = 'DISCHARGE',
  MEDICAL_REEVAL = 'MEDICAL_REEVAL',
}

export enum QueueEntryStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum ExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
  PDF = 'pdf',
}
