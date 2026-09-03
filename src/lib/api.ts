import type {
  AccountType,
  ApiResponse,
  ApiError,
  Appointment,
  AuthData,
  ClinicalSummary,
  Diagnosis,
  EligibilityResponse,
  HmoEnrollment,
  HmoPlan,
  HmoProvider,
  HospitalPatient,
  Invitation,
  OrgMember,
  Organization,
  PatientPrescription,
  PatientProfile,
  Prescription,
  User,
} from '@/types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8030/api/v1';

const TOKEN_KEY = 'haven_token';
const USER_KEY = 'haven_user';
const ORG_KEY = 'haven_org';

// ===== Token / user / org storage =====
export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export const userStore = {
  get: (): User | null => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  },
  set: (u: User) => localStorage.setItem(USER_KEY, JSON.stringify(u)),
  clear: () => localStorage.removeItem(USER_KEY),
};

export const orgStore = {
  get: (): Organization | null => {
    const raw = localStorage.getItem(ORG_KEY);
    return raw ? (JSON.parse(raw) as Organization) : null;
  },
  set: (o: Organization) => localStorage.setItem(ORG_KEY, JSON.stringify(o)),
  clear: () => localStorage.removeItem(ORG_KEY),
};

// ===== Core fetch wrapper =====
async function request<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
    auth?: boolean;
    orgId?: number;
  } = {},
): Promise<T> {
  const { method = 'GET', body, headers = {}, auth = true, orgId } = options;

  const finalHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (auth) {
    const token = tokenStore.get();
    if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (orgId !== undefined) {
    finalHeaders['x-organization-id'] = String(orgId);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers: finalHeaders,
      credentials: 'include',
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiClientError(
      0,
      'Cannot reach the Haven backend. Make sure it is running at ' +
        API_URL +
        ' and that CORS is enabled for this origin.',
    );
  }

  const text = await res.text();
  let json: unknown = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      throw new ApiClientError(res.status, 'Unexpected server response');
    }
  }

  if (!res.ok) {
    const err = json as ApiError;
    throw new ApiClientError(
      res.status,
      err?.message || `Request failed (${res.status})`,
      err?.details,
    );
  }

  return json as T;
}

export class ApiClientError extends Error {
  statusCode: number;
  details?: { fieldErrors?: Record<string, string[]> };

  constructor(
    status: number,
    message: string,
    details?: { fieldErrors?: Record<string, string[]> },
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = status;
    this.details = details;
  }
}

// Helper to extract field errors for forms
export function getFieldErrors(
  err: unknown,
): Record<string, string> {
  if (err instanceof ApiClientError && err.details?.fieldErrors) {
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(err.details.fieldErrors)) {
      if (v.length) result[k] = v[0];
    }
    return result;
  }
  return {};
}

export function getErrorMessage(err: unknown): string {
  if (err instanceof ApiClientError) return err.message;
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
}

// ===== Auth API =====
export const authApi = {
  signup: (body: {
    firstName: string;
    lastName: string;
    email: string;
    accountType: AccountType;
    password: string;
  }) =>
    request<ApiResponse<User>>('/auth/signup', {
      method: 'POST',
      body,
      auth: false,
    }),

  login: (body: { email: string; password: string }) =>
    request<ApiResponse<AuthData>>('/auth/login', {
      method: 'POST',
      body,
      auth: false,
    }),

  verifyEmail: (body: { token: string; email?: string }) =>
    request<ApiResponse<User>>('/auth/verify-email', {
      method: 'POST',
      body,
      auth: false,
    }),

  logout: () => request<ApiResponse<null>>('/auth/logout', { method: 'POST' }),
};

// ===== Organization API =====
export const orgApi = {
  myWorkspaces: () =>
    request<ApiResponse<Organization[]>>('/organization/my-workspaces'),

  get: (orgId: number) =>
    request<ApiResponse<Organization>>(`/organization/${orgId}`, { orgId }),

  members: (orgId: number) =>
    request<ApiResponse<OrgMember[]>>(`/organization/${orgId}/members`, {
      orgId,
    }),

  invite: (orgId: number, body: { email: string; role: string }) =>
    request<ApiResponse<Invitation>>(`/organization/${orgId}/invitations`, {
      method: 'POST',
      body,
      orgId,
    }),

  acceptInvitation: (body: { token: string }) =>
    request<ApiResponse<OrgMember>>('/organization/invitations/accept', {
      method: 'POST',
      body,
    }),

  invitations: (orgId: number) =>
    request<ApiResponse<Invitation[]>>(
      `/organization/${orgId}/invitations`,
      { orgId },
    ),
};

// ===== HMO API =====
export const hmoApi = {
  plans: (hmoId: number) =>
    request<ApiResponse<HmoPlan[]>>(`/hmo/${hmoId}/plans`, { orgId: hmoId }),

  createPlan: (hmoId: number, body: { name: string; description?: string }) =>
    request<ApiResponse<HmoPlan>>(`/hmo/${hmoId}/plans`, {
      method: 'POST',
      body,
      orgId: hmoId,
    }),

  connectProvider: (hmoId: number, body: { providerId: number }) =>
    request<ApiResponse<HmoProvider>>(`/hmo/${hmoId}/providers/connect`, {
      method: 'POST',
      body,
      orgId: hmoId,
    }),

  providers: (hmoId: number) =>
    request<ApiResponse<HmoProvider[]>>(`/hmo/${hmoId}/providers`, {
      orgId: hmoId,
    }),

  enroll: (
    hmoId: number,
    body: {
      patientId: number;
      employerHmoId: number;
      planId: number;
      hmoNumber?: string;
    },
  ) =>
    request<ApiResponse<HmoEnrollment>>(`/hmo/${hmoId}/enrollments`, {
      method: 'POST',
      body,
      orgId: hmoId,
    }),

  enrollments: (hmoId: number, search?: string) =>
    request<ApiResponse<HmoEnrollment[]>>(
      `/hmo/${hmoId}/enrollments${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      { orgId: hmoId },
    ),

  connectEmployer: (hmoId: number, body: { employerId: number }) =>
    request<ApiResponse<unknown>>(`/hmo/${hmoId}/employers/connect`, {
      method: 'POST',
      body,
      orgId: hmoId,
    }),

  partnerships: (orgId: number) =>
    request<ApiResponse<unknown[]>>(`/hmo/${orgId}/partnerships`, {
      orgId,
    }),
};

// ===== Clinical API =====
export const clinicalApi = {
  eligibilityCheck: (body: { hmoNumber: string; providerId: number }) =>
    request<ApiResponse<EligibilityResponse>>('/clinical/eligibility-check', {
      method: 'POST',
      body,
    }),

  diagnosis: (
    appointmentId: number,
    body: { diagnosis: string },
    orgId: number,
  ) =>
    request<ApiResponse<Diagnosis>>(
      `/clinical/appointments/${appointmentId}/diagnosis`,
      { method: 'POST', body, orgId },
    ),

  prescription: (
    appointmentId: number,
    body: {
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
      confirmPassword: string;
    },
    orgId: number,
  ) =>
    request<ApiResponse<Prescription>>(
      `/clinical/appointments/${appointmentId}/prescription`,
      { method: 'POST', body, orgId },
    ),

  summary: (appointmentId: number, orgId: number) =>
    request<ApiResponse<ClinicalSummary>>(
      `/clinical/appointments/${appointmentId}/summary`,
      { orgId },
    ),
};

// ===== Hospital Patients API =====
export const hospitalApi = {
  onboardPatient: (
    hospitalId: number,
    body: {
      firstName: string;
      lastName: string;
      email: string;
      phone?: string;
      dateOfBirth?: string;
      gender?: string;
      hospitalNumber?: string;
    },
  ) =>
    request<ApiResponse<HospitalPatient>>(
      `/hospital-patients/${hospitalId}/patients`,
      { method: 'POST', body, orgId: hospitalId },
    ),

  patients: (hospitalId: number, search?: string) =>
    request<ApiResponse<HospitalPatient[]>>(
      `/hospital-patients/${hospitalId}/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      { orgId: hospitalId },
    ),
};

// ===== Patient API =====
export const patientApi = {
  me: () => request<ApiResponse<PatientProfile>>('/patient/me'),

  prescriptions: () =>
    request<ApiResponse<PatientPrescription[]>>('/patient/prescriptions'),

  requestAppointment: (body: {
    hospitalId: number;
    hmoId: number;
    scheduledAt: string;
    type: Appointment['type'];
    service: Appointment['service'];
    userId: number;
  }) =>
    request<ApiResponse<Appointment>>('/patient/request-appointment', {
      method: 'POST',
      body,
      auth: false,
    }),
};
