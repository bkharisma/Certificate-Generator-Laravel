import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/Components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Users,
    Image,
    Pen,
    BookOpen,
    Upload,
    Plus,
    X,
    FileSpreadsheet,
    Download,
    Edit,
    Mail,
    Send,
    CheckCircle2,
    AlertCircle,
    Zap,
    Play,
    RotateCcw,
    Loader2,
    Eye,
    Ban,
    Camera,
    Image as ImageIcon,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface TemplateElement {
    id: number;
    type: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ProjectSignature {
    id: number;
    template_element_id: number;
    signature_image: string | null;
    signer_name: string;
    signer_title: string;
    sort_order: number;
    template_element: TemplateElement | null;
}

interface ProjectLogo {
    id: number;
    template_element_id: number;
    logo_image: string | null;
    sort_order: number;
    template_element: TemplateElement | null;
}

interface Recipient {
    id: number;
    name: string;
    email: string;
    certificate_number: string;
    certificate_path: string | null;
    status: string;
    email_status: string;
    created_at: string;
}

interface TrainingMaterial {
    id: number;
    title: string;
    description: string | null;
    columns: string[];
    rows: Record<string, string>[];
    background_image: string | null;
}

interface Project {
    id: number;
    name: string;
    template: {
        id: number;
        name: string;
        page_width: number;
        page_height: number;
        orientation: string;
        background_image: string | null;
        elements: TemplateElement[];
    };
    creator: { id: number; name: string };
    title_text: string | null;
    certificate_date: string | null;
    certificate_prefix: string;
    certificate_digit_count: number;
    certificate_next_number: number;
    email_subject: string | null;
    email_body: string | null;
    status: string;
    recipients_count: number;
    signatures: ProjectSignature[];
    logos: ProjectLogo[];
    training_material: TrainingMaterial | null;
    created_at: string;
}

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    active: 'bg-blue-500/10 text-blue-600 border-blue-200',
    completed: 'bg-green-500/10 text-green-600 border-green-200',
};

const TYPE_LABELS: Record<string, string> = {
    title: 'Title',
    recipient_name: 'Recipient Name',
    date: 'Date',
    certificate_number: 'Certificate No.',
    qr_code: 'QR Code',
    signature: 'Signature',
    logo: 'Logo',
};

export default function Show({
    project,
    recipients,
}: {
    project: Project;
    recipients: { data: Recipient[]; current_page: number; last_page: number; total: number; links: { url: string | null; label: string; active: boolean }[] };
}) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [signatureModal, setSignatureModal] = useState<{
        open: boolean;
        elementId: number | null;
        existing?: ProjectSignature | null;
    }>({ open: false, elementId: null });
    const [logoModal, setLogoModal] = useState<{
        open: boolean;
        elementId: number | null;
        existing?: ProjectLogo | null;
    }>({ open: false, elementId: null });

    const [signatureFile, setSignatureFile] = useState<File | null>(null);
    const [signerName, setSignerName] = useState('');
    const [signerTitle, setSignerTitle] = useState('');
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [recipientModal, setRecipientModal] = useState<{
        open: boolean;
        editing?: Recipient | null;
    }>({ open: false });
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [recipientName, setRecipientName] = useState('');
    const [recipientEmail, setRecipientEmail] = useState('');
    const [importFile, setImportFile] = useState<File | null>(null);

    const sigFileRef = useRef<HTMLInputElement>(null);
    const logoFileRef = useRef<HTMLInputElement>(null);
    const importFileRef = useRef<HTMLInputElement>(null);

    const [generating, setGenerating] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [regeneratingAll, setRegeneratingAll] = useState(false);

    const [revokeModal, setRevokeModal] = useState<{ open: boolean; recipient: Recipient | null }>({ open: false, recipient: null });
    const [revokeReason, setRevokeReason] = useState('');
    const [revoking, setRevoking] = useState(false);

    const [revokeAllOpen, setRevokeAllOpen] = useState(false);
    const [revokeAllReason, setRevokeAllReason] = useState('');
    const [revokingAll, setRevokingAll] = useState(false);

    const [editingMaterials, setEditingMaterials] = useState(false);
    const [materialTitle, setMaterialTitle] = useState('');
    const [materialDescription, setMaterialDescription] = useState('');
    const [materialColumns, setMaterialColumns] = useState<string[]>([]);
    const [materialRows, setMaterialRows] = useState<Record<string, string>[]>([]);
    const [newColumnName, setNewColumnName] = useState('');
    const [backgroundImage, setBackgroundImage] = useState<File | null>(null);
    const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
    const bgFileRef = useRef<HTMLInputElement>(null);

    function openSignatureModal(elementId: number, existing?: ProjectSignature) {
        setSignatureModal({ open: true, elementId, existing: existing ?? null });
        setSignatureFile(null);
        setSignerName(existing?.signer_name ?? '');
        setSignerTitle(existing?.signer_title ?? '');
    }

    function openLogoModal(elementId: number, existing?: ProjectLogo) {
        setLogoModal({ open: true, elementId, existing: existing ?? null });
        setLogoFile(null);
    }

    function handleSignatureSubmit() {
        if (!signatureModal.elementId) return;
        setSubmitting(true);
        const formData = new FormData();
        if (signatureFile) formData.append('signature', signatureFile);
        formData.append('template_element_id', String(signatureModal.elementId));
        formData.append('signer_name', signerName);
        formData.append('signer_title', signerTitle);

        const isUpdate = !!signatureModal.existing;
        const url = isUpdate
            ? route('projects.signatures.update', [project.id, signatureModal.existing!.id])
            : route('projects.signatures.store', project.id);

        if (isUpdate) {
            formData.append('_method', 'PUT');
        }

        router.post(url, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setSignatureModal({ open: false, elementId: null, existing: null });
                setSubmitting(false);
                setSignatureFile(null);
                toast.success(isUpdate ? 'Signature updated.' : 'Signature assigned.');
            },
            onError: () => {
                setSubmitting(false);
                toast.error('Failed to save signature.');
            },
        });
    }

    function handleLogoSubmit() {
        if (!logoModal.elementId || !logoFile) return;
        setSubmitting(true);
        const formData = new FormData();
        formData.append('logo', logoFile);
        formData.append('template_element_id', String(logoModal.elementId));

        const isUpdate = !!logoModal.existing;
        const url = isUpdate
            ? route('projects.logos.update', [project.id, logoModal.existing!.id])
            : route('projects.logos.store', project.id);

        if (isUpdate) {
            formData.append('_method', 'PUT');
        }

        router.post(url, formData, {
            preserveScroll: true,
            onSuccess: () => {
                setLogoModal({ open: false, elementId: null, existing: null });
                setSubmitting(false);
                setLogoFile(null);
                toast.success(isUpdate ? 'Logo updated.' : 'Logo uploaded.');
            },
            onError: () => {
                setSubmitting(false);
                toast.error('Failed to upload logo.');
            },
        });
    }

    function handleDeleteSignature(sig: ProjectSignature) {
        if (!confirm('Remove this signature?')) return;
        router.delete(route('projects.signatures.destroy', [project.id, sig.id]), {
            preserveScroll: true,
            onSuccess: () => toast.success('Signature removed.'),
        });
    }

    function handleDeleteLogo(logo: ProjectLogo) {
        if (!confirm('Remove this logo?')) return;
        router.delete(route('projects.logos.destroy', [project.id, logo.id]), {
            preserveScroll: true,
            onSuccess: () => toast.success('Logo removed.'),
        });
    }

    function openRecipientModal(recipient?: Recipient) {
        setRecipientModal({ open: true, editing: recipient ?? null });
        setRecipientName(recipient?.name ?? '');
        setRecipientEmail(recipient?.email ?? '');
    }

    function handleRecipientSubmit() {
        setSubmitting(true);
        const isUpdate = !!recipientModal.editing;

        if (isUpdate) {
            router.put(
                route('projects.recipients.update', [project.id, recipientModal.editing!.id]),
                { name: recipientName, email: recipientEmail },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setRecipientModal({ open: false, editing: null });
                        setSubmitting(false);
                        setRecipientName('');
                        setRecipientEmail('');
                        toast.success('Recipient updated.');
                    },
                    onError: () => {
                        setSubmitting(false);
                        toast.error('Failed to update recipient.');
                    },
                }
            );
        } else {
            router.post(
                route('projects.recipients.store', project.id),
                { name: recipientName, email: recipientEmail },
                {
                    preserveScroll: true,
                    onSuccess: () => {
                        setRecipientModal({ open: false, editing: null });
                        setSubmitting(false);
                        setRecipientName('');
                        setRecipientEmail('');
                        toast.success('Recipient added.');
                    },
                    onError: () => {
                        setSubmitting(false);
                        toast.error('Failed to add recipient.');
                    },
                }
            );
        }
    }

    function handleImportSubmit() {
        if (!importFile) return;
        setSubmitting(true);
        const formData = new FormData();
        formData.append('file', importFile);

        router.post(route('projects.recipients.import', project.id), formData, {
            preserveScroll: true,
            onSuccess: () => {
                setImportModalOpen(false);
                setSubmitting(false);
                setImportFile(null);
                toast.success('Import completed.');
            },
            onError: () => {
                setSubmitting(false);
                toast.error('Import failed.');
            },
        });
    }

    function handleDeleteRecipient(recipient: Recipient) {
        if (!confirm(`Delete recipient "${recipient.name}"?`)) return;
        router.delete(route('projects.recipients.destroy', [project.id, recipient.id]), {
            preserveScroll: true,
            onSuccess: () => toast.success('Recipient deleted.'),
            onError: () => toast.error('Failed to delete recipient.'),
        });
    }

    function startEditMaterials() {
        const tm = project.training_material;
        setMaterialTitle(tm?.title ?? '');
        setMaterialDescription(tm?.description ?? '');
        setMaterialColumns(tm?.columns ?? []);
        setMaterialRows(tm?.rows ?? []);
        setBackgroundImage(null);
        setBackgroundPreview(tm?.background_image ? `/storage/${tm.background_image}` : null);
        setEditingMaterials(true);
    }

    function cancelEditMaterials() {
        setEditingMaterials(false);
        setNewColumnName('');
        setBackgroundImage(null);
        setBackgroundPreview(null);
    }

    function addColumn() {
        const name = newColumnName.trim();
        if (!name) return;
        if (materialColumns.includes(name)) {
            toast.error('Column already exists.');
            return;
        }
        setMaterialColumns([...materialColumns, name]);
        setMaterialRows(materialRows.map(r => ({ ...r, [name]: '' })));
        setNewColumnName('');
    }

    function removeColumn(index: number) {
        const col = materialColumns[index];
        setMaterialColumns(materialColumns.filter((_, i) => i !== index));
        setMaterialRows(materialRows.map(r => {
            const { [col]: _, ...rest } = r;
            return rest;
        }));
    }

    function addRow() {
        const row: Record<string, string> = {};
        materialColumns.forEach(col => { row[col] = ''; });
        setMaterialRows([...materialRows, row]);
    }

    function removeRow(index: number) {
        setMaterialRows(materialRows.filter((_, i) => i !== index));
    }

    function updateCell(rowIndex: number, col: string, value: string) {
        setMaterialRows(materialRows.map((r, i) =>
            i === rowIndex ? { ...r, [col]: value } : r
        ));
    }

    function handleSaveMaterials() {
        if (!materialTitle.trim()) {
            toast.error('Title is required.');
            return;
        }
        if (materialColumns.length === 0) {
            toast.error('At least one column is required.');
            return;
        }
        if (materialRows.some(r => materialColumns.some(col => !r[col]?.trim()))) {
            toast.error('All cells must be filled.');
            return;
        }
        setSubmitting(true);
        const formData = new FormData();
        formData.append('title', materialTitle);
        formData.append('description', materialDescription);
        formData.append('columns', JSON.stringify(materialColumns));
        formData.append('rows', JSON.stringify(materialRows));
        if (backgroundImage) {
            formData.append('background_image', backgroundImage);
        }

        router.post(route('projects.training-material.store', project.id), formData, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                setEditingMaterials(false);
                setSubmitting(false);
                setNewColumnName('');
                setBackgroundImage(null);
                setBackgroundPreview(null);
                toast.success('Training materials saved.');
            },
            onError: () => {
                setSubmitting(false);
                toast.error('Failed to save training materials.');
            },
        });
    }

    function handleDeleteMaterials() {
        if (!confirm('Remove all training materials?')) return;
        router.delete(route('projects.training-material.destroy', project.id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Training materials removed.'),
        });
    }

    function handleBackgroundImageChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.match(/^image\/(png|jpe?g)$/)) {
            toast.error('Only PNG and JPG images are allowed.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image size must be less than 10MB.');
            return;
        }
        setBackgroundImage(file);
        const reader = new FileReader();
        reader.onload = () => setBackgroundPreview(reader.result as string);
        reader.readAsDataURL(file);
    }

    function removeBackgroundImage() {
        setBackgroundImage(null);
        setBackgroundPreview(null);
        if (bgFileRef.current) bgFileRef.current.value = '';
    }

    function handleSendEmail(recipientId: number, recipientName: string) {
        setSendingEmail(true);
        router.post(route('projects.send-email', [project.id, recipientId]), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setSendingEmail(false);
                toast.success(`Email queued for ${recipientName}.`);
            },
            onError: () => {
                setSendingEmail(false);
                toast.error('Failed to queue email.');
            },
        });
    }

    function handleSendAllEmails() {
        setSendingEmail(true);
        router.post(route('projects.send-all', project.id), {}, {
            preserveScroll: true,
            onSuccess: () => {
                setSendingEmail(false);
                toast.success('Emails queued for delivery.');
            },
            onError: () => {
                setSendingEmail(false);
                toast.error('Failed to queue emails.');
            },
        });
    }

    function handleRevoke() {
        if (!revokeModal.recipient || !revokeReason.trim()) return;
        setRevoking(true);
        router.post(route('projects.revoke', [project.id, revokeModal.recipient.id]), {
            reason: revokeReason,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setRevokeModal({ open: false, recipient: null });
                setRevokeReason('');
                setRevoking(false);
                toast.success('Certificate revoked.');
            },
            onError: () => {
                setRevoking(false);
                toast.error('Failed to revoke certificate.');
            },
        });
    }

    function handleRevokeAll() {
        if (!revokeAllReason.trim()) return;
        setRevokingAll(true);
        router.post(route('projects.revoke-all', project.id), {
            reason: revokeAllReason,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setRevokeAllOpen(false);
                setRevokeAllReason('');
                setRevokingAll(false);
                toast.success('All certificates revoked.');
            },
            onError: () => {
                setRevokingAll(false);
                toast.error('Failed to revoke certificates.');
            },
        });
    }

    const STATUS_BADGE: Record<string, string> = {
        pending: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
        generated: 'bg-blue-500/10 text-blue-600 border-blue-200',
        sent: 'bg-green-500/10 text-green-600 border-green-200',
        revoked: 'bg-red-500/10 text-red-600 border-red-200',
    };

    const EMAIL_STATUS_BADGE: Record<string, string> = {
        pending: 'bg-gray-500/10 text-gray-600 border-gray-200',
        sent: 'bg-green-500/10 text-green-600 border-green-200',
        failed: 'bg-red-500/10 text-red-600 border-red-200',
    };

    function handleDelete() {
        setDeleting(true);
        router.delete(route('projects.destroy', project.id), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteOpen(false);
                setDeleting(false);
            },
            onError: () => setDeleting(false),
        });
    }

    const signatureElements = project.template.elements.filter((e) => e.type === 'signature');
    const logoElements = project.template.elements.filter((e) => e.type === 'logo');

    return (
        <AuthenticatedLayout header={project.name}>
            <Head title={project.name} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('projects.index')}
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Link>
                        <Badge className={STATUS_COLORS[project.status]} variant="outline">
                            {project.status}
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={route('projects.edit', project.id)}>
                            <Button variant="outline">
                                <Pencil className="h-4 w-4" />
                                Edit
                            </Button>
                        </Link>
                        <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="overview" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="signatures">
                            <Pen className="h-4 w-4" />
                            Signatures
                            {project.signatures.length > 0 && (
                                <span className="ml-1 text-xs">({project.signatures.length})</span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="logos">
                            <Image className="h-4 w-4" />
                            Logos
                            {project.logos.length > 0 && (
                                <span className="ml-1 text-xs">({project.logos.length})</span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="recipients">
                            <Users className="h-4 w-4" />
                            Recipients
                            {project.recipients_count > 0 && (
                                <span className="ml-1 text-xs">({project.recipients_count})</span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="materials">
                            <BookOpen className="h-4 w-4" />
                            Materials
                            {project.training_material && <span className="ml-1 text-xs">(1)</span>}
                        </TabsTrigger>
                        <TabsTrigger value="generate">
                            <Zap className="h-4 w-4" />
                            Generate
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4">
                        <Card>
                            <CardContent className="p-6 grid gap-6 md:grid-cols-2">
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-sm">Project Info</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Template</span>
                                            <span className="font-medium">{project.template.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Title</span>
                                            <span className="font-medium">{project.title_text || '(not set)'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Date</span>
                                            <span className="font-medium">{project.certificate_date || '(today)'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Created by</span>
                                            <span className="font-medium">{project.creator.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Recipients</span>
                                            <span className="font-medium">{project.recipients_count}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h3 className="font-semibold text-sm">Certificate Config</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Number Format</span>
                                            <span className="font-medium font-mono">
                                                {project.certificate_prefix}/{String(project.certificate_next_number).padStart(project.certificate_digit_count, '0')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Next Number</span>
                                            <span className="font-medium">{project.certificate_next_number}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Email</span>
                                            <span className="font-medium">{project.email_subject ? 'Configured' : 'Not configured'}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {project.template.background_image && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm">Template Preview</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4">
                                    <div
                                        className="relative mx-auto overflow-hidden rounded-lg border bg-white shadow-sm"
                                        style={{
                                            aspectRatio: `${project.template.page_width} / ${project.template.page_height}`,
                                            maxWidth: '100%',
                                            maxHeight: '400px',
                                        }}
                                    >
                                        <img
                                            src={`/storage/${project.template.background_image}`}
                                            alt={project.template.name}
                                            className="h-full w-full object-contain"
                                        />
                                        {project.template.elements.map((el) => (
                                            <div
                                                key={el.id}
                                                className="absolute border border-dashed border-blue-400/50 rounded"
                                                style={{
                                                    left: `${(el.x / project.template.page_width) * 100}%`,
                                                    top: `${(el.y / project.template.page_height) * 100}%`,
                                                    width: `${(el.width / project.template.page_width) * 100}%`,
                                                    height: `${(el.height / project.template.page_height) * 100}%`,
                                                }}
                                            >
                                                <span className="absolute -top-4 left-0 text-[9px] text-blue-500 font-medium whitespace-nowrap">
                                                    {TYPE_LABELS[el.type] || el.type}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="signatures" className="space-y-4">
                        {signatureElements.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Pen className="h-10 w-10 text-muted-foreground/50 mb-3" />
                                    <p className="text-sm text-muted-foreground">No signature areas defined in template</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {signatureElements.map((el) => {
                                    const sig = project.signatures.find((s) => s.template_element_id === el.id);
                                    return (
                                        <Card key={el.id}>
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">{el.label}</span>
                                                    <Badge variant={sig ? 'default' : 'outline'}>
                                                        {sig ? 'Assigned' : 'Empty'}
                                                    </Badge>
                                                </div>
                                                {sig ? (
                                                    <div className="space-y-3">
                                                        {sig.signature_image && (
                                                            <img
                                                                src={`/storage/${sig.signature_image}`}
                                                                alt={sig.signer_name}
                                                                className="max-h-14 object-contain border rounded p-1 bg-white"
                                                            />
                                                        )}
                                                        <div className="space-y-0.5 text-sm">
                                                            <p className="font-medium">{sig.signer_name}</p>
                                                            <p className="text-muted-foreground text-xs">{sig.signer_title}</p>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openSignatureModal(el.id, sig)}
                                                            >
                                                                <Upload className="h-3 w-3" />
                                                                Replace
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleDeleteSignature(sig)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <p className="text-xs text-muted-foreground">
                                                            No signature assigned yet
                                                        </p>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openSignatureModal(el.id)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            Assign
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        <Dialog
                            open={signatureModal.open}
                            onOpenChange={(open) => {
                                if (!open) setSignatureModal({ open: false, elementId: null });
                            }}
                        >
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {signatureModal.existing ? 'Replace Signature' : 'Assign Signature'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Upload signature image and enter signer details.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Signature Image</Label>
                                        <div
                                            className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => sigFileRef.current?.click()}
                                        >
                                            {signatureFile ? (
                                                <div className="relative">
                                                    <img
                                                        src={URL.createObjectURL(signatureFile)}
                                                        alt="Preview"
                                                        className="max-h-24 object-contain"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-0.5"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSignatureFile(null);
                                                        }}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ) : signatureModal.existing?.signature_image ? (
                                                <img
                                                    src={`/storage/${signatureModal.existing.signature_image}`}
                                                    alt="Current"
                                                    className="max-h-24 object-contain"
                                                />
                                            ) : (
                                                <div className="text-center">
                                                    <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                                                    <p className="text-sm text-muted-foreground">
                                                        Click to upload signature image
                                                    </p>
                                                    <p className="text-xs text-muted-foreground/60 mt-1">
                                                        PNG or JPG, max 2MB
                                                    </p>
                                                </div>
                                            )}
                                            <input
                                                ref={sigFileRef}
                                                type="file"
                                                accept="image/png,image/jpeg"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) setSignatureFile(file);
                                                }}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signer_name">Signer Name</Label>
                                        <Input
                                            id="signer_name"
                                            value={signerName}
                                            onChange={(e) => setSignerName(e.target.value)}
                                            placeholder="e.g. Dr. John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="signer_title">Signer Title</Label>
                                        <Input
                                            id="signer_title"
                                            value={signerTitle}
                                            onChange={(e) => setSignerTitle(e.target.value)}
                                            placeholder="e.g. Head of Training"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setSignatureModal({ open: false, elementId: null })}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleSignatureSubmit}
                                        disabled={submitting || !signerName || !signerTitle || (!signatureFile && !signatureModal.existing)}
                                    >
                                        {submitting ? 'Saving...' : signatureModal.existing ? 'Update' : 'Assign'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </TabsContent>

                    <TabsContent value="logos" className="space-y-4">
                        {logoElements.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Image className="h-10 w-10 text-muted-foreground/50 mb-3" />
                                    <p className="text-sm text-muted-foreground">No logo areas defined in template</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {logoElements.map((el) => {
                                    const logo = project.logos.find((l) => l.template_element_id === el.id);
                                    return (
                                        <Card key={el.id}>
                                            <CardContent className="p-4 space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">{el.label}</span>
                                                    <Badge variant={logo ? 'default' : 'outline'}>
                                                        {logo ? 'Uploaded' : 'Empty'}
                                                    </Badge>
                                                </div>
                                                {logo && logo.logo_image ? (
                                                    <div className="space-y-3">
                                                        <img
                                                            src={`/storage/${logo.logo_image}`}
                                                            alt="Logo"
                                                            className="max-h-16 object-contain border rounded p-1 bg-white"
                                                        />
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => openLogoModal(el.id, logo)}
                                                            >
                                                                <Upload className="h-3 w-3" />
                                                                Replace
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleDeleteLogo(logo)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                                Remove
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-3">
                                                        <p className="text-xs text-muted-foreground">
                                                            No logo uploaded yet
                                                        </p>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openLogoModal(el.id)}
                                                        >
                                                            <Plus className="h-3 w-3" />
                                                            Upload
                                                        </Button>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}

                        <Dialog
                            open={logoModal.open}
                            onOpenChange={(open) => {
                                if (!open) setLogoModal({ open: false, elementId: null });
                            }}
                        >
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {logoModal.existing ? 'Replace Logo' : 'Upload Logo'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        Upload a logo image for this area.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Logo Image</Label>
                                        <div
                                            className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => logoFileRef.current?.click()}
                                        >
                                            {logoFile ? (
                                                <div className="relative">
                                                    <img
                                                        src={URL.createObjectURL(logoFile)}
                                                        alt="Preview"
                                                        className="max-h-24 object-contain"
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute -top-2 -right-2 rounded-full bg-destructive text-destructive-foreground p-0.5"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setLogoFile(null);
                                                        }}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ) : logoModal.existing?.logo_image ? (
                                                <img
                                                    src={`/storage/${logoModal.existing.logo_image}`}
                                                    alt="Current"
                                                    className="max-h-24 object-contain"
                                                />
                                            ) : (
                                                <div className="text-center">
                                                    <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                                                    <p className="text-sm text-muted-foreground">
                                                        Click to upload logo image
                                                    </p>
                                                    <p className="text-xs text-muted-foreground/60 mt-1">
                                                        PNG or JPG, max 2MB
                                                    </p>
                                                </div>
                                            )}
                                            <input
                                                ref={logoFileRef}
                                                type="file"
                                                accept="image/png,image/jpeg"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) setLogoFile(file);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setLogoModal({ open: false, elementId: null })}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleLogoSubmit}
                                        disabled={submitting || (!logoFile && !logoModal.existing)}
                                    >
                                        {submitting ? 'Saving...' : logoModal.existing ? 'Update' : 'Upload'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </TabsContent>

                    <TabsContent value="recipients" className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-muted-foreground">
                                {project.recipients_count} recipient(s) total
                            </p>
                            <div className="flex items-center gap-2">
                                <Button variant="outline" size="sm" onClick={() => window.open(route('recipients.template'), '_blank')}>
                                    <Download className="h-3 w-3" />
                                    Template
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setImportModalOpen(true)}>
                                    <FileSpreadsheet className="h-3 w-3" />
                                    Import Excel
                                </Button>
                                <Button size="sm" onClick={() => openRecipientModal()}>
                                    <Plus className="h-3 w-3" />
                                    Add Recipient
                                </Button>
                            </div>
                        </div>

                        {recipients.data.length === 0 ? (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
                                    <p className="text-sm text-muted-foreground">No recipients yet</p>
                                    <p className="text-xs text-muted-foreground/70">
                                        Add recipients manually or import from Excel
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <Card>
                                <CardContent className="p-0">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                                                <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                                                <th className="text-left p-3 font-medium text-muted-foreground">Cert. No.</th>
                                                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                                <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                                                <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recipients.data.map((r) => (
                                                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                                                    <td className="p-3 font-medium">{r.name}</td>
                                                    <td className="p-3 text-muted-foreground">{r.email}</td>
                                                    <td className="p-3 font-mono text-xs">{r.certificate_number}</td>
                                                    <td className="p-3">
                                                        <Badge variant="outline" className={STATUS_BADGE[r.status] || ''}>
                                                            {r.status === 'pending' && <AlertCircle className="h-3 w-3 mr-1 inline" />}
                                                            {r.status === 'generated' && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
                                                            {r.status === 'sent' && <Mail className="h-3 w-3 mr-1 inline" />}
                                                            {r.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3">
                                                        <Badge variant="outline" className={EMAIL_STATUS_BADGE[r.email_status] || ''}>
                                                            {r.email_status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        {['pending', 'revoked'].includes(r.status) && (
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                    onClick={() => openRecipientModal(r)}
                                                                >
                                                                    <Edit className="h-3 w-3" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon-sm"
                                                                    onClick={() => handleDeleteRecipient(r)}
                                                                    className="text-destructive hover:text-destructive"
                                                                >
                                                                    <Trash2 className="h-3 w-3" />
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        )}

                        {recipients.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                {recipients.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => {
                                            if (link.url) router.get(link.url, {}, { preserveScroll: true });
                                        }}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}

                        <Dialog
                            open={recipientModal.open}
                            onOpenChange={(open) => {
                                if (!open) setRecipientModal({ open: false, editing: null });
                            }}
                        >
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>
                                        {recipientModal.editing ? 'Edit Recipient' : 'Add Recipient'}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {recipientModal.editing
                                            ? 'Update recipient name and email.'
                                            : 'Enter recipient name and email. Certificate number will be auto-assigned.'}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="recipient_name">Name</Label>
                                        <Input
                                            id="recipient_name"
                                            value={recipientName}
                                            onChange={(e) => setRecipientName(e.target.value)}
                                            placeholder="e.g. John Doe"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="recipient_email">Email</Label>
                                        <Input
                                            id="recipient_email"
                                            type="email"
                                            value={recipientEmail}
                                            onChange={(e) => setRecipientEmail(e.target.value)}
                                            placeholder="e.g. john@example.com"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setRecipientModal({ open: false, editing: null })}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleRecipientSubmit}
                                        disabled={submitting || !recipientName || !recipientEmail}
                                    >
                                        {submitting
                                            ? 'Saving...'
                                            : recipientModal.editing
                                                ? 'Update'
                                                : 'Add Recipient'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Import Recipients from Excel</DialogTitle>
                                    <DialogDescription>
                                        Upload an Excel file (.xlsx) with columns "name" and "email".
                                        Download the template for the correct format.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => window.open(route('recipients.template'), '_blank')}>
                                        <Download className="h-3 w-3" />
                                        Download Template
                                    </Button>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Excel File</Label>
                                        <div
                                            className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                                            onClick={() => importFileRef.current?.click()}
                                        >
                                            {importFile ? (
                                                <div className="flex items-center gap-2 text-sm">
                                                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                                    <span className="font-medium">{importFile.name}</span>
                                                    <button
                                                        type="button"
                                                        className="ml-2 text-destructive hover:text-destructive/80"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setImportFile(null);
                                                        }}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-center">
                                                    <FileSpreadsheet className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                                                    <p className="text-sm text-muted-foreground">
                                                        Click to upload Excel file
                                                    </p>
                                                    <p className="text-xs text-muted-foreground/60 mt-1">
                                                        .xlsx or .csv, max 5MB
                                                    </p>
                                                </div>
                                            )}
                                            <input
                                                ref={importFileRef}
                                                type="file"
                                                accept=".xlsx,.xls,.csv"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) setImportFile(file);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setImportModalOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleImportSubmit}
                                        disabled={submitting || !importFile}
                                    >
                                        {submitting ? 'Importing...' : 'Import'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </TabsContent>

                    <TabsContent value="materials" className="space-y-4">
                        {!editingMaterials ? (
                            (() => {
                                const tm = project.training_material;
                                return !tm ? (
                                    <Card>
                                        <CardContent className="flex flex-col items-center justify-center py-12">
                                            <BookOpen className="h-10 w-10 text-muted-foreground/50 mb-3" />
                                            <p className="text-sm text-muted-foreground mb-4">No training materials yet</p>
                                            <Button onClick={startEditMaterials}>
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add Training Materials
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Card>
                                        <CardHeader className="flex flex-row items-center justify-between">
                                            <CardTitle>Training Materials</CardTitle>
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm" onClick={startEditMaterials}>
                                                    <Pencil className="h-4 w-4 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button variant="destructive" size="sm" onClick={handleDeleteMaterials}>
                                                    <Trash2 className="h-4 w-4 mr-1" />
                                                    Delete
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div>
                                                <h3 className="font-semibold">{tm.title}</h3>
                                                {tm.description && (
                                                    <p className="text-sm text-muted-foreground mt-1">{tm.description}</p>
                                                )}
                                            </div>
                                            {tm.background_image && (
                                                <div className="space-y-2">
                                                    <Label className="text-sm text-muted-foreground">Background Image</Label>
                                                    <div className="relative w-full max-w-md border rounded-lg overflow-hidden">
                                                        <img
                                                            src={`/storage/${tm.background_image}`}
                                                            alt="Training material background"
                                                            className="w-full h-auto object-contain bg-gray-100"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                            {tm.columns.length > 0 && (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm border">
                                                        <thead>
                                                            <tr className="bg-muted/50">
                                                                {tm.columns.map((col, i) => (
                                                                    <th key={i} className="text-left p-2 font-medium border">{col}</th>
                                                                ))}
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {tm.rows.map((row, i) => (
                                                                <tr key={i} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                                                                    {tm.columns.map((col, j) => (
                                                                        <td key={j} className="p-2 border">{row[col] || ''}</td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })()
                        ) : (
                            <Card>
                                <CardHeader>
                                    <CardTitle>{project.training_material ? 'Edit' : 'Add'} Training Materials</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="material-title">Title</Label>
                                        <Input
                                            id="material-title"
                                            value={materialTitle}
                                            onChange={e => setMaterialTitle(e.target.value)}
                                            placeholder="e.g., First Aid Training"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="material-desc">Description (optional)</Label>
                                        <Textarea
                                            id="material-desc"
                                            value={materialDescription}
                                            onChange={e => setMaterialDescription(e.target.value)}
                                            placeholder="Brief description of the training material"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <Label>Background Image (optional)</Label>
                                        <div className="flex items-start gap-4">
                                            <div className="flex-1">
                                                <input
                                                    ref={bgFileRef}
                                                    type="file"
                                                    accept=".png,.jpg,.jpeg"
                                                    onChange={handleBackgroundImageChange}
                                                    className="hidden"
                                                    id="material-background"
                                                />
                                                <Label
                                                    htmlFor="material-background"
                                                    className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary transition-colors"
                                                >
                                                    <div className="flex flex-col items-center gap-1">
                                                        <Camera className="h-6 w-6 text-muted-foreground" />
                                                        <span className="text-sm text-muted-foreground">
                                                            {backgroundImage ? backgroundImage.name : 'Upload PNG or JPG'}
                                                        </span>
                                                    </div>
                                                </Label>
                                                <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
                                            </div>
                                            {backgroundPreview && (
                                                <div className="relative">
                                                    <div className="w-32 h-20 border rounded-lg overflow-hidden bg-gray-100">
                                                        <img
                                                            src={backgroundPreview}
                                                            alt="Background preview"
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-6 w-6 absolute -top-2 -right-2 rounded-full"
                                                        onClick={removeBackgroundImage}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2">
                                            <Label className="whitespace-nowrap">Columns</Label>
                                            <Input
                                                value={newColumnName}
                                                onChange={e => setNewColumnName(e.target.value)}
                                                placeholder="Column name"
                                                className="max-w-[200px]"
                                                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addColumn(); } }}
                                            />
                                            <Button type="button" variant="outline" size="sm" onClick={addColumn}>
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add
                                            </Button>
                                        </div>
                                        {materialColumns.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {materialColumns.map((col, i) => (
                                                    <Badge key={i} variant="secondary" className="gap-1 px-3 py-1.5">
                                                        {col}
                                                        <button
                                                            onClick={() => removeColumn(i)}
                                                            className="ml-1 hover:text-destructive"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Label>Rows ({materialRows.length})</Label>
                                            <Button type="button" variant="outline" size="sm" onClick={addRow}>
                                                <Plus className="h-4 w-4 mr-1" />
                                                Add Row
                                            </Button>
                                        </div>
                                        {materialColumns.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">Add at least one column first</p>
                                        ) : materialRows.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">No rows yet. Click "Add Row" to start adding data.</p>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm border">
                                                    <thead>
                                                        <tr className="bg-muted/50">
                                                            {materialColumns.map((col, i) => (
                                                                <th key={i} className="text-left p-2 font-medium border">{col}</th>
                                                            ))}
                                                            <th className="w-10 border"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {materialRows.map((row, ri) => (
                                                            <tr key={ri}>
                                                                {materialColumns.map((col, ci) => (
                                                                    <td key={ci} className="p-1 border">
                                                                        <Input
                                                                            value={row[col] ?? ''}
                                                                            onChange={e => updateCell(ri, col, e.target.value)}
                                                                            className="h-8 border-0 shadow-none focus-visible:ring-1"
                                                                            placeholder="..."
                                                                        />
                                                                    </td>
                                                                ))}
                                                                <td className="p-1 border w-10">
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8 text-destructive"
                                                                        onClick={() => removeRow(ri)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </Button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={cancelEditMaterials}>
                                            Cancel
                                        </Button>
                                        <Button type="button" onClick={handleSaveMaterials} disabled={submitting}>
                                            {submitting ? 'Saving...' : 'Save'}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    <TabsContent value="generate" className="space-y-4">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="font-semibold">Certificate Generation</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Generate PDF certificates and send emails to recipients.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                            {recipients.data.filter(r => r.status === 'pending').length} pending
                                        </Badge>
                                        <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-200">
                                            {recipients.data.filter(r => r.status === 'generated' || r.status === 'sent').length} generated
                                        </Badge>
                                        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-200">
                                            {recipients.data.filter(r => r.email_status === 'pending' && (r.status === 'generated' || r.status === 'sent')).length} pending email
                                        </Badge>
                                        <Link href={route('templates.designer', project.template.id)}>
                                            <Button variant="outline" size="sm">
                                                <Pencil className="h-3 w-3 mr-1" />
                                                Edit Template
                                            </Button>
                                        </Link>
                                        {recipients.data.some(r => r.status === 'generated' || r.status === 'sent' || r.status === 'revoked') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={regeneratingAll}
                                                onClick={() => {
                                                    setRegeneratingAll(true);
                                                    router.post(route('projects.regenerate-all', project.id), {}, {
                                                        preserveScroll: true,
                                                        onSuccess: () => {
                                                            setRegeneratingAll(false);
                                                            toast.success('All certificates regenerated.');
                                                        },
                                                        onError: () => {
                                                            setRegeneratingAll(false);
                                                            toast.error('Failed to regenerate all certificates.');
                                                        },
                                                    });
                                                }}
                                            >
                                                {regeneratingAll ? (
                                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                ) : (
                                                    <RotateCcw className="h-3 w-3 mr-1" />
                                                )}
                                                Regenerate All
                                            </Button>
                                        )}
                                        {recipients.data.some(r => r.status === 'generated' || r.status === 'sent') && (
                                            <a href={route('projects.download-zip', project.id)}>
                                                <Button variant="outline" size="sm">
                                                    <Download className="h-3 w-3 mr-1" />
                                                    Download All
                                                </Button>
                                            </a>
                                        )}
                                        {recipients.data.some(r => r.status === 'generated' || r.status === 'sent') && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
                                                onClick={() => {
                                                    setRevokeAllOpen(true);
                                                    setRevokeAllReason('');
                                                }}
                                            >
                                                <Ban className="h-3 w-3 mr-1" />
                                                Revoke All
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {recipients.data.filter(r => r.status === 'pending').length > 0 && (
                            <Card>
                                <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                                    <Zap className="h-12 w-12 text-primary/60" />
                                    <div className="text-center">
                                        <p className="font-medium">
                                            {recipients.data.filter(r => r.status === 'pending').length} certificate(s) ready to generate
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Click the button below to generate all pending certificates. Emails will be queued automatically.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            onClick={() => window.open(route('projects.preview', project.id), '_blank')}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Preview Sample
                                        </Button>
                                        <Button
                                            size="lg"
                                            disabled={generating}
                                            onClick={() => {
                                                setGenerating(true);
                                                router.post(route('projects.generate', project.id), {}, {
                                                    preserveScroll: true,
                                                    onSuccess: () => {
                                                        setGenerating(false);
                                                        toast.success('Certificates generated successfully.');
                                                    },
                                                    onError: () => {
                                                        setGenerating(false);
                                                        toast.error('Failed to generate certificates.');
                                                    },
                                                });
                                            }}
                                        >
                                            {generating ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="h-4 w-4 mr-2" />
                                                    Generate All Certificates
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {recipients.data.filter(r => r.status === 'generated' || r.status === 'sent' || r.status === 'revoked').length > 0 && recipients.data.filter(r => r.status === 'pending').length === 0 && (
                            <Card>
                                <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                                    <RotateCcw className="h-12 w-12 text-primary/60" />
                                    <div className="text-center">
                                        <p className="font-medium">
                                            {recipients.data.filter(r => r.status === 'generated' || r.status === 'sent').length} certificate(s) already generated
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Use Regenerate All after editing the template, or preview a sample first.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            onClick={() => window.open(route('projects.preview', project.id), '_blank')}
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            Preview Sample
                                        </Button>
                                        <Button
                                            size="lg"
                                            onClick={() => {
                                                setRegeneratingAll(true);
                                                router.post(route('projects.regenerate-all', project.id), {}, {
                                                    preserveScroll: true,
                                                    onSuccess: () => {
                                                        setRegeneratingAll(false);
                                                        toast.success('All certificates regenerated.');
                                                    },
                                                    onError: () => {
                                                        setRegeneratingAll(false);
                                                        toast.error('Failed to regenerate all certificates.');
                                                    },
                                                });
                                            }}
                                            disabled={regeneratingAll}
                                        >
                                            {regeneratingAll ? (
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            ) : (
                                                <RotateCcw className="h-4 w-4 mr-2" />
                                            )}
                                            Regenerate All
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {recipients.data.filter(r => r.email_status !== 'sent' && (r.status === 'generated' || r.status === 'sent')).length > 0 && (
                            <Card>
                                <CardContent className="p-6 flex flex-col items-center justify-center gap-3">
                                    <Mail className="h-12 w-12 text-primary/60" />
                                    <div className="text-center">
                                        <p className="font-medium">
                                            {recipients.data.filter(r => r.email_status !== 'sent' && (r.status === 'generated' || r.status === 'sent')).length} email(s) pending delivery
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Send certificate emails to all generated recipients.
                                        </p>
                                    </div>
                                    <Button
                                        size="lg"
                                        disabled={sendingEmail}
                                        onClick={handleSendAllEmails}
                                    >
                                        {sendingEmail ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Send All Emails
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {recipients.data.length > 0 && (
                            <Card>
                                <CardContent className="p-0">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                                                <th className="text-left p-3 font-medium text-muted-foreground">Cert. No.</th>
                                                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                                <th className="text-left p-3 font-medium text-muted-foreground">Email</th>
                                                <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recipients.data.map((r) => (
                                                <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                                                    <td className="p-3 font-medium">{r.name}</td>
                                                    <td className="p-3 font-mono text-xs">{r.certificate_number}</td>
                                                    <td className="p-3">
                                                        <Badge variant="outline" className={STATUS_BADGE[r.status] || ''}>
                                                            {r.status === 'pending' && <AlertCircle className="h-3 w-3 mr-1 inline" />}
                                                            {r.status === 'generated' && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
                                                            {r.status === 'sent' && <Mail className="h-3 w-3 mr-1 inline" />}
                                                            {r.status === 'revoked' && <AlertCircle className="h-3 w-3 mr-1 inline" />}
                                                            {r.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3">
                                                        <Badge variant="outline" className={EMAIL_STATUS_BADGE[r.email_status] || ''}>
                                                            {r.email_status === 'pending' && 'Pending'}
                                                            {r.email_status === 'sent' && 'Sent'}
                                                            {r.email_status === 'failed' && 'Failed'}
                                                        </Badge>
                                                    </td>
                                                    <td className="p-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                        {r.status === 'pending' && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={generating}
                                                                    onClick={() => {
                                                                        setGenerating(true);
                                                                        router.post(route('projects.generate.single', [project.id, r.id]), {}, {
                                                                            preserveScroll: true,
                                                                            onSuccess: () => {
                                                                                setGenerating(false);
                                                                                toast.success(`Certificate generated for ${r.name}.`);
                                                                            },
                                                                            onError: () => {
                                                                                setGenerating(false);
                                                                                toast.error('Failed to generate certificate.');
                                                                            },
                                                                        });
                                                                    }}
                                                                >
                                                                    <Zap className="h-3 w-3 mr-1" />
                                                                    Generate
                                                                </Button>
                                                            )}
                                                            {(r.status === 'generated' || r.status === 'sent') && (
                                                                <>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() => window.open(`/storage/${r.certificate_path}`, '_blank')}
                                                                    >
                                                                        <Download className="h-3 w-3 mr-1" />
                                                                        PDF
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        disabled={sendingEmail}
                                                                        onClick={() => handleSendEmail(r.id, r.name)}
                                                                    >
                                                                        <Send className="h-3 w-3 mr-1" />
                                                                        {r.email_status === 'failed' ? 'Resend' : r.email_status === 'sent' ? 'Resend' : 'Send'}
                                                                    </Button>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="text-destructive hover:text-destructive border-destructive/30 hover:border-destructive"
                                                                        onClick={() => {
                                                                            setRevokeModal({ open: true, recipient: r });
                                                                            setRevokeReason('');
                                                                        }}
                                                                    >
                                                                        <Ban className="h-3 w-3 mr-1" />
                                                                        Revoke
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {r.status === 'revoked' && (
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    disabled={generating}
                                                                    onClick={() => {
                                                                        setGenerating(true);
                                                                        router.post(route('projects.regenerate', [project.id, r.id]), {}, {
                                                                            preserveScroll: true,
                                                                            onSuccess: () => {
                                                                                setGenerating(false);
                                                                                toast.success(`Certificate regenerated for ${r.name}.`);
                                                                            },
                                                                            onError: () => {
                                                                                setGenerating(false);
                                                                                toast.error('Failed to regenerate certificate.');
                                                                            },
                                                                        });
                                                                    }}
                                                                >
                                                                    <RotateCcw className="h-3 w-3 mr-1" />
                                                                    Regenerate
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </CardContent>
                            </Card>
                        )}

                        {recipients.data.length === 0 && (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12">
                                    <Users className="h-10 w-10 text-muted-foreground/50 mb-3" />
                                    <p className="text-sm text-muted-foreground">No recipients yet</p>
                                    <p className="text-xs text-muted-foreground/70">
                                        Add recipients first before generating certificates.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {recipients.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                {recipients.links.map((link, i) => (
                                    <Button
                                        key={i}
                                        variant={link.active ? 'default' : 'outline'}
                                        size="sm"
                                        disabled={!link.url}
                                        onClick={() => {
                                            if (link.url) router.get(link.url, {}, { preserveScroll: true });
                                        }}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Project</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{project.name}"? Projects with generated certificates cannot be deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={revokeModal.open} onOpenChange={(open) => {
                if (!open) {
                    setRevokeModal({ open: false, recipient: null });
                    setRevokeReason('');
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Revoke Certificate</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to revoke the certificate for <strong>{revokeModal.recipient?.name}</strong>?
                            The certificate will no longer be publicly accessible.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="revoke-reason">Reason for Revocation</Label>
                        <Textarea
                            id="revoke-reason"
                            value={revokeReason}
                            onChange={(e) => setRevokeReason(e.target.value)}
                            placeholder="e.g., Certificate issued with incorrect information"
                            className="min-h-[80px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setRevokeModal({ open: false, recipient: null });
                            setRevokeReason('');
                        }}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleRevoke} disabled={revoking || !revokeReason.trim()}>
                            {revoking ? 'Revoking...' : 'Revoke Certificate'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={revokeAllOpen} onOpenChange={(open) => {
                if (!open) {
                    setRevokeAllOpen(false);
                    setRevokeAllReason('');
                }
            }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Revoke All Certificates</DialogTitle>
                        <DialogDescription>
                            This will revoke all generated certificates in this project. They will no longer be publicly accessible.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                        <Label htmlFor="revoke-all-reason">Reason for Revocation</Label>
                        <Textarea
                            id="revoke-all-reason"
                            value={revokeAllReason}
                            onChange={(e) => setRevokeAllReason(e.target.value)}
                            placeholder="e.g., Template design updated, certificates need regeneration"
                            className="min-h-[80px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => {
                            setRevokeAllOpen(false);
                            setRevokeAllReason('');
                        }}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleRevokeAll} disabled={revokingAll || !revokeAllReason.trim()}>
                            {revokingAll ? 'Revoking...' : 'Revoke All'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
