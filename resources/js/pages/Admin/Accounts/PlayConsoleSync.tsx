import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { route } from '@/lib/route';
import toast from 'react-hot-toast';
import {
    ArrowLeft,
    Download,
    CheckCircle2,
    AlertCircle,
    Smartphone,
    RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@inertiajs/react';

type PlayApp = {
    package_name: string;
    name: string;
    icon_url: string | null;
    status: string;
    last_updated: string | null;
    already_added: boolean;
};

type Account = {
    id: string;
    name: string;
    account_id: string | null;
};

type Props = {
    account: Account;
    apps: PlayApp[];
    fetchError: string | null;
};

export default function PlayConsoleSync({ account, apps, fetchError }: Props) {
    const newApps      = apps.filter((a) => !a.already_added);
    const existingApps = apps.filter((a) => a.already_added);

    const [selected, setSelected] = useState<string[]>(newApps.map((a) => a.package_name));
    const [importing, setImporting] = useState(false);

    const allNewSelected = newApps.length > 0 && selected.length === newApps.length;

    const toggleAll = (checked: boolean) => {
        setSelected(checked ? newApps.map((a) => a.package_name) : []);
    };

    const toggleOne = (pkg: string, checked: boolean) => {
        setSelected((prev) =>
            checked ? [...prev, pkg] : prev.filter((p) => p !== pkg)
        );
    };

    const handleImport = () => {
        if (selected.length === 0) {
            toast.error('Select at least one app to import.');
            return;
        }

        setImporting(true);
        const promise = new Promise<void>((resolve, reject) => {
            router.post(
                route('admin.accounts.play-console.import', account.id),
                { packages: selected },
                {
                    onSuccess: () => resolve(),
                    onError: () => { setImporting(false); reject('Import failed.'); },
                }
            );
        });

        toast.promise(promise, {
            loading: `Importing ${selected.length} app(s)…`,
            success: 'Apps imported successfully!',
            error:   (e) => String(e),
        });
    };

    return (
        <>
            <Head title="Sync from Play Console" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href={route('admin.accounts.index')}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold">Sync from Play Console</h1>
                            <p className="text-sm text-muted-foreground">
                                Account: <span className="font-medium">{account.name}</span>
                                {account.account_id && (
                                    <span className="ml-2 font-mono text-xs">({account.account_id})</span>
                                )}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={handleImport}
                        disabled={importing || selected.length === 0}
                    >
                        <Download className="mr-2 h-4 w-4" />
                        Import {selected.length > 0 ? `(${selected.length})` : ''} Selected
                    </Button>
                </div>

                {/* Summary cards */}
                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Apps Found</CardTitle>
                            <Smartphone className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{apps.length}</div>
                            <p className="text-xs text-muted-foreground">From Play Console</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">New Apps</CardTitle>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{newApps.length}</div>
                            <p className="text-xs text-muted-foreground">Ready to import</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Already Added</CardTitle>
                            <RefreshCw className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{existingApps.length}</div>
                            <p className="text-xs text-muted-foreground">Already in system</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Apps table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Apps from Play Console</CardTitle>
                        <CardDescription>
                            Select apps to import into your Applications list.
                            Already-added apps are shown for reference but cannot be re-imported.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {apps.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                {fetchError ? (
                                    <>
                                        <AlertCircle className="h-12 w-12 text-red-500 mb-3" />
                                        <p className="font-medium text-red-600 mb-2">Could not fetch apps automatically</p>
                                        <p className="text-sm text-muted-foreground max-w-md whitespace-pre-line mb-4">{fetchError}</p>
                                        <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 p-4 text-left max-w-lg">
                                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-2">💡 How to fix:</p>
                                            <ol className="text-sm text-amber-700 dark:text-amber-400 space-y-1 list-decimal list-inside">
                                                <li>Go to <strong>Accounts</strong> → Edit your Play Console account</li>
                                                <li>In the <strong>Package Names</strong> field, enter your app package names (one per line)</li>
                                                <li>Example: <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">com.example.myapp</code></li>
                                                <li>Save and try syncing again</li>
                                            </ol>
                                        </div>
                                        <Link href={route('admin.accounts.index')} className="mt-4">
                                            <Button variant="outline">← Back to Accounts</Button>
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <AlertCircle className="h-12 w-12 text-muted-foreground mb-3" />
                                        <p className="font-medium">No apps found</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Make sure your service account has access to apps in this Play Console account.
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10">
                                            <Checkbox
                                                checked={allNewSelected}
                                                onCheckedChange={(c) => toggleAll(c as boolean)}
                                                disabled={newApps.length === 0}
                                            />
                                        </TableHead>
                                        <TableHead>App</TableHead>
                                        <TableHead>Package Name</TableHead>
                                        <TableHead>Play Status</TableHead>
                                        <TableHead>Import Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {apps.map((app) => (
                                        <TableRow
                                            key={app.package_name}
                                            className={app.already_added ? 'opacity-50' : ''}
                                        >
                                            <TableCell>
                                                <Checkbox
                                                    checked={selected.includes(app.package_name)}
                                                    onCheckedChange={(c) => toggleOne(app.package_name, c as boolean)}
                                                    disabled={app.already_added}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                                                        {app.icon_url ? (
                                                            <img
                                                                src={app.icon_url}
                                                                alt={app.name}
                                                                className="h-full w-full object-cover"
                                                                onError={(e) => {
                                                                    (e.target as HTMLImageElement).style.display = 'none';
                                                                }}
                                                            />
                                                        ) : (
                                                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <span className="font-medium">{app.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                                    {app.package_name}
                                                </code>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {app.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {app.already_added ? (
                                                    <Badge className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 text-xs gap-1">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Already Added
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 text-xs gap-1">
                                                        <Download className="h-3 w-3" />
                                                        Ready to Import
                                                    </Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

PlayConsoleSync.layout = {
    breadcrumbs: [
        { title: 'Dashboard',  href: '/admin/dashboard' },
        { title: 'Accounts',   href: '/admin/accounts' },
        { title: 'Sync Apps',  href: '#' },
    ],
};
