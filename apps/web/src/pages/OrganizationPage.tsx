import { useState } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserPlus,
  MoreVertical,
  Trash2,
  RefreshCw,
  Clock,
  Shield,
  Users,
  Mail,
  Calendar,
  Loader2,
  Building2,
  Pencil,
  Check,
  X,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  useMembers,
  useUpdateMemberRole,
  useRemoveMember,
  useInvitations,
  useCreateInvitation,
  useRevokeInvitation,
  useResendInvitation,
  useUpdateOrganization,
} from '@/hooks/api/useOrganizations';
import { useApiError } from '@/hooks/useApiError';
import type { UserRole } from '@/types';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export default function OrganizationPage() {
  const { isAdmin, currentOrganization, currentOrganizationId } = useApp();
  const { toast } = useToast();
  const { handleError } = useApiError();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('USER');
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [inviteToRevoke, setInviteToRevoke] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(
    currentOrganization?.name ?? ''
  );

  const orgId = currentOrganizationId ?? 0;

  // Fetch members
  const {
    data: members = [],
    isLoading: isLoadingMembers,
    error: membersError,
    refetch: refetchMembers,
  } = useMembers(orgId);

  // Fetch invitations
  const {
    data: invitations = [],
    isLoading: isLoadingInvitations,
    error: invitationsError,
    refetch: refetchInvitations,
  } = useInvitations(orgId);

  // Mutations
  const updateOrgMutation = useUpdateOrganization(orgId);
  const updateRoleMutation = useUpdateMemberRole(orgId);
  const removeMemberMutation = useRemoveMember(orgId);
  const createInvitationMutation = useCreateInvitation(orgId);
  const revokeInvitationMutation = useRevokeInvitation(orgId);
  const resendInvitationMutation = useResendInvitation(orgId);

  const pendingInvitations = invitations.filter((i) => i.status === 'PENDING');

  const handleInvite = async () => {
    if (!inviteEmail || !inviteEmail.includes('@')) return;

    try {
      await createInvitationMutation.mutateAsync({
        email: inviteEmail,
        role: inviteRole,
      });
      setInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('USER');
      toast({
        title: 'Invitation sent',
        description: `An invite has been sent to ${inviteEmail}.`,
      });
    } catch (error) {
      handleError(error, 'Failed to send invitation');
    }
  };

  const handleRoleChange = async (memberId: string, newRole: UserRole) => {
    try {
      await updateRoleMutation.mutateAsync({
        memberId: Number(memberId),
        role: newRole,
      });
      toast({
        title: 'Role updated',
        description: 'Member role has been changed.',
      });
    } catch (error) {
      handleError(error, 'Failed to update role');
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await removeMemberMutation.mutateAsync(Number(memberToRemove));
      toast({
        title: 'Member removed',
        description: 'The member has been removed from the organization.',
      });
    } catch (error) {
      handleError(error, 'Failed to remove member');
    } finally {
      setMemberToRemove(null);
    }
  };

  const handleRevokeInvite = async () => {
    if (!inviteToRevoke) return;

    try {
      await revokeInvitationMutation.mutateAsync(Number(inviteToRevoke));
      toast({
        title: 'Invitation revoked',
        description: 'The invitation has been cancelled.',
      });
    } catch (error) {
      handleError(error, 'Failed to revoke invitation');
    } finally {
      setInviteToRevoke(null);
    }
  };

  const handleResendInvite = async (inviteId: string) => {
    try {
      await resendInvitationMutation.mutateAsync(Number(inviteId));
      toast({
        title: 'Invitation resent',
        description: 'A new invitation email has been sent.',
      });
    } catch (error) {
      handleError(error, 'Failed to resend invitation');
    }
  };

  const handleSaveName = async () => {
    if (!editedName.trim()) return;

    try {
      await updateOrgMutation.mutateAsync({ name: editedName.trim() });
      setIsEditingName(false);
      toast({
        title: 'Organization updated',
        description: 'The organization name has been changed.',
      });
    } catch (error) {
      handleError(error, 'Failed to update organization');
    }
  };

  const handleCancelEdit = () => {
    setIsEditingName(false);
    setEditedName(currentOrganization?.name ?? '');
  };

  if (!currentOrganization) {
    return (
      <AppShell>
        <div className="p-4 md:p-6 max-w-5xl mx-auto">
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 max-w-5xl mx-auto">
        <PageHeader
          title="Organization"
          description="Manage your organization settings and members"
        />

        {/* Organization Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-accent" />
                </div>
                <div>
                  {isEditingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        className="h-8 w-48"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={handleSaveName}
                        disabled={updateOrgMutation.isPending}
                      >
                        {updateOrgMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={handleCancelEdit}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">
                        {currentOrganization.name}
                      </CardTitle>
                      {isAdmin && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => {
                            setEditedName(currentOrganization.name);
                            setIsEditingName(true);
                          }}
                        >
                          <Pencil className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  )}
                  <CardDescription className="flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Created{' '}
                    {format(
                      new Date(currentOrganization.createdAt),
                      'MMMM d, yyyy'
                    )}
                  </CardDescription>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Members & Invitations Tabs */}
        <Tabs defaultValue="members" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="members" className="gap-2">
                <Users className="w-4 h-4" />
                Members ({members.length})
              </TabsTrigger>
              <TabsTrigger value="invitations" className="gap-2">
                <Mail className="w-4 h-4" />
                Invitations ({pendingInvitations.length})
              </TabsTrigger>
            </TabsList>
            {isAdmin && (
              <Button onClick={() => setInviteModalOpen(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite member
              </Button>
            )}
          </div>

          <TabsContent value="members">
            {isLoadingMembers ? (
              <LoadingSkeleton variant="table" count={3} />
            ) : membersError ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Failed to load members
                  </p>
                  <Button variant="outline" onClick={() => refetchMembers()}>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : members.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No members yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Joined
                      </TableHead>
                      {isAdmin && <TableHead className="w-12"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {getInitials(member.user.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.user.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {member.user.email}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isAdmin ? (
                            <Select
                              value={member.role}
                              onValueChange={(v) =>
                                handleRoleChange(member.id, v as UserRole)
                              }
                              disabled={updateRoleMutation.isPending}
                            >
                              <SelectTrigger className="w-[110px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="ADMIN">
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-3.5 h-3.5" />
                                    Admin
                                  </div>
                                </SelectItem>
                                <SelectItem value="USER">User</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant={
                                member.role === 'ADMIN' ? 'default' : 'secondary'
                              }
                            >
                              {member.role === 'ADMIN' && (
                                <Shield className="w-3 h-3 mr-1" />
                              )}
                              {member.role}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(member.joinedAt), 'MMM d, yyyy')}
                          </div>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => setMemberToRemove(member.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove member
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="invitations">
            {isLoadingInvitations ? (
              <LoadingSkeleton variant="table" count={2} />
            ) : invitationsError ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Failed to load invitations
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => refetchInvitations()}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : invitations.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No pending invitations
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Invited
                      </TableHead>
                      {isAdmin && <TableHead className="w-12"></TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invitations.map((invite) => (
                      <TableRow key={invite.id}>
                        <TableCell className="font-medium">
                          {invite.email}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              invite.role === 'ADMIN' ? 'default' : 'secondary'
                            }
                          >
                            {invite.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              invite.status === 'PENDING'
                                ? 'border-status-processing text-status-processing'
                                : invite.status === 'ACCEPTED'
                                  ? 'border-status-ready text-status-ready'
                                  : 'border-status-failed text-status-failed'
                            }
                          >
                            {invite.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {formatDistanceToNow(new Date(invite.createdAt), {
                            addSuffix: true,
                          })}
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {invite.status === 'PENDING' && (
                                  <DropdownMenuItem
                                    onClick={() => handleResendInvite(invite.id)}
                                    disabled={resendInvitationMutation.isPending}
                                  >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Resend
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => setInviteToRevoke(invite.id)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Revoke
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Invite Modal */}
        <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Invite member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your organization.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(v) => setInviteRole(v as UserRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">User</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Admins can manage members, documents, and settings.
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setInviteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInvite}
                disabled={!inviteEmail || createInvitationMutation.isPending}
              >
                {createInvitationMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send invite'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Remove Member Confirmation */}
        <AlertDialog
          open={!!memberToRemove}
          onOpenChange={() => setMemberToRemove(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove member?</AlertDialogTitle>
              <AlertDialogDescription>
                This person will lose access to the organization immediately.
                You can invite them again later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemoveMember}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={removeMemberMutation.isPending}
              >
                {removeMemberMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Removing...
                  </>
                ) : (
                  'Remove'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Revoke Invite Confirmation */}
        <AlertDialog
          open={!!inviteToRevoke}
          onOpenChange={() => setInviteToRevoke(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Revoke invitation?</AlertDialogTitle>
              <AlertDialogDescription>
                The invite link will no longer work. You can send a new
                invitation later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRevokeInvite}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={revokeInvitationMutation.isPending}
              >
                {revokeInvitationMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  'Revoke'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  );
}
