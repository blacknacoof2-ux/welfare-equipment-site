import { randomUUID } from 'node:crypto';

export const INTAKE_STATUSES = ['NEW', 'REVIEWING', 'CONTACTED', 'COMPLETED', 'HOLD'] as const;
export type IntakeStatus = (typeof INTAKE_STATUSES)[number];

export type IntakeProduct = {
  slug: string;
  title: string;
  manufacturer: string;
  benefitCode: string;
  category: string;
  benefitPrice: number;
  priceSuffix: string;
};

export type IntakeRecord = {
  id: string;
  request_id: string;
  submitted_at: string;
  applicant_name: string;
  beneficiary_name: string;
  birth_date: string;
  care_number: string;
  phone: string;
  address: string;
  address_detail: string;
  relation: string;
  needs: string;
  items: IntakeProduct[];
  certificate_path: string;
  certificate_name: string;
  certificate_type: string;
  status: IntakeStatus;
  staff_note: string;
  updated_at: string;
};

export type IntakeListItem = Pick<
  IntakeRecord,
  | 'id'
  | 'request_id'
  | 'submitted_at'
  | 'applicant_name'
  | 'beneficiary_name'
  | 'phone'
  | 'address'
  | 'relation'
  | 'items'
  | 'status'
  | 'updated_at'
>;

type CreateIntakeInput = Omit<
  IntakeRecord,
  'id' | 'certificate_path' | 'certificate_name' | 'certificate_type' | 'status' | 'staff_note' | 'updated_at'
>;

function config() {
  return {
    url: process.env.SUPABASE_URL?.replace(/\/$/, '') ?? '',
    key: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    bucket: process.env.SUPABASE_CERTIFICATE_BUCKET?.trim() || 'consultation-certificates',
  };
}

export function isIntakeStoreConfigured() {
  const { url, key } = config();
  return Boolean(url && key);
}

function supabaseHeaders(extra: HeadersInit = {}) {
  const { key } = config();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...extra,
  };
}

function extensionFor(file: File) {
  const byType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  };
  return byType[file.type] ?? 'bin';
}

async function supabaseJson<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, cache: 'no-store' });
  const raw = await response.text();
  if (!response.ok) {
    throw new Error(`SUPABASE_${response.status}:${raw.slice(0, 300)}`);
  }
  if (!raw) return undefined as T;
  return JSON.parse(raw) as T;
}

export async function createIntake(input: CreateIntakeInput, certificate: File) {
  if (!isIntakeStoreConfigured()) throw new Error('INTAKE_STORE_NOT_CONFIGURED');
  const { url, bucket } = config();
  const month = input.submitted_at.slice(0, 7).replace('-', '/');
  const certificatePath = `${month}/${input.request_id}/${randomUUID()}.${extensionFor(certificate)}`;
  const objectUrl = `${url}/storage/v1/object/${encodeURIComponent(bucket)}/${certificatePath.split('/').map(encodeURIComponent).join('/')}`;

  const bytes = await certificate.arrayBuffer();
  const upload = await fetch(objectUrl, {
    method: 'POST',
    headers: supabaseHeaders({
      'Content-Type': certificate.type,
      'x-upsert': 'false',
    }),
    body: bytes,
    cache: 'no-store',
  });
  if (!upload.ok) {
    const detail = await upload.text().catch(() => '');
    throw new Error(`CERTIFICATE_UPLOAD_${upload.status}:${detail.slice(0, 300)}`);
  }

  const row = {
    request_id: input.request_id,
    submitted_at: input.submitted_at,
    applicant_name: input.applicant_name,
    beneficiary_name: input.beneficiary_name,
    birth_date: input.birth_date,
    care_number: input.care_number,
    phone: input.phone,
    address: input.address,
    address_detail: input.address_detail,
    relation: input.relation,
    needs: input.needs,
    items: input.items,
    certificate_path: certificatePath,
    certificate_name: certificate.name,
    certificate_type: certificate.type,
    status: 'NEW' satisfies IntakeStatus,
    staff_note: '',
  };

  try {
    const inserted = await supabaseJson<IntakeRecord[]>(`${url}/rest/v1/consultations`, {
      method: 'POST',
      headers: supabaseHeaders({
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      }),
      body: JSON.stringify(row),
    });
    if (!inserted?.[0]) throw new Error('INTAKE_INSERT_EMPTY');
    return inserted[0];
  } catch (error) {
    await fetch(objectUrl, {
      method: 'DELETE',
      headers: supabaseHeaders(),
      cache: 'no-store',
    }).catch(() => undefined);
    throw error;
  }
}

export async function listIntakes(limit = 200): Promise<IntakeListItem[]> {
  if (!isIntakeStoreConfigured()) return [];
  const { url } = config();
  const select = [
    'id',
    'request_id',
    'submitted_at',
    'applicant_name',
    'beneficiary_name',
    'phone',
    'address',
    'relation',
    'items',
    'status',
    'updated_at',
  ].join(',');
  return supabaseJson<IntakeListItem[]>(
    `${url}/rest/v1/consultations?select=${encodeURIComponent(select)}&order=submitted_at.desc&limit=${Math.min(Math.max(limit, 1), 500)}`,
    { headers: supabaseHeaders() },
  );
}

export async function getIntake(id: string): Promise<IntakeRecord | null> {
  if (!isIntakeStoreConfigured()) return null;
  const { url } = config();
  const rows = await supabaseJson<IntakeRecord[]>(
    `${url}/rest/v1/consultations?select=*&id=eq.${encodeURIComponent(id)}&limit=1`,
    { headers: supabaseHeaders() },
  );
  return rows[0] ?? null;
}

export async function updateIntake(id: string, values: { status?: IntakeStatus; staff_note?: string }) {
  if (!isIntakeStoreConfigured()) throw new Error('INTAKE_STORE_NOT_CONFIGURED');
  const { url } = config();
  const patch = {
    ...values,
    updated_at: new Date().toISOString(),
  };
  const rows = await supabaseJson<IntakeRecord[]>(
    `${url}/rest/v1/consultations?id=eq.${encodeURIComponent(id)}`,
    {
      method: 'PATCH',
      headers: supabaseHeaders({
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      }),
      body: JSON.stringify(patch),
    },
  );
  return rows[0] ?? null;
}

export async function createCertificateSignedUrl(path: string, expiresIn = 900) {
  if (!isIntakeStoreConfigured() || !path) return null;
  const { url, bucket } = config();
  const endpoint = `${url}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${path.split('/').map(encodeURIComponent).join('/')}`;
  const result = await supabaseJson<{ signedURL?: string; signedUrl?: string }>(endpoint, {
    method: 'POST',
    headers: supabaseHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ expiresIn }),
  });
  const signed = result.signedURL ?? result.signedUrl;
  if (!signed) return null;
  return signed.startsWith('http') ? signed : `${url}/storage/v1${signed.startsWith('/') ? signed : `/${signed}`}`;
}
