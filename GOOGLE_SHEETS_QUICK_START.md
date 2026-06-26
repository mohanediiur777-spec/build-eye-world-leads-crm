# Google Sheets Integration - Quick Start

## 📋 What You Need

1. **Code.gs** - Google Apps Script (provided in this repo)
2. **Google Sheet** - New blank sheet you'll create
3. **Deployment URL** - Generated when you deploy the script
4. **.env.local** - Configuration file with the deployment URL

## ⚡ Quick Setup (5 minutes)

### 1. Create Google Sheet
```
1. Go to sheets.google.com
2. Create new blank spreadsheet
3. Name it "Eye World Leads CRM"
```

### 2. Add Apps Script
```
1. Extensions > Apps Script
2. Delete default code
3. Paste entire Code.gs file
4. Save (Ctrl+S)
```

### 3. Deploy as Web App
```
1. Click Deploy > New Deployment
2. Type: Web app
3. Execute as: [Your Email]
4. Who has access: Anyone
5. Deploy
6. Copy the Deployment URL
```

### 4. Initialize Sheets
```
1. In Apps Script: Run > initializeSheets
2. Allow permissions
3. Check Google Sheet - should have 5 tabs now
```

### 5. Configure Next.js App
Create `.env.local` in your project root:
```
NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/d/YOUR_DEPLOYMENT_ID/usercontent/web/app
```

## 🚀 You're Ready!

Your Next.js app can now call:

```typescript
import { getLeads, createLead } from '@/lib/googleSheets';

// Fetch all leads
const response = await getLeads();
console.log(response.data); // Array of leads

// Create new lead
const newLead = await createLead({
  name: 'Ahmed Hassan',
  phone: '+966501234567',
  email: 'ahmed@example.com',
  clinicBranch: 'Riyadh Downtown',
  platform: 'Google',
  priority: 'High',
  slaStatus: 'ok',
  notes: ''
});
```

## 📚 Available Functions

### Leads
- `getLeads()` - Get all leads
- `getLeadById(id)` - Get specific lead
- `createLead(data)` - Create new lead
- `updateLead(id, data)` - Update existing lead
- `updateLeadSLA(leadId, status)` - Update SLA status

### Agents
- `getAgents()` - Get all agents
- `createAgent(data)` - Create new agent
- `updateAgent(id, data)` - Update agent

### Call Logs
- `getCallLogs()` - Get all call logs
- `getCallLogsByLeadId(leadId)` - Get calls for specific lead
- `logCall(data)` - Log new call

### Teams
- `getTeams()` - Get all teams
- `createTeam(data)` - Create new team
- `updateTeam(id, data)` - Update team

### Analytics
- `getStats()` - Get statistics (total leads, agents, calls, etc.)

## 🔐 Security Notes

⚠️ **Important:**
- Your deployment URL can be used to modify data
- Treat it like an API key
- Don't commit to git (keep in .env.local which is in .gitignore)
- Anyone with the URL can access/modify your data

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| 403 Forbidden | Change "Who has access" to "Anyone" and redeploy |
| Sheets not appearing | Run `initializeSheets()` manually in Apps Script |
| API not responding | Check NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL in .env.local |
| CORS errors | Google Apps Script handles this automatically |

## 📖 Full Documentation

See `GOOGLE_SHEETS_SETUP.md` for detailed API documentation and examples.

## ✅ After Deployment

Once you have the Deployment URL and .env.local configured:

1. Test a single endpoint to confirm connection
2. Gradually migrate mock data to real database
3. Remove mock data utilities when migration is complete
4. Monitor the "Config" sheet to verify updates

Happy coding! 🎉
