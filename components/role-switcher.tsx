import React from 'react';
import { Button } from '@/components/ui/button';
import { Briefcase, Users, BarChart3, Settings, User } from 'lucide-react';

interface RoleSwitcherProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
}

const roles = [
  { id: 'moderator', label: 'Moderator Intake', icon: User, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'agent', label: 'Call Center Agent', icon: Briefcase, color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { id: 'lead', label: 'Team Lead Monitor', icon: Users, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { id: 'executive', label: 'Executive Dashboard', icon: BarChart3, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { id: 'admin', label: 'Team Admin', icon: Settings, color: 'bg-amber-50 text-amber-700 border-amber-200' },
];

export function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  return (
    <div className="bg-white border-b border-slate-200 px-6 py-4">
      <div className="flex flex-wrap gap-3">
        {roles.map(role => {
          const Icon = role.icon;
          const isActive = currentRole === role.id;
          return (
            <button
              key={role.id}
              onClick={() => onRoleChange(role.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                isActive
                  ? `${role.color} border-current font-semibold`
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <Icon size={18} />
              <span className="text-sm hidden sm:inline">{role.label}</span>
              <span className="text-sm sm:hidden">{role.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
