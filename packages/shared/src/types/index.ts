export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'counselor' | 'client';
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  dateOfBirth?: Date;
  emergencyContact?: string;
  emergencyPhone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  clientId: string;
  counselorId: string;
  scheduledAt: Date;
  duration: number; // in minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  appointmentId: string;
  clientId: string;
  counselorId: string;
  date: Date;
  duration: number;
  notes: string;
  progress: string;
  nextSteps?: string;
  createdAt: Date;
  updatedAt: Date;
}
