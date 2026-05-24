import { Link, router } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import {
    ArrowLeft,
    Pencil,
    Trash2,
    Download,
    Ruler,
    User,
    Plus,
} from 'lucide-react';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { toast } from 'sonner';

interface TemplateElement {
    id: number;
    type: string;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    font_size: number | null;
    font_family: string | null;
    font_color: string | null;
    font_style: string | null;
    text_align: string | null;
    default_image?: string | null;
    sort_order: number;
}

interface Template {
    id: number;
    name: string;
    background_image: string | null;
    page_width: number;
    page_height: number;
    orientation: string;
    created_by: number;
    creator: { id: number; name: string };
    elements: TemplateElement[];
    created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
    title: 'Title',
    recipient_name: 'Recipient Name',
    date: 'Date',
    certificate_number: 'Certificate No.',
    qr_code: 'QR Code',
    signature: 'Signature',
    logo: 'Logo',
};

const TYPE_COLORS: Record<string, string> = {
    title: 'bg-blue-500/10 text-blue-600 border-blue-200',
    recipient_name: 'bg-green-500/10 text-green-600 border-green-200',
    date: 'bg-amber-500/10 text-amber-600 border-amber-200',
    certificate_number: 'bg-purple-500/10 text-purple-600 border-purple-200',
    qr_code: 'bg-red-500/10 text-red-600 border-red-200',
    signature: 'bg-cyan-500/10 text-cyan-600 border-cyan-200',
    logo: 'bg-pink-500/10 text-pink-600 border-pink-200',
};

export default function Show({ template, preview }: { template: Template; preview?: boolean }) {
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);

    function handleDelete() {
        setDeleting(true);
        router.delete(route('templates.destroy', template.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Template deleted');
                setDeleteOpen(false);
                setDeleting(false);
            },
            onError: () => {
                setDeleting(false);
            },
        });
    }

    const sortedElements = [...template.elements].sort((a, b) => a.sort_order - b.sort_order);

    return (
        <AuthenticatedLayout header={template.name}>
            <Head title={template.name} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link
                            href={route('templates.index')}
                            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Link>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href={route('templates.designer', template.id)}>
                            <Button variant="outline" size="sm">
                                <Pencil className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Edit Design</span>
                            </Button>
                        </Link>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                            <Trash2 className="h-4 w-4 sm:mr-2" />
                            <span className="hidden sm:inline">Delete</span>
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardContent className="p-4">
                                <div
                                    className="relative mx-auto overflow-hidden rounded-lg border bg-white shadow-sm"
                                    style={{
                                        aspectRatio: `${template.page_width} / ${template.page_height}`,
                                        maxWidth: '100%',
                                        maxHeight: '500px',
                                    }}
                                >
                                    {template.background_image ? (
                                        <img
                                            src={`/storage/${template.background_image}`}
                                            alt={template.name}
                                            className="h-full w-full object-contain"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-muted-foreground/50">
                                            No background
                                        </div>
                                    )}

                                    {sortedElements.map((el) => (
                                        <div
                                            key={el.id}
                                            className="absolute border-2 border-dashed rounded"
                                            style={{
                                                left: `${(el.x / template.page_width) * 100}%`,
                                                top: `${(el.y / template.page_height) * 100}%`,
                                                width: `${(el.width / template.page_width) * 100}%`,
                                                height: `${(el.height / template.page_height) * 100}%`,
                                                borderColor: TYPE_COLORS[el.type]?.includes('blue')
                                                    ? '#3b82f6'
                                                    : TYPE_COLORS[el.type]?.includes('green')
                                                    ? '#10b981'
                                                    : TYPE_COLORS[el.type]?.includes('amber')
                                                    ? '#f59e0b'
                                                    : TYPE_COLORS[el.type]?.includes('purple')
                                                    ? '#8b5cf6'
                                                    : TYPE_COLORS[el.type]?.includes('red')
                                                    ? '#ef4444'
                                                    : TYPE_COLORS[el.type]?.includes('cyan')
                                                    ? '#06b6d4'
                                                    : '#ec4899',
                                                backgroundColor: 'rgba(255,255,255,0.15)',
                                            }}
                                        >
                                            {['signature', 'logo'].includes(el.type) && el.default_image ? (
                                                <img
                                                    src={`/storage/${el.default_image}`}
                                                    alt={el.label}
                                                    className="h-full w-full object-contain"
                                                />
                                            ) : null}
                                            <span
                                                className="absolute -top-5 left-0 text-[10px] font-medium whitespace-nowrap"
                                                style={{
                                                    color: el.type === 'title' ? '#3b82f6'
                                                        : el.type === 'recipient_name' ? '#10b981'
                                                        : el.type === 'date' ? '#f59e0b'
                                                        : el.type === 'certificate_number' ? '#8b5cf6'
                                                        : el.type === 'qr_code' ? '#ef4444'
                                                        : el.type === 'signature' ? '#06b6d4'
                                                        : '#ec4899',
                                                }}
                                            >
                                                {TYPE_LABELS[el.type] || el.type}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-4">
                        <Card>
                            <CardContent className="p-4 space-y-3">
                                <h3 className="font-semibold text-sm">Template Info</h3>
                                <div className="space-y-2 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Orientation</span>
                                        <Badge variant="outline">{template.orientation}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Page Size</span>
                                        <span className="flex items-center gap-1">
                                            <Ruler className="h-3 w-3" />
                                            {template.page_width}×{template.page_height}mm
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Created by</span>
                                        <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {template.creator.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Elements</span>
                                        <span>{template.elements.length}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 space-y-3">
                                <h3 className="font-semibold text-sm">Elements</h3>
                                {sortedElements.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">No elements yet</p>
                                ) : (
                                    <div className="space-y-1">
                                        {sortedElements.map((el) => (
                                            <div
                                                key={el.id}
                                                className={`flex items-center justify-between rounded-md border px-2 py-1.5 text-xs ${TYPE_COLORS[el.type] || ''}`}
                                            >
                                                <span className="font-medium truncate">
                                                    {TYPE_LABELS[el.type] || el.type}
                                                </span>
                                                <span className="text-muted-foreground shrink-0">
                                                    {el.x}, {el.y}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Template</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{template.name}"? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
