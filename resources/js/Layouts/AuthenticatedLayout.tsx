import { Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';
import type { User as UserType } from '@/types';
import {
    LayoutDashboard,
    FileText,
    FolderKanban,
    Award,
    Settings,
    LogOut,
    User,
    Menu,
    ChevronDown,
    Users,
} from 'lucide-react';
import { Button } from '@/Components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Separator } from '@/Components/ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '@/Components/ui/sheet';
import { Toaster } from '@/Components/ui/sonner';
import { TooltipProvider } from '@/Components/ui/tooltip';

interface NavItem {
    label: string;
    href: string;
    icon: ReactNode;
}

const defaultNavItems: NavItem[] = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
        label: 'Templates',
        href: '/templates',
        icon: <FileText className="h-4 w-4" />,
    },
    {
        label: 'Projects',
        href: '/projects',
        icon: <FolderKanban className="h-4 w-4" />,
    },
    {
        label: 'Certificates',
        href: '/certificates',
        icon: <Award className="h-4 w-4" />,
    },
];

const adminNavItems: NavItem[] = [
    {
        label: 'Users',
        href: '/users',
        icon: <Users className="h-4 w-4" />,
    },
];

const bottomNavItems: NavItem[] = [
    {
        label: 'Settings',
        href: '/settings',
        icon: <Settings className="h-4 w-4" />,
    },
];

function SidebarContent({ currentPath, user, app }: { currentPath: string; user: { roles?: string[] }; app?: { name?: string; logo?: string | null } }) {
    const isAdmin = user.roles?.includes('admin');
    const navItems = isAdmin ? [...defaultNavItems, ...adminNavItems] : defaultNavItems;

    return (
        <div className="flex h-full flex-col">
            <div className="flex h-14 items-center border-b px-4">
                <Link href="/dashboard" className="flex items-center gap-2">
                    {app?.logo ? (
                        <img src={`/storage/${app.logo}`} alt="Logo" className="h-8 w-8 object-contain" />
                    ) : (
                        <Award className="h-6 w-6 text-primary" />
                    )}
                    <span className="font-semibold text-lg">{app?.name || 'CertGen'}</span>
                </Link>
            </div>

            <nav className="flex-1 space-y-1 px-2 py-4">
                {navItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                            currentPath === item.href || currentPath.startsWith(item.href + '/')
                                ? 'bg-accent text-accent-foreground'
                                : 'text-muted-foreground'
                        }`}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                ))}
            </nav>

            <Separator />

            <nav className="space-y-1 px-2 py-4">
                {bottomNavItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                            currentPath === item.href
                                ? 'bg-accent text-accent-foreground'
                                : 'text-muted-foreground'
                        }`}
                    >
                        {item.icon}
                        {item.label}
                    </Link>
                ))}
            </nav>
        </div>
    );
}

export default function AuthenticatedLayout({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const props = usePage().props as { auth: { user: UserType }; app?: { name?: string; logo?: string | null } };
    const user = props.auth.user;
    const { app } = props;
    const url = usePage().url;

    return (
        <TooltipProvider>
            <div className="flex h-screen overflow-hidden">
                <aside className="hidden w-64 shrink-0 border-r bg-card md:block">
                    <SidebarContent currentPath={url} user={user} app={app} />
                </aside>

                <div className="flex flex-1 flex-col overflow-hidden">
                    <header className="flex h-14 items-center justify-between border-b bg-card px-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <Sheet>
                                <SheetTrigger
                                    className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hidden"
                                    render={
                                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                        </svg>
                                    }
                                />
                                <SheetContent side="left" className="w-64 p-0">
                                    <SidebarContent currentPath={url} user={user} app={app} />
                                </SheetContent>
                            </Sheet>

                            {header && (
                                <div className="text-lg font-semibold">{header}</div>
                            )}
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger
                                className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
                                render={
                                    <>
                                        <Avatar className="h-8 w-8">
                                            <AvatarFallback className="text-xs">
                                                {user.name
                                                    .split(' ')
                                                    .map((n: string) => n[0])
                                                    .join('')
                                                    .toUpperCase()
                                                    .slice(0, 2)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="hidden font-medium sm:inline-block">
                                            {user.name}
                                        </span>
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    </>
                                }
                            />
                            <DropdownMenuContent align="end" className="w-56">
                                <div className="flex items-center gap-2 p-2">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{user.name}</p>
                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="flex items-center gap-2"
                                    onClick={() => router.visit(route('profile.edit'))}
                                >
                                    <User className="h-4 w-4" />
                                    Profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="flex items-center gap-2 text-destructive"
                                    onClick={() => {
                                        const form = document.createElement('form');
                                        form.method = 'POST';
                                        form.action = route('logout');
                                        const token = document.createElement('input');
                                        token.type = 'hidden';
                                        token.name = '_token';
                                        token.value = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
                                        form.appendChild(token);
                                        document.body.appendChild(form);
                                        form.submit();
                                    }}
                                >
                                    <LogOut className="h-4 w-4" />
                                    Log Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </header>

                    <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6">
                        {children}
                    </main>
                </div>
            </div>
            <Toaster />
        </TooltipProvider>
    );
}
