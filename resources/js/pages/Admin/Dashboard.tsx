import { Head, Link } from '@inertiajs/react';
import { Eye } from 'lucide-react';
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
                <div className="relative min-h-[400px] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-white p-6 dark:border-sidebar-border dark:bg-sidebar">
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
                                <div key={app.id} className="flex items-center justify-between border-b pb-3">
                                    <div>
                                        <p className="font-medium">{app.name}</p>
                                        <p className="text-sm text-muted-foreground">{app.package_name}</p>
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
                        <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                    )}
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
