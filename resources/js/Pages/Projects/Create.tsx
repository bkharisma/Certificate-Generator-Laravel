import { Head, useForm, Link } from '@inertiajs/react';
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
import { Card, CardContent } from '@/Components/ui/card';
import {
    ArrowLeft,
    ChevronRight,
    ChevronLeft,
    Check,
    Mail,
    Hash,
    Calendar,
    FileText,
    Layers,
} from 'lucide-react';
import { useState, useMemo } from 'react';

interface TemplateElement {
    id: number;
    type: string;
    label: string;
}

interface Template {
    id: number;
    name: string;
    page_width: number;
    page_height: number;
    orientation: string;
    elements: TemplateElement[];
}

const STEPS = [
    { title: 'Basic Info', icon: Layers },
    { title: 'Certificate', icon: FileText },
    { title: 'Numbering', icon: Hash },
    { title: 'Email', icon: Mail },
    { title: 'Review', icon: Check },
];

export default function Create({ templates }: { templates: Template[] }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        template_id: '',
        title_text: '',
        certificate_date: new Date().toISOString().split('T')[0],
        certificate_prefix: '',
        certificate_digit_count: '3',
        email_subject: '',
        email_body: '',
    });

    const [step, setStep] = useState(1);

    const selectedTemplate = useMemo(
        () => templates.find((t) => t.id === Number(data.template_id)),
        [data.template_id, templates]
    );

    const certPreview = useMemo(() => {
        if (!data.certificate_prefix) return '';
        const digits = Number(data.certificate_digit_count) || 3;
        const padded = '1'.padStart(digits, '0');
        return `${data.certificate_prefix}/${padded}`;
    }, [data.certificate_prefix, data.certificate_digit_count]);

    function canProceed(): boolean {
        switch (step) {
            case 1:
                return data.name.length > 0 && data.template_id !== '';
            case 2:
                return true;
            case 3:
                return data.certificate_prefix.length > 0;
            case 4:
                return true;
            default:
                return true;
        }
    }

    function nextStep() {
        if (step < 5 && canProceed()) setStep(step + 1);
    }

    function prevStep() {
        if (step > 1) setStep(step - 1);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(route('projects.store'), {
            onSuccess: () => reset(),
        });
    }

    return (
        <AuthenticatedLayout header="Create Project">
            <Head title="Create Project" />

            <div className="space-y-6 max-w-3xl mx-auto">
                <div>
                    <Link
                        href={route('projects.index')}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to projects
                    </Link>
                </div>

                <div className="flex items-center justify-between">
                    {STEPS.map((s, i) => (
                        <div key={s.title} className="flex items-center gap-2">
                            <div
                                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium transition-colors ${
                                    step > i + 1
                                        ? 'bg-primary text-primary-foreground'
                                        : step === i + 1
                                        ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                                        : 'bg-muted text-muted-foreground'
                                }`}
                            >
                                {step > i + 1 ? <Check className="h-4 w-4" /> : i + 1}
                            </div>
                            <span className={`text-sm hidden sm:inline ${step === i + 1 ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                                {s.title}
                            </span>
                            {i < STEPS.length - 1 && (
                                <div className={`hidden sm:block w-8 h-px mx-1 ${step > i + 1 ? 'bg-primary' : 'bg-border'}`} />
                            )}
                        </div>
                    ))}
                </div>

                <form onSubmit={handleSubmit}>
                    {step === 1 && (
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Project Name</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="e.g., Training Batch 2026"
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
                                            <SelectValue placeholder="Select a template..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {templates.map((t) => (
                                                <SelectItem key={t.id} value={String(t.id)}>
                                                    {t.name} ({t.orientation}, {t.page_width}×{t.page_height}mm)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.template_id && <p className="text-sm text-destructive">{errors.template_id}</p>}
                                </div>

                                {selectedTemplate && (
                                    <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
                                        <p className="text-sm font-medium">Selected Template</p>
                                        <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                                            <span>Name: {selectedTemplate.name}</span>
                                            <span>Orientation: {selectedTemplate.orientation}</span>
                                            <span>Size: {selectedTemplate.page_width}×{selectedTemplate.page_height}mm</span>
                                            <span>Elements: {selectedTemplate.elements?.length || 0}</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {step === 2 && (
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title_text">Certificate Title</Label>
                                    <Input
                                        id="title_text"
                                        value={data.title_text}
                                        onChange={(e) => setData('title_text', e.target.value)}
                                        placeholder="e.g., Certificate of Completion"
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
                            </CardContent>
                        </Card>
                    )}

                    {step === 3 && (
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="certificate_prefix">Certificate Number Prefix</Label>
                                    <Input
                                        id="certificate_prefix"
                                        value={data.certificate_prefix}
                                        onChange={(e) => setData('certificate_prefix', e.target.value)}
                                        placeholder="e.g., psdp"
                                    />
                                    {errors.certificate_prefix && <p className="text-sm text-destructive">{errors.certificate_prefix}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="certificate_digit_count">Number of Digits</Label>
                                    <Select
                                        value={data.certificate_digit_count}
                                        onValueChange={(v) => v !== null && setData('certificate_digit_count', v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="3">3 digits (e.g., 001)</SelectItem>
                                            <SelectItem value="4">4 digits (e.g., 0001)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.certificate_digit_count && <p className="text-sm text-destructive">{errors.certificate_digit_count}</p>}
                                </div>

                                {certPreview && (
                                    <div className="rounded-lg border bg-muted/30 p-4">
                                        <p className="text-sm font-medium">Preview Format</p>
                                        <p className="text-lg font-mono mt-1 text-primary">{certPreview}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            First certificate will be numbered: {certPreview}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {step === 4 && (
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email_subject">Email Subject</Label>
                                    <Input
                                        id="email_subject"
                                        value={data.email_subject}
                                        onChange={(e) => setData('email_subject', e.target.value)}
                                        placeholder="e.g., Your Certificate - {nama}"
                                    />
                                    {errors.email_subject && <p className="text-sm text-destructive">{errors.email_subject}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email_body">Email Body (HTML)</Label>
                                    <Textarea
                                        id="email_body"
                                        rows={8}
                                        value={data.email_body}
                                        onChange={(e) => setData('email_body', e.target.value)}
                                        placeholder={`Dear {nama},

Your certificate number {nomor_sertifikat} is ready.

Best regards,
Organization`}
                                    />
                                    {errors.email_body && <p className="text-sm text-destructive">{errors.email_body}</p>}
                                </div>

                                <div className="rounded-lg border bg-muted/30 p-3">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Available Variables</p>
                                    <div className="flex flex-wrap gap-1">
                                        {['{nama}', '{nomor_sertifikat}', '{tanggal}', '{nama_project}'].map((v) => (
                                            <button
                                                key={v}
                                                type="button"
                                                onClick={() => {
                                                    const area = document.getElementById('email_body') as HTMLTextAreaElement;
                                                    if (area) {
                                                        const start = area.selectionStart;
                                                        const end = area.selectionEnd;
                                                        const newVal = data.email_body.substring(0, start) + v + data.email_body.substring(end);
                                                        setData('email_body', newVal);
                                                        setTimeout(() => {
                                                            area.focus();
                                                            area.setSelectionRange(start + v.length, start + v.length);
                                                        }, 0);
                                                    }
                                                }}
                                                className="rounded bg-background border px-2 py-0.5 text-xs font-mono text-primary hover:bg-accent transition-colors"
                                            >
                                                {v}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {step === 5 && (
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <h3 className="font-semibold">Review Project</h3>

                                <div className="grid gap-3 text-sm">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-muted-foreground">Project Name</span>
                                        <span className="font-medium">{data.name}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-muted-foreground">Template</span>
                                        <span className="font-medium">{selectedTemplate?.name || '-'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-muted-foreground">Certificate Title</span>
                                        <span className="font-medium">{data.title_text || '(not set)'}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-muted-foreground">Certificate Date</span>
                                        <span className="font-medium">{data.certificate_date}</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-muted-foreground">Number Format</span>
                                        <span className="font-medium font-mono">{certPreview}...</span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-muted-foreground">Email</span>
                                        <span className="font-medium">{data.email_subject ? 'Configured' : 'Not configured'}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex items-center justify-between pt-4">
                        <div>
                            {step > 1 && (
                                <Button type="button" variant="outline" onClick={prevStep}>
                                    <ChevronLeft className="h-4 w-4" />
                                    Previous
                                </Button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                                Step {step} of 5
                            </span>
                            {step < 5 ? (
                                <Button type="button" onClick={nextStep} disabled={!canProceed()}>
                                    Next
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Creating...' : 'Create Project'}
                                </Button>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
