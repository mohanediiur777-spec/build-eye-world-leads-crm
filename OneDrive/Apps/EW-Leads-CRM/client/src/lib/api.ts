import { APPS_SCRIPT_URL } from "../../../shared/const";

export interface Lead {
  id: number;
  timestamp: string | null;
  name: string;
  phone: string;
  note: string;
  source?: string;
  inboundSource?: string;
  inboundType?: string;
  leadType?: string;
  inboundNotes?: string;
  entity?: string;
  platform?: string;
  priority?: string;
  followUp?: string;
  assignedTo?: string;
  dispatchedTo?: string;
  dispatchTimestamp: string | null;
  status?: string;
  adminNote: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  error?: string;
  leads?: T[];
  rowIndex?: number;
}

/**
 * Fetch all leads from Google Apps Script
 */
export async function fetchLeads(): Promise<Lead[]> {
  try {
    const response = await fetch(APPS_SCRIPT_URL);
    const data: ApiResponse<Lead> = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to fetch leads");
    }
    
    return data.leads || [];
  } catch (error) {
    console.error("Error fetching leads:", error);
    throw error;
  }
}

/**
 * Save a new lead to Google Apps Script
 */
export async function saveLead(
  name: string,
  phone: string,
  entity: string,
  platform: string,
  priority: string,
  note: string,
  followUp: string
): Promise<number> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "save",
        name,
        phone,
        entity,
        platform,
        priority,
        note,
        followUp
      })
    });
    
    const data: ApiResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to save lead");
    }
    
    return data.rowIndex || 0;
  } catch (error) {
    console.error("Error saving lead:", error);
    throw error;
  }
}

/**
 * Dispatch a lead to Call Center
 */
export async function dispatchLead(
  rowIndex: number,
  dispatchedTo: string
): Promise<void> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "dispatch",
        rowIndex,
        dispatchedTo
      })
    });
    
    const data: ApiResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to dispatch lead");
    }
  } catch (error) {
    console.error("Error dispatching lead:", error);
    throw error;
  }
}

/**
 * Update lead status and admin note
 */
export async function updateLeadStatus(
  rowIndex: number,
  status: string,
  adminNote: string,
  followUpDate?: string, // ISO date (YYYY-MM-DD), or "" to clear
  followUpNote?: string,
  additionalName?: string
): Promise<void> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "update",
        rowIndex,
        status,
        adminNote,
        followUpDate: followUpDate ?? undefined,
        followUpNote: followUpNote || undefined,
        additionalName: additionalName || undefined
      })
    });
    
    const data: ApiResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to update lead");
    }
  } catch (error) {
    console.error("Error updating lead:", error);
    throw error;
  }
}

/**
 * Toggle follow-up status on existing lead
 */
export async function toggleFollowUp(
  rowIndex: number,
  followUpDate: string, // ISO date (YYYY-MM-DD), or "" to clear
  followUpNote?: string
): Promise<void> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "toggleFollowUp",
        rowIndex,
        followUpDate,
        followUpNote: followUpNote || ""
      })
    });
    const data: ApiResponse = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to toggle follow-up");
    }
  } catch (error) {
    console.error("Error toggling follow-up:", error);
    throw error;
  }
}

/**
 * Clean phone number for WhatsApp (remove spaces and special characters)
 */
export function cleanPhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\(\)]/g, "");
}

/**
 * Generate WhatsApp message link
 */
export function generateWhatsAppLink(
  phoneNumber: string,
  message: string
): string {
  const cleanPhone = cleanPhoneNumber(phoneNumber);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

const WORK_START_HOUR = 11; // 11:00 AM Cairo
const WORK_END_HOUR   = 19; //  7:00 PM Cairo
const CAIRO_OFFSET_MS = 3 * 60 * 60 * 1000;

export function getWorkingMinutesElapsed(submittedAt: Date): number {
  const now = new Date();
  if (now <= submittedAt) return 0;

  let total = 0;
  let cursor = new Date(submittedAt.getTime());

  // Snap forward to next working minute
  cursor = snapToNextWorkingMinute(cursor);

  while (cursor < now) {
    if (isWorkingMinute(cursor)) total++;
    cursor = new Date(cursor.getTime() + 60 * 1000);
    if (cursor > now) break;
  }
  return total;
}

export function isWorkingMinute(utcDate: Date): boolean {
  const cairo = new Date(utcDate.getTime() + CAIRO_OFFSET_MS);
  const day   = cairo.getUTCDay();
  const hhmm  = cairo.getUTCHours() * 60 + cairo.getUTCMinutes();
  if (day === 5 || day === 6) return false; // Fri + Sat off
  return hhmm >= WORK_START_HOUR * 60 && hhmm < WORK_END_HOUR * 60;
}

export function snapToNextWorkingMinute(utcDate: Date): Date {
  let d = new Date(utcDate.getTime());
  for (let i = 0; i < 15000; i++) {
    if (isWorkingMinute(d)) return d;
    d = new Date(d.getTime() + 60 * 1000);
  }
  return d;
}

export function getSLAStatus(lead: Lead): "on_track" | "at_risk" | "breached" | "no_sla" {
  const closedStatuses = ["Booked/Confirmed", "Canceled", "Re-engage Lead"];
  if (!lead.timestamp) return "no_sla";
  if (lead.priority === "Cold") return "no_sla";
  if (closedStatuses.includes(lead.status || "")) return "no_sla";
  if ((lead.adminNote || "").trim()) return "no_sla"; // counter stops once note added

  const mins = getWorkingMinutesElapsed(new Date(lead.timestamp));

  if (lead.priority?.startsWith("Hot")) {
    if (mins > 180) return "breached";  // 3 working hours
    if (mins > 120) return "at_risk";
    return "on_track";
  }
  if (lead.priority?.startsWith("Warm")) {
    if (mins > 840) return "breached";  // 14 working hours
    if (mins > 600) return "at_risk";
    return "on_track";
  }
  return "no_sla";
}

/**
 * Get traffic light color based on SLA
 */
export function getTrafficLight(lead: Lead): string {
  const s = getSLAStatus(lead);
  if (s === "breached")  return "red";
  if (s === "at_risk")   return "yellow";
  if (s === "on_track")  return "green";
  return "gray";
}

/**
 * Format relative time (e.g., "45 minutes ago")
 */
export function formatRelativeTime(timestamp: string | null): string {
  if (!timestamp) return "Not dispatched";
  
  const now = new Date().getTime();
  const time = new Date(timestamp).getTime();
  const elapsedMs = now - time;
  
  const seconds = Math.floor(elapsedMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (seconds < 60) {
    return "Just now";
  } else if (minutes < 60) {
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
}

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if a lead was created today
 */
/**
 * Default follow-up due date when a lead is flagged at intake (today + 3 days).
 * Mirrors DEFAULT_FOLLOW_UP_DAYS in the Apps Script backend's migration.
 */
export function getDefaultFollowUpDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 3);
  return d.toISOString().split("T")[0];
}

export function isFollowUpOverdue(followUp?: string): boolean {
  if (!followUp || followUp === "Yes") return false; // legacy flag, no date to compare
  const due = new Date(followUp).getTime();
  if (Number.isNaN(due)) return false;
  return due < new Date().setHours(0, 0, 0, 0);
}

export function formatFollowUpLabel(followUp?: string): string {
  if (!followUp) return "No follow-up set";
  if (followUp === "Yes") return "Flagged (legacy)"; // pre-migration rows
  const due = new Date(followUp);
  if (Number.isNaN(due.getTime())) return "No follow-up set";

  const today = new Date().setHours(0, 0, 0, 0);
  const dueDay = due.setHours(0, 0, 0, 0);
  const diffDays = Math.round((dueDay - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) > 1 ? "s" : ""}`;
  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `Due in ${diffDays} days`;
}

export function isLeadFromToday(timestamp: string | null): boolean {

  if (!timestamp) return false;
  
  const leadDate = new Date(timestamp);
  const today = new Date();
  
  return (
    leadDate.getFullYear() === today.getFullYear() &&
    leadDate.getMonth() === today.getMonth() &&
    leadDate.getDate() === today.getDate()
  );
}

/**
 * Generate daily report text for WhatsApp
 */
export function generateDailyReport(leads: Lead[]): string {
  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  
  let report = `📊 Daily Report - ${dateStr}\nTotal Leads: ${leads.length}\n\n`;
  
  leads.forEach((lead, index) => {
    report += `${index + 1}. ${lead.name} - ${lead.phone}\n`;
  });
  
  return report;
}

/**
 * Send daily report to Apps Script (with optional date parameter)
 */
export async function sendDailyReport(date?: string, recipient?: string): Promise<void> {
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "dailyReport",
        date: date || undefined,
        recipient: recipient || undefined
      })
    });
    
    const data: ApiResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || "Failed to send daily report");
    }
  } catch (error) {
    console.error("Error sending daily report:", error);
    throw error;
  }
}

/**
 * Get yesterday's date in YYYY-MM-DD format
 */
export function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Check if a lead was created on a specific date
 */
export function isLeadFromDate(timestamp: string | null, dateStr: string): boolean {
  if (!timestamp) return false;
  
  const leadDate = new Date(timestamp);
  const [year, month, day] = dateStr.split("-").map(Number);
  const targetDate = new Date(year, month - 1, day);
  
  return (
    leadDate.getFullYear() === targetDate.getFullYear() &&
    leadDate.getMonth() === targetDate.getMonth() &&
    leadDate.getDate() === targetDate.getDate()
  );
}