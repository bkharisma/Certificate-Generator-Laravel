import { Head } from '@inertiajs/react';
import PublicLayout from '@/Layouts/PublicLayout';
import { Card, CardContent } from '@/Components/ui/card';
import { AlertCircle, Hash, User, Calendar, Ban } from 'lucide-react';

interface Props {
    certificateNumber: string;
    recipientName: string;
    revokedAt: string;
    revokeReason: string | null;
    orgName: string;
}

export default function CertificateRevoked({
    certificateNumber,
    recipientName,
    revokedAt,
    revokeReason,
    orgName,
}: Props) {
    return (
        <PublicLayout header={`${orgName} - Certificate Revoked`}>
            <Head title="Certificate Revoked" />

            <div className="flex flex-col items-center justify-center py-12">
                <Card className="w-full max-w-lg border-destructive/30">
                    <CardContent className="p-8 text-center">
                        <div className="mb-6 flex justify-center">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                                <Ban className="h-10 w-10 text-destructive" />
                            </div>
                        </div>

                        <h1 className="mb-2 text-2xl font-bold text-destructive">
                            Certificate Revoked
                        </h1>
                        <p className="mb-8 text-muted-foreground">
                            This certificate is no longer valid and has been officially revoked.
                        </p>

                        <div className="space-y-4 rounded-lg bg-muted/50 p-4 text-left">
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
                                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Revoked Date</p>
                                    <p className="font-medium">{revokedAt}</p>
                                </div>
                            </div>

                            {revokeReason && (
                                <div className="flex items-start gap-3">
                                    <AlertCircle className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Reason</p>
                                        <p className="font-medium">{revokeReason}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <p className="mt-6 text-xs text-muted-foreground">
                            {orgName} &mdash; Certificate Verification
                        </p>
                    </CardContent>
                </Card>
            </div>
        </PublicLayout>
    );
}
