'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SLABadge } from './sla-badge';
import { mockLeads, mockClinics } from '@/lib/mock-data';
import { Phone, Mail, MapPin, Plus } from 'lucide-react';

export function ModeratorIntake() {
  const [leads, setLeads] = useState(mockLeads);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nameAr: '',
    email: '',
    phone: '',
    clinic: mockClinics[0].name,
    priority: 'medium' as const,
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newLead = {
      ...formData,
      id: String(leads.length + 1),
      slaStatus: 'ok' as const,
      source: 'website' as const,
      createdAt: new Date(),
      lastContactAt: new Date(),
      nextFollowUp: new Date(Date.now() + 24 * 60 * 60 * 1000),
      callHistory: [],
    };
    setLeads([newLead, ...leads]);
    setShowForm(false);
    setFormData({
      name: '',
      nameAr: '',
      email: '',
      phone: '',
      clinic: mockClinics[0].name,
      priority: 'medium',
      notes: '',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">New Lead Intake</h2>
          <p className="text-sm text-slate-500 mt-1">Register and process new patient leads</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary-dark text-white gap-2"
        >
          <Plus size={18} />
          Add Lead
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Name (English)</label>
                <input
                  type="text"
                  placeholder="John Smith"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">الاسم (عربي)</label>
                <input
                  type="text"
                  placeholder="جون سميث"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Email</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Phone</label>
                <input
                  type="tel"
                  placeholder="+966501234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Clinic</label>
                <select
                  value={formData.clinic}
                  onChange={(e) => setFormData({ ...formData, clinic: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {mockClinics.map(clinic => (
                    <option key={clinic.id} value={clinic.name}>{clinic.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Notes</label>
              <textarea
                placeholder="Add any notes about the patient..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 h-24 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="bg-primary hover:bg-primary-dark text-white">
                Submit Lead
              </Button>
              <Button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-slate-200 hover:bg-slate-300 text-foreground"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {leads.slice(0, 8).map(lead => (
          <div key={lead.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">
                  {lead.name} <span className="text-slate-400 text-sm">({lead.nameAr})</span>
                </h3>
                <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <Mail size={16} />
                    {lead.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone size={16} />
                    {lead.phone}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={16} />
                    {lead.clinic}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <SLABadge status={lead.slaStatus} />
                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                  lead.priority === 'high' ? 'bg-red-100 text-red-700' :
                  lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {lead.priority.charAt(0).toUpperCase() + lead.priority.slice(1)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
