# Eye World Leads CRM - Connection Details

## Google Sheet Information

**Sheet ID:** `1XarhPhNb0VKy1_gdJHainBFCHlvcB6HzzeCGAXnDIno`

**Access URL:** https://docs.google.com/spreadsheets/d/1XarhPhNb0VKy1_gdJHainBFCHlvcB6HzzeCGAXnDIno/edit

## Google Apps Script Deployment

**Deployed URL:** https://script.google.com/macros/s/AKfycbzYhpRBvJbNB2xTmchLLP8UP19je9-hK4RIn9YCvs4bMym_S7HCOBNdJDCQcRDwtkVl/exec

## Environment Variables

The following variables are configured in `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/AKfycbzYhpRBvJbNB2xTmchLLP8UP19je9-hK4RIn9YCvs4bMym_S7HCOBNdJDCQcRDwtkVl/exec
NEXT_PUBLIC_GOOGLE_SHEET_ID=1XarhPhNb0VKy1_gdJHainBFCHlvcB6HzzeCGAXnDIno
```

## Data Sheets

Your Google Sheet contains the following tabs (created automatically by Code.gs):

1. **Leads** - All customer leads with contact information, priority, and SLA status
2. **Agents** - Call center agent information and performance metrics
3. **CallLogs** - Call history with duration, outcome, and agent details
4. **Teams** - Team structure and assignments
5. **Config** - System configuration and settings

## Testing Connection

1. Open the Google Sheet and verify the tabs exist
2. Go to http://localhost:3000 and add a test lead
3. Refresh the Google Sheet to see the new lead appear in the Leads tab

## Troubleshooting

If data doesn't sync:

1. **Check Google Apps Script logs:**
   - Open Google Sheet → Extensions → Apps Script → Logs
   - Look for any error messages

2. **Verify URL in .env.local:**
   - Make sure `NEXT_PUBLIC_GOOGLE_APPS_SCRIPT_URL` matches your deployment URL

3. **Check CORS:**
   - Google Apps Script should allow cross-origin requests by default
   - If issues persist, verify the script is deployed as "Web App"

4. **Test API directly:**
   ```bash
   curl "https://script.google.com/macros/s/AKfycbzYhpRBvJbNB2xTmchLLP8UP19je9-hK4RIn9YCvs4bMym_S7HCOBNdJDCQcRDwtkVl/exec?action=getLeads"
   ```

## Next Steps

1. **Add Test Data:** Use the app to add a few test leads
2. **Deploy to Vercel:** Once working locally, deploy with `vercel --prod`
3. **Share with Team:** Provide the Vercel URL to your team
4. **Set Up Backups:** Consider setting up automatic Google Sheet backups

## Support

For issues or questions about the integration, refer to:
- `GOOGLE_SHEETS_INTEGRATION.md` - Technical details
- `README_GOOGLE_SHEETS.md` - Quick overview
- `DEPLOYMENT_READY.md` - Deployment guide
