import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { route } from '@/lib/route';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, Power, PowerOff, Search } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal';
import { TableActions } from '@/components/table-actions';

type Application = {
    id: string;
    name: string;
    package_name: string;
    platform: string;
};

type AdNetwork = {
    id: string;
    name: string;
    provider: string;
    is_active: boolean;
};

type AdUnit = {
    id: string;
    ad_type: string;
    ad_unit_id: string;
    is_enabled: boolean;
    frequency?: number;
    priority?: number;
    description?: string;
    ad_network: AdNetwork;
};

type Props = {
    application: Application;
    adUnits: AdUnit[];
    adNetworks: AdNetwork[];
};

type AdUnitFormData = {
    ad_network_id: string;
    ad_type: string;
    encrypted_ad_unit_id: string;
    is_enabled: boolean;
    frequency?: number;
    priority?: number;
    description?: string;
};

const adTypes = [
    { value: 'banner', label: 'Banner Ad' },
    { value: 'interstitial', label: 'Interstitial Ad' },
    { value: 'rewarded', label: 'Rewarded Ad' },
    { value: 'rewarded_interstitial', label: 'Rewarded Interstitial' },
    { value: 'native', label: 'Native Ad' },
    { value: 'app_open', label: 'App Open Ad' },
];

export default function AdUnitsIndex({ application, adUnits, adNetworks }: Props) {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [adTypeFilter, setAdTypeFilter] = useState<string>('all');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingAdUnit, setEditingAdUnit] = useState<AdUnit | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [adUnitToDelete, setAdUnitToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedAdUnits, setSelectedAdUnits] = useState<string[]>([]);

    // Filter ad units based on search and filters
    const filteredAdUnits = adUnits.filter((adUnit) => {
        const matchesSearch = search === '' || 
            adUnit.ad_unit_id.toLowerCase().includes(search.toLowerCase()) ||
            adTypes.find((t) => t.value === adUnit.ad_type)?.label.toLowerCase().includes(search.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || 
            (statusFilter === 'enabled' && adUnit.is_enabled) ||
            (statusFilter === 'disabled' && !adUnit.is_enabled);
        
        const matchesAdType = adTypeFilter === 'all' || adUnit.ad_type === adTypeFilter;
        
        return matchesSearch && matchesStatus && matchesAdType;
    });

    const { data, setData, post, put, processing, errors, reset } = useForm<AdUnitFormData>({
        ad_network_id: '',
        ad_type: '',
        encrypted_ad_unit_id: '',
        is_enabled: true,
        frequency: 1,
        priority: 1,
        description: '',
    });

    const handleOpenDialog = (adUnit?: AdUnit) => {
        if (adUnit) {
            setEditingAdUnit(adUnit);
            setData({
                ad_network_id: adUnit.ad_network.id,
                ad_type: adUnit.ad_type,
                encrypted_ad_unit_id: adUnit.ad_unit_id,
                is_enabled: adUnit.is_enabled,
                frequency: adUnit.frequency,
                priority: adUnit.priority,
                description: '',
            });
        } else {
            setEditingAdUnit(null);
            reset();
        }
        setDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Frontend validation
        if (!data.ad_network_id) {
            toast.error('Please select an ad network');
            return;
        }

        if (!data.ad_type) {
            toast.error('Please select an ad type');
            return;
        }

        if (!data.encrypted_ad_unit_id.trim()) {
            toast.error('Ad unit ID is required');
            return;
        }

        const submitPromise = new Promise((resolve, reject) => {
            if (editingAdUnit) {
                put(route('admin.applications.ad-units.update', [application.id, editingAdUnit.id]), {
                    onSuccess: () => {
                        setDialogOpen(false);
                        reset();
                        setEditingAdUnit(null);
                        resolve('success');
                    },
                    onError: (errors) => {
                        const firstError = Object.values(errors)[0];
                        reject(firstError || 'Failed to update ad unit');
                    },
                });
            } else {
                post(route('admin.applications.ad-units.store', application.id), {
                    onSuccess: () => {
                        setDialogOpen(false);
                        reset();
                        resolve('success');
                    },
                    onError: (errors) => {
                        const firstError = Object.values(errors)[0];
                        reject(firstError || 'Failed to create ad unit');
                    },
                });
            }
        });

        toast.promise(submitPromise, {
            loading: editingAdUnit ? 'Updating ad unit...' : 'Creating ad unit...',
            success: editingAdUnit ? 'Ad unit updated successfully!' : 'Ad unit created successfully!',
            error: (err) => err.toString(),
        });
    };

    const handleToggle = (adUnit: AdUnit) => {
        router.post(
            route('admin.applications.ad-units.toggle', [application.id, adUnit.id]),
            {},
            {
                onSuccess: () => {
                    toast.success(`Ad unit ${adUnit.is_enabled ? 'disabled' : 'enabled'} successfully`);
                },
            }
        );
    };

    const handleDelete = (adUnitId: string) => {
        setAdUnitToDelete(adUnitId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        setIsDeleting(true);

        const deletePromise = new Promise((resolve, reject) => {
            if (adUnitToDelete) {
                // Single delete
                router.delete(route('admin.applications.ad-units.destroy', [application.id, adUnitToDelete]), {
                    onSuccess: () => {
                        setDeleteDialogOpen(false);
                        setAdUnitToDelete(null);
                        setIsDeleting(false);
                        resolve('success');
                    },
                    onError: () => {
                        setIsDeleting(false);
                        reject('Failed to delete ad unit');
                    },
                });
            } else {
                // Bulk delete
                const deletePromises = selectedAdUnits.map(id => 
                    new Promise((res, rej) => {
                        router.delete(route('admin.applications.ad-units.destroy', [application.id, id]), {
                            onSuccess: () => res('success'),
                            onError: () => rej('Failed'),
                            preserveState: false,
                        });
                    })
                );

                Promise.all(deletePromises)
                    .then(() => {
                        setDeleteDialogOpen(false);
                        setSelectedAdUnits([]);
                        setIsDeleting(false);
                        resolve('success');
                    })
                    .catch(() => {
                        setIsDeleting(false);
                        reject('Failed to delete some ad units');
                    });
            }
        });

        toast.promise(deletePromise, {
            loading: adUnitToDelete ? 'Deleting ad unit...' : `Deleting ${selectedAdUnits.length} ad units...`,
            success: adUnitToDelete ? 'Ad unit deleted successfully!' : `${selectedAdUnits.length} ad units deleted successfully!`,
            error: 'Could not delete ad unit(s)',
        });
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedAdUnits(filteredAdUnits.map((unit) => unit.id));
        } else {
            setSelectedAdUnits([]);
        }
    };

    const handleSelectAdUnit = (adUnitId: string, checked: boolean) => {
        if (checked) {
            setSelectedAdUnits([...selectedAdUnits, adUnitId]);
        } else {
            setSelectedAdUnits(selectedAdUnits.filter((id) => id !== adUnitId));
        }
    };

    const handleBulkToggle = (enabled: boolean) => {
        if (selectedAdUnits.length === 0) return;

        router.post(
            route('admin.applications.ad-units.bulk-toggle', application.id),
            { ad_unit_ids: selectedAdUnits, enabled },
            {
                onSuccess: () => {
                    setSelectedAdUnits([]);
                    toast.success(`${selectedAdUnits.length} ad units ${enabled ? 'enabled' : 'disabled'} successfully`);
                },
            }
        );
    };

    const handleBulkDelete = () => {
        if (selectedAdUnits.length === 0) return;
        
        setDeleteDialogOpen(true);
        setAdUnitToDelete(null); // null indicates bulk delete
    };

    return (
        <>
            <Head title={`Ad Units - ${application.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('admin.applications.show', application.id)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Ad Units</h1>
                        <p className="text-sm text-muted-foreground">
                            {application.name} - {application.package_name}
                        </p>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedAdUnits.length > 0 && (
                    <Card>
                        <CardContent className="flex items-center gap-2 py-3">
                            <span className="text-sm text-muted-foreground">
                                {selectedAdUnits.length} selected
                            </span>
                            <Button size="sm" variant="outline" onClick={() => handleBulkToggle(true)}>
                                <Power className="mr-2 h-4 w-4" />
                                Enable Selected
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleBulkToggle(false)}>
                                <PowerOff className="mr-2 h-4 w-4" />
                                Disable Selected
                            </Button>
                            <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Selected
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Ad Units Table */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Ad Units ({filteredAdUnits.length})</CardTitle>
                                <CardDescription>
                                    Manage ad units for this application
                                </CardDescription>
                            </div>
                            <Button onClick={() => handleOpenDialog()}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Ad Unit
                            </Button>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col gap-4 pt-4 md:flex-row md:items-center md:justify-between">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by ad unit ID or type..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <div className="flex gap-2">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="enabled">Enabled</SelectItem>
                                        <SelectItem value="disabled">Disabled</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select value={adTypeFilter} onValueChange={setAdTypeFilter}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="All Ad Types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Ad Types</SelectItem>
                                        {adTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredAdUnits.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">
                                    {adUnits.length === 0 ? 'No ad units configured yet' : 'No ad units match your filters'}
                                </p>
                                {adUnits.length === 0 && (
                                    <Button className="mt-4" onClick={() => handleOpenDialog()}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Your First Ad Unit
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">
                                            <Checkbox
                                                checked={selectedAdUnits.length === filteredAdUnits.length && filteredAdUnits.length > 0}
                                                onCheckedChange={handleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead>Ad Type</TableHead>
                                        <TableHead>Ad Unit ID</TableHead>
                                        <TableHead>Network</TableHead>
                                        <TableHead>Frequency</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAdUnits.map((adUnit) => (
                                        <TableRow key={adUnit.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedAdUnits.includes(adUnit.id)}
                                                    onCheckedChange={(checked) =>
                                                        handleSelectAdUnit(adUnit.id, checked as boolean)
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {adTypes.find((t) => t.value === adUnit.ad_type)?.label}
                                                </div>
                                                {adUnit.description && (
                                                    <div className="text-sm text-muted-foreground">
                                                        {adUnit.description}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-xs">{adUnit.ad_unit_id}</code>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">{adUnit.ad_network.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {adUnit.ad_network.provider}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {adUnit.frequency ? `Every ${adUnit.frequency}` : '-'}
                                            </TableCell>
                                            <TableCell>{adUnit.priority || '-'}</TableCell>
                                            <TableCell>
                                                <Switch
                                                    checked={adUnit.is_enabled}
                                                    onCheckedChange={() => handleToggle(adUnit)}
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <TableActions
                                                    onEdit={() => handleOpenDialog(adUnit)}
                                                    onDelete={() => handleDelete(adUnit.id)}
                                                    showView={false}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingAdUnit ? 'Edit Ad Unit' : 'Add New Ad Unit'}
                        </DialogTitle>
                        <DialogDescription>
                            Configure ad unit settings for your application
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="ad_network">
                                Ad Network <span className="text-red-500">*</span>
                            </Label>
                            <Select value={data.ad_network_id} onValueChange={(value) => setData('ad_network_id', value)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select network" />
                                </SelectTrigger>
                                <SelectContent>
                                    {adNetworks.map((network) => (
                                        <SelectItem key={network.id} value={network.id}>
                                            {network.name} ({network.provider})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.ad_network_id && (
                                <p className="text-sm font-medium text-red-600">{errors.ad_network_id}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="ad_type">
                                Ad Type <span className="text-red-500">*</span>
                            </Label>
                            <Select value={data.ad_type} onValueChange={(value) => setData('ad_type', value)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {adTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.ad_type && (
                                <p className="text-sm font-medium text-red-600">{errors.ad_type}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="encrypted_ad_unit_id">
                                Ad Unit ID <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="encrypted_ad_unit_id"
                                value={data.encrypted_ad_unit_id}
                                onChange={(e) => setData('encrypted_ad_unit_id', e.target.value)}
                                placeholder="ca-app-pub-xxxxxxxxxxxxx/xxxxxxxxxx"
                                className={errors.encrypted_ad_unit_id ? 'border-red-500' : ''}
                            />
                            {errors.encrypted_ad_unit_id && (
                                <p className="text-sm font-medium text-red-600">{errors.encrypted_ad_unit_id}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Enter your AdMob ad unit ID
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Input
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="e.g., Main banner on home screen"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <Label htmlFor="frequency">Frequency</Label>
                                <Input
                                    id="frequency"
                                    type="number"
                                    min="1"
                                    value={data.frequency}
                                    onChange={(e) => setData('frequency', parseInt(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Show ad every X times
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority</Label>
                                <Input
                                    id="priority"
                                    type="number"
                                    min="1"
                                    value={data.priority}
                                    onChange={(e) => setData('priority', parseInt(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Higher number = higher priority
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label>Enabled</Label>
                                <p className="text-sm text-muted-foreground">
                                    Enable this ad unit immediately
                                </p>
                            </div>
                            <Switch
                                checked={data.is_enabled}
                                onCheckedChange={(checked) => setData('is_enabled', checked)}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : editingAdUnit ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title={
                    adUnitToDelete
                        ? 'Are you sure you want to delete this ad unit?'
                        : `Are you sure you want to delete ${selectedAdUnits.length} ad unit(s)?`
                }
                description="This action cannot be undone. The ad unit(s) will be permanently deleted."
                confirmText={adUnitToDelete ? 'Delete ad unit' : 'Delete ad units'}
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
            />
        </>
    );
}

AdUnitsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Applications', href: '/admin/applications' },
        { title: 'Ad Units' },
    ],
};
