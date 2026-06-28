import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { route } from '@/lib/route';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Copy, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal';
import { TableActions } from '@/components/table-actions';

type Application = {
    id: string;
    name: string;
    package_name: string;
};

type ApiKey = {
    id: string;
    name: string;
    key_preview: string;
    last_used_at?: string;
    expires_at?: string;
    is_active: boolean;
    created_at: string;
    creator?: {
        name: string;
        email: string;
    };
};

type Props = {
    application: Application;
    apiKeys: ApiKey[];
};

type ApiKeyFormData = {
    name: string;
    expires_days?: number;
};

export default function ApiKeysIndex({ application, apiKeys }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [apiKeyToDelete, setApiKeyToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm<ApiKeyFormData>({
        name: '',
        expires_days: undefined,
    });

    const handleOpenDialog = () => {
        setGeneratedKey(null);
        reset();
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            // Make direct fetch call to get JSON response
            const response = await fetch(route('admin.applications.api-keys.store', application.id), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok && result.plain_key) {
                setGeneratedKey(result.plain_key);
                toast.success('API key generated successfully!');
                
                // Reload the page to show the new key in the table
                setTimeout(() => {
                    router.reload({ only: ['apiKeys'] });
                }, 2000);
            } else {
                throw new Error(result.message || 'Failed to generate API key');
            }
        } catch (error: any) {
            toast.error(error.message || 'Failed to generate API key');
        }
    };

    const handleCopyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        toast.success('API key copied to clipboard!');
    };

    const handleRevoke = (apiKeyId: string) => {
        router.post(
            route('admin.applications.api-keys.revoke', [application.id, apiKeyId]),
            {},
            {
                onSuccess: () => {
                    toast.success('API key revoked successfully');
                },
            }
        );
    };

    const handleDelete = (apiKeyId: string) => {
        setApiKeyToDelete(apiKeyId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!apiKeyToDelete) return;

        setIsDeleting(true);

        const deletePromise = new Promise((resolve, reject) => {
            router.delete(route('admin.applications.api-keys.destroy', [application.id, apiKeyToDelete]), {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setApiKeyToDelete(null);
                    setIsDeleting(false);
                    resolve('success');
                },
                onError: () => {
                    setIsDeleting(false);
                    reject('Failed to delete API key');
                },
            });
        });

        toast.promise(deletePromise, {
            loading: 'Deleting API key...',
            success: 'API key deleted successfully!',
            error: 'Could not delete API key',
        });
    };

    return (
        <>
            <Head title={`API Keys - ${application.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('admin.applications.show', application.id)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">API Keys</h1>
                        <p className="text-sm text-muted-foreground">
                            {application.name} - {application.package_name}
                        </p>
                    </div>
                </div>

                {/* API Keys Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>API Keys ({apiKeys.length})</CardTitle>
                                <CardDescription>
                                    Manage API keys for application authentication
                                </CardDescription>
                            </div>
                            <Button onClick={handleOpenDialog}>
                                <Plus className="mr-2 h-4 w-4" />
                                Generate API Key
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {apiKeys.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No API keys generated yet</p>
                                <Button className="mt-4" onClick={handleOpenDialog}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Generate Your First API Key
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Key Preview</TableHead>
                                        <TableHead>Last Used</TableHead>
                                        <TableHead>Expires</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Created</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {apiKeys.map((apiKey) => (
                                        <TableRow key={apiKey.id}>
                                            <TableCell>
                                                <div className="font-medium">{apiKey.name}</div>
                                                {apiKey.creator && (
                                                    <div className="text-xs text-muted-foreground">
                                                        by {apiKey.creator.name}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-xs">{apiKey.key_preview}</code>
                                            </TableCell>
                                            <TableCell>
                                                {apiKey.last_used_at ? (
                                                    <span className="text-sm">
                                                        {new Date(apiKey.last_used_at).toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">
                                                        Never
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {apiKey.expires_at ? (
                                                    <span className="text-sm">
                                                        {new Date(apiKey.expires_at).toLocaleDateString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">
                                                        Never
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={apiKey.is_active ? 'default' : 'secondary'}
                                                >
                                                    {apiKey.is_active ? 'Active' : 'Revoked'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">
                                                    {new Date(apiKey.created_at).toLocaleDateString()}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {apiKey.is_active && (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleRevoke(apiKey.id)}
                                                        >
                                                            <Ban className="mr-2 h-4 w-4" />
                                                            Revoke
                                                        </Button>
                                                    )}
                                                    <TableActions
                                                        onDelete={() => handleDelete(apiKey.id)}
                                                        showView={false}
                                                        showEdit={false}
                                                    />
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Generate API Key Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Generate New API Key</DialogTitle>
                        <DialogDescription>
                            {generatedKey
                                ? 'Your API key has been generated. Copy it now as it will not be shown again.'
                                : 'Create a new API key for authentication'}
                        </DialogDescription>
                    </DialogHeader>

                    {generatedKey ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Your API Key</Label>
                                <div className="flex gap-2">
                                    <Input value={generatedKey} readOnly className="font-mono" />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleCopyKey(generatedKey)}
                                    >
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                </div>
                                <p className="text-sm text-red-600 font-medium">
                                    Make sure to copy this key now. You won't be able to see it again!
                                </p>
                            </div>
                            <DialogFooter>
                                <Button onClick={() => setDialogOpen(false)}>Done</Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">
                                    Key Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Production API Key"
                                />
                                {errors.name && (
                                    <p className="text-sm font-medium text-red-600">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="expires_days">Expires In (Days)</Label>
                                <Input
                                    id="expires_days"
                                    type="number"
                                    min="1"
                                    value={data.expires_days || ''}
                                    onChange={(e) =>
                                        setData('expires_days', e.target.value ? parseInt(e.target.value) : undefined)
                                    }
                                    placeholder="Leave empty for no expiration"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Leave empty if you don't want the key to expire
                                </p>
                            </div>

                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Generating...' : 'Generate Key'}
                                </Button>
                            </DialogFooter>
                        </form>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Are you sure you want to delete this API key?"
                description="This action cannot be undone. Any requests using this key will fail."
                confirmText="Delete API key"
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
            />
        </>
    );
}

ApiKeysIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Applications', href: '/admin/applications' },
        { title: 'API Keys' },
    ],
};
