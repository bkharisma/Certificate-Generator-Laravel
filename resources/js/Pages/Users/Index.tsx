import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { sanitizeHtml } from '@/lib/utils';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Plus, Trash2, KeyRound, Upload, Users as UsersIcon } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface User {
    id: number;
    name: string;
    email: string;
    roles: { id: number; name: string }[];
    created_at: string;
}

interface PaginatedData {
    data: User[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export default function Index({ users, availableRoles }: { users: PaginatedData; availableRoles: string[] }) {
    const [addOpen, setAddOpen] = useState(false);
    const [bulkOpen, setBulkOpen] = useState(false);
    const [resetOpen, setResetOpen] = useState<number | null>(null);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: availableRoles[0] ?? '' });
    const [bulkUsers, setBulkUsers] = useState([{ name: '', email: '', password: '' }]);
    const [bulkRole, setBulkRole] = useState(availableRoles[0] ?? '');
    const [resetPassword, setResetPassword] = useState('');
    const [resetConfirm, setResetConfirm] = useState('');

    function addUser() {
        setSaving(true);
        router.post(route('users.store'), newUser, {
            preserveScroll: true,
            onSuccess: () => {
                setAddOpen(false);
                setNewUser({ name: '', email: '', password: '', role: availableRoles[0] || '' });
                toast.success('User created successfully');
                setSaving(false);
            },
            onError: () => {
                toast.error('Failed to create user');
                setSaving(false);
            },
        });
    }

    function addBulkUsers() {
        setSaving(true);
        router.post(route('users.bulk'), { users: bulkUsers, role: bulkRole }, {
            preserveScroll: true,
            onSuccess: () => {
                setBulkOpen(false);
                setBulkUsers([{ name: '', email: '', password: '' }]);
                toast.success('Users created successfully');
                setSaving(false);
            },
            onError: () => {
                toast.error('Failed to create users');
                setSaving(false);
            },
        });
    }

    function handleResetPassword(userId: number) {
        setSaving(true);
        router.post(route('users.reset-password', userId), {
            password: resetPassword,
            password_confirmation: resetConfirm,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setResetOpen(null);
                setResetPassword('');
                setResetConfirm('');
                toast.success('Password reset successfully');
                setSaving(false);
            },
            onError: () => {
                toast.error('Failed to reset password');
                setSaving(false);
            },
        });
    }

    function handleDelete() {
        if (!deleteId) return;
        setSaving(true);
        router.delete(route('users.destroy', deleteId), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteId(null);
                toast.success('User deleted');
                setSaving(false);
            },
            onError: () => {
                toast.error('Failed to delete user');
                setSaving(false);
            },
        });
    }

    function addBulkRow() {
        setBulkUsers([...bulkUsers, { name: '', email: '', password: '' }]);
    }

    function removeBulkRow(index: number) {
        setBulkUsers(bulkUsers.filter((_, i) => i !== index));
    }

    function updateBulkUser(index: number, field: string, value: string) {
        const updated = [...bulkUsers];
        updated[index] = { ...updated[index], [field]: value };
        setBulkUsers(updated);
    }

    return (
        <AuthenticatedLayout header="Users">
            <Head title="Users" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Users</h2>
                        <p className="text-muted-foreground">
                            Manage application users
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
                            <Button variant="outline" onClick={() => setBulkOpen(true)}>
                                <Upload className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Bulk Add</span>
                            </Button>
                            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                                <DialogHeader>
                                    <DialogTitle>Bulk Add Users</DialogTitle>
                                    <DialogDescription>
                                        Add multiple users at once
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Select value={bulkRole} onValueChange={(v) => { if (v) setBulkRole(v); }}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableRoles.map((role) => (
                                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    {bulkUsers.map((user, i) => (
                                        <div key={i} className="space-y-2 p-3 border rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium">User {i + 1}</span>
                                                {bulkUsers.length > 1 && (
                                                    <Button variant="ghost" size="sm" onClick={() => removeBulkRow(i)}>
                                                        <Trash2 className="h-3 w-3 text-destructive" />
                                                    </Button>
                                                )}
                                            </div>
                                            <Input
                                                placeholder="Name"
                                                value={user.name}
                                                onChange={(e) => updateBulkUser(i, 'name', e.target.value)}
                                            />
                                            <Input
                                                placeholder="Email"
                                                type="email"
                                                value={user.email}
                                                onChange={(e) => updateBulkUser(i, 'email', e.target.value)}
                                            />
                                            <Input
                                                placeholder="Password"
                                                type="password"
                                                value={user.password}
                                                onChange={(e) => updateBulkUser(i, 'password', e.target.value)}
                                            />
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" onClick={addBulkRow}>
                                        <Plus className="h-3 w-3 mr-1" />
                                        Add Row
                                    </Button>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
                                    <Button onClick={addBulkUsers} disabled={saving}>
                                        {saving ? 'Creating...' : 'Create Users'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={addOpen} onOpenChange={setAddOpen}>
                            <Button onClick={() => setAddOpen(true)}>
                                <Plus className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Add User</span>
                            </Button>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add User</DialogTitle>
                                    <DialogDescription>
                                        Create a new user account
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Name</Label>
                                        <Input
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            type="email"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Password</Label>
                                        <Input
                                            type="password"
                                            value={newUser.password}
                                            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Role</Label>
                                        <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v ?? '' })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableRoles.map((role) => (
                                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                                    <Button onClick={addUser} disabled={saving}>
                                        {saving ? 'Creating...' : 'Create User'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="rounded-md border">
                    {/* Mobile card view */}
                    <div className="divide-y md:hidden">
                        {users.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <UsersIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                                <p className="text-sm">No users found</p>
                            </div>
                        ) : (
                            users.data.map((user) => (
                                <div key={user.id} className="p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium truncate">{user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setResetOpen(user.id);
                                                    setResetPassword('');
                                                    setResetConfirm('');
                                                }}
                                            >
                                                <KeyRound className="h-3.5 w-3.5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive"
                                                onClick={() => setDeleteId(user.id)}
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        {user.roles.map((role) => (
                                            <Badge key={role.id} variant="outline">
                                                {role.name}
                                            </Badge>
                                        ))}
                                        <span className="text-xs text-muted-foreground ml-auto">{user.created_at}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Desktop table view */}
                    <div className="hidden md:block">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="w-[120px]">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            <UsersIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                                            No users found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.data.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                {user.roles.map((role) => (
                                                    <Badge key={role.id} variant="outline" className="mr-1">
                                                        {role.name}
                                                    </Badge>
                                                ))}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {user.created_at}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setResetOpen(user.id);
                                                            setResetPassword('');
                                                            setResetConfirm('');
                                                        }}
                                                    >
                                                        <KeyRound className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => setDeleteId(user.id)}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                {users.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {users.links.map((link, i) => (
                            <Button
                                key={i}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                disabled={!link.url}
                                onClick={() => {
                                    if (link.url) router.get(link.url, {}, { preserveScroll: true });
                                }}
                            >
                                {sanitizeHtml(link.label)}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            <Dialog open={resetOpen !== null} onOpenChange={(open) => { if (!open) setResetOpen(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>
                            Enter a new password for this user
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>New Password</Label>
                            <Input
                                type="password"
                                value={resetPassword}
                                onChange={(e) => setResetPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirm Password</Label>
                            <Input
                                type="password"
                                value={resetConfirm}
                                onChange={(e) => setResetConfirm(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setResetOpen(null)}>Cancel</Button>
                        <Button onClick={() => resetOpen && handleResetPassword(resetOpen)} disabled={saving}>
                            {saving ? 'Resetting...' : 'Reset Password'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete User</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this user? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                            {saving ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
