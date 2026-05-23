import { Head, usePage } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

interface PublicLayoutProps {
    header?: string;
}

export default function PublicLayout({ header, children }: PropsWithChildren<PublicLayoutProps>) {
    const { app } = usePage().props as { app?: { name?: string; logo?: string | null } };

    return (
        <div className="flex min-h-screen flex-col bg-gray-50">
            <Head title={header} />

            <header className="sticky top-0 z-50 border-b bg-white shadow-xs">
                <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
                    <div className="flex items-center gap-2 font-semibold text-lg">
                        {app?.logo && (
                            <img src={`/storage/${app.logo}`} alt="" className="h-8 w-8 object-contain" />
                        )}
                        <span className="text-primary">{app?.name || 'Certificate'}</span>
                        <span className="text-muted-foreground">Verification</span>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                <div className="mx-auto max-w-5xl px-4 py-8">
                    {children}
                </div>
            </main>

            <footer className="border-t bg-white py-4 text-center text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} {app?.name || 'Certificate'} Verification System
            </footer>
        </div>
    );
}
