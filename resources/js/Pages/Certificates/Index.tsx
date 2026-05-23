import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { sanitizeHtml } from '@/lib/utils';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
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
    Search,
    ExternalLink,
    Download,
    RotateCcw,
    Ban,
    Award,
    CheckCircle2,
    Mail,
    ArrowUpDown,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Label } from '@/Components/ui/label';

interface Certificate {
    id: number;
    name: string;
    email: string;
    certificate_number: string;
    status: string;
    email_status: string;
    certificate_path: string | null;
    created_at: string;
    project: { id: number; name: string };
}

interface PaginatedData {
    data: Certificate[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

interface ProjectOption {
    id: number;
    name: string;
}

export default function Index({
    certificates,
    projects,
    filters,
}: {
    certificates: PaginatedData;
    projects: ProjectOption[];
    filters: { search?: string; project?: string; status?: string; email_status?: string; sort?: string; dir?: string };
}) {
    const f = filters || {};
    const [search, setSearch] = useState(f.search || '');
    const [projectFilter, setProjectFilter] = useState(f.project || '');
    const [statusFilter, setStatusFilter] = useState(f.status || '');
    const [emailFilter, setEmailFilter] = useState(f.email_status || '');
    const [sortField, setSortField] = useState(f.sort || 'created_at');
    const [sortDir, setSortDir] = useState(f.dir || 'desc');

    const [revokeModal, setRevokeModal] = useState<{ open: boolean; cert: Certificate | null }>({ open: false, cert: null });
    const [revokeReason, setRevokeReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function applyFilters(overrides: Record<string, string> = {}) {
        const params: Record<string, string> = {};
        const s = { ...{ search, projectFilter, statusFilter, emailFilter, sortField, sortDir }, ...overrides };
        if (s.search) params.search = s.search;
        if (s.projectFilter) params.project = s.projectFilter;
        if (s.statusFilter) params.status = s.statusFilter;
        if (s.emailFilter) params.email_status = s.emailFilter;
        params.sort = s.sortField;
        params.dir = s.sortDir;

        router.get(route('certificates.index'), params, { preserveState: true, preserveScroll: true });
    }

    function handleSearch(e: React.FormEvent) {
        e.preventDefault();
        applyFilters();
    }

    function toggleSort(field: string) {
        const newDir = sortField === field ? (sortDir === 'asc' ? 'desc' : 'asc') : 'asc';
        const newField = sortField === field ? sortField : field;
        setSortField(newField);
        setSortDir(newDir);
        applyFilters({ sortField: newField, sortDir: newDir });
    }

    function handleRevoke() {
        if (!revokeModal.cert || !revokeReason.trim()) return;
        setSubmitting(true);
        router.post(route('certificates.revoke', revokeModal.cert.id), { reason: revokeReason }, {
            preserveScroll: true,
            onSuccess: () => {
                setRevokeModal({ open: false, cert: null });
                setRevokeReason('');
                setSubmitting(false);
                toast.success('Certificate revoked.');
            },
            onError: () => {
                setSubmitting(false);
                toast.error('Failed to revoke certificate.');
            },
        });
    }

    function handleRegenerate(cert: Certificate) {
        router.post(route('certificates.regenerate', cert.id), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success(`Certificate regenerated for ${cert.name}.`),
            onError: () => toast.error('Failed to regenerate certificate.'),
        });
    }

    const STATUS_BADGE: Record<string, string> = {
        generated: 'bg-blue-500/10 text-blue-600 border-blue-200',
        sent: 'bg-green-500/10 text-green-600 border-green-200',
        revoked: 'bg-red-500/10 text-red-600 border-red-200',
    };

    const EMAIL_STATUS_BADGE: Record<string, string> = {
        pending: 'bg-gray-500/10 text-gray-600 border-gray-200',
        sent: 'bg-green-500/10 text-green-600 border-green-200',
        failed: 'bg-red-500/10 text-red-600 border-red-200',
    };

    function SortIcon(field: string) {
        if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-30" />;
        return <ArrowUpDown className={`h-3 w-3 ml-1 inline ${sortDir === 'asc' ? 'rotate-180' : ''}`} />;
    }

    return (
        <AuthenticatedLayout header="Certificates">
            <Head title="Certificates" />

            <div className="space-y-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">All Certificates</h2>
                    <p className="text-muted-foreground">
                        Manage and monitor all generated certificates.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <form onSubmit={handleSearch} className="relative flex-1 min-w-[200px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or certificate number..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </form>

                    <Select value={projectFilter} onValueChange={v => { setProjectFilter(v ?? ''); applyFilters({ projectFilter: v ?? '' }); }}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="All Projects" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Projects</SelectItem>
                            {projects.map(p => (
                                <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={statusFilter} onValueChange={v => { setStatusFilter(v ?? ''); applyFilters({ statusFilter: v ?? '' }); }}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Status</SelectItem>
                            <SelectItem value="generated">Generated</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="revoked">Revoked</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={emailFilter} onValueChange={v => { setEmailFilter(v ?? ''); applyFilters({ emailFilter: v ?? '' }); }}>
                        <SelectTrigger className="w-[160px]">
                            <SelectValue placeholder="Email Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">All Email</SelectItem>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="sent">Sent</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {certificates.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <Award className="h-12 w-12 text-muted-foreground/40 mb-4" />
                            <p className="text-sm text-muted-foreground font-medium">No certificates found</p>
                            <p className="text-xs text-muted-foreground/60 mt-1">
                                Try adjusting your search or filters.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card>
                        <CardContent className="p-0">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th
                                            className="text-left p-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                                            onClick={() => toggleSort('name')}
                                        >
                                            Name {SortIcon('name')}
                                        </th>
                                        <th
                                            className="text-left p-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                                            onClick={() => toggleSort('certificate_number')}
                                        >
                                            Cert. No. {SortIcon('certificate_number')}
                                        </th>
                                        <th className="text-left p-3 font-medium text-muted-foreground">Project</th>
                                        <th
                                            className="text-left p-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                                            onClick={() => toggleSort('status')}
                                        >
                                            Status {SortIcon('status')}
                                        </th>
                                        <th
                                            className="text-left p-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                                            onClick={() => toggleSort('email_status')}
                                        >
                                            Email {SortIcon('email_status')}
                                        </th>
                                        <th
                                            className="text-left p-3 font-medium text-muted-foreground cursor-pointer hover:text-foreground select-none"
                                            onClick={() => toggleSort('created_at')}
                                        >
                                            Date {SortIcon('created_at')}
                                        </th>
                                        <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {certificates.data.map((cert) => (
                                        <tr key={cert.id} className="border-b last:border-0 hover:bg-muted/30">
                                            <td className="p-3 font-medium">{cert.name}</td>
                                            <td className="p-3 font-mono text-xs">{cert.certificate_number}</td>
                                            <td className="p-3 text-muted-foreground text-xs">{cert.project.name}</td>
                                            <td className="p-3">
                                                <Badge variant="outline" className={STATUS_BADGE[cert.status] || ''}>
                                                    {cert.status === 'generated' && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
                                                    {cert.status === 'sent' && <Mail className="h-3 w-3 mr-1 inline" />}
                                                    {cert.status === 'revoked' && <Ban className="h-3 w-3 mr-1 inline" />}
                                                    {cert.status}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="outline" className={EMAIL_STATUS_BADGE[cert.email_status] || ''}>
                                                    {cert.email_status}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-muted-foreground text-xs">{cert.created_at}</td>
                                            <td className="p-3 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link href={route('certificates.show', cert.id)}>
                                                        <Button variant="ghost" size="icon-sm">
                                                            <ExternalLink className="h-3 w-3" />
                                                        </Button>
                                                    </Link>
                                                    {cert.certificate_path && (
                                                        <a href={`/cert/${cert.certificate_number}?download=1`} target="_blank" download>
                                                            <Button variant="ghost" size="icon-sm">
                                                                <Download className="h-3 w-3" />
                                                            </Button>
                                                        </a>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() => handleRegenerate(cert)}
                                                        disabled={!['pending', 'revoked'].includes(cert.status)}
                                                    >
                                                        <RotateCcw className="h-3 w-3" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => setRevokeModal({ open: true, cert })}
                                                        disabled={!['generated', 'sent'].includes(cert.status)}
                                                    >
                                                        <Ban className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )}

                {certificates.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {certificates.links.map((link, i) => (
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

            <Dialog open={revokeModal.open} onOpenChange={(open) => {
                if (!open) { setRevokeModal({ open: false, cert: null }); setRevokeReason(''); }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Revoke Certificate</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to revoke the certificate for <strong>{revokeModal.cert?.name}</strong>?
                            The certificate will no longer be publicly accessible.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="reason">Reason for Revocation</Label>
                        <textarea
                            id="reason"
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            value={revokeReason}
                            onChange={e => setRevokeReason(e.target.value)}
                            placeholder="e.g. Certificate issued with incorrect data"
                            rows={3}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setRevokeModal({ open: false, cert: null }); setRevokeReason(''); }}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleRevoke} disabled={submitting || !revokeReason.trim()}>
                            {submitting ? 'Revoking...' : 'Revoke Certificate'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
