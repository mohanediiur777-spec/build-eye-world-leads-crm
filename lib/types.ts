export type Role = 'moderator' | 'agent' | 'lead' | 'executive' | 'admin';

export type SLAStatus = 'ok' | 'warning' | 'critical' | 'overdue';

export type Priority = 'high' | 'medium' | 'low';

export interface Lead {
  id: string;
  name: string;
  nameAr: string;
  email: string;
  phone: string;
  clinic: string;
  priority: Priority;
  slaStatus: SLAStatus;
  source: 'website' | 'phone' | 'referral' | 'social';
  createdAt: Date;
  lastContactAt: Date;
  nextFollowUp: Date;
  notes: string;
  assignedAgent?: string;
  callHistory: CallLog[];
}

export interface CallLog {
  id: string;
  leadId: string;
  date: Date;
  duration: number;
  notes: string;
  outcome: 'scheduled' | 'interested' | 'not-interested' | 'no-answer';
  agentName: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: Role;
  clinic: string;
  activeCalls: number;
  totalBookings: number;
  avgCallDuration: number;
}

export interface ClinicBranch {
  id: string;
  name: string;
  city: string;
  manager: string;
  leadsCount: number;
  bookingsCount: number;
}
