import { Head, Link } from '@inertiajs/react';
import { Eye, Smartphone, Info } from 'lucide-react';
import { route } from '@/lib/route';
import { Button } from '@/components/ui/button';
import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';

type Props = {
    statistics: {
        total: number;
        active: number;
        inactive: number;
        maintenance: number;
        android: number;
        ios: number;
        with_ads: number;
    };
    apiStats: {
        today: number;
        total: number;
        successful: number;
        failed: number;
    };
    recentApplications: any[];
    apiUsageChart: any[];
    topApplications: any[];
};

export default function Dashboard({ 
    statistics, 
    apiStats, 
    recentApplications = [],
    apiUsageChart = [],
    topApplications = []
}: Props) {
    return (
        <>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">

                {/* Play Store metadata info banner */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 px-4 py-3 flex items-start gap-3">
                    <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Play Store metadata</strong> (icon, rating, installs, category, screenshots) is only available for apps that are
                        <strong> publicly published</strong> on the Play Store. Draft, removed, or internal-track-only apps will show minimal data.
                        Once an app is live, use <strong>Sync</strong> to fetch full details automatically.
                    </p>
                </div>
                {/* Statistics Cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3 lg:grid-cols-4">
                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-6 dark:border-sidebar-border dark:bg-sidebar">
                        <h3 className="text-sm font-medium text-muted-foreground">Total Applications</h3>
                        <p className="mt-2 text-3xl font-bold">{statistics.total}</p>
                    </div>
                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-6 dark:border-sidebar-border dark:bg-sidebar">
                        <h3 className="text-sm font-medium text-muted-foreground">Active Apps</h3>
                        <p className="mt-2 text-3xl font-bold text-green-600">{statistics.active}</p>
                    </div>
                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-6 dark:border-sidebar-border dark:bg-sidebar">
                        <h3 className="text-sm font-medium text-muted-foreground">API Calls Today</h3>
                        <p className="mt-2 text-3xl font-bold text-blue-600">{apiStats.today}</p>
                    </div>
                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-6 dark:border-sidebar-border dark:bg-sidebar">
                        <h3 className="text-sm font-medium text-muted-foreground">Total API Calls</h3>
                        <p className="mt-2 text-3xl font-bold">{apiStats.total}</p>
                    </div>
                </div>

                {/* Recent Applications */}
                <div className="relative flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-white dark:border-sidebar-border dark:bg-sidebar">
                    <div className="p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">Recent Applications</h2>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={route('admin.applications.index')}>
                                    View All
                                </Link>
                            </Button>
                        </div>
                        {recentApplications.length > 0 ? (
                            <div className="space-y-4">
                                {recentApplications.map((app: any) => (
                                    <div key={app.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center flex-shrink-0">
                                                {app.icon_url ? (
                                                    <img
                                                        src={app.icon_url}
                                                        alt={app.name}
                                                        className="h-full w-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                            if (e.currentTarget.parentElement) {
                                                                e.currentTarget.parentElement.innerHTML = `<div class="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><span class="text-lg font-bold text-primary">${app.name.charAt(0).toUpperCase()}</span></div>`;
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <Smartphone className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-medium">{app.name}</p>
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
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                                                {app.status}
                                            </span>
                                            <Button variant="ghost" size="icon" asChild>
                                                <Link href={route('admin.applications.show', app.id)}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">
                                <div className="rounded-full bg-muted p-3 mb-4">
                                    <svg
                                        className="h-10 w-10 text-muted-foreground"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                        />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-1">No applications yet</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Get started by creating your first mobile application
                                </p>
                                <Button asChild>
                                    <Link href={route('admin.applications.create')}>
                                        Create Application
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: '/admin/dashboard',
        },
    ],
};
