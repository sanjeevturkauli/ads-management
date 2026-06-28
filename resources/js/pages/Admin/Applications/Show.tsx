import { Head, Link } from '@inertiajs/react';
import { useState } from 'react';
import { route } from '@/lib/route';
import {
    ArrowLeft,
    Edit,
    Settings,
    Key,
    FileText,
    History,
    Megaphone,
    GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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
    maintenance_mode: boolean;
    force_update: boolean;
    minimum_version?: string;
    latest_version?: string;
    review_dialog_enabled: boolean;
    created_at: string;
    updated_at: string;
    creator?: {
        name: string;
        email: string;
    };
    updater?: {
        name: string;
        email: string;
    };
    ad_units?: AdUnit[];
    api_keys?: ApiKey[];
    settings?: AppSetting[];
    versions?: AppVersion[];
};

type AdUnit = {
    id: string;
    ad_type: string;
    ad_unit_id: string;
    is_enabled: boolean;
    frequency?: number;
    priority?: number;
    ad_network: {
        name: string;
        platform: string;
    };
};

type ApiKey = {
    id: string;
    name: string;
    key_hash: string;
    last_used_at?: string;
    expires_at?: string;
    is_active: boolean;
    created_at: string;
    creator?: {
        name: string;
    };
};

type AppSetting = {
    id: string;
    key: string;
    value: string;
    type: string;
};

type AppVersion = {
    id: string;
    version: string;
    release_notes?: string;
    is_active: boolean;
    released_at: string;
};

type Props = {
    application: Application;
};

export default function ApplicationShow({ application }: Props) {
    const [activeTab, setActiveTab] = useState('general');

    const statusColors = {
        active: 'bg-green-500',
        inactive: 'bg-gray-500',
        maintenance: 'bg-yellow-500',
        archived: 'bg-red-500',
    };

    const adTypeLabels: Record<string, string> = {
        banner: 'Banner Ad',
        interstitial: 'Interstitial Ad',
        rewarded: 'Rewarded Ad',
        rewarded_interstitial: 'Rewarded Interstitial Ad',
        native: 'Native Ad',
        app_open: 'App Open Ad',
    };

    return (
        <>
            <Head title={`${application.name} - Applications`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={route('admin.applications.index')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        {application.icon_url && (
                            <img
                                src={application.icon_url}
                                alt={application.name}
                                className="h-16 w-16 rounded-xl"
                            />
                        )}
                        <div>
                            <h1 className="text-2xl font-bold">{application.name}</h1>
                            <a
                                href={
                                    application.platform === 'android'
                                        ? `https://play.google.com/store/apps/details?id=${application.package_name}`
                                        : `https://apps.apple.com/app/${application.package_name}`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
                            >
                                {application.package_name}
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
                    <Button asChild>
                        <Link href={route('admin.applications.edit', application.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Application
                        </Link>
                    </Button>
                </div>

                {/* Quick Info Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <div
                                    className={`h-2 w-2 rounded-full ${statusColors[application.status]}`}
                                />
                                <span className="font-medium capitalize">{application.status}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Platform</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Badge variant="outline" className="text-base">
                                {application.platform === 'android' ? '🤖' : '🍎'}{' '}
                                {application.platform}
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Version</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <code className="text-base font-semibold">{application.current_version}</code>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">Ads Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {application.ads_enabled ? (
                                <Badge className="bg-green-500">Enabled</Badge>
                            ) : (
                                <Badge variant="secondary">Disabled</Badge>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                    <TabsList className="grid w-full grid-cols-6">
                        <TabsTrigger value="general">
                            <Settings className="mr-2 h-4 w-4" />
                            General
                        </TabsTrigger>
                        <TabsTrigger value="ads">
                            <Megaphone className="mr-2 h-4 w-4" />
                            Ad Units ({application.ad_units?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="api">
                            <Key className="mr-2 h-4 w-4" />
                            API Keys ({application.api_keys?.length || 0})
                        </TabsTrigger>
                        <TabsTrigger value="versions">
                            <GitBranch className="mr-2 h-4 w-4" />
                            Versions
                        </TabsTrigger>
                        <TabsTrigger value="settings">
                            <FileText className="mr-2 h-4 w-4" />
                            Settings
                        </TabsTrigger>
                        <TabsTrigger value="audit">
                            <History className="mr-2 h-4 w-4" />
                            Audit Log
                        </TabsTrigger>
                    </TabsList>

                    {/* General Tab */}
                    <TabsContent value="general" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>General Information</CardTitle>
                                <CardDescription>
                                    Basic information about this application
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Application Name
                                        </label>
                                        <p className="mt-1 font-medium">{application.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Package Name
                                        </label>
                                        <a
                                            href={
                                                application.platform === 'android'
                                                    ? `https://play.google.com/store/apps/details?id=${application.package_name}`
                                                    : `https://apps.apple.com/app/${application.package_name}`
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-1 font-mono text-sm text-blue-600 hover:underline dark:text-blue-400 flex items-center gap-1"
                                        >
                                            {application.package_name}
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
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Platform
                                        </label>
                                        <p className="mt-1 capitalize">{application.platform}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Current Version
                                        </label>
                                        <p className="mt-1 font-mono">{application.current_version}</p>
                                    </div>
                                    {application.minimum_version && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Minimum Version
                                            </label>
                                            <p className="mt-1 font-mono">
                                                {application.minimum_version}
                                            </p>
                                        </div>
                                    )}
                                    {application.latest_version && (
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Latest Version
                                            </label>
                                            <p className="mt-1 font-mono">
                                                {application.latest_version}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {application.description && (
                                    <>
                                        <Separator />
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">
                                                Description
                                            </label>
                                            <p className="mt-1 text-sm leading-relaxed">
                                                {application.description}
                                            </p>
                                        </div>
                                    </>
                                )}

                                <Separator />

                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="flex items-center justify-between rounded-lg border p-3">
                                        <span className="text-sm font-medium">Ads Enabled</span>
                                        <Badge
                                            variant={
                                                application.ads_enabled ? 'default' : 'secondary'
                                            }
                                        >
                                            {application.ads_enabled ? 'Yes' : 'No'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border p-3">
                                        <span className="text-sm font-medium">
                                            Maintenance Mode
                                        </span>
                                        <Badge
                                            variant={
                                                application.maintenance_mode
                                                    ? 'destructive'
                                                    : 'secondary'
                                            }
                                        >
                                            {application.maintenance_mode ? 'On' : 'Off'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center justify-between rounded-lg border p-3">
                                        <span className="text-sm font-medium">Force Update</span>
                                        <Badge
                                            variant={
                                                application.force_update ? 'destructive' : 'secondary'
                                            }
                                        >
                                            {application.force_update ? 'On' : 'Off'}
                                        </Badge>
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Created At
                                        </label>
                                        <p className="mt-1 text-sm">
                                            {new Date(application.created_at).toLocaleString()}
                                        </p>
                                        {application.creator && (
                                            <p className="text-xs text-muted-foreground">
                                                by {application.creator.name}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Last Updated
                                        </label>
                                        <p className="mt-1 text-sm">
                                            {new Date(application.updated_at).toLocaleString()}
                                        </p>
                                        {application.updater && (
                                            <p className="text-xs text-muted-foreground">
                                                by {application.updater.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Ad Units Tab */}
                    <TabsContent value="ads" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Ad Units</CardTitle>
                                        <CardDescription>
                                            Manage ad units for this application
                                        </CardDescription>
                                    </div>
                                    <Button asChild>
                                        <Link
                                            href={route(
                                                'admin.applications.ad-units.index',
                                                application.id
                                            )}
                                        >
                                            Manage Ad Units
                                        </Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {!application.ad_units || application.ad_units.length === 0 ? (
                                    <p className="text-center text-muted-foreground">
                                        No ad units configured yet
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {application.ad_units.map((adUnit) => (
                                            <div
                                                key={adUnit.id}
                                                className="flex items-center justify-between rounded-lg border p-4"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium">
                                                            {adTypeLabels[adUnit.ad_type]}
                                                        </h4>
                                                        <Badge
                                                            variant={
                                                                adUnit.is_enabled
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {adUnit.is_enabled
                                                                ? 'Enabled'
                                                                : 'Disabled'}
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                                                        {adUnit.ad_unit_id ? 
                                                            (adUnit.ad_unit_id.length > 20 
                                                                ? `${adUnit.ad_unit_id.substring(0, 20)}...`
                                                                : adUnit.ad_unit_id
                                                            )
                                                            : 'N/A'
                                                        }
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {adUnit.ad_network.name} (
                                                        {adUnit.ad_network.platform})
                                                    </p>
                                                </div>
                                                {adUnit.frequency && (
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium">
                                                            Frequency
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Every {adUnit.frequency} times
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* API Keys Tab */}
                    <TabsContent value="api" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>API Keys</CardTitle>
                                        <CardDescription>
                                            Manage API keys for this application
                                        </CardDescription>
                                    </div>
                                    <Button asChild>
                                        <Link
                                            href={route(
                                                'admin.applications.api-keys.index',
                                                application.id
                                            )}
                                        >
                                            Manage API Keys
                                        </Link>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {!application.api_keys || application.api_keys.length === 0 ? (
                                    <p className="text-center text-muted-foreground">
                                        No API keys generated yet
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {application.api_keys.map((apiKey) => (
                                            <div
                                                key={apiKey.id}
                                                className="flex items-center justify-between rounded-lg border p-4"
                                            >
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h4 className="font-medium">{apiKey.name}</h4>
                                                        <Badge
                                                            variant={
                                                                apiKey.is_active
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {apiKey.is_active ? 'Active' : 'Revoked'}
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                                                        {apiKey.key_hash}
                                                    </p>
                                                    {apiKey.creator && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Created by {apiKey.creator.name}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="text-right text-sm">
                                                    {apiKey.last_used_at ? (
                                                        <>
                                                            <p className="font-medium">Last used</p>
                                                            <p className="text-muted-foreground">
                                                                {new Date(
                                                                    apiKey.last_used_at
                                                                ).toLocaleString()}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <p className="text-muted-foreground">
                                                            Never used
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

                    {/* Versions Tab */}
                    <TabsContent value="versions" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Version History</CardTitle>
                                        <CardDescription>
                                            Track application versions and releases
                                        </CardDescription>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="rounded-lg border p-4">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Current Version
                                            </p>
                                            <p className="mt-1 text-2xl font-bold">
                                                {application.current_version}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border p-4">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Minimum Version
                                            </p>
                                            <p className="mt-1 text-2xl font-bold">
                                                {application.minimum_version || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="rounded-lg border p-4">
                                            <p className="text-sm font-medium text-muted-foreground">
                                                Latest Version
                                            </p>
                                            <p className="mt-1 text-2xl font-bold">
                                                {application.latest_version || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    <Separator />

                                    {application.versions && application.versions.length > 0 ? (
                                        <div className="space-y-4">
                                            {application.versions.map((version) => (
                                                <div key={version.id} className="rounded-lg border p-4">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-mono text-lg font-semibold">
                                                                    v{version.version}
                                                                </h4>
                                                                <Badge
                                                                    variant={
                                                                        version.is_active
                                                                            ? 'default'
                                                                            : 'secondary'
                                                                    }
                                                                >
                                                                    {version.is_active
                                                                        ? 'Active'
                                                                        : 'Inactive'}
                                                                </Badge>
                                                            </div>
                                                            {version.release_notes && (
                                                                <p className="mt-2 text-sm text-muted-foreground">
                                                                    {version.release_notes}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground">
                                                            {new Date(
                                                                version.released_at
                                                            ).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-muted-foreground py-8">
                                            No version history available
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Settings Tab */}
                    <TabsContent value="settings" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Application Settings</CardTitle>
                                <CardDescription>
                                    Custom settings and configurations for this application
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Feature Toggles */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Features</h3>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between rounded-lg border p-4">
                                                <div>
                                                    <p className="font-medium">Ads Enabled</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Enable advertisements in this application
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={
                                                        application.ads_enabled ? 'default' : 'secondary'
                                                    }
                                                >
                                                    {application.ads_enabled ? 'Enabled' : 'Disabled'}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center justify-between rounded-lg border p-4">
                                                <div>
                                                    <p className="font-medium">Maintenance Mode</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Display maintenance message to users
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={
                                                        application.maintenance_mode
                                                            ? 'destructive'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {application.maintenance_mode ? 'On' : 'Off'}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center justify-between rounded-lg border p-4">
                                                <div>
                                                    <p className="font-medium">Force Update</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Require users to update to the latest version
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={
                                                        application.force_update
                                                            ? 'destructive'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {application.force_update ? 'On' : 'Off'}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center justify-between rounded-lg border p-4">
                                                <div>
                                                    <p className="font-medium">Review Dialog</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        Show app review prompt to users
                                                    </p>
                                                </div>
                                                <Badge
                                                    variant={
                                                        application.review_dialog_enabled
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {application.review_dialog_enabled
                                                        ? 'Enabled'
                                                        : 'Disabled'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Custom Settings */}
                                    {application.settings && application.settings.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">
                                                Custom Settings
                                            </h3>
                                            <div className="space-y-2">
                                                {application.settings.map((setting) => (
                                                    <div
                                                        key={setting.id}
                                                        className="flex items-center justify-between rounded-lg border p-3"
                                                    >
                                                        <div>
                                                            <p className="font-medium">{setting.key}</p>
                                                            <p className="text-sm text-muted-foreground">
                                                                Type: {setting.type}
                                                            </p>
                                                        </div>
                                                        <code className="text-sm">
                                                            {setting.value}
                                                        </code>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-4">
                                        <Button asChild>
                                            <Link
                                                href={route(
                                                    'admin.applications.edit',
                                                    application.id
                                                )}
                                            >
                                                Edit Settings
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Audit Log Tab */}
                    <TabsContent value="audit">
                        <Card>
                            <CardHeader>
                                <CardTitle>Audit Log</CardTitle>
                                <CardDescription>
                                    Track all changes made to this application
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-center text-muted-foreground">
                                    Audit log coming soon
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
        { title: 'Details' },
    ],
};
