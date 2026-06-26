'use client';

import { useState } from 'react';
import { HeaderComponent } from '@/components/header-component';
import { RoleSwitcher } from '@/components/role-switcher';
import { ModeratorIntake } from '@/components/moderator-intake';
import { CallCenterAgent } from '@/components/call-center-agent';
import { TeamLeadMonitor } from '@/components/team-lead-monitor';
import { ExecutiveDashboard } from '@/components/executive-dashboard';
import { TeamAdmin } from '@/components/team-admin';

export default function Page() {
  const [currentRole, setCurrentRole] = useState('moderator');

  const renderView = () => {
    switch (currentRole) {
      case 'moderator':
        return <ModeratorIntake />;
      case 'agent':
        return <CallCenterAgent />;
      case 'lead':
        return <TeamLeadMonitor />;
      case 'executive':
        return <ExecutiveDashboard />;
      case 'admin':
        return <TeamAdmin />;
      default:
        return <ModeratorIntake />;
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <HeaderComponent currentRole={currentRole} onRoleChange={setCurrentRole} />
      <RoleSwitcher currentRole={currentRole} onRoleChange={setCurrentRole} />
      <div className="px-6 py-8 max-w-7xl mx-auto">
        {renderView()}
      </div>
    </main>
  );
}
