import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { buttonVariants } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import { Award, Download, ExternalLink, Calendar, Hash, User, Building2 } from 'lucide-react';

interface Props {
    certificateNumber: string;
    recipientName: string;
    projectName: string;
    date: string;
    pdfUrl: string | null;
    orgName: string;
    downloadUrl: string;
}

export default function CertificateViewer({
    certificateNumber,
    recipientName,
    projectName,
    date,
    pdfUrl,
    orgName,
    downloadUrl,
}: Props) {
    return (
        <PublicLayout header={`${orgName} - Certificate Verification`}>
            <Head title={`Certificate - ${recipientName}`} />

            <div className="mb-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                            <Award className="h-6 w-6 text-primary" />
                            Digital Certificate
                        </h1>
                        <p className="text-muted-foreground text-sm">{orgName}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="px-3 py-1 text-xs">Verified</Badge>
                        <a
                            href={downloadUrl}
                            download
                            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                            <Download className="mr-1 h-4 w-4" />
                            Download PDF
                        </a>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2">
                    <Card className="overflow-hidden">
                        <CardContent className="p-0">
                            {pdfUrl ? (
                                <iframe
                                    src={pdfUrl}
                                    className="h-[400px] sm:h-[600px] w-full border-0"
                                    title="Certificate PDF"
                                />
                            ) : (
                                <div className="flex h-[400px] items-center justify-center text-muted-foreground">
                                    <p>Certificate file is not available.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardContent className="p-4 space-y-4">
                            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                Certificate Information
                            </h2>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <User className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Recipient</p>
                                        <p className="font-medium">{recipientName}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Hash className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Certificate Number</p>
                                        <p className="font-medium font-mono text-sm">{certificateNumber}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Building2 className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Project</p>
                                        <p className="font-medium">{projectName}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Issue Date</p>
                                        <p className="font-medium">{date}</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 space-y-2">
                            <a
                                href={downloadUrl}
                                download
                                className={cn(buttonVariants({ variant: "default", className: "w-full" }))}
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download Certificate
                            </a>
                            {pdfUrl && (
                                <a
                                    href={pdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(buttonVariants({ variant: "outline", className: "w-full" }))}
                                >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    Open in New Tab
                                </a>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PublicLayout>
    );
}
