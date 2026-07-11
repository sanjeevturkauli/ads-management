import { Head, Link, router } from '@inertiajs/react';
import { useState, useCallback, useRef, useEffect } from 'react';
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
    RefreshCw,
    Star,
    Download,
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
import { Switch } from '@/components/ui/switch';
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal';
import { TableActions } from '@/components/table-actions';
import { ButtonGroup } from '@/components/ui/button-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';

type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

type Application = {
    id: string;
    name: string;
    package_name: string;
    platform: 'android' | 'ios';
    status: 'active' | 'inactive' | 'maintenance' | 'archived';
    icon_url?: string;
    banner_url?: string;
    description?: string;
    developer_name?: string;
    category?: string;
    rating?: number;
    ratings_count?: number;
    installs?: string;
    play_status?: string;
    sync_status?: SyncStatus;
    last_synced_at?: string;
    sync_error?: string;
    current_version: string;
    ads_enabled: boolean;
    test_mode: boolean;
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

// ─── Helper Functions ─────────────────────────────────────────────────────────
const limitText = (text: string, limit: number = 20): string => {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
};

// ─── Play status badge ────────────────────────────────────────────────────────
const PLAY_STATUS_STYLES: Record<string, string> = {
    PUBLISHED:   'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    DRAFT:       'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    IN_REVIEW:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    BETA:        'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    ALPHA:       'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    INTERNAL:    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    HALTED:      'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    REMOVED:     'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

function PlayStatusCell({ status }: { status?: string }) {
    if (!status) return <span className="text-xs text-muted-foreground">—</span>;
    const cls = PLAY_STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500';
    return <Badge className={`text-xs ${cls}`}>{status.replace(/_/g, ' ')}</Badge>;
}

// ─── Sync status cell ─────────────────────────────────────────────────────────
function SyncStatusCell({ app, isSyncing, onSync }: {
    app: Application;
    isSyncing: boolean;
    onSync: () => void;
}) {
    const isActive = isSyncing || app.sync_status === 'pending' || app.sync_status === 'syncing';

    return (
        <div className="flex items-center gap-1.5">
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        size="icon" variant="ghost"
                        className="h-7 w-7 cursor-pointer text-muted-foreground hover:text-primary"
                        onClick={onSync}
                        disabled={isActive}
                    >
                        <RefreshCw className={`h-3.5 w-3.5 ${isActive ? 'animate-spin text-blue-500' : ''}`} />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    {isActive ? 'Syncing…' :
                        app.last_synced_at
                            ? `Last synced: ${new Date(app.last_synced_at).toLocaleDateString()}`
                            : 'Sync Play Store metadata'}
                </TooltipContent>
            </Tooltip>
            {app.sync_status === 'failed' && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <AlertCircle className="h-3.5 w-3.5 text-red-500 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                        <p className="text-xs">{app.sync_error ?? 'Sync failed'}</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
    );
}

export default function ApplicationsIndex({ applications, statistics, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [selectedApps, setSelectedApps] = useState<string[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [appToDelete, setAppToDelete] = useState<string | null>(null);
    const [isBulkDelete, setIsBulkDelete] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [syncingApps, setSyncingApps] = useState<Record<string, boolean>>({});
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // ── Auto-poll: if any app is pending/syncing, reload every 3s until all done ──
    const hasPendingSync = applications.data.some(
        (a) => a.sync_status === 'pending' || a.sync_status === 'syncing'
    );

    useEffect(() => {
        if (!hasPendingSync) {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
            return;
        }
        if (pollRef.current) return; // already polling

        pollRef.current = setInterval(() => {
            router.reload({ only: ['applications'], onSuccess: () => {
                // stop when no more pending
                const stillPending = applications.data.some(
                    a => a.sync_status === 'pending' || a.sync_status === 'syncing'
                );
                if (!stillPending) {
                    clearInterval(pollRef.current!);
                    pollRef.current = null;
                }
            }});
        }, 3000);

        return () => {
            if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hasPendingSync]);

    const handleSyncOne = useCallback((app: Application) => {
        setSyncingApps(p => ({ ...p, [app.id]: true }));

        const promise = fetch(route('admin.applications.sync', app.id), {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ force: true }),
        })
            .then(r => r.json())
            .then(() => {
                // Poll for completion every 3 seconds
                if (pollRef.current) clearInterval(pollRef.current);
                pollRef.current = setInterval(() => {
                    fetch(route('admin.applications.sync-status', app.id), {
                        headers: { 'Accept': 'application/json' },
                    })
                        .then(r => r.json())
                        .then(data => {
                            if (data.sync_status === 'synced' || data.sync_status === 'failed') {
                                clearInterval(pollRef.current!);
                                setSyncingApps(p => ({ ...p, [app.id]: false }));
                                // Reload page to show updated metadata
                                router.reload({ only: ['applications'] });
                            }
                        })
                        .catch(() => {
                            clearInterval(pollRef.current!);
                            setSyncingApps(p => ({ ...p, [app.id]: false }));
                        });
                }, 3000);
            })
            .catch(() => {
                setSyncingApps(p => ({ ...p, [app.id]: false }));
                throw new Error('Sync request failed');
            });

        toast.promise(promise, {
            loading: `Syncing ${app.name}…`,
            success: 'Sync queued — metadata will update shortly.',
            error:   'Could not queue sync.',
        });
    }, []);

    const handleSyncAll = useCallback(() => {
        const promise = fetch(route('admin.applications.sync-all'), {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        })
            .then(r => r.json())
            .then(data => {
                setTimeout(() => router.reload({ only: ['applications'] }), 5000);
                return data.message;
            });

        toast.promise(promise, {
            loading: 'Queuing sync for all apps…',
            success: (msg: string) => msg,
            error:   'Could not queue sync.',
        });
    }, []);

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

    const handleTestModeToggle = (appId: string, currentValue: boolean) => {
        const promise = fetch(route('admin.applications.toggle-test-mode', appId), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
            },
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || 'Failed to update test mode');
                }
                router.reload({ only: ['applications'] });
                return data;
            });

        toast.promise(promise, {
            loading: 'Updating test mode...',
            success: `Test mode ${!currentValue ? 'enabled' : 'disabled'}`,
            error: (err) => err.message || 'Failed to update test mode',
        });
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
                            <div className="flex items-center gap-2">
                                <Button asChild>
                                    <Link href={route('admin.applications.create')}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Application
                                    </Link>
                                </Button>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button variant="outline" onClick={handleSyncAll}>
                                            <RefreshCw className="mr-2 h-4 w-4" />
                                            Sync All
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Fetch Play Store metadata for all apps</TooltipContent>
                                </Tooltip>
                            </div>                        </div>

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
                                    <TableHead>Test Mode</TableHead>
                                    <TableHead>Play Store</TableHead>
                                    <TableHead>Sync</TableHead>
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
                                                            ) : app.sync_status === 'pending' || app.sync_status === 'syncing' ? (
                                                                <Skeleton className="h-10 w-10 rounded-lg" />
                                                            ) : (
                                                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                    <span className="text-lg font-bold text-primary">{app.name.charAt(0).toUpperCase()}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <Link
                                                                href={route('admin.applications.show', app.id)}
                                                                className="font-medium hover:underline truncate block"
                                                                title={app.name}
                                                            >
                                                                {limitText(app.name, 20)}
                                                            </Link>
                                                            <a
                                                                href={`https://play.google.com/store/apps/details?id=${app.package_name}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-xs text-blue-600 hover:underline dark:text-blue-400 truncate block"
                                                                title={app.package_name}
                                                            >
                                                                {limitText(app.package_name, 25)}
                                                            </a>
                                                            {/* Metadata row */}
                                                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                                {app.developer_name && (
                                                                    <span className="text-xs text-muted-foreground truncate">{app.developer_name}</span>
                                                                )}
                                                                {app.category && (
                                                                    <Badge variant="outline" className="text-xs h-4 px-1">{app.category}</Badge>
                                                                )}
                                                                {app.rating != null && (
                                                                    <span className="flex items-center gap-0.5 text-xs text-amber-500">
                                                                        <Star className="h-3 w-3 fill-amber-400" />
                                                                        {app.rating.toFixed(1)}
                                                                    </span>
                                                                )}
                                                                {app.installs && (
                                                                    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                                                                        <Download className="h-3 w-3" />
                                                                        {app.installs}
                                                                    </span>
                                                                )}
                                                            </div>
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
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={app.test_mode}
                                                            onCheckedChange={() => handleTestModeToggle(app.id, app.test_mode)}
                                                        />
                                                        <span className="text-sm text-muted-foreground">
                                                            {app.test_mode ? 'On' : 'Off'}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                {/* Play Store status */}
                                                <TableCell>
                                                    <PlayStatusCell status={app.play_status} />
                                                </TableCell>
                                                {/* Sync status */}
                                                <TableCell>
                                                    <SyncStatusCell
                                                        app={app}
                                                        isSyncing={!!syncingApps[app.id]}
                                                        onSync={() => handleSyncOne(app)}
                                                    />
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
