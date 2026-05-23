import { Head, Link, router } from '@inertiajs/react';
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
import {
    ArrowLeft,
    Save,
    Type,
    User,
    Calendar,
    Hash,
    QrCode,
    Pen,
    Image as ImageIcon,
    Trash2,
    Eye,
} from 'lucide-react';
import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import * as fabric from 'fabric';
import QRCode from 'qrcode';

const DPI = 96;
const MM_PER_INCH = 25.4;
const PX_PER_MM = DPI / MM_PER_INCH;

const ELEMENT_TYPES = [
    { type: 'title', label: 'Title', icon: Type },
    { type: 'recipient_name', label: 'Recipient Name', icon: User },
    { type: 'date', label: 'Date', icon: Calendar },
    { type: 'certificate_number', label: 'Certificate No.', icon: Hash },
    { type: 'qr_code', label: 'QR Code', icon: QrCode },
    { type: 'signature', label: 'Signature', icon: Pen },
    { type: 'logo', label: 'Logo', icon: ImageIcon },
] as const;

type ElementType = typeof ELEMENT_TYPES[number]['type'];

interface TemplateElement {
    id?: number;
    type: ElementType;
    label: string;
    x: number;
    y: number;
    width: number;
    height: number;
    font_size: number | null;
    font_family: string | null;
    font_color: string | null;
    font_style: 'normal' | 'bold' | 'italic' | null;
    text_align: 'left' | 'center' | 'right' | null;
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
    elements: TemplateElement[];
}

function mmToPx(mm: number): number {
    return mm * PX_PER_MM;
}

function pxToMm(px: number): number {
    return px / PX_PER_MM;
}

const ELEMENT_COLORS: Record<string, string> = {
    title: '#3b82f6',
    recipient_name: '#10b981',
    date: '#f59e0b',
    certificate_number: '#8b5cf6',
    qr_code: '#ef4444',
    signature: '#06b6d4',
    logo: '#ec4899',
};

export default function Designer({ template }: { template: Template }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricRef = useRef<fabric.Canvas | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [scale, setScale] = useState(1);
    const [saving, setSaving] = useState(false);
    const [selected, setSelected] = useState<fabric.FabricObject | null>(null);

    const [selType, setSelType] = useState<string>('');
    const [selX, setSelX] = useState(0);
    const [selY, setSelY] = useState(0);
    const [selW, setSelW] = useState(0);
    const [selH, setSelH] = useState(0);
    const [selFontSize, setSelFontSize] = useState(32);
    const [selFontFamily, setSelFontFamily] = useState('Arial');
    const [selFontColor, setSelFontColor] = useState('#000000');
    const [selFontStyle, setSelFontStyle] = useState('normal');
    const [selTextAlign, setSelTextAlign] = useState('center');

    const initialized = useRef(false);

    const calculateScale = useCallback((containerWidth: number) => {
        const padding = 48;
        const available = containerWidth - padding;
        const s = available / mmToPx(template.page_width);
        return Math.min(s, 1.5);
    }, [template.page_width]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const updateSize = () => {
            const s = calculateScale(container.clientWidth);
            setScale(s);
            setCanvasSize({
                width: mmToPx(template.page_width) * s,
                height: mmToPx(template.page_height) * s,
            });
        };

        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(container);
        return () => observer.disconnect();
    }, [calculateScale, template.page_width, template.page_height]);

    useEffect(() => {
        if (canvasSize.width === 0 || canvasSize.height === 0) return;

        if (fabricRef.current) {
            fabricRef.current.dispose();
            initialized.current = false;
        }

        const canvas = new fabric.Canvas(canvasRef.current!, {
            width: canvasSize.width,
            height: canvasSize.height,
            backgroundColor: '#ffffff',
            preserveObjectStacking: true,
            selection: true,
        });

        fabricRef.current = canvas;
        initialized.current = true;

        if (template.background_image) {
            fabric.Image.fromURL(`/storage/${template.background_image}`).then((img) => {
                img.set({
                    left: 0,
                    top: 0,
                    originX: 'left',
                    originY: 'top',
                    scaleX: canvasSize.width / img.width!,
                    scaleY: canvasSize.height / img.height!,
                });
                canvas.backgroundImage = img;
                canvas.renderAll();
            });
        }

        canvas.on('selection:created', (e) => {
            if (e.selected && e.selected.length > 0) {
                updateSelection(e.selected[0]);
            }
        });

        canvas.on('selection:updated', (e) => {
            if (e.selected && e.selected.length > 0) {
                updateSelection(e.selected[0]);
            }
        });

        canvas.on('selection:cleared', () => {
            setSelected(null);
        });

        canvas.on('object:modified', (e) => {
            if (e.target) updateSelection(e.target);
        });

        function updateSelection(obj: fabric.FabricObject) {
            setSelected(obj);
            const type = obj.get('elementType') || '';
            setSelType(type);

            const bounds = obj.getBoundingRect();

            setSelX(Math.round(pxToMm(bounds.left / scale) * 100) / 100);
            setSelY(Math.round(pxToMm(bounds.top / scale) * 100) / 100);
            setSelW(Math.round(pxToMm(bounds.width / scale) * 100) / 100);
            setSelH(Math.round(pxToMm(bounds.height / scale) * 100) / 100);

            if ('fontSize' in obj) {
                const textObj = obj as fabric.Text;
                setSelFontSize(textObj.fontSize ?? 32);
                setSelFontFamily(textObj.fontFamily ?? 'Arial');
                setSelFontColor(textObj.fill?.toString() || '#000000');
                setSelFontStyle(textObj.fontStyle || 'normal');
                setSelTextAlign(textObj.textAlign || 'center');
            }
        }

        const loadedElements = template.elements || [];
        Promise.all(loadedElements.map((el) => addElementToCanvas(el, canvas, scale))).then(() => {
            canvas.renderAll();
        });

        return () => {
            canvas.dispose();
            initialized.current = false;
        };
    }, [canvasSize.width, canvasSize.height]);

    function getElementDefaults(type: ElementType) {
        const baseSize = 40;
        const defaults: Record<string, Record<string, unknown>> = {
            title: { width: 200, height: 40, fontSize: 32, fontFamily: 'Arial', fill: '#000000' },
            recipient_name: { width: 250, height: 50, fontSize: 36, fontFamily: 'Arial', fill: '#000000' },
            date: { width: 120, height: 30, fontSize: 20, fontFamily: 'Arial', fill: '#000000' },
            certificate_number: { width: 120, height: 30, fontSize: 16, fontFamily: 'Arial', fill: '#666666' },
            qr_code: { width: baseSize, height: baseSize },
            signature: { width: 80, height: 40 },
            logo: { width: 60, height: 60 },
        };
        return defaults[type] || { width: 100, height: 30 };
    }

    async function addElementToCanvas(
        el: { type: string; id?: number | null; x: number; y: number; width: number; height: number; font_size?: number | null; font_family?: string | null; font_color?: string | null; font_style?: string | null; text_align?: string | null; label?: string; default_image?: string | null },
        canvas: fabric.Canvas,
        currentScale: number
    ) {
        const left = mmToPx(el.x) * currentScale;
        const top = mmToPx(el.y) * currentScale;
        const width = mmToPx(el.width) * currentScale;
        const height = mmToPx(el.height) * currentScale;

        let obj: fabric.FabricObject;

        if (el.type === 'qr_code') {
            const qrDataUrl = await QRCode.toDataURL('https://certificate-gen.test/cert/PLACEHOLDER', {
                width: Math.round(width),
                margin: 0,
                color: { dark: '#000000', light: '#ffffff' },
            });
            const img = await fabric.Image.fromURL(qrDataUrl, { crossOrigin: 'anonymous' });
            img.set({
                left,
                top,
                originX: 'left',
                originY: 'top',
                scaleX: width / (img.width || 1),
                scaleY: height / (img.height || 1),
            });
            img.set('elementType', 'qr_code');
            img.set('elementId', el.id ?? null);
            obj = img;
        } else if (['signature', 'logo'].includes(el.type) && el.default_image) {
            try {
                const img = await fabric.Image.fromURL(`/storage/${el.default_image}`, { crossOrigin: 'anonymous' });
                img.set({
                    left,
                    top,
                    originX: 'left',
                    originY: 'top',
                    scaleX: width / (img.width || 1),
                    scaleY: height / (img.height || 1),
                });
                img.set('elementType', el.type);
                img.set('default_image', el.default_image);
                img.set('elementId', el.id ?? null);
                obj = img;
            } catch {
                const group = createPlaceholderGroup(el, left, top, width, height, currentScale);
                group.set('default_image', el.default_image ?? null);
                group.set('elementId', el.id ?? null);
                obj = group;
            }
        } else if (['qr_code', 'signature', 'logo'].includes(el.type)) {
            const group = createPlaceholderGroup(el, left, top, width, height, currentScale);
            group.set('default_image', el.default_image ?? null);
            group.set('elementId', el.id ?? null);
            obj = group;
        } else {
            const textAlign = (el.text_align || 'center') as 'left' | 'center' | 'right';
            const fontStyle = (el.font_style || 'normal') as 'normal' | 'italic';
            const color = el.font_color || '#000000';

            const text = new fabric.Text(el.label || el.type.replace('_', ' '), {
                left,
                top,
                originX: 'left',
                originY: 'top',
                width,
                fontSize: el.font_size || 20,
                fontFamily: el.font_family || 'Arial',
                fill: color,
                fontStyle: fontStyle === 'italic' ? 'italic' : 'normal',
                fontWeight: el.font_style === 'bold' ? 'bold' : 'normal',
                textAlign,
            });
            text.set('elementType', el.type);
            text.set('elementId', el.id ?? null);

            obj = text;
        }

        canvas.add(obj);
        canvas.renderAll();
    }

    function createPlaceholderGroup(
        el: { type: string; label?: string | null; id?: number | null },
        left: number,
        top: number,
        width: number,
        height: number,
        currentScale: number
    ) {
        const rect = new fabric.Rect({
            left,
            top,
            originX: 'left',
            originY: 'top',
            width,
            height,
            fill: 'transparent',
            stroke: ELEMENT_COLORS[el.type] || '#666',
            strokeWidth: 1 / currentScale,
            strokeDashArray: [4 / currentScale, 4 / currentScale],
            rx: 4 / currentScale,
            ry: 4 / currentScale,
        });

        const placeholderLabel = new fabric.Text(el.label?.toUpperCase() || el.type.replace('_', ' ').toUpperCase(), {
            left: left + width / 2,
            top: top + height / 2,
            originX: 'center',
            originY: 'center',
            fontSize: Math.min(10, height / 4),
            fill: ELEMENT_COLORS[el.type] || '#666',
            fontFamily: 'Arial',
        });

        const group = new fabric.Group([rect, placeholderLabel], {
            left,
            top,
            originX: 'left',
            originY: 'top',
            width,
            height,
        });
        group.set('elementType', el.type);
        group.set('elementId', el.id ?? null);
        return group;
    }

    async function handleDrop(type: ElementType) {
        const canvas = fabricRef.current;
        if (!canvas || !initialized.current) return;

        const defaults = getElementDefaults(type);

        const el = {
            type,
            x: pxToMm(50 / scale),
            y: pxToMm(50 / scale),
            width: pxToMm((defaults.width as number) / scale),
            height: pxToMm((defaults.height as number) / scale),
            font_size: (defaults.fontSize as number | undefined) ?? null,
            font_family: (defaults.fontFamily as string | undefined) ?? null,
            font_color: (defaults.fill as string | undefined) ?? null,
            font_style: null as string | null,
            text_align: 'center' as string | null,
            label: type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        };

        await addElementToCanvas(el, canvas, scale);

        toast.success(`${ELEMENT_TYPES.find((e) => e.type === type)?.label} element added`);
    }

    function updateElementProperty(path: string, value: unknown) {
        const canvas = fabricRef.current;
        if (!canvas || !selected) return;

        selected.set(path as keyof fabric.FabricObject, value);
        selected.setCoords();
        canvas.renderAll();

        const bounds = selected.getBoundingRect();
        setSelX(Math.round(pxToMm(bounds.left / scale) * 100) / 100);
        setSelY(Math.round(pxToMm(bounds.top / scale) * 100) / 100);
    }

    function updateElementPos(x: number, y: number, w: number, h: number) {
        const canvas = fabricRef.current;
        if (!canvas || !selected) return;

        selected.set({
            left: mmToPx(x) * scale,
            top: mmToPx(y) * scale,
            scaleX: mmToPx(w) * scale / ((selected.width ?? 1) || 1),
            scaleY: mmToPx(h) * scale / ((selected.height ?? 1) || 1),
        });
        selected.setCoords();
        canvas.renderAll();
    }

    function deleteSelected() {
        const canvas = fabricRef.current;
        if (!canvas || !selected) return;
        canvas.remove(selected);
        canvas.discardActiveObject();
        canvas.renderAll();
        setSelected(null);
        toast.success('Element deleted');
    }

    function getCsrfToken(): string {
        const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
        if (meta) return meta.content;
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        return '';
    }

    async function handleImageUpload(file: File | undefined) {
        if (!file || !selected || !fabricRef.current) return;

        const canvas = fabricRef.current;
        const formData = new FormData();
        formData.append('image', file);
        formData.append('type', selType);

        try {
            const response = await fetch(route('templates.elements.image.upload', template.id), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            const bounds = selected.getBoundingRect();
            const elementId = selected.get('elementId') as number | null;

            canvas.remove(selected);

            const img = await fabric.Image.fromURL(`/storage/${data.default_image}`);
            img.set({
                left: bounds.left,
                top: bounds.top,
                originX: 'left',
                originY: 'top',
                scaleX: bounds.width / (img.width || 1),
                scaleY: bounds.height / (img.height || 1),
            });
            img.set('elementType', selType);
            img.set('default_image', data.default_image);
            img.set('elementId', elementId);

            canvas.add(img);
            canvas.setActiveObject(img);
            canvas.renderAll();
            const newBounds = img.getBoundingRect();
            setSelected(img);
            setSelX(Math.round(pxToMm(newBounds.left / scale) * 100) / 100);
            setSelY(Math.round(pxToMm(newBounds.top / scale) * 100) / 100);
            setSelW(Math.round(pxToMm(newBounds.width / scale) * 100) / 100);
            setSelH(Math.round(pxToMm(newBounds.height / scale) * 100) / 100);

            toast.success('Image uploaded');
        } catch {
            toast.error('Failed to upload image');
        }
    }

    async function handleImageRemove() {
        if (!selected || !fabricRef.current) return;

        const canvas = fabricRef.current;
        const bounds = selected.getBoundingRect();
        const type = selected.get('elementType') as string;
        const elementId = selected.get('elementId') as number | null;

        try {
            const response = await fetch(route('templates.elements.image.delete', template.id), {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': getCsrfToken(),
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ type }),
            });

            if (!response.ok) throw new Error('Delete failed');

            canvas.remove(selected);

            const group = createPlaceholderGroup(
                { type, label: type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()), id: elementId },
                bounds.left,
                bounds.top,
                bounds.width,
                bounds.height,
                scale
            );

            canvas.add(group);
            canvas.setActiveObject(group);
            canvas.renderAll();
            const gBounds = group.getBoundingRect();
            setSelected(group);
            setSelX(Math.round(pxToMm(gBounds.left / scale) * 100) / 100);
            setSelY(Math.round(pxToMm(gBounds.top / scale) * 100) / 100);
            setSelW(Math.round(pxToMm(gBounds.width / scale) * 100) / 100);
            setSelH(Math.round(pxToMm(gBounds.height / scale) * 100) / 100);

            toast.success('Image removed');
        } catch {
            toast.error('Failed to remove image');
        }
    }

    function handleSave() {
        const canvas = fabricRef.current;
        if (!canvas) return;

        setSaving(true);
        const allObjects = canvas.getObjects();
        const elements: TemplateElement[] = allObjects
            .filter((obj) => obj.get('elementType'))
            .map((obj, index) => {
                const type = obj.get('elementType') as ElementType;
                const bounds = obj.getBoundingRect();

                const el: TemplateElement = {
                    type,
                    label: type.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
                    x: Math.round(pxToMm(bounds.left / scale) * 100) / 100,
                    y: Math.round(pxToMm(bounds.top / scale) * 100) / 100,
                    width: Math.round(pxToMm(bounds.width / scale) * 100) / 100,
                    height: Math.round(pxToMm(bounds.height / scale) * 100) / 100,
                    font_size: null,
                    font_family: null,
                    font_color: null,
                    font_style: null,
                    text_align: null,
                    default_image: (obj.get('default_image') as string | undefined) || null,
                    sort_order: index,
                };

                const elementId = obj.get('elementId') as number | undefined;
                if (elementId) {
                    el.id = elementId;
                }

                if ('fontSize' in obj) {
                    const textObj = obj as fabric.Text;
                    el.font_size = textObj.fontSize ?? null;
                    el.font_family = textObj.fontFamily ?? null;
                    el.font_color = (textObj.fill?.toString() || null) as string | null;
                    el.font_style = (textObj.fontStyle as 'normal' | 'bold' | 'italic') || 'normal';
                    el.text_align = (textObj.textAlign as 'left' | 'center' | 'right') || 'center';
                }

                return el;
            });

        router.post(
            route('templates.elements', template.id),
            { elements: JSON.parse(JSON.stringify(elements)) },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Elements saved successfully');
                    setSaving(false);
                },
                onError: () => {
                    toast.error('Failed to save elements');
                    setSaving(false);
                },
            }
        );
    }

    return (
        <AuthenticatedLayout header={template.name}>
            <Head title={template.name + ' — Designer'} />

            <div className="flex h-[calc(100vh-3.5rem)] -m-4 md:-m-6">
                <div className="w-56 shrink-0 border-r bg-card overflow-y-auto p-3 space-y-1">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                        Elements
                    </div>
                    {ELEMENT_TYPES.map(({ type, label, icon: Icon }) => (
                        <button
                            key={type}
                            onClick={() => handleDrop(type)}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                            <Icon className="h-4 w-4" style={{ color: ELEMENT_COLORS[type] }} />
                            {label}
                        </button>
                    ))}

                    <div className="border-t pt-3 mt-3">
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 px-1">
                            Actions
                        </div>
                        <Link href={route('templates.show', template.id)}>
                            <Button variant="outline" size="sm" className="w-full justify-start mb-1">
                                <Eye className="h-4 w-4" />
                                Preview
                            </Button>
                        </Link>
                        <Button
                            size="sm"
                            className="w-full justify-start"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            <Save className="h-4 w-4" />
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </div>

                <div ref={containerRef} className="flex-1 overflow-auto bg-muted/30 p-6">
                    <div
                        className="relative mx-auto shadow-xl border bg-white"
                        style={{
                            width: canvasSize.width,
                            height: canvasSize.height,
                        }}
                    >
                        <canvas ref={canvasRef} />
                    </div>
                    <div className="mt-2 text-center">
                        <span className="text-xs text-muted-foreground">
                            {template.orientation} — {template.page_width}×{template.page_height}mm (scale: {Math.round(scale * 100)}%)
                        </span>
                    </div>
                </div>

                <div className="w-64 shrink-0 border-l bg-card overflow-y-auto p-4 space-y-4">
                    <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Properties
                    </div>

                    {!selected ? (
                        <p className="text-sm text-muted-foreground">
                            Select an element to edit its properties
                        </p>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <Label className="text-xs">Element Type</Label>
                                <Input value={selType.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())} disabled />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-xs">X (mm)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={selX}
                                        onChange={(e) => {
                                            const v = parseFloat(e.target.value) || 0;
                                            setSelX(v);
                                            updateElementPos(v, selY, selW, selH);
                                        }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Y (mm)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={selY}
                                        onChange={(e) => {
                                            const v = parseFloat(e.target.value) || 0;
                                            setSelY(v);
                                            updateElementPos(selX, v, selW, selH);
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <Label className="text-xs">Width (mm)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={selW}
                                        onChange={(e) => {
                                            const v = parseFloat(e.target.value) || 1;
                                            setSelW(v);
                                            updateElementPos(selX, selY, v, selH);
                                        }}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Height (mm)</Label>
                                    <Input
                                        type="number"
                                        step="0.1"
                                        value={selH}
                                        onChange={(e) => {
                                            const v = parseFloat(e.target.value) || 1;
                                            setSelH(v);
                                            updateElementPos(selX, selY, selW, v);
                                        }}
                                    />
                                </div>
                            </div>

                            {['signature', 'logo'].includes(selType) && (
                                <div className="space-y-2">
                                    <Label className="text-xs">Default Image</Label>
                                    {selected?.get('default_image') ? (
                                        <div className="space-y-2">
                                            <img
                                                src={`/storage/${selected.get('default_image')}`}
                                                alt="Element preview"
                                                className="w-full h-24 object-contain rounded border"
                                            />
                                            <div className="flex gap-2">
                                                <label className="flex-1 cursor-pointer">
                                                    <div className="text-xs text-center py-1.5 rounded border border-input hover:bg-accent transition-colors">
                                                        Replace
                                                    </div>
                                                    <input
                                                        type="file"
                                                        accept="image/png,image/jpg,image/jpeg,image/gif,image/svg+xml"
                                                        className="hidden"
                                                        onChange={(e) => handleImageUpload(e.target.files?.[0])}
                                                    />
                                                </label>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1 text-xs"
                                                    onClick={handleImageRemove}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="flex cursor-pointer items-center justify-center rounded border border-dashed border-input h-20 hover:bg-accent transition-colors">
                                            <span className="text-xs text-muted-foreground">Upload Image</span>
                                            <input
                                                type="file"
                                                accept="image/png,image/jpg,image/jpeg,image/gif,image/svg+xml"
                                                className="hidden"
                                                onChange={(e) => handleImageUpload(e.target.files?.[0])}
                                            />
                                        </label>
                                    )}
                                </div>
                            )}

                            {!['qr_code', 'signature', 'logo'].includes(selType) && (
                                <>
                                    <div className="space-y-1">
                                        <Label className="text-xs">Font Size</Label>
                                        <Input
                                            type="number"
                                            value={selFontSize}
                                            onChange={(e) => {
                                                const v = parseInt(e.target.value) || 12;
                                                setSelFontSize(v);
                                                updateElementProperty('fontSize', v);
                                            }}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs">Font Family</Label>
                                        <Select
                                            value={selFontFamily}
                                            onValueChange={(v) => {
                                                if (v !== null) {
                                                    setSelFontFamily(v);
                                                    updateElementProperty('fontFamily', v);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Arial">Arial</SelectItem>
                                                <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                                                <SelectItem value="Courier New">Courier New</SelectItem>
                                                <SelectItem value="Georgia">Georgia</SelectItem>
                                                <SelectItem value="Verdana">Verdana</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs">Font Color</Label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="color"
                                                value={selFontColor}
                                                onChange={(e) => {
                                                    setSelFontColor(e.target.value);
                                                    updateElementProperty('fill', e.target.value);
                                                }}
                                                className="h-8 w-8 rounded border border-input cursor-pointer"
                                            />
                                            <Input
                                                value={selFontColor}
                                                onChange={(e) => {
                                                    setSelFontColor(e.target.value);
                                                    updateElementProperty('fill', e.target.value);
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs">Font Style</Label>
                                        <Select
                                            value={selFontStyle}
                                            onValueChange={(v) => {
                                                if (v !== null) {
                                                    setSelFontStyle(v);
                                                    updateElementProperty('fontStyle', v === 'italic' ? 'italic' : 'normal');
                                                    updateElementProperty('fontWeight', v === 'bold' ? 'bold' : 'normal');
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="bold">Bold</SelectItem>
                                                <SelectItem value="italic">Italic</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-1">
                                        <Label className="text-xs">Text Align</Label>
                                        <Select
                                            value={selTextAlign}
                                            onValueChange={(v) => {
                                                if (v !== null) {
                                                    setSelTextAlign(v);
                                                    updateElementProperty('textAlign', v);
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="left">Left</SelectItem>
                                                <SelectItem value="center">Center</SelectItem>
                                                <SelectItem value="right">Right</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}

                            <Button
                                variant="destructive"
                                size="sm"
                                className="w-full"
                                onClick={deleteSelected}
                            >
                                <Trash2 className="h-4 w-4" />
                                Delete Element
                            </Button>
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
