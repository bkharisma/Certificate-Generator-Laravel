import { Head, Link, usePage } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { useState, FormEventHandler } from 'react';
import {
    Award,
    Search,
    ShieldCheck,
    Mail,
    FolderKanban,
    LogIn,
    ArrowRight,
} from 'lucide-react';

interface Props {
    orgName: string;
}

export default function Home({ orgName }: Props) {
    const { auth } = usePage().props as { auth?: { user?: { id: number } } };
    const [certNumber, setCertNumber] = useState('');

    const handleSearch: FormEventHandler = (e) => {
        e.preventDefault();
        const trimmed = certNumber.trim();
        if (trimmed) {
            window.location.href = `/cert/${encodeURIComponent(trimmed)}`;
        }
    };

    return (
        <PublicLayout header={`${orgName}`}>
            <Head title={`${orgName} - Sistem Manajemen Sertifikat`} />

            <section className="flex flex-col items-center text-center py-16 md:py-24">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                    <Award className="h-10 w-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
                    {orgName}
                </h1>
                <p className="mt-4 max-w-2xl text-muted-foreground text-lg">
                    Sistem Manajemen dan Verifikasi Sertifikat Digital.
                    Generate, kirim, dan verifikasi sertifikat dengan mudah dan aman.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    {auth?.user ? (
                        <Link href={route('dashboard')}>
                            <Button size="lg">
                                <FolderKanban className="mr-2 h-5 w-5" />
                                Dashboard
                            </Button>
                        </Link>
                    ) : (
                        <Link href={route('login')}>
                            <Button size="lg">
                                <LogIn className="mr-2 h-5 w-5" />
                                Login
                            </Button>
                        </Link>
                    )}
                    <a href="#verify">
                        <Button variant="outline" size="lg">
                            <Search className="mr-2 h-5 w-5" />
                            Verifikasi Sertifikat
                        </Button>
                    </a>
                </div>
            </section>

            <section id="verify" className="py-12">
                <Card className="mx-auto max-w-xl">
                    <CardContent className="p-6 md:p-8">
                        <div className="mb-6 text-center">
                            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                <Search className="h-6 w-6 text-primary" />
                            </div>
                            <h2 className="text-xl font-semibold">Verifikasi Sertifikat</h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Masukkan nomor sertifikat untuk memverifikasi keasliannya.
                            </p>
                        </div>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                value={certNumber}
                                onChange={(e) => setCertNumber(e.target.value)}
                                placeholder="Contoh: CERT-2025-001"
                                className="flex-1"
                            />
                            <Button type="submit" disabled={!certNumber.trim()}>
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </section>

            <section className="py-12">
                <h2 className="mb-8 text-center text-2xl font-bold tracking-tight">
                    Fitur Utama
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardContent className="flex flex-col items-center p-6 text-center">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10">
                                <Award className="h-6 w-6 text-blue-500" />
                            </div>
                            <h3 className="font-semibold">Generate Sertifikat</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Buat sertifikat digital secara otomatis dengan template yang customizable.
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex flex-col items-center p-6 text-center">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                                <ShieldCheck className="h-6 w-6 text-green-500" />
                            </div>
                            <h3 className="font-semibold">Verifikasi Online</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Verifikasi keaslian sertifikat kapan saja melalui nomor sertifikat.
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex flex-col items-center p-6 text-center">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-500/10">
                                <Mail className="h-6 w-6 text-purple-500" />
                            </div>
                            <h3 className="font-semibold">Kirim Email</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Kirim sertifikat langsung ke email penerima secara massal.
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="flex flex-col items-center p-6 text-center">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10">
                                <FolderKanban className="h-6 w-6 text-orange-500" />
                            </div>
                            <h3 className="font-semibold">Manajemen Proyek</h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Kelola sertifikat per proyek pelatihan atau kegiatan dengan mudah.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {!auth?.user && (
                <section className="py-12 text-center">
                    <Card className="mx-auto max-w-lg">
                        <CardContent className="p-8">
                            <h2 className="text-xl font-semibold">Pengelola Sertifikat?</h2>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Login untuk mengelola template, proyek, dan sertifikat.
                            </p>
                            <Link href={route('login')} className="mt-4 inline-block">
                                <Button>
                                    <LogIn className="mr-2 h-4 w-4" />
                                    Login ke Dashboard
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </section>
            )}
        </PublicLayout>
    );
}
