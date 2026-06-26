# Google Sheets Integration Setup Guide

## Step 1: Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com)
2. Create a new blank spreadsheet
3. Name it "Eye World Leads CRM"

## Step 2: Deploy the Google Apps Script

1. In your Google Sheet, go to **Extensions > Apps Script**
2. Delete the default code in editor.gs
3. Paste the entire **Code.gs** script provided
4. Save the project (Ctrl+S / Cmd+S)
5. Click the blue **"Deploy"** button in the top-right
6. Select **"New deployment"**
7. Click the gear icon > **"Web app"**
8. Set:
   - **Execute as:** Your email
   - **Who has access:** Anyone
9. Click **Deploy**
10. Copy the **Deployment URL** (you'll need this for the app)
11. Click **"Allow"** to grant permissions

## Step 3: Initialize the Google Sheet

1. In Apps Script editor, go to **Run** menu
2. Select function: **initializeSheets**
3. Click **Run**
4. Grant permissions when prompted
5. Check your Google Sheet - you should now see 5 tabs: Leads, Agents, CallLogs, Teams, Config

## Step 4: Configure the Next.js App

Once you have the Deployment URL from Step 2, create a `.env.local` file in your project:

```
NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercontent/web/app
```

Replace `{DEPLOYMENT_ID}` with the ID from your deployment URL.

## Available API Endpoints

### POST Endpoints (Creating/Updating Data)

**Base URL:** `https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercontent/web/app`

#### Create Lead
```json
{
  "action": "createLead",
  "name": "Ahmed Hassan",
  "phone": "+966501234567",
  "email": "ahmed@example.com",
  "clinicBranch": "Riyadh Downtown",
  "platform": "Google",
  "priority": "High",
  "slaStatus": "ok",
  "notes": "Follow-up consultation"
}
```

#### Update Lead
```json
{
  "action": "updateLead",
  "id": "LEAD_...",
  "name": "Ahmed Hassan",
  "status": "active",
  "priority": "High"
}
```

#### Update Lead SLA Status
```json
{
  "action": "updateLeadSLA",
  "leadId": "LEAD_...",
  "slaStatus": "warning"
}
```

#### Create Agent
```json
{
  "action": "createAgent",
  "name": "Fatima Ahmed",
  "email": "fatima@eyeworld.com",
  "clinicBranch": "Riyadh Downtown",
  "status": "active",
  "bookings": 0,
  "role": "agent"
}
```

#### Update Agent
```json
{
  "action": "updateAgent",
  "id": "AGENT_...",
  "bookings": 5,
  "status": "active"
}
```

#### Log Call
```json
{
  "action": "logCall",
  "leadId": "LEAD_...",
  "agentName": "Fatima Ahmed",
  "duration": "12:34",
  "outcome": "appointment_booked",
  "notes": "Patient booked for consultation",
  "recordingUrl": ""
}
```

#### Create Team
```json
{
  "action": "createTeam",
  "teamName": "Riyadh Team",
  "leadCount": 0,
  "activeAgents": 3
}
```

#### Update Team
```json
{
  "action": "updateTeam",
  "id": "TEAM_...",
  "leadCount": 45,
  "activeAgents": 4
}
```

### GET Endpoints (Retrieving Data)

**Format:** `https://script.google.com/macros/d/{DEPLOYMENT_ID}/usercontent/web/app?action={ACTION}`

#### Get All Leads
```
?action=getLeads
```
Response:
```json
{
  "success": true,
  "message": "Leads retrieved",
  "data": [
    {
      "id": "LEAD_...",
      "name": "Ahmed Hassan",
      "phone": "+966501234567",
      "email": "ahmed@example.com",
      "clinicBranch": "Riyadh Downtown",
      "platform": "Google",
      "priority": "High",
      "slaStatus": "ok",
      "createdDate": "2024-06-26T10:30:00.000Z",
      "assignedAgent": "",
      "notes": "",
      "status": "active",
      "lastUpdated": "2024-06-26T10:30:00.000Z"
    }
  ]
}
```

#### Get Lead by ID
```
?action=getLeadById&id=LEAD_...
```

#### Get All Agents
```
?action=getAgents
```

#### Get Call Logs
```
?action=getCallLogs
```

#### Get Call Logs by Lead ID
```
?action=getCallLogsByLeadId&leadId=LEAD_...
```

#### Get Teams
```
?action=getTeams
```

#### Get Statistics
```
?action=getStats
```
Response:
```json
{
  "success": true,
  "message": "Stats retrieved",
  "data": {
    "totalLeads": 45,
    "totalAgents": 8,
    "totalCalls": 120,
    "activeLeads": 30,
    "completedCalls": 95
  }
}
```

## Sheet Structure

### Leads Sheet
- ID, Name, Phone, Email, Clinic Branch, Platform, Priority, SLA Status, Created Date, Assigned Agent, Notes, Status, Last Updated

### Agents Sheet
- ID, Name, Email, Clinic Branch, Status, Bookings, Role, Created Date

### CallLogs Sheet
- ID, Lead ID, Agent Name, Call Date, Call Duration, Outcome, Notes, Recording URL

### Teams Sheet
- ID, Team Name, Lead Count, Active Agents, Created Date

### Config Sheet
- Setting, Value (stores spreadsheet ID and last updated timestamp)

## Example: Using with Next.js

```typescript
// lib/googleSheets.ts
const SCRIPT_URL = process.env.NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL!;

export async function createLead(data: any) {
  const response = await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'createLead',
      ...data
    })
  });
  return response.json();
}

export async function getLeads() {
  const params = new URLSearchParams({ action: 'getLeads' });
  const response = await fetch(`${SCRIPT_URL}?${params}`);
  return response.json();
}
```

## Troubleshooting

### "Cannot find apps script URL"
- Make sure you deployed as a Web App (Extensions > Apps Script > Deploy > New Deployment > Web App)
- Verify the URL is set in your `.env.local` file

### 403 Forbidden Error
- Make sure "Who has access" is set to "Anyone"
- Try re-deploying with "Execute as: Your email"

### Sheets not initializing
- In Apps Script, run the `initializeSheets()` function manually
- Check if you have permission to edit the Google Sheet

### CORS Issues
- Google Apps Script handles CORS automatically
- Make sure you're making requests from an authorized domain

## Security Notes

1. **Do NOT share the deployment URL publicly** - anyone with it can modify data
2. Consider adding a simple token-based authentication by modifying the Code.gs script
3. Monitor the "Config" sheet to see when data was last modified
4. Google Sheets has rate limits (~100 requests/100 seconds for Apps Script)

## Next Steps

1. Deploy the Google Sheet with Code.gs
2. Get the Deployment URL
3. Add it to your Next.js `.env.local` file
4. Update the app to use the Google Sheets API instead of mock data
5. Test the integration thoroughly

