import { Head } from '@inertiajs/react';
import { 
    Smartphone, 
    Megaphone, 
    Key, 
    Activity, 
    TrendingUp,
    Users,
    BarChart3,
    PieChart
} from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

type Statistics = {
    total_applications: number;
    active_applications: number;
    total_ad_units: number;
    enabled_ad_units: number;
    total_api_keys: number;
    active_api_keys: number;
    total_api_requests: number;
    total_audit_logs: number;
};

type Props = {
    statistics: Statistics;
    applicationsByStatus: Record<string, number>;
    applicationsByPlatform: Record<string, number>;
    adUnitsByType: Record<string, number>;
    adUnitsByNetwork: Record<string, number>;
    recentActivity: Record<string, number>;
    apiUsage: Record<string, number>;
    topApplications: Array<{ name: string; ad_units_count: number }>;
    recentAuditLogs: Array<{
        action: string;
        module: string;
        user: string;
        created_at: string;
    }>;
};

const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    inactive: 'bg-gray-500',
    maintenance: 'bg-yellow-500',
    archived: 'bg-red-500',
};

const actionColors: Record<string, string> = {
    created: 'bg-green-500',
    updated: 'bg-blue-500',
    deleted: 'bg-red-500',
    viewed: 'bg-gray-500',
};

export default function AnalyticsIndex({
    statistics,
    applicationsByStatus,
    applicationsByPlatform,
    adUnitsByType,
    adUnitsByNetwork,
    recentActivity,
    apiUsage,
    topApplications,
    recentAuditLogs,
}: Props) {
    return (
        <>
            <Head title="Analytics" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
                    <p className="text-sm text-muted-foreground">
                        Overview of system statistics and activity
                    </p>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Applications</CardTitle>
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_applications}</div>
                            <p className="text-xs text-muted-foreground">
                                {statistics.active_applications} active
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ad Units</CardTitle>
                            <Megaphone className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_ad_units}</div>
                            <p className="text-xs text-muted-foreground">
                                {statistics.enabled_ad_units} enabled
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">API Keys</CardTitle>
                            <Key className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{statistics.total_api_keys}</div>
                            <p className="text-xs text-muted-foreground">
                                {statistics.active_api_keys} active
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">API Requests</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {statistics.total_api_requests.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">Total requests</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts Row */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Applications by Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChart className="h-5 w-5" />
                                Applications by Status
                            </CardTitle>
                            <CardDescription>Distribution of application states</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(applicationsByStatus).map(([status, count]) => (
                                    <div key={status} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div
                                                className={`h-3 w-3 rounded-full ${statusColors[status] || 'bg-gray-500'}`}
                                            />
                                            <span className="text-sm capitalize">{status}</span>
                                        </div>
                                        <span className="text-sm font-medium">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Applications by Platform */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Smartphone className="h-5 w-5" />
                                Applications by Platform
                            </CardTitle>
                            <CardDescription>Android vs iOS distribution</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(applicationsByPlatform).map(([platform, count]) => (
                                    <div key={platform} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">
                                                {platform === 'android' ? '🤖' : '🍎'}
                                            </span>
                                            <span className="text-sm capitalize">{platform}</span>
                                        </div>
                                        <span className="text-sm font-medium">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Ad Units Analytics */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Ad Units by Type */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Ad Units by Type
                            </CardTitle>
                            <CardDescription>Distribution of ad unit types</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(adUnitsByType).map(([type, count]) => (
                                    <div key={type} className="flex items-center justify-between">
                                        <span className="text-sm capitalize">
                                            {type.replace('_', ' ')}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-24 rounded-full bg-muted">
                                                <div
                                                    className="h-2 rounded-full bg-primary"
                                                    style={{
                                                        width: `${(count / statistics.total_ad_units) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium w-8 text-right">
                                                {count}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Ad Units by Network */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Megaphone className="h-5 w-5" />
                                Ad Units by Network
                            </CardTitle>
                            <CardDescription>Distribution by ad networks</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(adUnitsByNetwork).map(([network, count]) => (
                                    <div key={network} className="flex items-center justify-between">
                                        <span className="text-sm">{network}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-24 rounded-full bg-muted">
                                                <div
                                                    className="h-2 rounded-full bg-primary"
                                                    style={{
                                                        width: `${(count / statistics.total_ad_units) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium w-8 text-right">
                                                {count}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Overview */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Top Applications */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Top Applications
                            </CardTitle>
                            <CardDescription>By number of ad units</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {topApplications.map((app, index) => (
                                    <div key={app.name} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium text-muted-foreground w-6">
                                                #{index + 1}
                                            </span>
                                            <span className="text-sm">{app.name}</span>
                                        </div>
                                        <Badge variant="secondary">{app.ad_units_count} units</Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                Recent Activity
                            </CardTitle>
                            <CardDescription>Latest system actions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {recentAuditLogs.map((log, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge
                                                className={`${actionColors[log.action.toLowerCase()] || 'bg-gray-500'} text-white`}
                                            >
                                                {log.action}
                                            </Badge>
                                            <span className="text-sm">{log.module}</span>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {log.created_at}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity Charts */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Recent System Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                System Activity (Last 7 Days)
                            </CardTitle>
                            <CardDescription>Audit log entries per day</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {Object.entries(recentActivity).map(([date, count]) => (
                                    <div key={date} className="flex items-center justify-between">
                                        <span className="text-sm">{date}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-32 rounded-full bg-muted">
                                                <div
                                                    className="h-2 rounded-full bg-green-500"
                                                    style={{
                                                        width: `${Math.min((count / Math.max(...Object.values(recentActivity))) * 100, 100)}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium w-12 text-right">
                                                {count}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* API Usage */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5" />
                                API Usage (Last 7 Days)
                            </CardTitle>
                            <CardDescription>API requests per day</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {Object.entries(apiUsage).map(([date, count]) => (
                                    <div key={date} className="flex items-center justify-between">
                                        <span className="text-sm">{date}</span>
                                        <div className="flex items-center gap-2">
                                            <div className="h-2 w-32 rounded-full bg-muted">
                                                <div
                                                    className="h-2 rounded-full bg-blue-500"
                                                    style={{
                                                        width: `${Math.min((count / Math.max(...Object.values(apiUsage))) * 100, 100)}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium w-12 text-right">
                                                {count}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

AnalyticsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Analytics', href: '/admin/analytics' },
    ],
};
