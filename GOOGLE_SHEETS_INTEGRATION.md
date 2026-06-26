# Eye World Leads CRM - Google Sheets Integration Guide

## Overview

Your Next.js app is now fully connected to Google Sheets through the Google Apps Script deployment. All lead data, agents, call logs, and teams are stored in and retrieved from Google Sheets in real-time.

## Current Setup

### Deployed Google Apps Script
- **URL**: `https://script.google.com/macros/s/AKfycbzYhpRBvJbNB2xTmchLLP8UP19je9-hK4RIn9YCvs4bMym_S7HCOBNdJDCQcRDwtkVl/exec`
- **Environment Variable**: `NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL` (already set in `.env.local`)

## How It Works

### 1. Data Flow

```
Next.js App (React Components)
        ↓
SWR Hooks (useLeads, useAgents, etc.)
        ↓
Google Sheets API Client (lib/googleSheets.ts)
        ↓
Google Apps Script
        ↓
Google Sheets Database
```

### 2. Real-Time Data Sync

All components automatically fetch data from Google Sheets:

- **Moderator Intake**: Fetches all leads, allows creating new leads
- **Call Center Agent**: Fetches leads and call logs, logs new calls
- **Team Lead Monitor**: Displays team performance metrics
- **Executive Dashboard**: Shows analytics from all data
- **Team Admin**: Manages agents and teams

## Key Features Implemented

### Hooks (in `hooks/useGoogleSheetsData.ts`)

```typescript
// Fetch all leads
const { leads, isLoading, mutate } = useLeads();

// Fetch all agents
const { agents, isLoading, mutate } = useAgents();

// Fetch all call logs
const { callLogs, isLoading, mutate } = useCallLogs();

// Fetch all teams
const { teams, isLoading, mutate } = useTeams();
```

### API Functions (in `lib/googleSheets.ts`)

**Creating Data:**
```typescript
// Create a new lead
await createLead({
  name: 'Ahmed Hassan',
  email: 'ahmed@example.com',
  phone: '+966501234567',
  clinicBranch: 'Downtown Branch',
  priority: 'high',
  platform: 'website',
  notes: 'New patient inquiry',
  slaStatus: 'ok',
  assignedAgent: '',
});

// Log a call
await logCall({
  leadId: 'lead_123',
  agentName: 'Agent Name',
  callDate: new Date().toISOString(),
  duration: '15',
  outcome: 'scheduled',
  notes: 'Call notes here',
  recordingUrl: '',
});
```

**Retrieving Data:**
```typescript
// Get all leads
const { success, data: leads } = await getLeads();

// Get specific lead
const { success, data: lead } = await getLeadById('lead_id');

// Get call logs for a lead
const { success, data: logs } = await getCallLogsByLeadId('lead_id');

// Get stats
const { success, data: stats } = await getStats();
```

## Testing the Integration

### 1. Add a Lead

1. Go to **Moderator Intake** tab
2. Click **Add Lead**
3. Fill in the form with test data
4. Click **Submit Lead**
5. Lead appears in the list and is saved to Google Sheets

### 2. Log a Call

1. Go to **Call Center Agent** tab
2. Expand a lead
3. Click outcome button (Scheduled, Interested, or Not Interested)
4. Call is logged to Google Sheets

### 3. View Analytics

1. Go to **Executive Dashboard** tab
2. See real-time charts and metrics based on Google Sheets data

## Google Sheets Sheet Structure

Your Google Sheet should have these 5 sheets (auto-created by the script):

### 1. **Leads** Sheet
Columns: `id`, `name`, `phone`, `email`, `clinicBranch`, `platform`, `priority`, `slaStatus`, `createdDate`, `assignedAgent`, `notes`, `status`, `lastUpdated`

### 2. **Agents** Sheet
Columns: `id`, `name`, `email`, `clinicBranch`, `status`, `bookings`, `role`, `createdDate`

### 3. **CallLogs** Sheet
Columns: `id`, `leadId`, `agentName`, `callDate`, `duration`, `outcome`, `notes`, `recordingUrl`

### 4. **Teams** Sheet
Columns: `id`, `teamName`, `leadCount`, `activeAgents`, `createdDate`

### 5. **Config** Sheet
Stores app configuration and metadata

## Troubleshooting

### Issue: "No leads yet" message
- **Cause**: Google Sheet is empty
- **Fix**: Add leads via the app's "Add Lead" form or manually in the Leads sheet

### Issue: Data not updating
- **Cause**: SWR cache not refreshing
- **Fix**: The app automatically refetches data every 60 seconds. You can manually refresh by calling `mutate()` on the hook result

### Issue: "Google Apps Script URL not configured"
- **Cause**: Environment variable not set
- **Fix**: Make sure `NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL` is in `.env.local`

### Issue: CORS errors
- **Cause**: Google Apps Script not deployed correctly
- **Fix**: 
  1. Go to your Google Sheet
  2. Extensions > Apps Script
  3. Click Deploy > New Deployment
  4. Type: Web app
  5. Execute as: Your Google account
  6. Who has access: Anyone
  7. Copy the URL to `.env.local`

## Performance Considerations

- **Caching**: SWR caches data for 60 seconds to reduce API calls
- **Deduplication**: Multiple requests to the same endpoint within 60 seconds use cached data
- **Manual Refresh**: Call `mutate()` to force a refresh when needed

## Security Notes

- Google Apps Script URL is public (by design for this demo)
- Data is stored in your personal Google Sheet (only you have access)
- In production, add authentication to the Google Apps Script
- Sensitive data should be encrypted before sending to Google Sheets

## Next Steps

1. **Populate Test Data**: Add more leads, agents, and teams via the app
2. **Monitor Real-Time Sync**: Watch data appear in both the app and Google Sheet
3. **Deploy to Vercel**: Push your code to production for team access
4. **Add Authentication**: Implement user login to restrict data access
5. **Customize Workflows**: Extend the app with additional business logic

## Files Modified

- `app/page.tsx` - Now uses real data
- `components/moderator-intake.tsx` - Uses useLeads hook
- `components/call-center-agent.tsx` - Uses useLeads and useCallLogs hooks
- `components/executive-dashboard.tsx` - Uses all hooks for analytics
- `lib/googleSheets.ts` - Google Apps Script API client
- `hooks/useGoogleSheetsData.ts` - Data fetching hooks
- `.env.local` - Added GOOGLE_APPS_SCRIPT_URL

## API Reference

All functions in `lib/googleSheets.ts`:

### Create Operations
- `createLead(data)` - Create new lead
- `createAgent(data)` - Create new agent
- `createTeam(data)` - Create new team
- `logCall(data)` - Log a call

### Update Operations
- `updateLead(id, data)` - Update lead details
- `updateLeadSLA(leadId, slaStatus)` - Update SLA status
- `updateAgent(id, data)` - Update agent details
- `updateTeam(id, data)` - Update team details

### Get Operations
- `getLeads()` - Get all leads
- `getLeadById(id)` - Get specific lead
- `getAgents()` - Get all agents
- `getCallLogs()` - Get all call logs
- `getCallLogsByLeadId(leadId)` - Get call logs for a lead
- `getTeams()` - Get all teams
- `getStats()` - Get statistics

All return `ApiResponse<T>` with `success`, `message`, and `data` fields.
