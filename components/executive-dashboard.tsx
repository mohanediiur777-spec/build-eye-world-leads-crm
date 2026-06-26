'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useLeads, useAgents, useCallLogs } from '@/hooks/useGoogleSheetsData';
import { TrendingUp, BarChart3, Users, Target } from 'lucide-react';

export function ExecutiveDashboard() {
  const { leads = [] } = useLeads();
  const { agents = [] } = useAgents();
  const { callLogs = [] } = useCallLogs();

  // Data for Lead Volume by Clinic
  const clinicData = [
    { name: 'Downtown', leads: leads.filter(l => l.clinicBranch === 'Downtown Branch').length },
    { name: 'North', leads: leads.filter(l => l.clinicBranch === 'North Branch').length },
    { name: 'South', leads: leads.filter(l => l.clinicBranch === 'South Branch').length },
  ];

  // Data for Lead Platform Distribution
  const platformData = [
    { name: 'Website', value: leads.filter(l => l.platform === 'website').length },
    { name: 'Instagram', value: leads.filter(l => l.platform === 'instagram').length },
    { name: 'WhatsApp', value: leads.filter(l => l.platform === 'whatsapp').length },
    { name: 'Phone', value: leads.filter(l => l.platform === 'phone').length },
  ];

  // Data for Agent Bookings
  const agentBookings = agents
    .map(agent => ({
      name: agent.name.split(' ')[0],
      bookings: agent.bookings,
    }))
    .sort((a, b) => b.bookings - a.bookings)
    .slice(0, 5);

  // KPI calculations
  const totalLeads = leads.length;
  const conversions = callLogs.filter(c => c.outcome === 'scheduled').length;
  const conversionRate = totalLeads > 0 ? ((conversions / totalLeads) * 100).toFixed(1) : '0';
  const scheduledLeads = conversions;
  const slaOk = leads.filter(l => l.slaStatus === 'ok').length;
  const slaCompliance = totalLeads > 0 ? ((slaOk / totalLeads) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Executive Dashboard</h2>
        <p className="text-sm text-slate-500 mt-1">Overall performance metrics and analytics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Total Leads</p>
              <p className="text-2xl font-bold text-primary mt-1">{totalLeads}</p>
            </div>
            <Users className="text-primary opacity-20" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Conversion Rate</p>
              <p className="text-2xl font-bold text-accent mt-1">{conversionRate}%</p>
            </div>
            <TrendingUp className="text-accent opacity-20" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Scheduled</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{scheduledLeads}</p>
            </div>
            <Target className="text-green-600 opacity-20" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">SLA Compliance</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{slaCompliance}%</p>
            </div>
            <BarChart3 className="text-blue-600 opacity-20" size={32} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="font-semibold text-foreground text-lg mb-4">Lead Volume by Clinic</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={clinicData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#1e293b' }}
              />
              <Legend />
              <Bar dataKey="leads" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
              <Bar dataKey="bookings" fill="#06b6d4" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="font-semibold text-foreground text-lg mb-4">Top Agents by Bookings</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={agentBookings}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}
                labelStyle={{ color: '#1e293b' }}
              />
              <Bar dataKey="bookings" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="font-semibold text-foreground text-lg mb-4">Lead Platform Distribution</h3>
          <div className="space-y-3">
            {platformData.map(platform => {
              const percentage = totalLeads > 0 ? ((platform.value / totalLeads) * 100).toFixed(0) : '0';
              return (
                <div key={platform.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{platform.name}</span>
                    <span className="text-sm font-bold text-primary">{platform.value} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="font-semibold text-foreground text-lg mb-4">SLA Status Overview</h3>
          <div className="space-y-3">
            {[
              { label: 'On Track', status: 'ok', count: leads.filter(l => l.slaStatus === 'ok').length, color: 'bg-green-500' },
              { label: 'At Risk', status: 'warning', count: leads.filter(l => l.slaStatus === 'warning').length, color: 'bg-yellow-500' },
              { label: 'Critical', status: 'critical', count: leads.filter(l => l.slaStatus === 'critical').length, color: 'bg-red-500' },
              { label: 'Overdue', status: 'overdue', count: leads.filter(l => l.slaStatus === 'overdue').length, color: 'bg-slate-600' },
            ].map(item => {
              const percentage = totalLeads > 0 ? ((item.count / totalLeads) * 100).toFixed(0) : '0';
              return (
                <div key={item.status}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{item.label}</span>
                    <span className="text-sm font-bold text-slate-900">{item.count} ({percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2">
                    <div
                      className={`${item.color} rounded-full h-2 transition-all`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
