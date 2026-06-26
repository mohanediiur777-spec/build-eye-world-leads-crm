// Google Sheets Integration Client
// This utility handles all communication with the Google Apps Script backend

const SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL;

if (!SCRIPT_URL) {
  console.warn('[v0] NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL is not set. Using mock data.');
}

// Types
export interface Lead {
  id: string;
  name: string;
  phone: string;
  email: string;
  clinicBranch: string;
  platform: string;
  priority: string;
  slaStatus: string;
  createdDate: string;
  assignedAgent: string;
  notes: string;
  status: string;
  lastUpdated: string;
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  clinicBranch: string;
  status: string;
  bookings: number;
  role: string;
  createdDate: string;
}

export interface CallLog {
  id: string;
  leadId: string;
  agentName: string;
  callDate: string;
  duration: string;
  outcome: string;
  notes: string;
  recordingUrl: string;
}

export interface Team {
  id: string;
  teamName: string;
  leadCount: number;
  activeAgents: number;
  createdDate: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// POST Operations
export async function createLead(data: Omit<Lead, 'id' | 'createdDate' | 'lastUpdated' | 'status'>): Promise<ApiResponse<Lead>> {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured');
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'createLead',
        ...data
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[v0] Error creating lead:', error);
    throw error;
  }
}

export async function updateLead(id: string, data: Partial<Lead>): Promise<ApiResponse<any>> {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured');
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'updateLead',
        id,
        ...data
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[v0] Error updating lead:', error);
    throw error;
  }
}

export async function updateLeadSLA(leadId: string, slaStatus: string): Promise<ApiResponse<any>> {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured');
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'updateLeadSLA',
        leadId,
        slaStatus
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[v0] Error updating SLA:', error);
    throw error;
  }
}

export async function createAgent(data: Omit<Agent, 'id' | 'createdDate'>): Promise<ApiResponse<Agent>> {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured');
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'createAgent',
        ...data
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[v0] Error creating agent:', error);
    throw error;
  }
}

export async function updateAgent(id: string, data: Partial<Agent>): Promise<ApiResponse<any>> {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured');
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'updateAgent',
        id,
        ...data
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[v0] Error updating agent:', error);
    throw error;
  }
}

export async function logCall(data: Omit<CallLog, 'id'>): Promise<ApiResponse<CallLog>> {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured');
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'logCall',
        ...data
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[v0] Error logging call:', error);
    throw error;
  }
}

export async function createTeam(data: Omit<Team, 'id' | 'createdDate'>): Promise<ApiResponse<Team>> {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured');
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'createTeam',
        ...data
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[v0] Error creating team:', error);
    throw error;
  }
}

export async function updateTeam(id: string, data: Partial<Team>): Promise<ApiResponse<any>> {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured');
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'updateTeam',
        id,
        ...data
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[v0] Error updating team:', error);
    throw error;
  }
}

// GET Operations
export async function getLeads(): Promise<ApiResponse<Lead[]>> {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured');
  }

  try {
    const params = new URLSearchParams({ action: 'getLeads' });
    const response = await fetch(`${SCRIPT_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[v0] Error fetching leads:', error);
    throw error;
  }
}

export async function getLeadById(id: string): Promise<ApiResponse<Lead>> {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured');
  }

  try {
    const params = new URLSearchParams({ action: 'getLeadById', id });
    const response = await fetch(`${SCRIPT_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[v0] Error fetching lead:', error);
    throw error;
  }
}

export async function getAgents(): Promise<ApiResponse<Agent[]>> {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured');
  }

  try {
    const params = new URLSearchParams({ action: 'getAgents' });
    const response = await fetch(`${SCRIPT_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[v0] Error fetching agents:', error);
    throw error;
  }
}

export async function getCallLogs(): Promise<ApiResponse<CallLog[]>> {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured');
  }

  try {
    const params = new URLSearchParams({ action: 'getCallLogs' });
    const response = await fetch(`${SCRIPT_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[v0] Error fetching call logs:', error);
    throw error;
  }
}

export async function getCallLogsByLeadId(leadId: string): Promise<ApiResponse<CallLog[]>> {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured');
  }

  try {
    const params = new URLSearchParams({ action: 'getCallLogsByLeadId', leadId });
    const response = await fetch(`${SCRIPT_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[v0] Error fetching call logs:', error);
    throw error;
  }
}

export async function getTeams(): Promise<ApiResponse<Team[]>> {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured');
  }

  try {
    const params = new URLSearchParams({ action: 'getTeams' });
    const response = await fetch(`${SCRIPT_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[v0] Error fetching teams:', error);
    throw error;
  }
}

export async function getStats(): Promise<ApiResponse<any>> {
  if (!SCRIPT_URL) {
    throw new Error('Google Apps Script URL not configured');
  }

  try {
    const params = new URLSearchParams({ action: 'getStats' });
    const response = await fetch(`${SCRIPT_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('[v0] Error fetching stats:', error);
    throw error;
  }
}
