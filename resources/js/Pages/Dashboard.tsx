import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import {
    Award,
    FileText,
    FolderKanban,
    Users,
    Mail,
    Ban,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';

export default function Dashboard({ stats, recentActivity }: {
    stats: {
        totalCertificates: number;
        totalTemplates: number;
        totalProjects: number;
        totalRecipients: number;
        totalSent: number;
        totalRevoked: number;
    };
    recentActivity: {
        id: number;
        name: string;
        certificate_number: string;
        status: string;
        project_name: string;
        created_at: string;
    }[];
}) {
    const STATUS_BADGE: Record<string, string> = {
        generated: 'bg-blue-500/10 text-blue-600 border-blue-200',
        sent: 'bg-green-500/10 text-green-600 border-green-200',
        revoked: 'bg-red-500/10 text-red-600 border-red-200',
    };

    return (
        <AuthenticatedLayout header="Dashboard">
            <Head title="Dashboard" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Welcome back! Here's an overview of your certificates.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Certificates</CardTitle>
                            <Award className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalCertificates}</div>
                            <p className="text-xs text-muted-foreground">Certificates generated</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Templates</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalTemplates}</div>
                            <p className="text-xs text-muted-foreground">Active templates</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Projects</CardTitle>
                            <FolderKanban className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalProjects}</div>
                            <p className="text-xs text-muted-foreground">Active projects</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Recipients</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalRecipients}</div>
                            <p className="text-xs text-muted-foreground">Total recipients</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
                            <Mail className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats.totalSent}</div>
                            <p className="text-xs text-muted-foreground">Successfully delivered</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Revoked</CardTitle>
                            <Ban className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.totalRevoked}</div>
                            <p className="text-xs text-muted-foreground">Revoked certificates</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Recipients</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalRecipients}</div>
                            <p className="text-xs text-muted-foreground">Recipients / {stats.totalCertificates} certified</p>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {recentActivity.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Award className="h-10 w-10 text-muted-foreground/40 mb-3" />
                                <p className="text-sm text-muted-foreground">No activity yet</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">
                                    Generate certificates to see activity here.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {recentActivity.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Badge variant="outline" className={`${STATUS_BADGE[item.status] || ''} shrink-0`}>
                                                {item.status === 'generated' && <CheckCircle2 className="h-3 w-3 mr-1 inline" />}
                                                {item.status === 'sent' && <Mail className="h-3 w-3 mr-1 inline" />}
                                                {item.status === 'revoked' && <Ban className="h-3 w-3 mr-1 inline" />}
                                                {item.status}
                                            </Badge>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{item.name}</p>
                                                <p className="text-xs text-muted-foreground truncate">{item.project_name} — {item.certificate_number}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs text-muted-foreground">{item.created_at}</span>
                                            <Link href={route('certificates.show', item.id)}>
                                                <Button variant="ghost" size="icon-xs">
                                                    <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
