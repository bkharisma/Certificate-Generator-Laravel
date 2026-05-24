import { Head, useForm, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { ArrowLeft, Save } from 'lucide-react';
import { useMemo } from 'react';

interface Template {
    id: number;
    name: string;
    page_width: number;
    page_height: number;
    orientation: string;
}

interface Project {
    id: number;
    name: string;
    template_id: number;
    template: Template;
    title_text: string | null;
    certificate_date: string | null;
    certificate_prefix: string;
    certificate_digit_count: number;
    certificate_next_number: number;
    email_subject: string | null;
    email_body: string | null;
    status: string;
}

export default function Edit({ project, templates }: { project: Project; templates: Template[] }) {
    const { data, setData, put, processing, errors } = useForm({
        name: project.name,
        template_id: String(project.template_id),
        title_text: project.title_text || '',
        certificate_date: project.certificate_date || new Date().toISOString().split('T')[0],
        certificate_prefix: project.certificate_prefix,
        certificate_digit_count: String(project.certificate_digit_count),
        email_subject: project.email_subject || '',
        email_body: project.email_body || '',
        status: project.status,
    });

    const selectedTemplate = useMemo(
        () => templates.find((t) => t.id === Number(data.template_id)),
        [data.template_id, templates]
    );

    const certPreview = useMemo(() => {
        if (!data.certificate_prefix) return '';
        const digits = Number(data.certificate_digit_count) || 3;
        const padded = String(project.certificate_next_number).padStart(digits, '0');
        return `${data.certificate_prefix}/${padded}`;
    }, [data.certificate_prefix, data.certificate_digit_count, project.certificate_next_number]);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(route('projects.update', project.id));
    }

    return (
        <AuthenticatedLayout header={`Edit: ${project.name}`}>
            <Head title={`Edit: ${project.name}`} />

            <div className="space-y-6 max-w-2xl">
                <div>
                    <Link
                        href={route('projects.show', project.id)}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to project
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Project Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Project Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                />
                                {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="template_id">Template</Label>
                                <Select
                                    value={data.template_id}
                                    onValueChange={(v) => v !== null && setData('template_id', v)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {templates.map((t) => (
                                            <SelectItem key={t.id} value={String(t.id)}>
                                                {t.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.template_id && <p className="text-sm text-destructive">{errors.template_id}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(v) => v !== null && setData('status', v)}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Certificate Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="title_text">Certificate Title</Label>
                                <Input
                                    id="title_text"
                                    value={data.title_text}
                                    onChange={(e) => setData('title_text', e.target.value)}
                                />
                                {errors.title_text && <p className="text-sm text-destructive">{errors.title_text}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="certificate_date">Certificate Date</Label>
                                <Input
                                    id="certificate_date"
                                    type="date"
                                    value={data.certificate_date}
                                    onChange={(e) => setData('certificate_date', e.target.value)}
                                />
                                {errors.certificate_date && <p className="text-sm text-destructive">{errors.certificate_date}</p>}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="certificate_prefix">Number Prefix</Label>
                                    <Input
                                        id="certificate_prefix"
                                        value={data.certificate_prefix}
                                        onChange={(e) => setData('certificate_prefix', e.target.value)}
                                    />
                                    {errors.certificate_prefix && <p className="text-sm text-destructive">{errors.certificate_prefix}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="certificate_digit_count">Digit Count</Label>
                                    <Select
                                        value={data.certificate_digit_count}
                                        onValueChange={(v) => v !== null && setData('certificate_digit_count', v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="3">3 digits</SelectItem>
                                            <SelectItem value="4">4 digits</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {certPreview && (
                                <div className="rounded-lg border bg-muted/30 p-3 text-sm">
                                    <span className="text-muted-foreground">Current format: </span>
                                    <span className="font-mono font-medium text-primary">{certPreview}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Email Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email_subject">Email Subject</Label>
                                <Input
                                    id="email_subject"
                                    value={data.email_subject}
                                    onChange={(e) => setData('email_subject', e.target.value)}
                                />
                                {errors.email_subject && <p className="text-sm text-destructive">{errors.email_subject}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email_body">Email Body (HTML)</Label>
                                <Textarea
                                    id="email_body"
                                    rows={6}
                                    value={data.email_body}
                                    onChange={(e) => setData('email_body', e.target.value)}
                                />
                                {errors.email_body && <p className="text-sm text-destructive">{errors.email_body}</p>}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex gap-3">
                        <Link href={route('projects.show', project.id)}>
                            <Button type="button" variant="outline">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="h-4 w-4" />
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
