import { Link, router } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { FileText, Plus, Pencil, Trash2, Eye, Ruler, User } from 'lucide-react';
import { useState } from 'react';

interface Template {
    id: number;
    name: string;
    background_image: string | null;
    page_width: number;
    page_height: number;
    orientation: string;
    created_by: number;
    creator: { id: number; name: string };
    elements_count?: number;
    created_at: string;
}

interface PaginatedData {
    data: Template[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export default function Index({ templates }: { templates: PaginatedData }) {
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        router.delete(route('templates.destroy', deleteId), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteId(null);
                setDeleting(false);
            },
            onError: () => {
                setDeleting(false);
            },
        });
    }

    return (
        <AuthenticatedLayout header="Templates">
            <Head title="Templates" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Templates</h2>
                        <p className="text-muted-foreground">
                            Manage your certificate templates
                        </p>
                    </div>
                    <Link href={route('templates.create')}>
                        <Button>
                            <Plus className="h-4 w-4" />
                            Create Template
                        </Button>
                    </Link>
                </div>

                {templates.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <p className="text-lg font-medium text-muted-foreground">No templates yet</p>
                            <p className="text-sm text-muted-foreground/70 mb-4">
                                Create your first template to get started
                            </p>
                            <Link href={route('templates.create')}>
                                <Button>
                                    <Plus className="h-4 w-4" />
                                    Create Template
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {templates.data.map((template) => (
                            <Card key={template.id} className="overflow-hidden flex flex-col">
                                <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                                    {template.background_image ? (
                                        <img
                                            src={`/storage/${template.background_image}`}
                                            alt={template.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center">
                                            <FileText className="h-10 w-10 text-muted-foreground/30" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <span className="inline-flex items-center rounded-md bg-background/80 px-2 py-1 text-xs font-medium text-muted-foreground backdrop-blur-sm">
                                            {template.orientation}
                                        </span>
                                    </div>
                                </div>
                                <CardHeader className="p-4 pb-2">
                                    <CardTitle className="text-base truncate">{template.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 pb-2 flex-1">
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <Ruler className="h-3 w-3" />
                                            {template.page_width}×{template.page_height}mm
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <User className="h-3 w-3" />
                                            {template.creator.name}
                                        </span>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 pt-2 gap-1 flex-wrap">
                                    <Link href={route('templates.show', template.id)}>
                                        <Button variant="ghost" size="sm">
                                            <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                    </Link>
                                    <Link href={route('templates.designer', template.id)}>
                                        <Button variant="ghost" size="sm">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => setDeleteId(template.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}

                {templates.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {templates.links.map((link, i) => (
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
            </div>

            <Dialog open={deleteId !== null} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Template</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this template? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>
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
