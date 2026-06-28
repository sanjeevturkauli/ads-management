import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { route } from '@/lib/route';
import toast from 'react-hot-toast';
import {
    Plus,
    Search,
    Filter,
    Smartphone,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Archive,
    Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal';
import { TableActions } from '@/components/table-actions';
import { ButtonGroup } from '@/components/ui/button-group';

type Application = {
    id: string;
    name: string;
    package_name: string;
    platform: 'android' | 'ios';
    status: 'active' | 'inactive' | 'maintenance' | 'archived';
    icon_url?: string;
    description?: string;
    current_version: string;
    ads_enabled: boolean;
    created_at: string;
    updated_at: string;
};

type Statistics = {
    total: number;
    active: number;
    inactive: number;
    maintenance: number;
    android: number;
    ios: number;
    with_ads: number;
};

type Props = {
    applications: {
        data: Application[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    statistics: Statistics;
    filters: {
        search?: string;
        status?: string;
        platform?: string;
    };
};

const statusConfig = {
    active: { label: 'Active', icon: CheckCircle2, color: 'bg-green-500' },
    inactive: { label: 'Inactive', icon: XCircle, color: 'bg-gray-500' },
    maintenance: { label: 'Maintenance', icon: AlertCircle, color: 'bg-yellow-500' },
    archived: { label: 'Archived', icon: Archive, color: 'bg-red-500' },
};

export default function ApplicationsIndex({ applications, statistics, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedApps, setSelectedApps] = useState<string[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [appToDelete, setAppToDelete] = useState<string | null>(null);
    const [isBulkDelete, setIsBulkDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(
            route('admin.applications.index'),
            { search: value, status: filters.status, platform: filters.platform },
            { preserveState: true, replace: true }
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route('admin.applications.index'),
            { search: filters.search, [key]: value },
            { preserveState: true, replace: true }
        );
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedApps(applications.data.map((app) => app.id));
        } else {
            setSelectedApps([]);
        }
    };

    const handleSelectApp = (appId: string, checked: boolean) => {
        if (checked) {
            setSelectedApps([...selectedApps, appId]);
        } else {
            setSelectedApps(selectedApps.filter((id) => id !== appId));
        }
    };

    const handleBulkStatusUpdate = (status: string) => {
        if (selectedApps.length === 0) return;

        router.post(
            route('admin.applications.bulk-status'),
            { application_ids: selectedApps, status },
            {
                onSuccess: () => setSelectedApps([]),
                preserveScroll: true,
            }
        );
    };

    const handleDelete = (appId: string) => {
        setAppToDelete(appId);
        setIsBulkDelete(false);
        setDeleteDialogOpen(true);
    };

    const handleBulkDelete = () => {
        if (selectedApps.length === 0) return;
        setIsBulkDelete(true);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        setIsDeleting(true);
        
        const deletePromise = new Promise((resolve, reject) => {
            if (isBulkDelete) {
                // Bulk delete
                router.post(
                    route('admin.applications.bulk-delete'),
                    { application_ids: selectedApps },
                    {
                        onSuccess: () => {
                            setDeleteDialogOpen(false);
                            setSelectedApps([]);
                            setIsBulkDelete(false);
                            setIsDeleting(false);
                            resolve('success');
                        },
                        onError: () => {
                            setIsDeleting(false);
                            reject('Failed to delete applications');
                        },
                    }
                );
            } else {
                // Single delete
                if (!appToDelete) {
                    reject('No application selected');
                    return;
                }
                
                router.delete(route('admin.applications.destroy', appToDelete), {
                    onSuccess: () => {
                        setDeleteDialogOpen(false);
                        setAppToDelete(null);
                        setIsDeleting(false);
                        resolve('success');
                    },
                    onError: () => {
                        setIsDeleting(false);
                        reject('Failed to delete application');
                    },
                });
            }
        });

        toast.promise(deletePromise, {
            loading: isBulkDelete ? 'Deleting applications...' : 'Deleting application...',
            success: isBulkDelete ? 'Applications deleted successfully!' : 'Application deleted successfully!',
            error: isBulkDelete ? 'Could not delete applications' : 'Could not delete application',
        });
    };

    return (
        <>
            <Head title="Applications" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total}</div>
                            <p className="text-xs text-muted-foreground">
                                {statistics.android} Android, {statistics.ios} iOS
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.active}</div>
                            <p className="text-xs text-muted-foreground">Currently running</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">With Ads</CardTitle>
                            <AlertCircle className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.with_ads}</div>
                            <p className="text-xs text-muted-foreground">Ads enabled apps</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Maintenance</CardTitle>
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.maintenance}</div>
                            <p className="text-xs text-muted-foreground">Under maintenance</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters and Actions */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            <div>
                                <CardTitle>Applications</CardTitle>
                                <CardDescription>
                                    Manage your mobile applications and their configurations
                                </CardDescription>
                            </div>
                            <Button asChild>
                                <Link href={route('admin.applications.create')}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Application
                                </Link>
                            </Button>
                        </div>

                        {/* Search and Filters */}
                        <div className="flex flex-col gap-4 pt-4 md:flex-row">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search applications..."
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select
                                value={filters.status}
                                onValueChange={(value) => handleFilterChange('status', value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                    <SelectItem value="maintenance">Maintenance</SelectItem>
                                    <SelectItem value="archived">Archived</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select
                                value={filters.platform}
                                onValueChange={(value) => handleFilterChange('platform', value)}
                            >
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="All Platforms" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Platforms</SelectItem>
                                    <SelectItem value="android">Android</SelectItem>
                                    <SelectItem value="ios">iOS</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Bulk Actions */}
                        {selectedApps.length > 0 && (
                            <div className="flex items-center gap-2 pt-4">
                                <span className="text-sm text-muted-foreground">
                                    {selectedApps.length} selected
                                </span>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleBulkStatusUpdate('active')}
                                >
                                    Set Active
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleBulkStatusUpdate('inactive')}
                                >
                                    Set Inactive
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleBulkStatusUpdate('maintenance')}
                                >
                                    Set Maintenance
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleBulkDelete}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Selected
                                </Button>
                            </div>
                        )}
                    </CardHeader>

                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={
                                                selectedApps.length === applications.data.length &&
                                                applications.data.length > 0
                                            }
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>Application</TableHead>
                                    <TableHead>Platform</TableHead>
                                    <TableHead>Version</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Ads</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {applications.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center">
                                            No applications found
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    applications.data.map((app) => {
                                        const StatusIcon = statusConfig[app.status].icon;
                                        return (
                                            <TableRow key={app.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedApps.includes(app.id)}
                                                        onCheckedChange={(checked) =>
                                                            handleSelectApp(app.id, checked as boolean)
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                                                            {app.icon_url ? (
                                                                <img
                                                                    src={app.icon_url}
                                                                    alt={app.name}
                                                                    className="h-full w-full object-cover"
                                                                    onError={(e) => {
                                                                        e.currentTarget.style.display = 'none';
                                                                        e.currentTarget.parentElement!.innerHTML = `<div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><span class="text-lg font-bold text-primary">${app.name.charAt(0).toUpperCase()}</span></div>`;
                                                                    }}
                                                                />
                                                            ) : (
                                                                <Smartphone className="h-5 w-5 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <Link
                                                                href={route(
                                                                    'admin.applications.show',
                                                                    app.id
                                                                )}
                                                                className="font-medium hover:underline"
                                                            >
                                                                {app.name}
                                                            </Link>
                                                            <a
                                                                href={
                                                                    app.platform === 'android'
                                                                        ? `https://play.google.com/store/apps/details?id=${app.package_name}`
                                                                        : `https://apps.apple.com/app/${app.package_name}`
                                                                }
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-sm text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
                                                            >
                                                                {app.package_name}
                                                                <svg
                                                                    className="h-3 w-3"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <path
                                                                        strokeLinecap="round"
                                                                        strokeLinejoin="round"
                                                                        strokeWidth={2}
                                                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                                    />
                                                                </svg>
                                                            </a>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">
                                                        {app.platform === 'android' ? '🤖' : '🍎'}{' '}
                                                        {app.platform}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="text-sm">{app.current_version}</code>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <StatusIcon className="h-4 w-4" />
                                                        <span className="capitalize">
                                                            {statusConfig[app.status].label}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {app.ads_enabled ? (
                                                        <Badge className="bg-green-500">
                                                            Enabled
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary">Disabled</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(app.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <TableActions
                                                        viewHref={route(
                                                            'admin.applications.show',
                                                            app.id
                                                        )}
                                                        editHref={route(
                                                            'admin.applications.edit',
                                                            app.id
                                                        )}
                                                        onDelete={() => handleDelete(app.id)}
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {applications.last_page > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    Showing page {applications.current_page} of {applications.last_page} ({applications.total} total)
                                </p>
                                <div className="flex gap-1">
                                    {/* Previous Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.get(
                                                route('admin.applications.index'),
                                                { ...filters, page: applications.current_page - 1 },
                                                { preserveState: true }
                                            )
                                        }
                                        disabled={applications.current_page === 1}
                                    >
                                        Previous
                                    </Button>

                                    {/* Page Numbers */}
                                    {Array.from({ length: Math.min(applications.last_page, 10) }, (_, i) => {
                                        const page = i + 1;
                                        // Show first 3, last 3, and current page with neighbors
                                        if (
                                            page <= 3 ||
                                            page > applications.last_page - 3 ||
                                            Math.abs(page - applications.current_page) <= 1
                                        ) {
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={
                                                        applications.current_page === page
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        router.get(
                                                            route('admin.applications.index'),
                                                            { ...filters, page },
                                                            { preserveState: true }
                                                        )
                                                    }
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        } else if (
                                            page === 4 ||
                                            page === applications.last_page - 3
                                        ) {
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
                                                route('admin.applications.index'),
                                                { ...filters, page: applications.current_page + 1 },
                                                { preserveState: true }
                                            )
                                        }
                                        disabled={applications.current_page === applications.last_page}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title={
                    isBulkDelete
                        ? `Are you sure you want to delete ${selectedApps.length} application(s)?`
                        : 'Are you sure you want to delete this application?'
                }
                description="Once deleted, all of its resources and data will also be permanently deleted. This action cannot be undone."
                confirmText={isBulkDelete ? 'Delete applications' : 'Delete application'}
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
            />
        </>
    );
}

ApplicationsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Applications', href: '/admin/applications' },
    ],
};
