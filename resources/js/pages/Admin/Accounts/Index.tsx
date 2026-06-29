import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';
import { route } from '@/lib/route';
import toast from 'react-hot-toast';
import {
    Link2,
    Link2Off,
    Plus,
    Trash2,
    RefreshCw,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Eye,
    EyeOff,
    Edit2,
    Search,
    Filter,
    LayoutList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// ─── SVG Provider Icons ───────────────────────────────────────────────────────

function GooglePlayIcon({ size = 20 }: { size?: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={size} height={size}>
            <path fill="#2f80ed" d="M1.351685 21.145075V2.85595c0-2.0033175 2.193515-3.255395 3.949365-2.253l16.030975 9.1442c1.755125 1.00165 1.755125 3.50435 0 4.505275L5.30105 23.39735c-1.7551 1.00165-3.949365-0.249675-3.949365-2.252275Z" strokeWidth="0.25" />
            <path fill="#ccf6ff" d="M17.4025 7.5059 8.979425 12.3563 7.3712 9.507c-0.180325-0.320225-0.481225-0.555025-0.8357-0.6521-0.3549-0.0996-0.7348-0.054725-1.056725 0.12485L1.351685 11.270925v2.80965L5.7402 11.64325l1.615575 2.863975c0.18065 0.31945 0.489075 0.558125 0.845975 0.65505 0.359625 0.0967 0.7429 0.047325 1.066275-0.137325l10.60705-6.1091-2.472575-1.40995Z" strokeWidth="0.25" />
        </svg>
    );
}

function GoogleAdsIcon({ size = 20 }: { size?: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" width={size} height={size}>
            <path fill="#fbbc04" d="M0.7909875 16.744 8.598925 3.37695c0.9918 0.5839 5.992975 3.3517 6.8007 3.878025L7.5917 20.622825C6.73775 21.750875-0.2908325 18.45595 0.7909875 16.7432v0.0008Z" strokeWidth="0.25" />
            <path fill="#4285f4" d="m23.224275 16.7437-7.807925-13.36625c-1.09155-1.81655-3.442525-2.4766725-5.373425-1.4037725-1.9309 1.0728975-2.51885 3.3841475-1.4273 5.2817725l7.80795 13.367875c1.09155 1.81575 3.442525 2.475875 5.3734 1.402975 1.846575-1.0729 2.51885-3.46605 1.4273-5.280975v-0.001625Z" strokeWidth="0.25" />
            <path fill="#34a853" d="M4.169375 22.542975c2.1646 0 3.919375-1.7112 3.919375-3.82205 0-2.110875-1.754775-3.82205-3.919375-3.82205C2.0047625 14.898875 0.25 16.61005 0.25 18.720925c0 2.11085 1.7547625 3.82205 3.919375 3.82205Z" strokeWidth="0.25" />
        </svg>
    );
}

// ─── Types ───────────────────────────────────────────────────────────────────

type ConnectedAccount = {
    id: string;
    provider: string;
    provider_label: string;
    name: string;
    account_id: string | null;
    status: 'connected' | 'disconnected' | 'error';
    last_synced_at: string | null;
    created_at: string;
    user: { id: number; name: string };
    credentials: Record<string, string>;
};

type Statistics = {
    total: number;
    connected: number;
    disconnected: number;
    error: number;
    google_play: number;
    google_ads: number;
};

type Props = {
    accounts: ConnectedAccount[];
    statistics: Statistics;
    providers: Record<string, string>;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; badge: string }> = {
    connected:    { label: 'Connected',    icon: CheckCircle2, badge: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
    disconnected: { label: 'Disconnected', icon: XCircle,      badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
    error:        { label: 'Error',        icon: AlertCircle,  badge: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
};

type CredentialField = {
    key: string;
    label: string;
    placeholder: string;
    sensitive?: boolean;
    multiline?: boolean;
};

const CREDENTIAL_FIELDS: Record<string, CredentialField[]> = {
    google_play_console: [
        { key: 'service_account_email', label: 'Service Account Email',  placeholder: 'your-service@project.iam.gserviceaccount.com' },
        { key: 'project_id',            label: 'Google Cloud Project ID', placeholder: 'my-project-123456' },
        { key: 'private_key',           label: 'Private Key (PEM)',       placeholder: '-----BEGIN PRIVATE KEY-----', sensitive: true, multiline: true },
    ],
    google_ads: [
        { key: 'developer_token', label: 'Developer Token',               placeholder: 'ABcDeFgHiJkLmNoPqRsTuVwXyZ', sensitive: true },
        { key: 'client_id',       label: 'OAuth Client ID',               placeholder: '1234567890-abc.apps.googleusercontent.com' },
        { key: 'client_secret',   label: 'OAuth Client Secret',           placeholder: 'GOCSPX-xxxxxx', sensitive: true },
        { key: 'refresh_token',   label: 'Refresh Token',                 placeholder: '1//0fxxxxxxxxxxxxxxxx', sensitive: true },
        { key: 'manager_id',      label: 'Manager Account ID (optional)', placeholder: '123-456-7890' },
    ],
};

// ─── Connect / Edit Dialog ────────────────────────────────────────────────────

type ConnectDialogProps = {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    providers: Record<string, string>;
    editAccount: ConnectedAccount | null;
};

function ConnectDialog({ open, onOpenChange, providers, editAccount }: ConnectDialogProps) {
    const isEdit = editAccount !== null;
    const [revealKeys, setRevealKeys] = useState<Record<string, boolean>>({});

    const { data, setData, post, put, processing, errors, reset } = useForm({
        provider:    editAccount?.provider ?? '',
        name:        editAccount?.name ?? '',
        account_id:  editAccount?.account_id ?? '',
        // Pre-fill existing credentials when editing
        credentials: (editAccount?.credentials ?? {}) as Record<string, string>,
    });

    // Sync form values whenever editAccount changes (e.g. opening different account to edit)
    useEffect(() => {
        if (editAccount) {
            setData('provider',    editAccount.provider);
            setData('name',        editAccount.name);
            setData('account_id',  editAccount.account_id ?? '');
            setData('credentials', editAccount.credentials ?? {});
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [editAccount?.id]);

    const handleClose = () => {
        reset();
        setRevealKeys({});
        onOpenChange(false);
    };

    // In edit mode, provider can't change — use editAccount's provider for field lookup
    const activeProvider = isEdit ? (editAccount?.provider ?? '') : data.provider;
    const fields: CredentialField[] = CREDENTIAL_FIELDS[activeProvider] ?? [];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const promise = new Promise<void>((resolve, reject) => {
            const opts = {
                onSuccess: () => { handleClose(); resolve(); },
                onError: (err: Record<string, string>) => reject(Object.values(err)[0] || 'Failed'),
            };
            if (isEdit && editAccount) {
                put(route('admin.accounts.update', editAccount.id), opts);
            } else {
                post(route('admin.accounts.store'), opts);
            }
        });
        toast.promise(promise, {
            loading: isEdit ? 'Updating…' : 'Connecting…',
            success: isEdit ? 'Account updated!' : 'Account connected!',
            error: (e: unknown) => String(e),
        });
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else onOpenChange(true); }}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Account' : 'Connect Account'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Update your connected account details.' : 'Link an external platform account to this system.'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isEdit && (
                        <div className="space-y-2">
                            <Label>Platform <span className="text-red-500">*</span></Label>
                            <Select value={data.provider} onValueChange={(v) => { setData('provider', v); setData('credentials', {}); }}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a platform…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(providers).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>
                                            <span className="flex items-center gap-2">
                                                {key === 'google_play_console' ? <GooglePlayIcon size={16} /> : <GoogleAdsIcon size={16} />}
                                                {label}
                                            </span>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.provider && <p className="text-sm text-red-600">{errors.provider}</p>}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label>Account Label <span className="text-red-500">*</span></Label>
                        <Input
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            placeholder="e.g. Production Google Ads"
                            className={errors.name ? 'border-red-500' : ''}
                        />
                        {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Account ID <span className="text-muted-foreground text-xs">(optional)</span></Label>
                        <Input
                            value={data.account_id}
                            onChange={(e) => setData('account_id', e.target.value)}
                            placeholder="e.g. 123-456-7890"
                        />
                    </div>

                    {/* API Credentials */}
                    {fields.length > 0 && (
                        <>
                            <Separator />
                            <p className="text-sm font-medium text-muted-foreground">
                                {isEdit ? 'Update credentials (leave blank to keep existing)' : 'API Credentials'}
                            </p>
                            {fields.map((field) => (
                                <div key={field.key} className="space-y-2">
                                    <Label>
                                        {field.label}
                                        {!isEdit && <span className="text-red-500"> *</span>}
                                    </Label>
                                    <div className="relative">
                                        {field.multiline ? (
                                            <textarea
                                                rows={4}
                                                value={data.credentials[field.key] ?? ''}
                                                onChange={(e) => setData('credentials', { ...data.credentials, [field.key]: e.target.value })}
                                                placeholder={field.placeholder}
                                                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring font-mono text-xs"
                                            />
                                        ) : (
                                            <Input
                                                type={field.sensitive && !revealKeys[field.key] ? 'password' : 'text'}
                                                value={data.credentials[field.key] ?? ''}
                                                onChange={(e) => setData('credentials', { ...data.credentials, [field.key]: e.target.value })}
                                                placeholder={field.placeholder}
                                                className={`font-mono text-sm${field.sensitive ? ' pr-10' : ''}`}
                                            />
                                        )}
                                        {field.sensitive && !field.multiline && (
                                            <button
                                                type="button"
                                                onClick={() => setRevealKeys((p) => ({ ...p, [field.key]: !p[field.key] }))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                {revealKeys[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? (isEdit ? 'Saving…' : 'Connecting…') : (isEdit ? 'Save Changes' : 'Connect Account')}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AccountsIndex({ accounts, statistics, providers }: Props) {
    const [dialogOpen, setDialogOpen]       = useState(false);
    const [deleteOpen, setDeleteOpen]       = useState(false);
    const [editAccount, setEditAccount]     = useState<ConnectedAccount | null>(null);
    const [deleteTarget, setDeleteTarget]   = useState<ConnectedAccount | null>(null);
    const [isDeleting, setIsDeleting]       = useState(false);
    const [syncingId, setSyncingId]         = useState<string | null>(null);
    const [search, setSearch]               = useState('');
    const [filterProvider, setFilterProvider] = useState('');
    const [filterStatus, setFilterStatus]   = useState('');

    const filtered = useMemo(() => {
        return accounts.filter((a) => {
            const q = search.toLowerCase();
            const matchSearch = !q ||
                a.name.toLowerCase().includes(q) ||
                (a.account_id ?? '').toLowerCase().includes(q) ||
                a.provider_label.toLowerCase().includes(q);
            const matchProvider = !filterProvider || a.provider === filterProvider;
            const matchStatus   = !filterStatus   || a.status   === filterStatus;
            return matchSearch && matchProvider && matchStatus;
        });
    }, [accounts, search, filterProvider, filterStatus]);

    const handleEdit   = (a: ConnectedAccount) => { setEditAccount(a); setDialogOpen(true); };
    const handleDelete = (a: ConnectedAccount) => { setDeleteTarget(a); setDeleteOpen(true); };

    const handleSync = (a: ConnectedAccount) => {
        setSyncingId(a.id);
        const promise = new Promise<void>((resolve, reject) => {
            router.visit(route('admin.accounts.play-console.sync', a.id), {
                onSuccess: () => { setSyncingId(null); resolve(); },
                onError:   () => { setSyncingId(null); reject('Failed to fetch apps from Play Console.'); },
                onFinish:  () => setSyncingId(null),
            });
        });
        toast.promise(promise, {
            loading: 'Syncing apps from Play Console…',
            success: 'Apps fetched successfully!',
            error:   (e: unknown) => String(e),
        });
    };

    const handleToggle = (a: ConnectedAccount) => {
        const p = new Promise<void>((resolve, reject) => {
            router.post(route('admin.accounts.toggle', a.id), {}, {
                onSuccess: () => resolve(),
                onError:   () => reject('Failed'),
            });
        });
        toast.promise(p, {
            loading: a.status === 'connected' ? 'Disconnecting…' : 'Reconnecting…',
            success: a.status === 'connected' ? 'Account disconnected.' : 'Account reconnected.',
            error:   'Could not update status.',
        });
    };

    const confirmDelete = () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        const p = new Promise<void>((resolve, reject) => {
            router.delete(route('admin.accounts.destroy', deleteTarget.id), {
                onSuccess: () => { setDeleteOpen(false); setDeleteTarget(null); setIsDeleting(false); resolve(); },
                onError:   () => { setIsDeleting(false); reject('Failed'); },
            });
        });
        toast.promise(p, {
            loading: 'Removing account…',
            success: 'Account removed.',
            error:   'Could not remove account.',
        });
    };

    return (
        <>
            <Head title="Accounts" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Accounts</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage platform integrations — Google Play Console, Google Ads and more.
                        </p>
                    </div>
                    <Button onClick={() => { setEditAccount(null); setDialogOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" /> Connect Account
                    </Button>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
                            <Link2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total}</div>
                            <p className="text-xs text-muted-foreground">Across all platforms</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Connected</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.connected}</div>
                            <p className="text-xs text-muted-foreground">Active integrations</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Play Console</CardTitle>
                            <GooglePlayIcon size={20} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.google_play}</div>
                            <p className="text-xs text-muted-foreground">Google Play accounts</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Google Ads</CardTitle>
                            <GoogleAdsIcon size={20} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.google_ads}</div>
                            <p className="text-xs text-muted-foreground">Google Ads accounts</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Table */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-1">
                            <CardTitle>Connected Accounts</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                {filtered.length} of {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                            </p>
                        </div>

                        {/* Filters */}
                        <div className="flex flex-col gap-3 pt-2 md:flex-row">
                            <div className="relative flex-1">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, account ID or platform…"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>
                            <Select value={filterProvider} onValueChange={setFilterProvider}>
                                <SelectTrigger className="w-full md:w-[200px]">
                                    <Filter className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <SelectValue placeholder="All Platforms" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Platforms</SelectItem>
                                    {Object.entries(providers).map(([key, label]) => (
                                        <SelectItem key={key} value={key}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <Filter className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Statuses</SelectItem>
                                    <SelectItem value="connected">Connected</SelectItem>
                                    <SelectItem value="disconnected">Disconnected</SelectItem>
                                    <SelectItem value="error">Error</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Account</TableHead>
                                    <TableHead>Platform</TableHead>
                                    <TableHead>Account ID</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Last Synced</TableHead>
                                    <TableHead>Added</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                                            {accounts.length === 0
                                                ? 'No accounts connected yet. Click "Connect Account" to get started.'
                                                : 'No accounts match your filters.'}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filtered.map((account) => {
                                        const sc = STATUS_CONFIG[account.status] ?? STATUS_CONFIG['disconnected'];
                                        const StatusIcon = sc.icon;
                                        return (
                                            <TableRow key={account.id}>
                                                <TableCell>
                                                    <div className="font-medium">{account.name}</div>
                                                    <div className="text-xs text-muted-foreground">{account.user.name}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        {account.provider === 'google_play_console'
                                                            ? <GooglePlayIcon size={18} />
                                                            : <GoogleAdsIcon size={18} />}
                                                        <span className="text-sm">{account.provider_label}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {account.account_id
                                                        ? <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{account.account_id}</code>
                                                        : <span className="text-muted-foreground text-xs">—</span>}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={`text-xs gap-1 ${sc.badge}`}>
                                                        <StatusIcon className="h-3 w-3" />
                                                        {sc.label}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {account.last_synced_at
                                                        ? new Date(account.last_synced_at).toLocaleDateString()
                                                        : '—'}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {new Date(account.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {/* View Apps — navigate to sync page WITHOUT triggering sync */}
                                                        {account.provider === 'google_play_console' && account.status === 'connected' && (
                                                            <>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Link href={route('admin.accounts.play-console.sync', account.id)}>
                                                                            <Button size="icon" variant="ghost" className="h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground">
                                                                                <LayoutList className="h-4 w-4" />
                                                                            </Button>
                                                                        </Link>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent><p>View Apps from Play Console</p></TooltipContent>
                                                                </Tooltip>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <Button
                                                                            size="icon" variant="ghost"
                                                                            className="h-8 w-8 cursor-pointer text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                                                                            disabled={syncingId === account.id}
                                                                            onClick={() => handleSync(account)}
                                                                        >
                                                                            <RefreshCw className={`h-4 w-4 ${syncingId === account.id ? 'animate-spin' : ''}`} />
                                                                        </Button>
                                                                    </TooltipTrigger>
                                                                    <TooltipContent>
                                                                        <p>{syncingId === account.id ? 'Syncing…' : 'Re-sync Apps from Play Console'}</p>
                                                                    </TooltipContent>
                                                                </Tooltip>
                                                            </>
                                                        )}
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="icon" variant="ghost"
                                                                    className="h-8 w-8 cursor-pointer"
                                                                    onClick={() => handleToggle(account)}
                                                                >
                                                                    {account.status === 'connected'
                                                                        ? <Link2Off className="h-4 w-4" />
                                                                        : <RefreshCw className="h-4 w-4" />}
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p>{account.status === 'connected' ? 'Disconnect' : 'Reconnect'}</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button size="icon" variant="ghost" className="h-8 w-8 cursor-pointer" onClick={() => handleEdit(account)}>
                                                                    <Edit2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Edit Account</p></TooltipContent>
                                                        </Tooltip>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Button
                                                                    size="icon" variant="ghost"
                                                                    className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                                                                    onClick={() => handleDelete(account)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </TooltipTrigger>
                                                            <TooltipContent><p>Remove Account</p></TooltipContent>
                                                        </Tooltip>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <ConnectDialog
                open={dialogOpen}
                onOpenChange={(v) => { setDialogOpen(v); if (!v) setEditAccount(null); }}
                providers={providers}
                editAccount={editAccount}
            />

            <DeleteConfirmationModal
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Remove this account?"
                description="The account connection and its stored credentials will be permanently deleted. This action cannot be undone."
                confirmText="Remove account"
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
            />
        </>
    );
}

AccountsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Accounts',  href: '/admin/accounts' },
    ],
};
