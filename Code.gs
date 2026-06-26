// Eye World Leads CRM - Google Sheets Backend
// Deploy as web app: New Deployment > Web App > Execute as: Me > Allow Anyone

const SPREADSHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();
const ss = SpreadsheetApp.getActiveSpreadsheet();

// Initialize sheets on first run
function initializeSheets() {
  const sheetNames = ['Leads', 'Agents', 'CallLogs', 'Teams', 'Config'];
  
  sheetNames.forEach(name => {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  });

  initializeLeadsSheet();
  initializeAgentsSheet();
  initializeCallLogsSheet();
  initializeTeamsSheet();
  initializeConfigSheet();
}

// Initialize Leads sheet with headers
function initializeLeadsSheet() {
  const sheet = ss.getSheetByName('Leads');
  if (sheet.getLastRow() === 0) {
    const headers = [
      'ID',
      'Name',
      'Phone',
      'Email',
      'Clinic Branch',
      'Platform',
      'Priority',
      'SLA Status',
      'Created Date',
      'Assigned Agent',
      'Notes',
      'Status',
      'Last Updated'
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0ea5e9').setFontColor('white');
  }
}

// Initialize Agents sheet with headers
function initializeAgentsSheet() {
  const sheet = ss.getSheetByName('Agents');
  if (sheet.getLastRow() === 0) {
    const headers = [
      'ID',
      'Name',
      'Email',
      'Clinic Branch',
      'Status',
      'Bookings',
      'Role',
      'Created Date'
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0ea5e9').setFontColor('white');
  }
}

// Initialize CallLogs sheet with headers
function initializeCallLogsSheet() {
  const sheet = ss.getSheetByName('CallLogs');
  if (sheet.getLastRow() === 0) {
    const headers = [
      'ID',
      'Lead ID',
      'Agent Name',
      'Call Date',
      'Call Duration',
      'Outcome',
      'Notes',
      'Recording URL'
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0ea5e9').setFontColor('white');
  }
}

// Initialize Teams sheet with headers
function initializeTeamsSheet() {
  const sheet = ss.getSheetByName('Teams');
  if (sheet.getLastRow() === 0) {
    const headers = [
      'ID',
      'Team Name',
      'Lead Count',
      'Active Agents',
      'Created Date'
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0ea5e9').setFontColor('white');
  }
}

// Initialize Config sheet with settings
function initializeConfigSheet() {
  const sheet = ss.getSheetByName('Config');
  if (sheet.getLastRow() === 0) {
    const headers = ['Setting', 'Value'];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, 2).setFontWeight('bold').setBackground('#0ea5e9').setFontColor('white');
    
    // Add default settings
    sheet.appendRow(['Spreadsheet ID', SPREADSHEET_ID]);
    sheet.appendRow(['Last Updated', new Date().toISOString()]);
  }
}

// Main doPost handler for creating/updating data
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;

    switch (action) {
      case 'createLead':
        return createLead(params);
      case 'updateLead':
        return updateLead(params);
      case 'updateLeadSLA':
        return updateLeadSLA(params);
      case 'createAgent':
        return createAgent(params);
      case 'updateAgent':
        return updateAgent(params);
      case 'logCall':
        return logCall(params);
      case 'createTeam':
        return createTeam(params);
      case 'updateTeam':
        return updateTeam(params);
      default:
        return respond(false, 'Unknown action: ' + action);
    }
  } catch (error) {
    return respond(false, 'Error: ' + error.toString());
  }
}

// Main doGet handler for retrieving data
function doGet(e) {
  try {
    const action = e.parameter.action;

    switch (action) {
      case 'getLeads':
        return getLeads();
      case 'getLeadById':
        return getLeadById(e.parameter.id);
      case 'getAgents':
        return getAgents();
      case 'getCallLogs':
        return getCallLogs();
      case 'getCallLogsByLeadId':
        return getCallLogsByLeadId(e.parameter.leadId);
      case 'getTeams':
        return getTeams();
      case 'getStats':
        return getStats();
      default:
        return respondGet(false, 'Unknown action: ' + action);
    }
  } catch (error) {
    return respondGet(false, 'Error: ' + error.toString());
  }
}

// CREATE OPERATIONS
function createLead(params) {
  const sheet = ss.getSheetByName('Leads');
  const id = generateId('LEAD');
  
  const row = [
    id,
    params.name || '',
    params.phone || '',
    params.email || '',
    params.clinicBranch || '',
    params.platform || '',
    params.priority || 'Normal',
    params.slaStatus || 'ok',
    new Date().toISOString(),
    params.assignedAgent || '',
    params.notes || '',
    'active',
    new Date().toISOString()
  ];

  sheet.appendRow(row);
  updateConfigLastUpdated();

  return respond(true, 'Lead created successfully', { id, ...params });
}

function createAgent(params) {
  const sheet = ss.getSheetByName('Agents');
  const id = generateId('AGENT');
  
  const row = [
    id,
    params.name || '',
    params.email || '',
    params.clinicBranch || '',
    params.status || 'active',
    params.bookings || 0,
    params.role || 'agent',
    new Date().toISOString()
  ];

  sheet.appendRow(row);
  updateConfigLastUpdated();

  return respond(true, 'Agent created successfully', { id, ...params });
}

function logCall(params) {
  const sheet = ss.getSheetByName('CallLogs');
  const id = generateId('CALL');
  
  const row = [
    id,
    params.leadId || '',
    params.agentName || '',
    new Date().toISOString(),
    params.duration || '0',
    params.outcome || '',
    params.notes || '',
    params.recordingUrl || ''
  ];

  sheet.appendRow(row);
  updateConfigLastUpdated();

  // Update lead's last contacted date
  updateLeadLastContactedDate(params.leadId);

  return respond(true, 'Call logged successfully', { id, ...params });
}

function createTeam(params) {
  const sheet = ss.getSheetByName('Teams');
  const id = generateId('TEAM');
  
  const row = [
    id,
    params.teamName || '',
    params.leadCount || 0,
    params.activeAgents || 0,
    new Date().toISOString()
  ];

  sheet.appendRow(row);
  updateConfigLastUpdated();

  return respond(true, 'Team created successfully', { id, ...params });
}

// UPDATE OPERATIONS
function updateLead(params) {
  const sheet = ss.getSheetByName('Leads');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === params.id) {
      const range = sheet.getRange(i + 1, 1, 1, 13);
      const row = [
        params.id,
        params.name !== undefined ? params.name : data[i][1],
        params.phone !== undefined ? params.phone : data[i][2],
        params.email !== undefined ? params.email : data[i][3],
        params.clinicBranch !== undefined ? params.clinicBranch : data[i][4],
        params.platform !== undefined ? params.platform : data[i][5],
        params.priority !== undefined ? params.priority : data[i][6],
        params.slaStatus !== undefined ? params.slaStatus : data[i][7],
        data[i][8],
        params.assignedAgent !== undefined ? params.assignedAgent : data[i][9],
        params.notes !== undefined ? params.notes : data[i][10],
        params.status !== undefined ? params.status : data[i][11],
        new Date().toISOString()
      ];
      range.setValues([row]);
      updateConfigLastUpdated();
      return respond(true, 'Lead updated successfully', row);
    }
  }
  
  return respond(false, 'Lead not found');
}

function updateLeadSLA(params) {
  const sheet = ss.getSheetByName('Leads');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === params.leadId) {
      sheet.getRange(i + 1, 8).setValue(params.slaStatus);
      sheet.getRange(i + 1, 13).setValue(new Date().toISOString());
      updateConfigLastUpdated();
      return respond(true, 'SLA Status updated', { leadId: params.leadId, slaStatus: params.slaStatus });
    }
  }
  
  return respond(false, 'Lead not found');
}

function updateAgent(params) {
  const sheet = ss.getSheetByName('Agents');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === params.id) {
      const range = sheet.getRange(i + 1, 1, 1, 8);
      const row = [
        params.id,
        params.name !== undefined ? params.name : data[i][1],
        params.email !== undefined ? params.email : data[i][2],
        params.clinicBranch !== undefined ? params.clinicBranch : data[i][3],
        params.status !== undefined ? params.status : data[i][4],
        params.bookings !== undefined ? params.bookings : data[i][5],
        params.role !== undefined ? params.role : data[i][6],
        data[i][7]
      ];
      range.setValues([row]);
      updateConfigLastUpdated();
      return respond(true, 'Agent updated successfully', row);
    }
  }
  
  return respond(false, 'Agent not found');
}

function updateTeam(params) {
  const sheet = ss.getSheetByName('Teams');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === params.id) {
      const range = sheet.getRange(i + 1, 1, 1, 5);
      const row = [
        params.id,
        params.teamName !== undefined ? params.teamName : data[i][1],
        params.leadCount !== undefined ? params.leadCount : data[i][2],
        params.activeAgents !== undefined ? params.activeAgents : data[i][3],
        data[i][4]
      ];
      range.setValues([row]);
      updateConfigLastUpdated();
      return respond(true, 'Team updated successfully', row);
    }
  }
  
  return respond(false, 'Team not found');
}

// RETRIEVE OPERATIONS
function getLeads() {
  const sheet = ss.getSheetByName('Leads');
  const data = sheet.getDataRange().getValues();
  const leads = [];

  for (let i = 1; i < data.length; i++) {
    leads.push({
      id: data[i][0],
      name: data[i][1],
      phone: data[i][2],
      email: data[i][3],
      clinicBranch: data[i][4],
      platform: data[i][5],
      priority: data[i][6],
      slaStatus: data[i][7],
      createdDate: data[i][8],
      assignedAgent: data[i][9],
      notes: data[i][10],
      status: data[i][11],
      lastUpdated: data[i][12]
    });
  }

  return respondGet(true, 'Leads retrieved', leads);
}

function getLeadById(leadId) {
  const sheet = ss.getSheetByName('Leads');
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === leadId) {
      const lead = {
        id: data[i][0],
        name: data[i][1],
        phone: data[i][2],
        email: data[i][3],
        clinicBranch: data[i][4],
        platform: data[i][5],
        priority: data[i][6],
        slaStatus: data[i][7],
        createdDate: data[i][8],
        assignedAgent: data[i][9],
        notes: data[i][10],
        status: data[i][11],
        lastUpdated: data[i][12]
      };
      return respondGet(true, 'Lead retrieved', lead);
    }
  }

  return respondGet(false, 'Lead not found');
}

function getAgents() {
  const sheet = ss.getSheetByName('Agents');
  const data = sheet.getDataRange().getValues();
  const agents = [];

  for (let i = 1; i < data.length; i++) {
    agents.push({
      id: data[i][0],
      name: data[i][1],
      email: data[i][2],
      clinicBranch: data[i][3],
      status: data[i][4],
      bookings: data[i][5],
      role: data[i][6],
      createdDate: data[i][7]
    });
  }

  return respondGet(true, 'Agents retrieved', agents);
}

function getCallLogs() {
  const sheet = ss.getSheetByName('CallLogs');
  const data = sheet.getDataRange().getValues();
  const logs = [];

  for (let i = 1; i < data.length; i++) {
    logs.push({
      id: data[i][0],
      leadId: data[i][1],
      agentName: data[i][2],
      callDate: data[i][3],
      duration: data[i][4],
      outcome: data[i][5],
      notes: data[i][6],
      recordingUrl: data[i][7]
    });
  }

  return respondGet(true, 'Call logs retrieved', logs);
}

function getCallLogsByLeadId(leadId) {
  const sheet = ss.getSheetByName('CallLogs');
  const data = sheet.getDataRange().getValues();
  const logs = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === leadId) {
      logs.push({
        id: data[i][0],
        leadId: data[i][1],
        agentName: data[i][2],
        callDate: data[i][3],
        duration: data[i][4],
        outcome: data[i][5],
        notes: data[i][6],
        recordingUrl: data[i][7]
      });
    }
  }

  return respondGet(true, 'Call logs retrieved', logs);
}

function getTeams() {
  const sheet = ss.getSheetByName('Teams');
  const data = sheet.getDataRange().getValues();
  const teams = [];

  for (let i = 1; i < data.length; i++) {
    teams.push({
      id: data[i][0],
      teamName: data[i][1],
      leadCount: data[i][2],
      activeAgents: data[i][3],
      createdDate: data[i][4]
    });
  }

  return respondGet(true, 'Teams retrieved', teams);
}

function getStats() {
  const leadsSheet = ss.getSheetByName('Leads');
  const agentsSheet = ss.getSheetByName('Agents');
  const callLogsSheet = ss.getSheetByName('CallLogs');

  const leadsData = leadsSheet.getDataRange().getValues();
  const agentsData = agentsSheet.getDataRange().getValues();
  const callLogsData = callLogsSheet.getDataRange().getValues();

  const stats = {
    totalLeads: leadsData.length - 1,
    totalAgents: agentsData.length - 1,
    totalCalls: callLogsData.length - 1,
    activeLeads: countByStatus(leadsData, 'active'),
    completedCalls: countCallsByOutcome(callLogsData, 'completed')
  };

  return respondGet(true, 'Stats retrieved', stats);
}

// HELPER FUNCTIONS
function generateId(prefix) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return prefix + '_' + timestamp + random;
}

function updateConfigLastUpdated() {
  const sheet = ss.getSheetByName('Config');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'Last Updated') {
      sheet.getRange(i + 1, 2).setValue(new Date().toISOString());
      break;
    }
  }
}

function updateLeadLastContactedDate(leadId) {
  const sheet = ss.getSheetByName('Leads');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === leadId) {
      sheet.getRange(i + 1, 13).setValue(new Date().toISOString());
      break;
    }
  }
}

function countByStatus(data, status) {
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][11] === status) count++;
  }
  return count;
}

function countCallsByOutcome(data, outcome) {
  let count = 0;
  for (let i = 1; i < data.length; i++) {
    if (data[i][5] === outcome) count++;
  }
  return count;
}

function respond(success, message, data = null) {
  const output = ContentService.createTextOutput(
    JSON.stringify({
      success: success,
      message: message,
      data: data || {}
    })
  );
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

function respondGet(success, message, data = null) {
  const output = ContentService.createTextOutput(
    JSON.stringify({
      success: success,
      message: message,
      data: data || {}
    })
  );
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
