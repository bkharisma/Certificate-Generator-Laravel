import { router, usePage } from '@inertiajs/react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, Send } from 'lucide-react';

interface Settings {
    app_name: string;
    app_logo: string | null;
    favicon: string | null;
    mail_mailer: string;
    mail_host: string;
    mail_port: string;
    mail_encryption: string;
    mail_username: string | null;
    mail_password: string | null;
    mail_from_address: string | null;
    mail_from_name: string | null;
}

export default function Index({ settings }: { settings: Settings }) {
    const [appName, setAppName] = useState(settings.app_name);
    const [appLogo, setAppLogo] = useState<File | null>(null);
    const [favicon, setFavicon] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);

    const [mailMailer, setMailMailer] = useState(settings.mail_mailer);
    const [mailHost, setMailHost] = useState(settings.mail_host);
    const [mailPort, setMailPort] = useState(settings.mail_port);
    const [mailEncryption, setMailEncryption] = useState(settings.mail_encryption);
    const [mailUsername, setMailUsername] = useState(settings.mail_username || '');
    const [mailPassword, setMailPassword] = useState(settings.mail_password || '');
    const [mailFromAddress, setMailFromAddress] = useState(settings.mail_from_address || '');
    const [mailFromName, setMailFromName] = useState(settings.mail_from_name || '');
    const [testEmail, setTestEmail] = useState('');
    const [testingMail, setTestingMail] = useState(false);

    const { errors } = usePage().props;

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);

        const form = new FormData();
        form.append('app_name', appName);
        if (appLogo) form.append('app_logo', appLogo);
        if (favicon) form.append('favicon', favicon);
        form.append('mail_mailer', mailMailer);
        form.append('mail_host', mailHost);
        form.append('mail_port', mailPort);
        form.append('mail_encryption', mailEncryption);
        form.append('mail_username', mailUsername);
        form.append('mail_password', mailPassword);
        form.append('mail_from_address', mailFromAddress);
        form.append('mail_from_name', mailFromName);

        router.post(route('settings.update'), form, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Settings saved successfully');
                setSaving(false);
            },
            onError: () => {
                toast.error('Failed to save settings');
                setSaving(false);
            },
        });
    }

    async function handleTestMail() {
        if (!testEmail) {
            toast.error('Enter an email address to test');
            return;
        }
        setTestingMail(true);
        try {
            const response = await fetch(route('settings.test-mail'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': getCsrfToken(),
                },
                credentials: 'include',
                body: JSON.stringify({ test_email: testEmail }),
            });
            const data = await response.json();
            if (response.ok) {
                toast.success(data.message);
            } else {
                toast.error(data.error || 'Failed to send test email');
            }
        } catch {
            toast.error('Failed to send test email');
        }
        setTestingMail(false);
    }

    function getCsrfToken(): string {
        const meta = document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
        if (meta) return meta.content;
        const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
        if (match) return decodeURIComponent(match[1]);
        return '';
    }

    return (
        <AuthenticatedLayout header="Settings">
            <Head title="Settings" />

            <div className="space-y-6 max-w-2xl">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">
                        Manage application and mail settings
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>General</CardTitle>
                            <CardDescription>
                                Configure your application name and branding
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="app_name">Application Name</Label>
                                <Input
                                    id="app_name"
                                    value={appName}
                                    onChange={(e) => setAppName(e.target.value)}
                                />
                                {errors?.app_name && (
                                    <p className="text-sm text-destructive">{errors.app_name as string}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="app_logo">App Logo (PNG/JPG)</Label>
                                <Input
                                    id="app_logo"
                                    type="file"
                                    accept="image/png,image/jpeg,image/jpg"
                                    onChange={(e) => setAppLogo(e.target.files?.[0] || null)}
                                />
                                {settings.app_logo && (
                                    <div className="mt-2">
                                        <img
                                            src={`/storage/${settings.app_logo}`}
                                            alt="Current logo"
                                            className="h-12 object-contain"
                                        />
                                    </div>
                                )}
                                {errors?.app_logo && (
                                    <p className="text-sm text-destructive">{errors.app_logo as string}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="favicon">Favicon (PNG/SVG)</Label>
                                <Input
                                    id="favicon"
                                    type="file"
                                    accept="image/png,image/svg+xml"
                                    onChange={(e) => setFavicon(e.target.files?.[0] || null)}
                                />
                                {errors?.favicon && (
                                    <p className="text-sm text-destructive">{errors.favicon as string}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Mail className="h-5 w-5" />
                                Mail Settings (Gmail)
                            </CardTitle>
                            <CardDescription>
                                Configure SMTP to send certificate emails. Use a Gmail App Password, not your regular password.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Mailer</Label>
                                    <Select value={mailMailer} onValueChange={(v) => v && setMailMailer(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="smtp">SMTP</SelectItem>
                                            <SelectItem value="sendmail">Sendmail</SelectItem>
                                            <SelectItem value="log">Log (debug)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Encryption</Label>
                                    <Select value={mailEncryption} onValueChange={(v) => v && setMailEncryption(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="tls">TLS</SelectItem>
                                            <SelectItem value="ssl">SSL</SelectItem>
                                            <SelectItem value="none">None</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label>SMTP Host</Label>
                                    <Input
                                        value={mailHost}
                                        onChange={(e) => setMailHost(e.target.value)}
                                        placeholder="smtp.gmail.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Port</Label>
                                    <Input
                                        type="number"
                                        value={mailPort}
                                        onChange={(e) => setMailPort(e.target.value)}
                                        placeholder="587"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Username (Gmail Address)</Label>
                                <Input
                                    value={mailUsername}
                                    onChange={(e) => setMailUsername(e.target.value)}
                                    placeholder="your-email@gmail.com"
                                    type="email"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Password (Gmail App Password)</Label>
                                <Input
                                    type="password"
                                    value={mailPassword}
                                    onChange={(e) => setMailPassword(e.target.value)}
                                    placeholder="xxxx xxxx xxxx xxxx"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Generate at: Google Account → Security → App Passwords
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>From Address</Label>
                                    <Input
                                        type="email"
                                        value={mailFromAddress}
                                        onChange={(e) => setMailFromAddress(e.target.value)}
                                        placeholder="your-email@gmail.com"
                                    />
                                    {errors?.mail_from_address && (
                                        <p className="text-sm text-destructive">{errors.mail_from_address as string}</p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>From Name</Label>
                                    <Input
                                        value={mailFromName}
                                        onChange={(e) => setMailFromName(e.target.value)}
                                        placeholder={settings.app_name}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 border-t">
                                <Label>Test Email</Label>
                                <div className="flex gap-2 mt-2">
                                    <Input
                                        type="email"
                                        value={testEmail}
                                        onChange={(e) => setTestEmail(e.target.value)}
                                        placeholder="recipient@example.com"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleTestMail}
                                        disabled={testingMail}
                                    >
                                        <Send className="h-4 w-4 mr-1" />
                                        {testingMail ? 'Sending...' : 'Test'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Settings'}
                        </Button>
                    </div>
                </form>
            </div>
        </AuthenticatedLayout>
    );
}
