import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    ArrowLeft,
    Download,
    ExternalLink,
    RotateCcw,
    Ban,
    CheckCircle2,
    Mail,
    AlertTriangle,
    Award,
    Loader2,
    User,
    Hash,
    FolderKanban,
    Calendar,
    FileText,
    Send,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Label } from '@/Components/ui/label';

export default function Show({ certificate }: { certificate: {
    id: number;
    name: string;
    email: string;
    certificate_number: string;
    status: string;
    email_status: string;
    email_sent_at: string | null;
    revoked_at: string | null;
    revoke_reason: string | null;
    created_at: string;
    certificate_path: string | null;
    pdf_url: string | null;
    download_url: string;
    project_name: string;
    project_id: number;
    template_name: string | null;
    org_name: string;
} }) {
    const [revokeOpen, setRevokeOpen] = useState(false);
    const [revokeReason, setRevokeReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const isActive = certificate.status === 'generated' || certificate.status === 'sent';
    const isRevoked = certificate.status === 'revoked';

    function handleRevoke() {
        if (!revokeReason.trim()) return;
        setSubmitting(true);
        router.post(route('certificates.revoke', certificate.id), { reason: revokeReason }, {
            preserveScroll: true,
            onSuccess: () => {
                setRevokeOpen(false);
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

    function handleRegenerate() {
        setSubmitting(true);
        router.post(route('certificates.regenerate', certificate.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setSubmitting(false);
                toast.success('Certificate regenerated.');
            },
            onError: () => {
                setSubmitting(false);
                toast.error('Failed to regenerate certificate.');
            },
        });
    }

    const STATUS_CONFIG: Record<string, { label: string; className: string; icon: any }> = {
        generated: { label: 'Generated', className: 'bg-blue-500/10 text-blue-600 border-blue-200', icon: CheckCircle2 },
        sent: { label: 'Sent', className: 'bg-green-500/10 text-green-600 border-green-200', icon: Mail },
        revoked: { label: 'Revoked', className: 'bg-red-500/10 text-red-600 border-red-200', icon: Ban },
    };

    const StatusIcon = STATUS_CONFIG[certificate.status]?.icon || Award;

    return (
        <AuthenticatedLayout header="Certificate Detail">
            <Head title={`Certificate - ${certificate.name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('certificates.index')}
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Link>
                        <Badge variant="outline" className={STATUS_CONFIG[certificate.status]?.className || ''}>
                            <StatusIcon className="h-3 w-3 mr-1 inline" />
                            {STATUS_CONFIG[certificate.status]?.label || certificate.status}
                        </Badge>
                    </div>

                    {isActive && (
                        <div className="flex items-center gap-2">
                            {certificate.pdf_url && (
                                <a href={certificate.download_url} target="_blank">
                                    <Button variant="outline">
                                        <Download className="h-4 w-4 mr-2" />
                                        Download PDF
                                    </Button>
                                </a>
                            )}
                            <Button
                                variant="destructive"
                                onClick={() => setRevokeOpen(true)}
                            >
                                <Ban className="h-4 w-4 mr-2" />
                                Revoke
                            </Button>
                        </div>
                    )}

                    {isRevoked && (
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={handleRegenerate}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <RotateCcw className="h-4 w-4 mr-2" />
                                )}
                                Regenerate
                            </Button>
                        </div>
                    )}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {isRevoked && (
                        <Card className="md:col-span-2 border-destructive/50 bg-destructive/5">
                            <CardContent className="p-4 flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-medium text-destructive">Certificate Revoked</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        This certificate was revoked on {certificate.revoked_at}.
                                    </p>
                                    {certificate.revoke_reason && (
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Reason: {certificate.revoke_reason}
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Certificate Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-3">
                                <User className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Recipient</p>
                                    <p className="font-medium">{certificate.name}</p>
                                    <p className="text-xs text-muted-foreground">{certificate.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Hash className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Certificate Number</p>
                                    <p className="font-mono font-medium">{certificate.certificate_number}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <FolderKanban className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Project</p>
                                    <Link
                                        href={route('projects.show', certificate.project_id)}
                                        className="font-medium text-primary hover:underline"
                                    >
                                        {certificate.project_name}
                                    </Link>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Template</p>
                                    <p className="font-medium">{certificate.template_name || '-'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Created</p>
                                    <p className="font-medium">{certificate.created_at}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Status & Delivery</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Certificate Status</span>
                                <Badge variant="outline" className={STATUS_CONFIG[certificate.status]?.className || ''}>
                                    <StatusIcon className="h-3 w-3 mr-1 inline" />
                                    {STATUS_CONFIG[certificate.status]?.label || certificate.status}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Email Status</span>
                                <Badge variant="outline" className={
                                    certificate.email_status === 'sent'
                                        ? 'bg-green-500/10 text-green-600 border-green-200'
                                        : certificate.email_status === 'failed'
                                            ? 'bg-red-500/10 text-red-600 border-red-200'
                                            : 'bg-gray-500/10 text-gray-600 border-gray-200'
                                }>
                                    {certificate.email_status === 'sent' && <Mail className="h-3 w-3 mr-1 inline" />}
                                    {certificate.email_status}
                                </Badge>
                            </div>
                            {certificate.email_sent_at && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Email Sent At</span>
                                    <span className="text-sm font-medium">{certificate.email_sent_at}</span>
                                </div>
                            )}
                            {isRevoked && certificate.revoked_at && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">Revoked At</span>
                                    <span className="text-sm font-medium">{certificate.revoked_at}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {certificate.pdf_url && (
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-sm">Certificate Preview</CardTitle>
                            <div className="flex items-center gap-2">
                                <a href={certificate.pdf_url} target="_blank">
                                    <Button variant="outline" size="sm">
                                        <ExternalLink className="h-3 w-3 mr-1" />
                                        Open in Tab
                                    </Button>
                                </a>
                                <a href={certificate.download_url} target="_blank">
                                    <Button variant="outline" size="sm">
                                        <Download className="h-3 w-3 mr-1" />
                                        Download
                                    </Button>
                                </a>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <iframe
                                src={certificate.pdf_url}
                                className="w-full rounded-lg border bg-white"
                                style={{ height: '600px' }}
                                title="Certificate PDF"
                            />
                        </CardContent>
                    </Card>
                )}
            </div>

            <Dialog open={revokeOpen} onOpenChange={(open) => {
                if (!open) { setRevokeOpen(false); setRevokeReason(''); }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Revoke Certificate</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to revoke the certificate for <strong>{certificate.name}</strong>?
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
                        <Button variant="outline" onClick={() => { setRevokeOpen(false); setRevokeReason(''); }}>
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
