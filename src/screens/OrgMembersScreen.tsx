import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { orgApi, getErrorMessage, getFieldErrors } from '@/lib/api';
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
import type { Invitation, OrgMember, OrgRole } from '@/types';
import { UserPlus, Copy, Check } from 'lucide-react';

const ROLES: OrgRole[] = [
  'ORG_ADMIN',
  'STAFF',
  'HMO_ADMIN',
  'HMO_OFFICER',
  'PROVIDER_ADMIN',
  'DOCTOR',
];

export function OrgMembersScreen() {
  const { org } = useAuth();
  const orgId = org?.id ?? 0;
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<OrgRole>('STAFF');
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [lastToken, setLastToken] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (orgId) loadData();
  }, [orgId]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [memRes, invRes] = await Promise.all([
        orgApi.members(orgId),
        orgApi.invitations(orgId).catch(() => ({ data: [] as Invitation[] })),
      ]);
      setMembers(memRes.data);
      setInvitations(invRes.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setLastToken('');
    setInviting(true);
    try {
      const res = await orgApi.invite(orgId, {
        email: inviteEmail,
        role: inviteRole,
      });
      if (res.data.token) {
        setLastToken(res.data.token);
        setInviteSuccess(`Invitation sent to ${inviteEmail}. Share the token below for demo/testing.`);
      } else {
        setInviteSuccess(`Invitation sent to ${inviteEmail}.`);
      }
      setInviteEmail('');
      loadData();
    } catch (err) {
      setInviteError(getErrorMessage(err));
      const fieldErrs = getFieldErrors(err);
      if (fieldErrs.email) setInviteError(fieldErrs.email);
    } finally {
      setInviting(false);
    }
  };

  const copyToken = () => {
    navigator.clipboard.writeText(lastToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6">
      {error && <Alert>{error}</Alert>}

      {/* Invite form */}
      <Card>
        <CardHeader title="Invite Member" subtitle="Send an invitation to join this organization" />
        <CardBody>
          {inviteError && <div className="mb-4"><Alert>{inviteError}</Alert></div>}
          {inviteSuccess && (
            <div className="mb-4">
              <Alert type="success">{inviteSuccess}</Alert>
              {lastToken && (
                <div className="mt-3 flex items-center gap-2 rounded-lg border border-slate-300 bg-slate-50 p-3">
                  <code className="flex-1 text-xs text-slate-700 break-all">{lastToken}</code>
                  <Button variant="outline" onClick={copyToken} className="shrink-0">
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? 'Copied' : 'Copy'}
                  </Button>
                </div>
              )}
            </div>
          )}
          <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="Email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="member@example.com"
                required
              />
            </div>
            <div className="sm:w-48">
              <Select
                label="Role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as OrgRole)}
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                ))}
              </Select>
            </div>
            <Button type="submit" loading={inviting}>
              <UserPlus className="h-4 w-4" /> Invite
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Members list */}
      <Card>
        <CardHeader title="Members" subtitle={`${members.length} active member(s)`} />
        <CardBody>
          {members.length === 0 ? (
            <EmptyState title="No members yet" message="Invite people to join your organization" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Role</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {m.user.firstName} {m.user.lastName}
                      </td>
                      <td className="py-3 pr-4 text-slate-600">{m.user.email}</td>
                      <td className="py-3 pr-4 text-slate-600">{m.role.replace(/_/g, ' ')}</td>
                      <td className="py-3">
                        <Badge color={statusColor(m.status)}>{m.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Pending invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader title="Pending Invitations" subtitle={`${invitations.length} pending invitation(s)`} />
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Role</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {invitations.map((inv) => (
                    <tr key={inv.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pr-4 text-slate-900">{inv.email}</td>
                      <td className="py-3 pr-4 text-slate-600">{inv.role.replace(/_/g, ' ')}</td>
                      <td className="py-3">
                        <Badge color={statusColor(inv.status)}>{inv.status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
