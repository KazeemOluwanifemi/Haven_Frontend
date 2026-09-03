import { useState, type ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button, Badge } from '@/components/ui';
import type { Organization } from '@/types';
import {
  Activity,
  Users,
  Network,
  Stethoscope,
  Building2,
  LogOut,
  LayoutDashboard,
  Pill,
  ClipboardList,
  UserCircle,
  Menu,
  X,
} from 'lucide-react';

export type NavItem = {
  id: string;
  label: string;
  icon: typeof Users;
  view: string;
};

export function DashboardLayout({
  navItems,
  activeView,
  onNavigate,
  children,
  title,
}: {
  navItems: NavItem[];
  activeView: string;
  onNavigate: (view: string) => void;
  children: ReactNode;
  title: string;
}) {
  const { user, org, logout, setOrg } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const orgTypeLabel = (t: string) => {
    if (t === 'EMPLOYER') return 'Employer';
    if (t === 'HMO') return 'HMO';
    if (t === 'HOSPITAL') return 'Hospital';
    return t;
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-slate-900">Haven</span>
        </div>

        <nav className="space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeView === item.view;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.view);
                  setSidebarOpen(false);
                }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 border-t border-slate-200 p-4">
          {org && (
            <button
              onClick={() => setOrg(null)}
              className="mb-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              <Building2 className="h-4 w-4" />
              Switch workspace
            </button>
          )}
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {org && (
              <Badge color="teal">{orgTypeLabel(org.type)}</Badge>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <UserCircle className="h-5 w-5 text-slate-400" />
              <span className="font-medium">{user?.firstName} {user?.lastName}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

// Helper to determine nav items based on org type
export function getNavItems(org: Organization | null): NavItem[] {
  if (!org) {
    // Patient portal
    return [
      { id: 'profile', label: 'My Profile', icon: UserCircle, view: 'patient-profile' },
      { id: 'search', label: 'Find Provider', icon: Network, view: 'patient-search' },
      { id: 'prescriptions', label: 'Prescriptions', icon: Pill, view: 'patient-prescriptions' },
    ];
  }

  switch (org.type) {
    case 'EMPLOYER':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, view: 'employer-dashboard' },
        { id: 'members', label: 'Members', icon: Users, view: 'org-members' },
      ];
    case 'HMO':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, view: 'hmo-dashboard' },
        { id: 'members', label: 'Members', icon: Users, view: 'org-members' },
        { id: 'plans', label: 'Plans', icon: ClipboardList, view: 'hmo-plans' },
        { id: 'providers', label: 'Provider Network', icon: Network, view: 'hmo-providers' },
        { id: 'enrollments', label: 'Enrollments', icon: Users, view: 'hmo-enrollments' },
      ];
    case 'HOSPITAL':
      return [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, view: 'hospital-dashboard' },
        { id: 'members', label: 'Members', icon: Users, view: 'org-members' },
        { id: 'patients', label: 'Patients', icon: Users, view: 'hospital-patients' },
        { id: 'doctor', label: 'Consultation', icon: Stethoscope, view: 'doctor-consultation' },
      ];
    default:
      return [];
  }
}

export function getDashboardTitle(view: string): string {
  const titles: Record<string, string> = {
    'patient-profile': 'My Profile',
    'patient-search': 'Find Provider & Request Appointment',
    'patient-prescriptions': 'My Prescriptions',
    'employer-dashboard': 'Employer Dashboard',
    'org-members': 'Organization Members',
    'hmo-dashboard': 'HMO Dashboard',
    'hmo-plans': 'Health Plans',
    'hmo-providers': 'Provider Network',
    'hmo-enrollments': 'Enrollments',
    'hospital-dashboard': 'Hospital Dashboard',
    'hospital-patients': 'Patient Registry',
    'doctor-consultation': 'Doctor Consultation',
  };
  return titles[view] || 'Dashboard';
}
