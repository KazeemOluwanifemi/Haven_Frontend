import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  patientApi,
  hmoApi,
  getErrorMessage,
  getFieldErrors,
} from '@/lib/api';
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Input,
  Select,
  Badge,
  Alert,
  Spinner,
  EmptyState,
  statusColor,
} from '@/components/ui';
import type { HmoProvider, PatientPrescription, PatientProfile } from '@/types';
import { Search, CalendarPlus, Pill, UserCircle, ClipboardList } from 'lucide-react';

// ===== Patient Profile =====
export function PatientProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await patientApi.me();
      setProfile(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (error) return <Alert>{error}</Alert>;
  if (!profile) return <EmptyState title="Profile not found" />;

  return (
    <div className="space-y-6">
      {/* Profile card */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-teal-600">
              <UserCircle className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="text-sm text-slate-500">{profile.email}</p>
              <div className="mt-1">
                <Badge color={profile.isEmailVerified ? 'green' : 'yellow'}>
                  {profile.isEmailVerified ? 'Email Verified' : 'Email Not Verified'}
                </Badge>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* HMO Enrollments */}
      <Card>
        <CardHeader title="HMO Enrollments" subtitle={`${profile.enrollments?.length || 0} enrollment(s)`} />
        <CardBody>
          {!profile.enrollments || profile.enrollments.length === 0 ? (
            <EmptyState title="No HMO enrollments" message="Your HMO enrollment will appear here once active" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {profile.enrollments.map((en, i) => (
                <div key={i} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900">{en.hmoName}</h4>
                    <Badge color={statusColor(en.status)}>{en.status}</Badge>
                  </div>
                  <dl className="mt-3 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-500">HMO Number</dt>
                      <dd className="font-medium text-slate-900">{en.hmoNumber}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Plan</dt>
                      <dd className="font-medium text-slate-900">{en.planName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Enrolled</dt>
                      <dd className="text-slate-600">{new Date(en.enrollmentDate).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Hospital Registrations */}
      <Card>
        <CardHeader title="Hospital Registrations" subtitle={`${profile.registrations?.length || 0} registration(s)`} />
        <CardBody>
          {!profile.registrations || profile.registrations.length === 0 ? (
            <EmptyState title="No hospital registrations" message="Your hospital registrations will appear here" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Hospital</th>
                    <th className="pb-3 pr-4 font-medium">Hospital Number</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.registrations.map((reg, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-slate-900">{reg.hospitalName}</td>
                      <td className="py-3 pr-4 text-slate-600">{reg.hospitalNumber}</td>
                      <td className="py-3 text-slate-500">{new Date(reg.registrationDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// ===== Patient Provider Search + Appointment Request =====
export function PatientSearchScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [providers, setProviders] = useState<HmoProvider[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [profileError, setProfileError] = useState('');

  const [showRequest, setShowRequest] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<HmoProvider | null>(null);
  const [scheduledAt, setScheduledAt] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [requestSuccess, setRequestSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const res = await patientApi.me();
      setProfile(res.data);
      // Load providers from first active enrollment's HMO
      if (res.data.enrollments && res.data.enrollments.length > 0) {
        const firstEnrollment = res.data.enrollments.find((e) => e.status === 'ACTIVE') || res.data.enrollments[0];
        if (firstEnrollment) {
          try {
            const provRes = await hmoApi.providers(firstEnrollment.hmoId);
            setProviders(provRes.data);
          } catch {
            // HMO providers may require org context
          }
        }
      }
    } catch (err) {
      setProfileError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers.filter((p) => {
    if (!search) return true;
    const name = p.provider?.name || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError('');
    setRequestSuccess('');
    setRequesting(true);
    try {
      if (!profile) throw new Error('Profile not loaded');
      const enrollment = profile.enrollments?.find((e) => e.status === 'ACTIVE');
      if (!enrollment) throw new Error('No active HMO enrollment found');
      if (!selectedProvider) throw new Error('No provider selected');

      const res = await patientApi.requestAppointment({
        hospitalId: selectedProvider.providerId,
        hmoId: enrollment.hmoId,
        scheduledAt: new Date(scheduledAt).toISOString(),
        type: 'REQUEST',
        service: 'CONSULTATION',
        userId: user?.id ?? 0,
      });
      setRequestSuccess(`Appointment request submitted! ID: ${res.data.id}`);
      setShowRequest(false);
      setSelectedProvider(null);
      setScheduledAt('');
    } catch (err) {
      setRequestError(getErrorMessage(err));
    } finally {
      setRequesting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6">
      {profileError && <Alert>{profileError}</Alert>}
      {requestSuccess && <Alert type="success">{requestSuccess}</Alert>}

      {/* Active enrollment info */}
      {profile?.enrollments && profile.enrollments.length > 0 && (
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <ClipboardList className="h-5 w-5 text-teal-600" />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Active Enrollment: {profile.enrollments.find((e) => e.status === 'ACTIVE')?.hmoName || 'N/A'}
                </p>
                <p className="text-xs text-slate-500">
                  HMO Number: {profile.enrollments.find((e) => e.status === 'ACTIVE')?.hmoNumber || 'N/A'} ·
                  Plan: {profile.enrollments.find((e) => e.status === 'ACTIVE')?.planName || 'N/A'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Provider search */}
      <Card>
        <CardHeader title="Search Providers" subtitle="Find a hospital in your HMO network" />
        <CardBody>
          <form onSubmit={(e) => e.preventDefault()} className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm"
                placeholder="Search by hospital name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </form>

          {providers.length === 0 ? (
            <EmptyState
              title="No providers available"
              message="Your HMO has not connected any hospitals yet, or you have no active enrollment"
            />
          ) : filteredProviders.length === 0 ? (
            <EmptyState title="No matching providers" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredProviders.map((p) => (
                <div key={p.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-slate-900">{p.provider?.name || `Provider #${p.providerId}`}</h4>
                      {p.provider?.address && (
                        <p className="mt-0.5 text-xs text-slate-400">{p.provider.address}</p>
                      )}
                      {p.provider?.phone && (
                        <p className="mt-0.5 text-xs text-slate-400">{p.provider.phone}</p>
                      )}
                    </div>
                    <Badge color="green">In Network</Badge>
                  </div>
                  <Button
                    className="mt-3"
                    variant="outline"
                    onClick={() => {
                      setSelectedProvider(p);
                      setShowRequest(true);
                      setRequestError('');
                      setRequestSuccess('');
                    }}
                  >
                    <CalendarPlus className="h-4 w-4" /> Request Appointment
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Appointment request modal */}
      {showRequest && selectedProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <Card className="w-full max-w-md">
            <CardHeader title="Request Appointment" subtitle={selectedProvider.provider?.name || `Provider #${selectedProvider.providerId}`} />
            <CardBody>
              {requestError && <div className="mb-4"><Alert>{requestError}</Alert></div>}
              <form onSubmit={handleRequest} className="space-y-4">
                <Input
                  label="Date & Time"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  required
                />
                <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                  <p><span className="font-medium">Service:</span> General Consultation</p>
                  <p><span className="font-medium">Type:</span> Request</p>
                  {profile?.enrollments?.find((e) => e.status === 'ACTIVE') && (
                    <p><span className="font-medium">HMO:</span> {profile.enrollments.find((e) => e.status === 'ACTIVE')?.hmoName}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="submit" loading={requesting}>Submit Request</Button>
                  <Button variant="outline" onClick={() => setShowRequest(false)}>Cancel</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}

// ===== Patient Prescriptions =====
export function PatientPrescriptionsScreen() {
  const [prescriptions, setPrescriptions] = useState<PatientPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await patientApi.prescriptions();
      setPrescriptions(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6">
      {error && <Alert>{error}</Alert>}

      <Card>
        <CardHeader title="My Prescriptions" subtitle={`${prescriptions.length} prescription(s)`} />
        <CardBody>
          {prescriptions.length === 0 ? (
            <EmptyState title="No prescriptions yet" message="Your prescriptions will appear here after a doctor issues one" />
          ) : (
            <div className="space-y-4">
              {prescriptions.map((rx) => (
                <div key={rx.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-teal-600">
                      <Pill className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{rx.medication}</h4>
                      <p className="mt-0.5 text-sm text-slate-600">
                        {rx.dosage} · {rx.frequency} · {rx.duration}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-400">
                        <span>Issued by: {rx.issuedBy}</span>
                        {rx.hospital && <span>Hospital: {rx.hospital}</span>}
                        <span>Date: {new Date(rx.issuedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
