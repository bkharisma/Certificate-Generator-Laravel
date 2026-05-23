import { Head, useForm, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { ArrowLeft, Upload, Ruler, Image as ImageIcon } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const PAGE_SIZES: Record<string, { width: number; height: number }> = {
    'A3': { width: 297, height: 420 },
    'A4': { width: 210, height: 297 },
    'A5': { width: 148, height: 210 },
    'A6': { width: 105, height: 148 },
    'Letter': { width: 216, height: 279 },
    'Legal': { width: 216, height: 356 },
    'Tabloid': { width: 279, height: 432 },
};

export default function Create() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        page_width: '297',
        page_height: '210',
        orientation: 'landscape',
        background: null as File | null,
    });

    const [preview, setPreview] = useState<string | null>(null);
    const [pageSize, setPageSize] = useState('A4');

    function setPageDimensions(size: string, orientation: string) {
        const dims = PAGE_SIZES[size];
        if (!dims) return;
        if (orientation === 'landscape') {
            setData('page_width', String(Math.max(dims.width, dims.height)));
            setData('page_height', String(Math.min(dims.width, dims.height)));
        } else {
            setData('page_width', String(Math.min(dims.width, dims.height)));
            setData('page_height', String(Math.max(dims.width, dims.height)));
        }
    }

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (file) {
            setData('background', file);
            setPreview(URL.createObjectURL(file));
        }
    }, [setData]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
        maxSize: 10 * 1024 * 1024,
        multiple: false,
    });

    function handleOrientationChange(value: string | null) {
        if (!value) return;
        setData('orientation', value);
        setPageDimensions(pageSize, value);
    }

    function handlePageSizeChange(value: string | null) {
        if (!value) return;
        setPageSize(value);
        setPageDimensions(value, data.orientation);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        post(route('templates.store'), {
            forceFormData: true,
            onSuccess: () => reset(),
        });
    }

    return (
        <AuthenticatedLayout header="Create Template">
            <Head title="Create Template" />

            <div className="space-y-6 max-w-2xl">
                <div>
                    <Link
                        href={route('templates.index')}
                        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to templates
                    </Link>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Template Name</Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g., Basic Certificate"
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Orientation</Label>
                            <Select
                                value={data.orientation}
                                onValueChange={handleOrientationChange}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="landscape">Landscape</SelectItem>
                                    <SelectItem value="portrait">Portrait</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Page Size</Label>
                            <Select value={pageSize} onValueChange={handlePageSizeChange}>
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(PAGE_SIZES).map(([name, dims]) => (
                                        <SelectItem key={name} value={name}>
                                            {name} ({Math.min(dims.width, dims.height)}×{Math.max(dims.width, dims.height)}mm)
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.page_width && (
                                <p className="text-sm text-destructive">{errors.page_width}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Background Image</Label>
                            <div
                                {...getRootProps()}
                                className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer ${
                                    isDragActive
                                        ? 'border-primary bg-primary/5'
                                        : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                                }`}
                            >
                                <input {...getInputProps()} />
                                {preview ? (
                                    <div className="relative w-full">
                                        <img
                                            src={preview}
                                            alt="Background preview"
                                            className="max-h-48 w-full rounded-md object-contain"
                                        />
                                        <p className="mt-2 text-center text-xs text-muted-foreground">
                                            Click or drag to replace
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {isDragActive ? (
                                            <Upload className="h-8 w-8 text-primary mb-2" />
                                        ) : (
                                            <ImageIcon className="h-8 w-8 text-muted-foreground/50 mb-2" />
                                        )}
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {isDragActive ? 'Drop image here' : 'Drag & drop background image'}
                                        </p>
                                        <p className="text-xs text-muted-foreground/70 mt-1">
                                            PNG or JPG, max 10MB
                                        </p>
                                    </>
                                )}
                            </div>
                            {errors.background && (
                                <p className="text-sm text-destructive">{errors.background}</p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                        <Ruler className="h-5 w-5 text-muted-foreground" />
                        <div className="text-sm">
                            <p className="font-medium">Page preview</p>
                            <p className="text-muted-foreground">
                                {data.orientation === 'landscape' ? 'Landscape' : 'Portrait'} — {pageSize} ({data.page_width}×{data.page_height}mm)
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Link href={route('templates.index')}>
                            <Button type="button" variant="outline">Cancel</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Template'}
                        </Button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
