'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SLABadge } from './sla-badge';
import { mockLeads } from '@/lib/mock-data';
import { Phone, Clock, CheckCircle, XCircle, ChevronDown } from 'lucide-react';

export function CallCenterAgent() {
  const [leads, setLeads] = useState(mockLeads);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<string | null>(null);

  const handleLogCall = (leadId: string, outcome: string) => {
    setLeads(leads.map(lead => {
      if (lead.id === leadId) {
        return {
          ...lead,
          lastContactAt: new Date(),
          callHistory: [
            ...lead.callHistory,
            {
              id: `call_${Date.now()}`,
              leadId,
              date: new Date(),
              duration: Math.floor(Math.random() * 20) + 5,
              notes: 'Call logged from agent dashboard',
              outcome: outcome as any,
              agentName: 'Current Agent',
            },
          ],
        };
      }
      return lead;
    }));
    setSelectedOutcome(null);
  };

  const criticalLeads = leads.filter(l => l.slaStatus === 'critical' || l.slaStatus === 'warning');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Call Queue</h2>
        <p className="text-sm text-slate-500 mt-1">Manage your leads and log call outcomes</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg border border-red-200 p-4">
          <div className="text-sm text-red-600 font-semibold">Critical Priority</div>
          <div className="text-3xl font-bold text-red-700 mt-1">
            {leads.filter(l => l.slaStatus === 'critical').length}
          </div>
          <p className="text-xs text-red-600 mt-2">Requires immediate attention</p>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200 p-4">
          <div className="text-sm text-yellow-600 font-semibold">At Risk</div>
          <div className="text-3xl font-bold text-yellow-700 mt-1">
            {leads.filter(l => l.slaStatus === 'warning').length}
          </div>
          <p className="text-xs text-yellow-600 mt-2">Follow-up needed soon</p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200 p-4">
          <div className="text-sm text-green-600 font-semibold">On Track</div>
          <div className="text-3xl font-bold text-green-700 mt-1">
            {leads.filter(l => l.slaStatus === 'ok').length}
          </div>
          <p className="text-xs text-green-600 mt-2">SLA maintained</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-foreground text-lg">Priority Leads</h3>
        {criticalLeads.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-slate-500">
            No critical leads at this moment
          </div>
        ) : (
          criticalLeads.map(lead => (
            <div key={lead.id} className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <button
                onClick={() => setExpandedLeadId(expandedLeadId === lead.id ? null : lead.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-3">
                    <SLABadge status={lead.slaStatus} />
                    <div>
                      <p className="font-semibold text-foreground">{lead.name}</p>
                      <p className="text-sm text-slate-500">{lead.phone}</p>
                    </div>
                  </div>
                </div>
                <ChevronDown
                  size={20}
                  className={`text-slate-400 transition-transform ${
                    expandedLeadId === lead.id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedLeadId === lead.id && (
                <div className="border-t border-slate-200 p-4 bg-slate-50 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600 mb-2">Notes:</p>
                    <p className="text-sm text-slate-700 bg-white p-2 rounded">{lead.notes}</p>
                  </div>

                  {lead.callHistory.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-slate-600 mb-2">Recent Calls:</p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {lead.callHistory.slice(-3).map(call => (
                          <div key={call.id} className="bg-white p-2 rounded text-sm border border-slate-200">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{call.agentName}</span>
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock size={12} />
                                {call.duration} min
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{call.outcome}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleLogCall(lead.id, 'scheduled')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-sm rounded font-medium transition-colors"
                    >
                      <CheckCircle size={16} />
                      Scheduled
                    </button>
                    <button
                      onClick={() => handleLogCall(lead.id, 'interested')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded font-medium transition-colors"
                    >
                      <Phone size={16} />
                      Interested
                    </button>
                    <button
                      onClick={() => handleLogCall(lead.id, 'not-interested')}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded font-medium transition-colors"
                    >
                      <XCircle size={16} />
                      Not Interested
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
