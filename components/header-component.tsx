import React from 'react';
import { Eye } from 'lucide-react';

interface HeaderComponentProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
}

export function HeaderComponent({ currentRole, onRoleChange }: HeaderComponentProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Eye className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Eye World</h1>
            <p className="text-xs text-slate-500">Leads Management System</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-foreground capitalize">
            {currentRole.replace('-', ' ')}
          </p>
          <p className="text-xs text-slate-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
      </div>
    </header>
  );
}
