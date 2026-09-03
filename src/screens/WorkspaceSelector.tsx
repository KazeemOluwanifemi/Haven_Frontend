import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { orgApi, getErrorMessage } from '@/lib/api';
import { Button, Card, CardBody, Alert, Spinner } from '@/components/ui';
import type { Organization } from '@/types';
import { Building2, ArrowRight, Activity } from 'lucide-react';

export function WorkspaceSelector() {
  const { user, setOrg, logout } = useAuth();
  const [workspaces, setWorkspaces] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await orgApi.myWorkspaces();
      setWorkspaces(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const orgTypeIcon = (type: string) => {
    switch (type) {
      case 'EMPLOYER':
        return 'Employer';
      case 'HMO':
        return 'HMO';
      case 'HOSPITAL':
        return 'Hospital';
      default:
        return type;
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-200 px-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex flex-col items-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-900 text-white">
            <Activity className="h-7 w-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Select Workspace</h1>
          <p className="mt-1 text-sm text-slate-500">Choose an organization to continue, or go to your patient portal</p>
        </div>

        {error && <Alert>{error}</Alert>}

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : (
          <>
            {/* Patient Portal Option */}
            {user?.accountType === 'PATIENT' && (
              <Card
                className="cursor-pointer transition hover:border-teal-400 hover:shadow-md"
                onClick={() => setOrg(null)}
              >
                <CardBody className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                      <Activity className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">Patient Portal</h3>
                      <p className="text-sm text-slate-500">View your profile, enrollments, prescriptions</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-400" />
                </CardBody>
              </Card>
            )}

            {/* Organization Workspaces */}
            {workspaces.length > 0 && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Your Organizations</h2>
                <div className="space-y-3">
                  {workspaces.map((ws) => (
                    <Card
                      key={ws.id}
                      className="cursor-pointer transition hover:border-slate-400 hover:shadow-md"
                      onClick={() => setOrg(ws)}
                    >
                      <CardBody className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                            <Building2 className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{ws.name}</h3>
                            <p className="text-sm text-slate-500">{orgTypeIcon(ws.type)} · {ws.email}</p>
                          </div>
                        </div>
                        <ArrowRight className="h-5 w-5 text-slate-400" />
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {workspaces.length === 0 && user?.accountType !== 'PATIENT' && (
              <Card>
                <CardBody className="py-8 text-center">
                  <p className="text-sm text-slate-500">You don't belong to any organization yet.</p>
                  <p className="mt-1 text-xs text-slate-400">Ask an admin to invite you, then accept the invitation token.</p>
                </CardBody>
              </Card>
            )}
          </>
        )}

        <div className="flex justify-center">
          <Button variant="ghost" onClick={logout}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
