import { Link, router } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    Plus,
    FolderKanban,
    Eye,
    Pencil,
    Trash2,
    Users,
    FileText,
    Calendar,
    Layers,
} from 'lucide-react';
import { useState } from 'react';

interface Project {
    id: number;
    name: string;
    template: { id: number; name: string };
    creator: { id: number; name: string };
    status: string;
    recipients_count: number;
    certificate_prefix: string;
    certificate_date: string | null;
    created_at: string;
}

interface PaginatedData {
    data: Project[];
    current_page: number;
    last_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-yellow-500/10 text-yellow-600 border-yellow-200',
    active: 'bg-blue-500/10 text-blue-600 border-blue-200',
    completed: 'bg-green-500/10 text-green-600 border-green-200',
};

export default function Index({ projects }: { projects: PaginatedData }) {
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleting, setDeleting] = useState(false);

    function handleDelete() {
        if (!deleteId) return;
        setDeleting(true);
        router.delete(route('projects.destroy', deleteId), {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteId(null);
                setDeleting(false);
            },
            onError: () => setDeleting(false),
        });
    }

    return (
        <AuthenticatedLayout header="Projects">
            <Head title="Projects" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
                        <p className="text-muted-foreground">
                            Manage your certificate generation projects
                        </p>
                    </div>
                    <Link href={route('projects.create')}>
                        <Button>
                            <Plus className="h-4 w-4" />
                            Create Project
                        </Button>
                    </Link>
                </div>

                {projects.data.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16">
                            <FolderKanban className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <p className="text-lg font-medium text-muted-foreground">No projects yet</p>
                            <p className="text-sm text-muted-foreground/70 mb-4">
                                Create your first project to start generating certificates
                            </p>
                            <Link href={route('projects.create')}>
                                <Button>
                                    <Plus className="h-4 w-4" />
                                    Create Project
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {projects.data.map((project) => (
                            <Card key={project.id} className="flex flex-col">
                                <CardHeader className="p-4 pb-2">
                                    <div className="flex items-start justify-between">
                                        <CardTitle className="text-base truncate">{project.name}</CardTitle>
                                        <Badge
                                            variant="outline"
                                            className={`ml-2 shrink-0 ${STATUS_COLORS[project.status] || ''}`}
                                        >
                                            {project.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 pt-0 pb-2 flex-1 space-y-2">
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                        <span className="flex items-center gap-1">
                                            <Layers className="h-3 w-3" />
                                            {project.template.name}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users className="h-3 w-3" />
                                            {project.recipients_count} recipients
                                        </span>
                                        {project.certificate_date && (
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {project.certificate_date}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <FileText className="h-3 w-3" />
                                        Prefix: {project.certificate_prefix}
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 pt-2 gap-1">
                                    <Link href={route('projects.show', project.id)}>
                                        <Button variant="ghost" size="sm">
                                            <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                    </Link>
                                    <Link href={route('projects.edit', project.id)}>
                                        <Button variant="ghost" size="sm">
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() => setDeleteId(project.id)}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                )}

                {projects.last_page > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        {projects.links.map((link, i) => (
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
                        <DialogTitle>Delete Project</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this project? This action cannot be undone.
                            Projects with generated certificates cannot be deleted.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteId(null)}>Cancel</Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                            {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}
