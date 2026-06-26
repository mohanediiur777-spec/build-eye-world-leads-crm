'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { mockAgents, mockClinics } from '@/lib/mock-data';
import { Users, MapPin, Mail, Plus } from 'lucide-react';

export function TeamAdmin() {
  const [agents, setAgents] = useState(mockAgents);
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [agentForm, setAgentForm] = useState({
    name: '',
    email: '',
    clinic: mockClinics[0].name,
    role: 'agent' as const,
  });

  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (agentForm.name && agentForm.email) {
      const newAgent = {
        id: `agent_${Date.now()}`,
        name: agentForm.name,
        email: agentForm.email,
        role: agentForm.role,
        clinic: agentForm.clinic,
        activeCalls: 0,
        totalBookings: 0,
        avgCallDuration: 0,
      };
      setAgents([...agents, newAgent]);
      setShowAgentForm(false);
      setAgentForm({
        name: '',
        email: '',
        clinic: mockClinics[0].name,
        role: 'agent',
      });
    }
  };

  const handleRemoveAgent = (id: string) => {
    setAgents(agents.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Team Administration</h2>
          <p className="text-sm text-slate-500 mt-1">Manage team members and clinic assignments</p>
        </div>
        <Button
          onClick={() => setShowAgentForm(!showAgentForm)}
          className="bg-primary hover:bg-primary-dark text-white gap-2"
        >
          <Plus size={18} />
          Add Agent
        </Button>
      </div>

      {showAgentForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <form onSubmit={handleAddAgent} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Agent Name"
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Email</label>
                <input
                  type="email"
                  placeholder="agent@eyeworld.com"
                  value={agentForm.email}
                  onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Clinic Assignment</label>
                <select
                  value={agentForm.clinic}
                  onChange={(e) => setAgentForm({ ...agentForm, clinic: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {mockClinics.map(clinic => (
                    <option key={clinic.id} value={clinic.name}>{clinic.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Role</label>
                <select
                  value={agentForm.role}
                  onChange={(e) => setAgentForm({ ...agentForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="agent">Call Center Agent</option>
                  <option value="lead">Team Lead</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="bg-primary hover:bg-primary-dark text-white">
                Add Agent
              </Button>
              <Button
                type="button"
                onClick={() => setShowAgentForm(false)}
                className="bg-slate-200 hover:bg-slate-300 text-foreground"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Total Agents</p>
              <p className="text-2xl font-bold text-primary mt-1">{agents.length}</p>
            </div>
            <Users className="text-primary opacity-20" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Active Agents</p>
              <p className="text-2xl font-bold text-accent mt-1">{agents.filter(a => a.activeCalls > 0).length}</p>
            </div>
            <Users className="text-accent opacity-20" size={32} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Clinic Branches</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{mockClinics.length}</p>
            </div>
            <MapPin className="text-green-600 opacity-20" size={32} />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-foreground text-lg">Team Members</h3>
        <div className="space-y-2">
          {agents.map(agent => (
            <div key={agent.id} className="bg-white rounded-lg border border-slate-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{agent.name}</h4>
                  <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-600">
                    <div className="flex items-center gap-1">
                      <Mail size={16} />
                      {agent.email}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={16} />
                      {agent.clinic}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                      {agent.totalBookings} Bookings
                    </span>
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                      {agent.activeCalls} Active Calls
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveAgent(agent.id)}
                  className="text-red-600 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold text-foreground text-lg">Clinic Branches</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockClinics.map(clinic => (
            <div key={clinic.id} className="bg-white rounded-lg border border-slate-200 p-4">
              <h4 className="font-semibold text-foreground">{clinic.name}</h4>
              <p className="text-sm text-slate-600 mt-1">City: {clinic.city}</p>
              <p className="text-sm text-slate-600">Manager: {clinic.manager}</p>
              <div className="flex gap-2 mt-3">
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                  {clinic.leadsCount} Leads
                </span>
                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded">
                  {clinic.bookingsCount} Bookings
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
