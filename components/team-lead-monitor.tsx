'use client';

import React, { useState } from 'react';
import { SLABadge } from './sla-badge';
import { mockLeads, mockAgents } from '@/lib/mock-data';
import { Users, TrendingUp, Clock } from 'lucide-react';

export function TeamLeadMonitor() {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const agents = mockAgents;
  const leadsForSelectedAgent = selectedAgent
    ? mockLeads.filter(l => l.assignedAgent === selectedAgent)
    : [];

  const stats = {
    totalLeads: mockLeads.length,
    scheduledToday: mockLeads.filter(l => {
      const today = new Date();
      return l.nextFollowUp.toDateString() === today.toDateString();
    }).length,
    criticalCount: mockLeads.filter(l => l.slaStatus === 'critical').length,
    avgCallDuration: (mockLeads.reduce((sum, l) => sum + (l.callHistory[0]?.duration || 0), 0) / mockLeads.length).toFixed(1),
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Team Performance</h2>
        <p className="text-sm text-slate-500 mt-1">Monitor agent performance and lead distribution</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Total Leads</p>
              <p className="text-2xl font-bold text-primary mt-1">{stats.totalLeads}</p>
            </div>
            <Users className="text-primary opacity-20" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Today Schedule</p>
              <p className="text-2xl font-bold text-accent mt-1">{stats.scheduledToday}</p>
            </div>
            <Clock className="text-accent opacity-20" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Critical</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.criticalCount}</p>
            </div>
            <TrendingUp className="text-red-600 opacity-20" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Avg Call Duration</p>
              <p className="text-2xl font-bold text-primary mt-1">{stats.avgCallDuration}m</p>
            </div>
            <Clock className="text-primary opacity-20" size={32} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1">
          <h3 className="font-semibold text-foreground text-lg mb-3">Agents</h3>
          <div className="space-y-2">
            {agents.map(agent => (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(selectedAgent === agent.name ? null : agent.name)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedAgent === agent.name
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-medium text-sm">{agent.name}</p>
                <p className="text-xs opacity-75 mt-0.5">{agent.totalBookings} bookings</p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          <h3 className="font-semibold text-foreground text-lg mb-3">
            {selectedAgent ? `${selectedAgent}'s Assigned Leads` : 'Select an agent to view leads'}
          </h3>
          
          {selectedAgent ? (
            <div className="space-y-3">
              {leadsForSelectedAgent.length === 0 ? (
                <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-slate-500">
                  No leads assigned to this agent
                </div>
              ) : (
                leadsForSelectedAgent.map(lead => (
                  <div key={lead.id} className="bg-white rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">{lead.name}</p>
                        <p className="text-sm text-slate-500 mt-0.5">{lead.clinic}</p>
                      </div>
                      <SLABadge status={lead.slaStatus} />
                    </div>
                    <div className="flex gap-2 mt-3 text-xs">
                      <span className={`px-2 py-1 rounded font-medium ${
                        lead.priority === 'high' ? 'bg-red-100 text-red-700' :
                        lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)} Priority
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded">
                        {lead.callHistory.length} calls
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500">
              Select an agent from the list to view their assigned leads
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
