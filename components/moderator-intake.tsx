'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { SLABadge } from './sla-badge';
import { Phone, Mail, MapPin, Plus } from 'lucide-react';
import { useLeads } from '@/hooks/useGoogleSheetsData';
import { createLead } from '@/lib/googleSheets';

export function ModeratorIntake() {
  const { leads = [], mutate } = useLeads();
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    clinicBranch: 'Downtown Branch',
    priority: 'medium',
    platform: 'website',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createLead({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        clinicBranch: formData.clinicBranch,
        priority: formData.priority,
        platform: formData.platform,
        notes: formData.notes,
        slaStatus: 'ok',
        assignedAgent: '',
      });
      setShowForm(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        clinicBranch: 'Downtown Branch',
        priority: 'medium',
        platform: 'website',
        notes: '',
      });
      mutate();
    } catch (error) {
      console.error('[v0] Error creating lead:', error);
    } finally {
      setIsSubmitting(false);
    }
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
                <label className="text-sm font-medium text-foreground block mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="Ahmed Hassan"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Email</label>
                <input
                  type="email"
                  placeholder="ahmed@example.com"
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
                <label className="text-sm font-medium text-foreground block mb-1">Clinic Branch</label>
                <select
                  value={formData.clinicBranch}
                  onChange={(e) => setFormData({ ...formData, clinicBranch: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option>Downtown Branch</option>
                  <option>North Branch</option>
                  <option>South Branch</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Platform</label>
                <select
                  value={formData.platform}
                  onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="website">Website</option>
                  <option value="instagram">Instagram</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
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
              <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary-dark text-white disabled:opacity-50">
                {isSubmitting ? 'Submitting...' : 'Submit Lead'}
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
        {leads.length === 0 ? (
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-8 text-center">
            <p className="text-slate-500">No leads yet. Add your first lead to get started.</p>
          </div>
        ) : (
          leads.map(lead => (
            <div key={lead.id} className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{lead.name}</h3>
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
                      {lead.clinicBranch}
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
          ))
        )}
      </div>
    </div>
  );
}
