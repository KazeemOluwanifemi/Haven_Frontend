import { useState } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import {
  DashboardLayout,
  getNavItems,
  getDashboardTitle,
} from '@/components/DashboardLayout';
import {
  LoginScreen,
  SignupScreen,
  VerifyScreen,
} from '@/screens/LoginScreen';
import { WorkspaceSelector } from '@/screens/WorkspaceSelector';
import { OrgMembersScreen } from '@/screens/OrgMembersScreen';
import {
  HmoPlansScreen,
  HmoProvidersScreen,
  HmoEnrollmentsScreen,
} from '@/screens/HmoScreens';
import {
  PatientProfileScreen,
  PatientSearchScreen,
  PatientPrescriptionsScreen,
} from '@/screens/PatientScreens';
import { HospitalPatientsScreen } from '@/screens/HospitalScreens';
import { DoctorConsultationScreen } from '@/screens/DoctorConsultationScreen';
import { Card, CardBody, CardHeader, Badge } from '@/components/ui';
import type { Organization } from '@/types';

function DashboardView({
  view,
  org,
}: {
  view: string;
  org: Organization | null;
}) {
  // Role-based dashboards
  if (view === 'employer-dashboard') {
    return (
      <Card>
        <CardHeader title="Employer Dashboard" subtitle={org?.name} />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Organization</p>
              <p className="mt-1 font-semibold text-slate-900">{org?.name}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Type</p>
              <p className="mt-1 font-semibold text-slate-900">
                <Badge color="teal">Employer</Badge>
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Email</p>
              <p className="mt-1 font-semibold text-slate-900">{org?.email}</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Invite members to your organization and manage your team from the Members tab.
          </p>
        </CardBody>
      </Card>
    );
  }

  if (view === 'hmo-dashboard') {
    return (
      <Card>
        <CardHeader title="HMO Dashboard" subtitle={org?.name} />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Organization</p>
              <p className="mt-1 font-semibold text-slate-900">{org?.name}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Type</p>
              <p className="mt-1 font-semibold text-slate-900">
                <Badge color="teal">HMO</Badge>
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Email</p>
              <p className="mt-1 font-semibold text-slate-900">{org?.email}</p>
            </div>
          </div>
          <p className="mt-6 text-sm text-slate-500">
            Manage health plans, connect hospital providers, and enroll patients from the sidebar.
          </p>
        </CardBody>
      </Card>
    );
  }

  if (view === 'hospital-dashboard') {
    return (
      <Card>
        <CardHeader title="Hospital Dashboard" subtitle={org?.name} />
        <CardBody>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Organization</p>
              <p className="mt-1 font-semibold text-slate-900">{org?.name}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Type</p>
              <p className="mt-1 font-semibold text-slate-900">
                <Badge color="teal">Hospital</Badge>
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Email</p>
              <p className="mt-1 font-semibold text-slate-900">{org?.email}</p>
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <p className="text-sm font-medium text-slate-700">Quick actions:</p>
            <ul className="ml-4 list-disc text-sm text-slate-500">
              <li>Onboard and search patients from the Patients tab</li>
              <li>Check eligibility, record diagnoses, and issue prescriptions from the Consultation tab</li>
            </ul>
          </div>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm text-amber-700">
              Appointment approval is under construction. You can load existing appointments by ID in the Consultation tab.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  // Default: blank dashboard
  return null;
}

function AppContent() {
  const { user, token, org } = useAuth();
  const [authScreen, setAuthScreen] = useState('login');
  const [activeView, setActiveView] = useState('');

  // Not logged in → show auth screens
  if (!user || !token) {
    if (authScreen === 'signup') return <SignupScreen onNavigate={setAuthScreen} />;
    if (authScreen === 'verify') return <VerifyScreen onNavigate={setAuthScreen} />;
    return <LoginScreen onNavigate={setAuthScreen} />;
  }

  // Logged in but no org selected → workspace selector
  if (!org) {
    return <WorkspaceSelector />;
  }

  // Determine nav items based on org
  const navItems = getNavItems(org);
  const currentView = activeView || navItems[0]?.view || '';
  const title = getDashboardTitle(currentView);

  // Render the active view
  const renderView = () => {
    switch (currentView) {
      // Patient portal views
      case 'patient-profile':
        return <PatientProfileScreen />;
      case 'patient-search':
        return <PatientSearchScreen />;
      case 'patient-prescriptions':
        return <PatientPrescriptionsScreen />;

      // Org members
      case 'org-members':
        return <OrgMembersScreen />;

      // HMO views
      case 'hmo-dashboard':
      case 'employer-dashboard':
      case 'hospital-dashboard':
        return <DashboardView view={currentView} org={org} />;
      case 'hmo-plans':
        return <HmoPlansScreen />;
      case 'hmo-providers':
        return <HmoProvidersScreen />;
      case 'hmo-enrollments':
        return <HmoEnrollmentsScreen />;

      // Hospital views
      case 'hospital-patients':
        return <HospitalPatientsScreen />;
      case 'doctor-consultation':
        return <DoctorConsultationScreen />;

      default:
        return <DashboardView view={currentView} org={org} />;
    }
  };

  return (
    <DashboardLayout
      navItems={navItems}
      activeView={currentView}
      onNavigate={setActiveView}
      title={title}
    >
      {renderView()}
    </DashboardLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
