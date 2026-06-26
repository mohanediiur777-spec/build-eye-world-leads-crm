'use client';

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { mockLeads, mockClinics, mockAgents } from '@/lib/mock-data';
import { TrendingUp, BarChart3, Users, Target } from 'lucide-react';

export function ExecutiveDashboard() {
  // Data for Lead Volume by Clinic
  const clinicData = mockClinics.map(clinic => ({
    name: clinic.name,
    leads: clinic.leadsCount,
    bookings: clinic.bookingsCount,
  }));

  // Data for Lead Source Distribution
  const sourceData = [
    {
      name: 'Website',
      value: mockLeads.filter(l => l.source === 'website').length,
    },
    {
      name: 'Phone',
      value: mockLeads.filter(l => l.source === 'phone').length,
    },
    {
      name: 'Referral',
      value: mockLeads.filter(l => l.source === 'referral').length,
    },
    {
      name: 'Social',
      value: mockLeads.filter(l => l.source === 'social').length,
    },
  ];

  // Data for Agent Bookings Leaderboard
  const agentBookings = mockAgents
    .map(agent => ({
      name: agent.name.split(' ')[0],
      bookings: agent.totalBookings,
    }))
    .sort((a, b) => b.bookings - a.bookings);

  // KPI calculations
  const totalLeads = mockLeads.length;
  const conversionRate = ((mockLeads.filter(l => l.callHistory.length > 0).length / totalLeads) * 100).toFixed(1);
  const scheduledLeads = mockLeads.filter(l => l.callHistory.some(c => c.outcome === 'scheduled')).length;
  const slaCompliance = ((mockLeads.filter(l => l.slaStatus === 'ok' || l.slaStatus === 'overdue').length / totalLeads) * 100).toFixed(1);

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
          <h3 className="font-semibold text-foreground text-lg mb-4">Lead Source Distribution</h3>
          <div className="space-y-3">
            {sourceData.map(source => {
              const percentage = ((source.value / totalLeads) * 100).toFixed(0);
              return (
                <div key={source.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{source.name}</span>
                    <span className="text-sm font-bold text-primary">{source.value} ({percentage}%)</span>
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
              { label: 'On Track', status: 'ok', count: mockLeads.filter(l => l.slaStatus === 'ok').length, color: 'bg-green-500' },
              { label: 'At Risk', status: 'warning', count: mockLeads.filter(l => l.slaStatus === 'warning').length, color: 'bg-yellow-500' },
              { label: 'Critical', status: 'critical', count: mockLeads.filter(l => l.slaStatus === 'critical').length, color: 'bg-red-500' },
              { label: 'Overdue', status: 'overdue', count: mockLeads.filter(l => l.slaStatus === 'overdue').length, color: 'bg-slate-600' },
            ].map(item => {
              const percentage = ((item.count / totalLeads) * 100).toFixed(0);
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
