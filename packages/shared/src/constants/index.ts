export const APP_NAME = 'CounselFlow Ultimate';
export const APP_VERSION = '1.0.0';

export const USER_ROLES = {
  ADMIN: 'admin',
  COUNSELOR: 'counselor',
  CLIENT: 'client',
} as const;

export const APPOINTMENT_STATUS = {
  SCHEDULED: 'scheduled',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no-show',
} as const;

export const DEFAULT_APPOINTMENT_DURATION = 60; // minutes

export const DATE_FORMATS = {
  DISPLAY: 'MMMM d, yyyy',
  API: 'yyyy-MM-dd',
  TIME: 'h:mm a',
} as const;
