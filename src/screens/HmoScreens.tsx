import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
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
  Textarea,
  Badge,
  Alert,
  Spinner,
  EmptyState,
  statusColor,
} from '@/components/ui';
import type { HmoEnrollment, HmoPlan, HmoProvider } from '@/types';
import { Plus, Search, Link2 } from 'lucide-react';

// ===== HMO Plans =====
export function HmoPlansScreen() {
  const { org } = useAuth();
  const hmoId = org?.id ?? 0;
  const [plans, setPlans] = useState<HmoPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (hmoId) loadPlans();
  }, [hmoId]);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const res = await hmoApi.plans(hmoId);
      setPlans(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);
    try {
      await hmoApi.createPlan(hmoId, { name, description });
      setName('');
      setDescription('');
      setShowForm(false);
      loadPlans();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert>{error}</Alert>}

      <Card>
        <CardHeader
          title="Health Plans"
          subtitle={`${plans.length} plan(s)`}
          action={
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4" /> New Plan
            </Button>
          }
        />
        <CardBody>
          {showForm && (
            <form onSubmit={handleCreate} className="mb-6 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              {formError && <Alert>{formError}</Alert>}
              <Input
                label="Plan Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Corporate Plan"
                required
              />
              <Textarea
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What does this plan cover?"
                rows={3}
              />
              <div className="flex gap-2">
                <Button type="submit" loading={creating}>Create Plan</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : plans.length === 0 ? (
            <EmptyState title="No plans yet" message="Create a health plan to offer to enrollees" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <div key={plan.id} className="rounded-lg border border-slate-200 p-4">
                  <h4 className="font-semibold text-slate-900">{plan.name}</h4>
                  <p className="mt-1 text-sm text-slate-500">{plan.description || 'No description'}</p>
                  <div className="mt-3 text-xs text-slate-400">ID: {plan.id}</div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// ===== HMO Providers =====
export function HmoProvidersScreen() {
  const { org } = useAuth();
  const hmoId = org?.id ?? 0;
  const [providers, setProviders] = useState<HmoProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [providerId, setProviderId] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (hmoId) loadProviders();
  }, [hmoId]);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const res = await hmoApi.providers(hmoId);
      setProviders(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setConnecting(true);
    try {
      await hmoApi.connectProvider(hmoId, { providerId: Number(providerId) });
      setProviderId('');
      setShowForm(false);
      loadProviders();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert>{error}</Alert>}

      <Card>
        <CardHeader
          title="Provider Network"
          subtitle={`${providers.length} connected provider(s)`}
          action={
            <Button onClick={() => setShowForm(!showForm)}>
              <Link2 className="h-4 w-4" /> Connect Provider
            </Button>
          }
        />
        <CardBody>
          {showForm && (
            <form onSubmit={handleConnect} className="mb-6 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              {formError && <Alert>{formError}</Alert>}
              <Input
                label="Provider ID (Hospital Organization ID)"
                type="number"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                placeholder="Enter hospital organization ID"
                required
              />
              <div className="flex gap-2">
                <Button type="submit" loading={connecting}>Connect</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          )}

          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : providers.length === 0 ? (
            <EmptyState title="No providers connected" message="Connect a hospital to your HMO network" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {providers.map((p) => (
                <div key={p.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-slate-900">{p.provider?.name || `Provider #${p.providerId}`}</h4>
                    <Badge color="green">Connected</Badge>
                  </div>
                  {p.provider?.email && (
                    <p className="mt-1 text-sm text-slate-500">{p.provider.email}</p>
                  )}
                  {p.provider?.address && (
                    <p className="mt-0.5 text-xs text-slate-400">{p.provider.address}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

// ===== HMO Enrollments =====
export function HmoEnrollmentsScreen() {
  const { org } = useAuth();
  const hmoId = org?.id ?? 0;
  const [enrollments, setEnrollments] = useState<HmoEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');
  const [plans, setPlans] = useState<HmoPlan[]>([]);

  const [form, setForm] = useState({
    patientId: '',
    employerHmoId: '',
    planId: '',
    hmoNumber: '',
  });

  useEffect(() => {
    if (hmoId) {
      loadEnrollments();
      loadPlans();
    }
  }, [hmoId]);

  const loadEnrollments = async () => {
    setLoading(true);
    try {
      const res = await hmoApi.enrollments(hmoId, search || undefined);
      setEnrollments(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const res = await hmoApi.plans(hmoId);
      setPlans(res.data);
    } catch {
      // ignore
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadEnrollments();
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);
    try {
      await hmoApi.enroll(hmoId, {
        patientId: Number(form.patientId),
        employerHmoId: Number(form.employerHmoId),
        planId: Number(form.planId),
        hmoNumber: form.hmoNumber || undefined,
      });
      setForm({ patientId: '', employerHmoId: '', planId: '', hmoNumber: '' });
      setShowForm(false);
      loadEnrollments();
    } catch (err) {
      setFormError(getErrorMessage(err));
      const fieldErrs = getFieldErrors(err);
      if (fieldErrs.patientId) setFormError(fieldErrs.patientId);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert>{error}</Alert>}

      <Card>
        <CardHeader
          title="Enrollments"
          subtitle={`${enrollments.length} enrollment(s)`}
          action={
            <Button onClick={() => setShowForm(!showForm)}>
              <Plus className="h-4 w-4" /> New Enrollment
            </Button>
          }
        />
        <CardBody>
          {showForm && (
            <form onSubmit={handleEnroll} className="mb-6 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              {formError && <Alert>{formError}</Alert>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Patient ID"
                  type="number"
                  value={form.patientId}
                  onChange={(e) => setForm({ ...form, patientId: e.target.value })}
                  required
                />
                <Input
                  label="Employer HMO ID"
                  type="number"
                  value={form.employerHmoId}
                  onChange={(e) => setForm({ ...form, employerHmoId: e.target.value })}
                  required
                />
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-slate-700">Plan</label>
                  <select
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
                    value={form.planId}
                    onChange={(e) => setForm({ ...form, planId: e.target.value })}
                    required
                  >
                    <option value="">Select a plan</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="HMO Number (optional)"
                  value={form.hmoNumber}
                  onChange={(e) => setForm({ ...form, hmoNumber: e.target.value })}
                  placeholder="Auto-generated if blank"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={creating}>Enroll Patient</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          )}

          <form onSubmit={handleSearch} className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm"
                placeholder="Search by HMO number or patient name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" type="submit">Search</Button>
          </form>

          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : enrollments.length === 0 ? (
            <EmptyState title="No enrollments found" message="Enroll patients to see them here" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Patient</th>
                    <th className="pb-3 pr-4 font-medium">HMO Number</th>
                    <th className="pb-3 pr-4 font-medium">Plan ID</th>
                    <th className="pb-3 pr-4 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((en) => (
                    <tr key={en.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {en.patient ? `${en.patient.firstName} ${en.patient.lastName}` : `Patient #${en.patientId}`}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{en.hmoNumber}</td>
                      <td className="py-3 pr-4 text-slate-600">{en.planId}</td>
                      <td className="py-3 pr-4">
                        <Badge color={statusColor(en.status)}>{en.status}</Badge>
                      </td>
                      <td className="py-3 text-slate-500">
                        {new Date(en.enrollmentDate).toLocaleDateString()}
                      </td>
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
