import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  clinicalApi,
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
} from '@/components/ui';
import type { ClinicalSummary, EligibilityResponse } from '@/types';
import {
  Stethoscope,
  ShieldCheck,
  Pill,
  FileText,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export function DoctorConsultationScreen() {
  const { org } = useAuth();
  const orgId = org?.id ?? 0;

  // Eligibility check state
  const [hmoNumber, setHmoNumber] = useState('');
  const [providerId, setProviderId] = useState('');
  const [eligibilityResult, setEligibilityResult] = useState<EligibilityResponse | null>(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);
  const [eligibilityError, setEligibilityError] = useState('');

  // Appointment / clinical summary state
  const [appointmentId, setAppointmentId] = useState('');
  const [summary, setSummary] = useState<ClinicalSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  // Diagnosis state
  const [diagnosisText, setDiagnosisText] = useState('');
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [diagnosisError, setDiagnosisError] = useState('');
  const [diagnosisSuccess, setDiagnosisSuccess] = useState('');

  // Prescription state
  const [rxForm, setRxForm] = useState({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    confirmPassword: '',
  });
  const [rxLoading, setRxLoading] = useState(false);
  const [rxError, setRxError] = useState('');
  const [rxSuccess, setRxSuccess] = useState('');

  // ===== Eligibility Check =====
  const handleEligibility = async (e: React.FormEvent) => {
    e.preventDefault();
    setEligibilityError('');
    setEligibilityResult(null);
    setEligibilityLoading(true);
    try {
      const res = await clinicalApi.eligibilityCheck({
        hmoNumber,
        providerId: Number(providerId),
      });
      setEligibilityResult(res.data);
    } catch (err) {
      setEligibilityError(getErrorMessage(err));
    } finally {
      setEligibilityLoading(false);
    }
  };

  // ===== Load Summary =====
  const handleLoadSummary = async (e: React.FormEvent) => {
    e.preventDefault();
    setSummaryError('');
    setSummary(null);
    setSummaryLoading(true);
    try {
      const res = await clinicalApi.summary(Number(appointmentId), orgId);
      setSummary(res.data);
      setDiagnosisSuccess('');
      setRxSuccess('');
    } catch (err) {
      setSummaryError(getErrorMessage(err));
    } finally {
      setSummaryLoading(false);
    }
  };

  // ===== Record Diagnosis =====
  const handleDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    setDiagnosisError('');
    setDiagnosisSuccess('');
    setDiagnosisLoading(true);
    try {
      await clinicalApi.diagnosis(Number(appointmentId), { diagnosis: diagnosisText }, orgId);
      setDiagnosisSuccess('Diagnosis recorded successfully.');
      setDiagnosisText('');
      // Reload summary
      const res = await clinicalApi.summary(Number(appointmentId), orgId);
      setSummary(res.data);
    } catch (err) {
      setDiagnosisError(getErrorMessage(err));
    } finally {
      setDiagnosisLoading(false);
    }
  };

  // ===== Create Prescription =====
  const handlePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setRxError('');
    setRxSuccess('');
    setRxLoading(true);
    try {
      const res = await clinicalApi.prescription(Number(appointmentId), {
        medication: rxForm.medication,
        dosage: rxForm.dosage,
        frequency: rxForm.frequency,
        duration: rxForm.duration,
        confirmPassword: rxForm.confirmPassword,
      }, orgId);
      setRxSuccess(`Prescription confirmed: ${res.data.medication} (${res.data.dosage})`);
      setRxForm({ medication: '', dosage: '', frequency: '', duration: '', confirmPassword: '' });
      // Reload summary
      const sumRes = await clinicalApi.summary(Number(appointmentId), orgId);
      setSummary(res.data ? sumRes.data : null);
    } catch (err) {
      setRxError(getErrorMessage(err));
      const fieldErrs = getFieldErrors(err);
      if (fieldErrs.confirmPassword) setRxError(fieldErrs.confirmPassword);
    } finally {
      setRxLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Eligibility Check */}
      <Card>
        <CardHeader
          title="Eligibility Check"
          subtitle="Verify patient HMO eligibility before consultation"
        />
        <CardBody>
          {eligibilityError && <div className="mb-4"><Alert>{eligibilityError}</Alert></div>}

          <form onSubmit={handleEligibility} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="HMO Number"
                value={hmoNumber}
                onChange={(e) => setHmoNumber(e.target.value)}
                placeholder="Patient's HMO number"
                required
              />
            </div>
            <div className="sm:w-48">
              <Input
                label="Provider ID"
                type="number"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                placeholder="Hospital ID"
                required
              />
            </div>
            <Button type="submit" loading={eligibilityLoading}>
              <ShieldCheck className="h-4 w-4" /> Check
            </Button>
          </form>

          {eligibilityResult && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center gap-3">
                {eligibilityResult.eligible ? (
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-red-600" />
                )}
                <div>
                  <p className="font-semibold text-slate-900">
                    Status: {eligibilityResult.eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'}
                  </p>
                  {eligibilityResult.patientName && (
                    <p className="text-sm text-slate-600">Patient: {eligibilityResult.patientName}</p>
                  )}
                  {eligibilityResult.planName && (
                    <p className="text-sm text-slate-600">Plan: {eligibilityResult.planName}</p>
                  )}
                  {eligibilityResult.provider && (
                    <p className="text-sm text-slate-600">Provider: {eligibilityResult.provider}</p>
                  )}
                </div>
                <div className="ml-auto">
                  <Badge color={eligibilityResult.eligible ? 'green' : 'red'}>
                    {eligibilityResult.status || (eligibilityResult.eligible ? 'ACTIVE' : 'INACTIVE')}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Appointment Lookup */}
      <Card>
        <CardHeader
          title="Appointment Lookup"
          subtitle="Load an appointment to view clinical summary and record care"
        />
        <CardBody>
          {summaryError && <div className="mb-4"><Alert>{summaryError}</Alert></div>}

          <form onSubmit={handleLoadSummary} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Appointment ID"
                type="number"
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                placeholder="Enter appointment ID"
                required
              />
            </div>
            <Button type="submit" loading={summaryLoading}>
              <FileText className="h-4 w-4" /> Load Summary
            </Button>
          </form>

          {summaryLoading && <div className="mt-4 flex justify-center"><Spinner /></div>}

          {summary && (
            <div className="mt-6 space-y-4">
              {/* Summary header */}
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3">
                  <Stethoscope className="h-5 w-5 text-slate-600" />
                  <div>
                    <h4 className="font-semibold text-slate-900">{summary.patientName || 'Patient'}</h4>
                    <p className="text-sm text-slate-500">
                      {summary.hospitalName} · HMO: {summary.hmoNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Existing diagnosis */}
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <FileText className="h-4 w-4" /> Diagnosis
                </h4>
                {summary.diagnosis ? (
                  <div>
                    <p className="text-sm text-slate-700">{summary.diagnosis.diagnosis}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Recorded by {summary.diagnosis.recordedBy} on{' '}
                      {new Date(summary.diagnosis.recordedAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No diagnosis recorded yet</p>
                )}
              </div>

              {/* Existing prescription */}
              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Pill className="h-4 w-4" /> Prescription
                </h4>
                {summary.prescription ? (
                  <div>
                    <p className="text-sm font-medium text-slate-900">{summary.prescription.medication}</p>
                    <p className="text-sm text-slate-600">
                      {summary.prescription.dosage} · {summary.prescription.frequency} · {summary.prescription.duration}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Issued by {summary.prescription.issuedBy} on{' '}
                      {new Date(summary.prescription.issuedAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No prescription issued yet</p>
                )}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Diagnosis form — only show when summary loaded and no diagnosis yet */}
      {summary && !summary.diagnosis && (
        <Card>
          <CardHeader title="Record Diagnosis" subtitle="Enter the clinical diagnosis for this appointment" />
          <CardBody>
            {diagnosisError && <div className="mb-4"><Alert>{diagnosisError}</Alert></div>}
            {diagnosisSuccess && <div className="mb-4"><Alert type="success">{diagnosisSuccess}</Alert></div>}
            <form onSubmit={handleDiagnosis} className="space-y-4">
              <Textarea
                label="Diagnosis"
                value={diagnosisText}
                onChange={(e) => setDiagnosisText(e.target.value)}
                placeholder="Enter clinical diagnosis..."
                rows={4}
                required
              />
              <Button type="submit" loading={diagnosisLoading}>
                <FileText className="h-4 w-4" /> Record Diagnosis
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Prescription form — only show when summary loaded, diagnosis exists, and no prescription yet */}
      {summary && summary.diagnosis && !summary.prescription && (
        <Card>
          <CardHeader
            title="Create & Confirm Prescription"
            subtitle="Enter prescription details and confirm with your password"
          />
          <CardBody>
            {rxError && <div className="mb-4"><Alert>{rxError}</Alert></div>}
            {rxSuccess && <div className="mb-4"><Alert type="success">{rxSuccess}</Alert></div>}
            <form onSubmit={handlePrescription} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Medication"
                  value={rxForm.medication}
                  onChange={(e) => setRxForm({ ...rxForm, medication: e.target.value })}
                  placeholder="e.g. Amoxicillin"
                  required
                />
                <Input
                  label="Dosage"
                  value={rxForm.dosage}
                  onChange={(e) => setRxForm({ ...rxForm, dosage: e.target.value })}
                  placeholder="e.g. 500mg"
                  required
                />
                <Input
                  label="Frequency"
                  value={rxForm.frequency}
                  onChange={(e) => setRxForm({ ...rxForm, frequency: e.target.value })}
                  placeholder="e.g. 3 times daily"
                  required
                />
                <Input
                  label="Duration"
                  value={rxForm.duration}
                  onChange={(e) => setRxForm({ ...rxForm, duration: e.target.value })}
                  placeholder="e.g. 7 days"
                  required
                />
              </div>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <div className="flex items-center gap-2 text-sm text-amber-700">
                  <Lock className="h-4 w-4" />
                  <span className="font-medium">Security confirmation required</span>
                </div>
                <p className="mt-1 text-xs text-amber-600">
                  Enter your account password to confirm and sign this prescription.
                </p>
              </div>
              <Input
                label="Confirm Password"
                type="password"
                value={rxForm.confirmPassword}
                onChange={(e) => setRxForm({ ...rxForm, confirmPassword: e.target.value })}
                placeholder="Your account password"
                required
              />
              <Button type="submit" loading={rxLoading}>
                <ShieldCheck className="h-4 w-4" /> Confirm & Issue Prescription
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {/* Complete state */}
      {summary && summary.diagnosis && summary.prescription && (
        <Card>
          <CardBody>
            <div className="flex items-center gap-3 py-4">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              <div>
                <h4 className="font-semibold text-slate-900">Consultation Complete</h4>
                <p className="text-sm text-slate-500">
                  Diagnosis and prescription have been recorded for this appointment.
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Empty state when no summary loaded */}
      {!summary && !summaryLoading && (
        <Card>
          <CardBody>
            <EmptyState
              title="No appointment loaded"
              message="Enter an appointment ID above to view the clinical summary and record care"
            />
          </CardBody>
        </Card>
      )}
    </div>
  );
}
