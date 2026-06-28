import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { route } from '@/lib/route';
import toast from 'react-hot-toast';
import { Plus, Search } from 'lucide-react';
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal';
import { TableActions } from '@/components/table-actions';

type AdNetwork = {
    id: string;
    name: string;
    slug: string;
    provider: string;
    is_active: boolean;
    priority: number;
    ad_units_count: number;
};

type Props = {
    adNetworks: {
        data: AdNetwork[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

type AdNetworkFormData = {
    name: string;
    slug: string;
    provider: string;
    is_active: boolean;
    priority: number;
};

const providers = [
    { value: 'admob', label: 'Google AdMob' },
    { value: 'facebook', label: 'Facebook Audience Network' },
    { value: 'unity', label: 'Unity Ads' },
    { value: 'applovin', label: 'AppLovin' },
    { value: 'ironsource', label: 'IronSource' },
    { value: 'custom', label: 'Custom' },
];

export default function AdNetworksIndex({ adNetworks }: Props) {
    const [search, setSearch] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingNetwork, setEditingNetwork] = useState<AdNetwork | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [networkToDelete, setNetworkToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const { data, setData, post, put, processing, errors, reset } = useForm<AdNetworkFormData>({
        name: '',
        slug: '',
        provider: '',
        is_active: true,
        priority: 1,
    });

    const handleOpenDialog = (network?: AdNetwork) => {
        if (network) {
            setEditingNetwork(network);
            setData({
                name: network.name,
                slug: network.slug,
                provider: network.provider,
                is_active: network.is_active,
                priority: network.priority,
            });
        } else {
            setEditingNetwork(null);
            reset();
        }
        setDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submitPromise = new Promise((resolve, reject) => {
            if (editingNetwork) {
                put(route('admin.ad-networks.update', editingNetwork.id), {
                    onSuccess: () => {
                        setDialogOpen(false);
                        reset();
                        setEditingNetwork(null);
                        resolve('success');
                    },
                    onError: (errors) => {
                        const firstError = Object.values(errors)[0];
                        reject(firstError || 'Failed to update ad network');
                    },
                });
            } else {
                post(route('admin.ad-networks.store'), {
                    onSuccess: () => {
                        setDialogOpen(false);
                        reset();
                        resolve('success');
                    },
                    onError: (errors) => {
                        const firstError = Object.values(errors)[0];
                        reject(firstError || 'Failed to create ad network');
                    },
                });
            }
        });

        toast.promise(submitPromise, {
            loading: editingNetwork ? 'Updating ad network...' : 'Creating ad network...',
            success: editingNetwork ? 'Ad network updated successfully!' : 'Ad network created successfully!',
            error: (err) => err.toString(),
        });
    };

    const handleToggle = (network: AdNetwork) => {
        router.post(
            route('admin.ad-networks.toggle', network.id),
            {},
            {
                onSuccess: () => {
                    toast.success(`Ad network ${network.is_active ? 'disabled' : 'enabled'} successfully`);
                },
            }
        );
    };

    const handleDelete = (networkId: string) => {
        setNetworkToDelete(networkId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!networkToDelete) return;

        setIsDeleting(true);

        const deletePromise = new Promise((resolve, reject) => {
            router.delete(route('admin.ad-networks.destroy', networkToDelete), {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setNetworkToDelete(null);
                    setIsDeleting(false);
                    resolve('success');
                },
                onError: () => {
                    setIsDeleting(false);
                    reject('Failed to delete ad network');
                },
            });
        });

        toast.promise(deletePromise, {
            loading: 'Deleting ad network...',
            success: 'Ad network deleted successfully!',
            error: 'Could not delete ad network',
        });
    };

    // Auto-generate slug from name
    const handleNameChange = (name: string) => {
        setData('name', name);
        if (!editingNetwork) {
            const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            setData('slug', slug);
        }
    };

    return (
        <>
            <Head title="Ad Networks" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Ad Networks</h1>
                    <p className="text-sm text-muted-foreground">
                        Manage advertising networks and providers
                    </p>
                </div>

                {/* Ad Networks Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Ad Networks ({adNetworks.total})</CardTitle>
                                <CardDescription>
                                    Configure advertising networks for your applications
                                </CardDescription>
                            </div>
                            <Button onClick={() => handleOpenDialog()}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Ad Network
                            </Button>
                        </div>

                        {/* Search */}
                        <div className="relative pt-4">
                            <Search className="absolute left-2.5 top-6.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search ad networks..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-8"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        {adNetworks.data.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No ad networks configured yet</p>
                                <Button className="mt-4" onClick={() => handleOpenDialog()}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Your First Ad Network
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Provider</TableHead>
                                            <TableHead>Ad Units</TableHead>
                                            <TableHead>Priority</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {adNetworks.data.map((network) => (
                                            <TableRow key={network.id}>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{network.name}</div>
                                                        <code className="text-xs text-muted-foreground">
                                                            {network.slug}
                                                        </code>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {providers.find((p) => p.value === network.provider)?.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge>{network.ad_units_count}</Badge>
                                                </TableCell>
                                                <TableCell>{network.priority}</TableCell>
                                                <TableCell>
                                                    <Switch
                                                        checked={network.is_active}
                                                        onCheckedChange={() => handleToggle(network)}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <TableActions
                                                        onEdit={() => handleOpenDialog(network)}
                                                        onDelete={() => handleDelete(network.id)}
                                                        showView={false}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                {adNetworks.last_page > 1 && (
                                    <div className="flex items-center justify-between pt-4 border-t mt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Showing page {adNetworks.current_page} of {adNetworks.last_page} ({adNetworks.total} total)
                                        </p>
                                        <div className="flex gap-1">
                                            {/* Previous Button */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    router.get(
                                                        route('admin.ad-networks.index'),
                                                        { page: adNetworks.current_page - 1 },
                                                        { preserveState: true }
                                                    )
                                                }
                                                disabled={adNetworks.current_page === 1}
                                            >
                                                Previous
                                            </Button>

                                            {/* Page Numbers */}
                                            {Array.from({ length: Math.min(adNetworks.last_page, 10) }, (_, i) => {
                                                const page = i + 1;
                                                if (
                                                    page <= 3 ||
                                                    page > adNetworks.last_page - 3 ||
                                                    Math.abs(page - adNetworks.current_page) <= 1
                                                ) {
                                                    return (
                                                        <Button
                                                            key={page}
                                                            variant={
                                                                adNetworks.current_page === page
                                                                    ? 'default'
                                                                    : 'outline'
                                                            }
                                                            size="sm"
                                                            onClick={() =>
                                                                router.get(
                                                                    route('admin.ad-networks.index'),
                                                                    { page },
                                                                    { preserveState: true }
                                                                )
                                                            }
                                                        >
                                                            {page}
                                                        </Button>
                                                    );
                                                } else if (page === 4 || page === adNetworks.last_page - 3) {
                                                    return (
                                                        <span key={page} className="px-2 flex items-center">
                                                            ...
                                                        </span>
                                                    );
                                                }
                                                return null;
                                            })}

                                            {/* Next Button */}
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    router.get(
                                                        route('admin.ad-networks.index'),
                                                        { page: adNetworks.current_page + 1 },
                                                        { preserveState: true }
                                                    )
                                                }
                                                disabled={adNetworks.current_page === adNetworks.last_page}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingNetwork ? 'Edit Ad Network' : 'Add New Ad Network'}
                        </DialogTitle>
                        <DialogDescription>
                            Configure advertising network settings
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Network Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="Google AdMob"
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && (
                                <p className="text-sm font-medium text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">
                                Slug <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="slug"
                                value={data.slug}
                                onChange={(e) => setData('slug', e.target.value)}
                                placeholder="google-admob"
                                className={errors.slug ? 'border-red-500' : ''}
                            />
                            {errors.slug && (
                                <p className="text-sm font-medium text-red-600">{errors.slug}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="provider">
                                Provider <span className="text-red-500">*</span>
                            </Label>
                            <Select value={data.provider} onValueChange={(value) => setData('provider', value)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select provider" />
                                </SelectTrigger>
                                <SelectContent>
                                    {providers.map((provider) => (
                                        <SelectItem key={provider.value} value={provider.value}>
                                            {provider.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.provider && (
                                <p className="text-sm font-medium text-red-600">{errors.provider}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Input
                                id="priority"
                                type="number"
                                min="1"
                                max="100"
                                value={data.priority}
                                onChange={(e) => setData('priority', parseInt(e.target.value))}
                            />
                            <p className="text-xs text-muted-foreground">
                                Higher number = higher priority
                            </p>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label>Active</Label>
                                <p className="text-sm text-muted-foreground">
                                    Enable this ad network
                                </p>
                            </div>
                            <Switch
                                checked={data.is_active}
                                onCheckedChange={(checked) => setData('is_active', checked)}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : editingNetwork ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Are you sure you want to delete this ad network?"
                description="This action cannot be undone. The ad network will be permanently deleted."
                confirmText="Delete ad network"
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
            />
        </>
    );
}

AdNetworksIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Ad Networks', href: '/admin/ad-networks' },
    ],
};
