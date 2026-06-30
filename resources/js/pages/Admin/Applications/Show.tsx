import { Head, Link, router } from '@inertiajs/react';
import { useState, useRef, useCallback } from 'react';
import { route } from '@/lib/route';
import toast from 'react-hot-toast';
import {
    ArrowLeft, Edit, Settings, Key, FileText,
    History, Megaphone, GitBranch, ExternalLink,
    Star, Download, RefreshCw, Globe, Shield,
    Calendar, Store, MonitorSmartphone,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

// ─── Types ────────────────────────────────────────────────────────────────────

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
    screenshots?: string[];
    privacy_policy_url?: string;
    website_url?: string;
    play_store_url?: string;
    store_last_updated_at?: string;
    play_status?: string;
    play_version_code?: string;
    sync_status?: 'pending' | 'syncing' | 'synced' | 'failed';
    last_synced_at?: string;
    sync_error?: string;
    current_version: string;
    minimum_version?: string;
    latest_version?: string;
    ads_enabled: boolean;
    maintenance_mode: boolean;
    force_update: boolean;
    review_dialog_enabled: boolean;
    created_at: string;
    updated_at: string;
    creator?: { name: string; email: string };
    updater?: { name: string; email: string };
    ad_units?: AdUnit[];
    api_keys?: ApiKey[];
    settings?: AppSetting[];
    versions?: AppVersion[];
};

type AdUnit = {
    id: string; ad_type: string; ad_unit_id: string;
    is_enabled: boolean; frequency?: number;
    ad_network: { name: string; platform: string };
};
type ApiKey = {
    id: string; name: string; key_hash: string;
    last_used_at?: string; expires_at?: string;
    is_active: boolean; created_at: string;
    creator?: { name: string };
};
type AppSetting = { id: string; key: string; value: string; type: string };
type AppVersion = { id: string; version: string; release_notes?: string; is_active: boolean; released_at: string };
type Props = { application: Application };

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-500', inactive: 'bg-gray-500',
    maintenance: 'bg-yellow-500', archived: 'bg-red-500',
};

const PLAY_STATUS_STYLES: Record<string, string> = {
    PUBLISHED: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    DRAFT:     'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
    IN_REVIEW: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    BETA:      'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    ALPHA:     'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    INTERNAL:  'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
    HALTED:    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    REMOVED:   'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const AD_TYPE_LABELS: Record<string, string> = {
    banner: 'Banner', interstitial: 'Interstitial', rewarded: 'Rewarded',
    rewarded_interstitial: 'Rewarded Interstitial', native: 'Native', app_open: 'App Open',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
            <div className="text-sm font-medium">{children}</div>
        </div>
    );
}

function PlayStatusBadge({ status }: { status?: string }) {
    if (!status) return <span className="text-muted-foreground text-xs">—</span>;
    const cls = PLAY_STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-600';
    return <Badge className={`text-xs ${cls}`}>{status.replace(/_/g, ' ')}</Badge>;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ApplicationShow({ application }: Props) {
    const [activeTab, setActiveTab] = useState('overview');
    const [syncing, setSyncing] = useState(false);
    const [appState, setAppState] = useState(application);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const handleSync = useCallback(() => {
        setSyncing(true);
        const promise = fetch(route('admin.applications.sync', appState.id) + '?force=1', {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content ?? '',
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
        }).then(() => {
            if (pollRef.current) clearInterval(pollRef.current);
            pollRef.current = setInterval(() => {
                fetch(route('admin.applications.sync-status', appState.id), {
                    headers: { 'Accept': 'application/json' },
                })
                    .then(r => r.json())
                    .then(data => {
                        if (data.sync_status === 'synced' || data.sync_status === 'failed') {
                            clearInterval(pollRef.current!);
                            setSyncing(false);
                            router.reload();
                        }
                    })
                    .catch(() => { clearInterval(pollRef.current!); setSyncing(false); });
            }, 3000);
        }).catch(() => { setSyncing(false); throw new Error('Sync failed'); });

        toast.promise(promise, {
            loading: 'Syncing Play Store metadata…',
            success: 'Sync queued — updating shortly.',
            error: 'Could not queue sync.',
        });
    }, [appState.id]);

    const isSyncing = syncing || appState.sync_status === 'syncing' || appState.sync_status === 'pending';

    // If stuck in syncing for > 2 min, stop polling — queue may not be running
    const syncStartedAt = useRef<number | null>(null);
    useEffect(() => {
        if (isSyncing && !syncStartedAt.current) {
            syncStartedAt.current = Date.now();
        }
        if (!isSyncing) {
            syncStartedAt.current = null;
        }
    }, [isSyncing]);

    return (
        <>
            <Head title={`${appState.name}`} />
            <div className="flex h-full flex-1 flex-col gap-4 p-4">

                {/* ── Header ─────────────────────────────────────────────── */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <Button variant="ghost" size="icon" asChild className="mt-1 shrink-0">
                            <Link href={route('admin.applications.index')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>

                        {/* App Icon */}
                        <div className="h-16 w-16 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 shadow-sm">
                            {appState.icon_url ? (
                                <img src={appState.icon_url} alt={appState.name}
                                    className="h-full w-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.innerHTML =
                                            `<span class="text-2xl font-bold text-primary">${appState.name.charAt(0)}</span>`;
                                    }} />
                            ) : isSyncing ? (
                                <Skeleton className="h-16 w-16" />
                            ) : (
                                <span className="text-2xl font-bold text-primary">{appState.name.charAt(0)}</span>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <h1 className="text-2xl font-bold">{appState.name}</h1>
                                <div className={`h-2 w-2 rounded-full ${STATUS_COLORS[appState.status]}`} />
                                <span className="text-sm text-muted-foreground capitalize">{appState.status}</span>
                                {appState.play_status && <PlayStatusBadge status={appState.play_status} />}
                            </div>
                            {appState.developer_name && (
                                <p className="text-sm text-muted-foreground">{appState.developer_name}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <a href={`https://play.google.com/store/apps/details?id=${appState.package_name}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1 font-mono">
                                    {appState.package_name} <ExternalLink className="h-3 w-3" />
                                </a>
                                {appState.category && (
                                    <Badge variant="outline" className="text-xs">{appState.category}</Badge>
                                )}
                                {appState.rating != null && (
                                    <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                                        <Star className="h-3 w-3 fill-amber-400" />
                                        {appState.rating.toFixed(1)}
                                        {appState.ratings_count && (
                                            <span className="text-muted-foreground">
                                                ({appState.ratings_count.toLocaleString()})
                                            </span>
                                        )}
                                    </span>
                                )}
                                {appState.installs && (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Download className="h-3 w-3" /> {appState.installs}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="outline" size="icon" onClick={handleSync} disabled={isSyncing}>
                                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                {isSyncing ? 'Syncing…' : appState.last_synced_at
                                    ? `Synced ${new Date(appState.last_synced_at).toLocaleDateString()}`
                                    : 'Sync Play Store metadata'}
                            </TooltipContent>
                        </Tooltip>
                        <Button asChild>
                            <Link href={route('admin.applications.edit', appState.id)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* ── Quick stats ─────────────────────────────────────────── */}
                <div className="grid gap-3 md:grid-cols-4">
                    <Card className="py-3">
                        <CardContent className="px-4">
                            <p className="text-xs text-muted-foreground">Version</p>
                            <p className="text-lg font-bold font-mono">{appState.current_version}</p>
                        </CardContent>
                    </Card>
                    <Card className="py-3">
                        <CardContent className="px-4">
                            <p className="text-xs text-muted-foreground">Ads</p>
                            <div className="mt-0.5">
                                {appState.ads_enabled
                                    ? <Badge className="bg-green-500 text-xs">Enabled</Badge>
                                    : <Badge variant="secondary" className="text-xs">Disabled</Badge>}
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="py-3">
                        <CardContent className="px-4">
                            <p className="text-xs text-muted-foreground">Platform</p>
                            <p className="text-sm font-medium capitalize mt-0.5">
                                {appState.platform === 'android' ? '🤖' : '🍎'} {appState.platform}
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="py-3">
                        <CardContent className="px-4">
                            <p className="text-xs text-muted-foreground">Sync</p>
                            <div className="mt-0.5 flex items-center gap-1 flex-wrap">
                                {appState.sync_status === 'synced' && <Badge className="bg-green-500 text-xs">Synced</Badge>}
                                {appState.sync_status === 'failed' && <Badge className="bg-red-500 text-xs">Failed</Badge>}
                                {(appState.sync_status === 'pending' || appState.sync_status === 'syncing') && (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Badge className="bg-blue-500 text-xs animate-pulse cursor-help">Queued…</Badge>
                                        </TooltipTrigger>
                                        <TooltipContent className="max-w-xs">
                                            <p className="font-medium">Waiting for queue worker</p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Ensure <code>php artisan queue:work</code> is running,
                                                or a cron job is set for <code>php artisan schedule:run</code>.
                                            </p>
                                        </TooltipContent>
                                    </Tooltip>
                                )}
                                {!appState.sync_status && <span className="text-xs text-muted-foreground">—</span>}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Tabs ────────────────────────────────────────────────── */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                    <TabsList className="w-full grid grid-cols-6">
                        <TabsTrigger value="overview"><Store className="mr-1.5 h-3.5 w-3.5" />Overview</TabsTrigger>
                        <TabsTrigger value="ads"><Megaphone className="mr-1.5 h-3.5 w-3.5" />Ads ({appState.ad_units?.length ?? 0})</TabsTrigger>
                        <TabsTrigger value="api"><Key className="mr-1.5 h-3.5 w-3.5" />API Keys ({appState.api_keys?.length ?? 0})</TabsTrigger>
                        <TabsTrigger value="versions"><GitBranch className="mr-1.5 h-3.5 w-3.5" />Versions</TabsTrigger>
                        <TabsTrigger value="settings"><Settings className="mr-1.5 h-3.5 w-3.5" />Settings</TabsTrigger>
                        <TabsTrigger value="audit"><History className="mr-1.5 h-3.5 w-3.5" />Audit</TabsTrigger>
                    </TabsList>

                    {/* ── OVERVIEW TAB ──────────────────────────────────── */}
                    <TabsContent value="overview" className="space-y-4 mt-4">
                        <div className="grid gap-4 lg:grid-cols-3">

                            {/* Left col — Play Store metadata */}
                            <div className="lg:col-span-2 space-y-4">

                                {/* Play Store info */}
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="flex items-center gap-2 text-base">
                                            <Store className="h-4 w-4" /> Play Store Details
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <InfoRow label="Developer">
                                                {appState.developer_name ?? <span className="text-muted-foreground">—</span>}
                                            </InfoRow>
                                            <InfoRow label="Category">
                                                {appState.category
                                                    ? <Badge variant="outline">{appState.category}</Badge>
                                                    : <span className="text-muted-foreground">—</span>}
                                            </InfoRow>
                                            <InfoRow label="Rating">
                                                {appState.rating != null ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="flex">
                                                            {[1,2,3,4,5].map(s => (
                                                                <Star key={s} className={`h-4 w-4 ${s <= Math.round(appState.rating!) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                                                            ))}
                                                        </div>
                                                        <span className="font-semibold">{appState.rating.toFixed(1)}</span>
                                                        {appState.ratings_count && (
                                                            <span className="text-xs text-muted-foreground">({appState.ratings_count.toLocaleString()} ratings)</span>
                                                        )}
                                                    </div>
                                                ) : isSyncing ? <Skeleton className="h-4 w-32" /> : <span className="text-muted-foreground">—</span>}
                                            </InfoRow>
                                            <InfoRow label="Installs">
                                                {appState.installs ? (
                                                    <span className="flex items-center gap-1"><Download className="h-3.5 w-3.5 text-muted-foreground" />{appState.installs}</span>
                                                ) : isSyncing ? <Skeleton className="h-4 w-20" /> : <span className="text-muted-foreground">—</span>}
                                            </InfoRow>
                                            <InfoRow label="Play Status">
                                                <PlayStatusBadge status={appState.play_status} />
                                            </InfoRow>
                                            <InfoRow label="Play Version Code">
                                                {appState.play_version_code
                                                    ? <code className="text-sm">{appState.play_version_code}</code>
                                                    : <span className="text-muted-foreground">—</span>}
                                            </InfoRow>
                                            <InfoRow label="Last Updated on Store">
                                                {appState.store_last_updated_at
                                                    ? new Date(appState.store_last_updated_at).toLocaleDateString()
                                                    : <span className="text-muted-foreground">—</span>}
                                            </InfoRow>
                                            <InfoRow label="Last Synced">
                                                {appState.last_synced_at
                                                    ? new Date(appState.last_synced_at).toLocaleString()
                                                    : <span className="text-muted-foreground">Never</span>}
                                            </InfoRow>
                                        </div>

                                        {/* Links row */}
                                        <div className="flex flex-wrap gap-2 pt-1">
                                            <a href={`https://play.google.com/store/apps/details?id=${appState.package_name}`}
                                                target="_blank" rel="noopener noreferrer">
                                                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                                    <Store className="h-3 w-3" /> Play Store
                                                </Button>
                                            </a>
                                            {appState.website_url && (
                                                <a href={appState.website_url} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                                        <Globe className="h-3 w-3" /> Website
                                                    </Button>
                                                </a>
                                            )}
                                            {appState.privacy_policy_url && (
                                                <a href={appState.privacy_policy_url} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                                                        <Shield className="h-3 w-3" /> Privacy Policy
                                                    </Button>
                                                </a>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Description */}
                                {appState.description && (
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="text-base">Description</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line line-clamp-6">
                                                {appState.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Screenshots */}
                                {appState.screenshots && appState.screenshots.length > 0 && (
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <MonitorSmartphone className="h-4 w-4" /> Screenshots
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex gap-2 overflow-x-auto pb-2">
                                                {appState.screenshots.map((url, i) => (
                                                    <img key={i} src={url} alt={`Screenshot ${i + 1}`}
                                                        className="h-48 w-auto rounded-lg border object-cover shrink-0"
                                                        onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                                    />
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}


                            </div>

                            {/* Right col — App config */}
                            <div className="space-y-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Settings className="h-4 w-4" /> App Config
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <InfoRow label="Current Version">
                                            <code>{appState.current_version}</code>
                                        </InfoRow>
                                        <InfoRow label="Minimum Version">
                                            <code>{appState.minimum_version ?? '—'}</code>
                                        </InfoRow>
                                        <InfoRow label="Latest Version">
                                            <code>{appState.latest_version ?? '—'}</code>
                                        </InfoRow>
                                        <Separator />
                                        {[
                                            { label: 'Ads Enabled', val: appState.ads_enabled },
                                            { label: 'Maintenance Mode', val: appState.maintenance_mode },
                                            { label: 'Force Update', val: appState.force_update },
                                            { label: 'Review Dialog', val: appState.review_dialog_enabled },
                                        ].map(({ label, val }) => (
                                            <div key={label} className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">{label}</span>
                                                <Badge variant={val ? 'default' : 'secondary'} className="text-xs">
                                                    {val ? 'On' : 'Off'}
                                                </Badge>
                                            </div>
                                        ))}
                                        <Separator />
                                        <InfoRow label="Created">
                                            <div>
                                                <span>{new Date(appState.created_at).toLocaleDateString()}</span>
                                                {appState.creator && <span className="text-xs text-muted-foreground ml-1">by {appState.creator.name}</span>}
                                            </div>
                                        </InfoRow>
                                        <InfoRow label="Updated">
                                            <div>
                                                <span>{new Date(appState.updated_at).toLocaleDateString()}</span>
                                                {appState.updater && <span className="text-xs text-muted-foreground ml-1">by {appState.updater.name}</span>}
                                            </div>
                                        </InfoRow>
                                    </CardContent>
                                </Card>

                                {/* Banner image */}
                                {appState.banner_url && (
                                    <Card className="overflow-hidden">
                                        <img src={appState.banner_url} alt="Feature graphic"
                                            className="w-full object-cover rounded-t-xl"
                                            onError={(e) => (e.target as HTMLImageElement).parentElement!.style.display = 'none'}
                                        />
                                        <CardContent className="py-2 px-3">
                                            <p className="text-xs text-muted-foreground">Feature Graphic</p>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* ── ADS TAB ───────────────────────────────────────── */}
                    <TabsContent value="ads" className="mt-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Ad Units</CardTitle>
                                        <CardDescription>Manage ad units for this application</CardDescription>
                                    </div>
                                    <Button asChild>
                                        <Link href={route('admin.applications.ad-units.index', appState.id)}>
                                            Manage Ad Units
                                        </Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {!appState.ad_units?.length ? (
                                    <p className="text-center text-muted-foreground py-8">No ad units configured yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {appState.ad_units.map((adUnit) => (
                                            <div key={adUnit.id} className="flex items-center justify-between rounded-lg border p-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium">{AD_TYPE_LABELS[adUnit.ad_type] ?? adUnit.ad_type}</h4>
                                                        <Badge variant={adUnit.is_enabled ? 'default' : 'secondary'}>
                                                            {adUnit.is_enabled ? 'Enabled' : 'Disabled'}
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                                                        {adUnit.ad_unit_id ? adUnit.ad_unit_id.substring(0, 30) + (adUnit.ad_unit_id.length > 30 ? '…' : '') : 'N/A'}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">{adUnit.ad_network.name} ({adUnit.ad_network.platform})</p>
                                                </div>
                                                {adUnit.frequency && (
                                                    <div className="text-right text-sm">
                                                        <p className="font-medium">Frequency</p>
                                                        <p className="text-xs text-muted-foreground">Every {adUnit.frequency}x</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── API KEYS TAB ──────────────────────────────────── */}
                    <TabsContent value="api" className="mt-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>API Keys</CardTitle>
                                        <CardDescription>Manage API keys for this application</CardDescription>
                                    </div>
                                    <Button asChild>
                                        <Link href={route('admin.applications.api-keys.index', appState.id)}>
                                            Manage API Keys
                                        </Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {!appState.api_keys?.length ? (
                                    <p className="text-center text-muted-foreground py-8">No API keys generated yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {appState.api_keys.map((apiKey) => (
                                            <div key={apiKey.id} className="flex items-center justify-between rounded-lg border p-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium">{apiKey.name}</h4>
                                                        <Badge variant={apiKey.is_active ? 'default' : 'secondary'}>
                                                            {apiKey.is_active ? 'Active' : 'Revoked'}
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-1 font-mono text-xs text-muted-foreground">{apiKey.key_hash}</p>
                                                    {apiKey.creator && <p className="text-xs text-muted-foreground">by {apiKey.creator.name}</p>}
                                                </div>
                                                <div className="text-right text-sm">
                                                    {apiKey.last_used_at ? (
                                                        <>
                                                            <p className="font-medium">Last used</p>
                                                            <p className="text-muted-foreground">{new Date(apiKey.last_used_at).toLocaleString()}</p>
                                                        </>
                                                    ) : (
                                                        <p className="text-muted-foreground">Never used</p>
                                                    )}
                                                    {apiKey.expires_at && (
                                                        <p className="text-xs text-muted-foreground mt-1">
                                                            Expires {new Date(apiKey.expires_at).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── VERSIONS TAB ──────────────────────────────────── */}
                    <TabsContent value="versions" className="mt-4">
                        <Card>
                            <CardHeader><CardTitle>Version History</CardTitle></CardHeader>
                            <CardContent>
                                {!appState.versions?.length ? (
                                    <p className="text-center text-muted-foreground py-8">No versions tracked yet</p>
                                ) : (
                                    <div className="space-y-3">
                                        {appState.versions.map((v) => (
                                            <div key={v.id} className="flex items-start justify-between rounded-lg border p-4">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <code className="font-semibold">{v.version}</code>
                                                        {v.is_active && <Badge className="bg-green-500 text-xs">Active</Badge>}
                                                    </div>
                                                    {v.release_notes && (
                                                        <p className="mt-1 text-sm text-muted-foreground">{v.release_notes}</p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(v.released_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── SETTINGS TAB ──────────────────────────────────── */}
                    <TabsContent value="settings" className="mt-4">
                        <Card>
                            <CardHeader><CardTitle>App Settings</CardTitle></CardHeader>
                            <CardContent>
                                {!appState.settings?.length ? (
                                    <p className="text-center text-muted-foreground py-8">No settings configured</p>
                                ) : (
                                    <div className="divide-y">
                                        {appState.settings.map((s) => (
                                            <div key={s.id} className="flex items-center justify-between py-3">
                                                <div>
                                                    <code className="text-sm font-medium">{s.key}</code>
                                                    <Badge variant="outline" className="ml-2 text-xs">{s.type}</Badge>
                                                </div>
                                                <span className="text-sm font-mono text-muted-foreground">{s.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* ── AUDIT TAB ─────────────────────────────────────── */}
                    <TabsContent value="audit" className="mt-4">
                        <Card>
                            <CardHeader><CardTitle>Audit Log</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-center text-muted-foreground py-8">
                                    Audit logs are available in{' '}
                                    <Link href={route('admin.audit-logs.index')} className="text-primary hover:underline">
                                        Audit Logs
                                    </Link>
                                </p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

ApplicationShow.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Applications', href: '/admin/applications' },
        { title: 'Details', href: '#' },
    ],
};
