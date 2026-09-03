import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  hospitalApi,
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
} from '@/components/ui';
import type { HospitalPatient } from '@/types';
import { Search, UserPlus } from 'lucide-react';

export function HospitalPatientsScreen() {
  const { org } = useAuth();
  const hospitalId = org?.id ?? 0;
  const [patients, setPatients] = useState<HospitalPatient[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: 'MALE',
    hospitalNumber: '',
  });

  useEffect(() => {
    if (hospitalId) loadPatients();
  }, [hospitalId]);

  const loadPatients = async () => {
    setLoading(true);
    try {
      const res = await hospitalApi.patients(hospitalId, search || undefined);
      setPatients(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadPatients();
  };

  const handleOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setCreating(true);
    try {
      await hospitalApi.onboardPatient(hospitalId, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone || undefined,
        dateOfBirth: form.dateOfBirth || undefined,
        gender: form.gender,
        hospitalNumber: form.hospitalNumber || undefined,
      });
      setForm({ firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', gender: 'MALE', hospitalNumber: '' });
      setShowForm(false);
      loadPatients();
    } catch (err) {
      setFormError(getErrorMessage(err));
      const fieldErrs = getFieldErrors(err);
      if (fieldErrs.email) setFormError(fieldErrs.email);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <Alert>{error}</Alert>}

      <Card>
        <CardHeader
          title="Patient Registry"
          subtitle={`${patients.length} patient(s)`}
          action={
            <Button onClick={() => setShowForm(!showForm)}>
              <UserPlus className="h-4 w-4" /> Onboard Patient
            </Button>
          }
        />
        <CardBody>
          {showForm && (
            <form onSubmit={handleOnboard} className="mb-6 space-y-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              {formError && <Alert>{formError}</Alert>}
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="First Name"
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
                <Input
                  label="Last Name"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
                <Input
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <Input
                  label="Phone"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <Input
                  label="Date of Birth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                />
                <Select
                  label="Gender"
                  value={form.gender}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </Select>
                <Input
                  label="Hospital Number (optional)"
                  value={form.hospitalNumber}
                  onChange={(e) => setForm({ ...form, hospitalNumber: e.target.value })}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" loading={creating}>Onboard</Button>
                <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          )}

          <form onSubmit={handleSearch} className="mb-4 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm"
                placeholder="Search by name, email, or hospital number..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button variant="outline" type="submit">Search</Button>
          </form>

          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : patients.length === 0 ? (
            <EmptyState title="No patients found" message="Onboard patients to see them here" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Gender</th>
                    <th className="pb-3 pr-4 font-medium">Hospital #</th>
                    <th className="pb-3 font-medium">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {p.firstName} {p.lastName}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{p.email}</td>
                      <td className="py-3 pr-4 text-slate-600">{p.gender}</td>
                      <td className="py-3 pr-4 text-slate-600">{p.hospitalNumber || '—'}</td>
                      <td className="py-3 text-slate-500">
                        {new Date(p.registrationDate).toLocaleDateString()}
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
