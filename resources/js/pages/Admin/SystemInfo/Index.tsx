import { Head } from '@inertiajs/react';
import { Server, Database, HardDrive, Cpu, Check, X } from 'lucide-react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

type SystemInfo = {
    app: Record<string, any>;
    laravel: Record<string, string>;
    database: Record<string, any>;
    cache: Record<string, string>;
    queue: Record<string, string>;
    session: Record<string, string>;
    mail: Record<string, string>;
    server: Record<string, string>;
    extensions: Record<string, boolean>;
};

type Props = {
    systemInfo: SystemInfo;
};

export default function SystemInfoIndex({ systemInfo }: Props) {
    return (
        <>
            <Head title="System Information" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Server className="h-6 w-6" />
                        System Information
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Server configuration and system details
                    </p>
                </div>

                {/* Application Info */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Server className="h-5 w-5" />
                                Application
                            </CardTitle>
                            <CardDescription>Laravel application information</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">Name</TableCell>
                                        <TableCell>{systemInfo.app.name}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Environment</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    systemInfo.app.env === 'production'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {systemInfo.app.env}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Debug Mode</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    systemInfo.app.debug ? 'destructive' : 'secondary'
                                                }
                                            >
                                                {systemInfo.app.debug ? 'Enabled' : 'Disabled'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">URL</TableCell>
                                        <TableCell className="font-mono text-sm">
                                            {systemInfo.app.url}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Timezone</TableCell>
                                        <TableCell>{systemInfo.app.timezone}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Locale</TableCell>
                                        <TableCell>{systemInfo.app.locale}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Cpu className="h-5 w-5" />
                                Framework & PHP
                            </CardTitle>
                            <CardDescription>Laravel and PHP versions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">Laravel Version</TableCell>
                                        <TableCell>
                                            <Badge>{systemInfo.laravel.version}</Badge>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">PHP Version</TableCell>
                                        <TableCell>
                                            <Badge>{systemInfo.laravel.php_version}</Badge>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Database Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Database className="h-5 w-5" />
                            Database
                        </CardTitle>
                        <CardDescription>Database connection and statistics</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-medium">Connection</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{systemInfo.database.connection}</Badge>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Database Name</TableCell>
                                    <TableCell className="font-mono">
                                        {systemInfo.database.database}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Host</TableCell>
                                    <TableCell>{systemInfo.database.host}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Port</TableCell>
                                    <TableCell>{systemInfo.database.port}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Database Size</TableCell>
                                    <TableCell>
                                        <Badge>{systemInfo.database.size}</Badge>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>

                        {systemInfo.database.tables && Object.keys(systemInfo.database.tables).length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium mb-3">Table Record Counts</h4>
                                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                                    {Object.entries(systemInfo.database.tables).map(([table, count]) => (
                                        <div
                                            key={table}
                                            className="flex items-center justify-between rounded-lg border p-3"
                                        >
                                            <span className="text-sm capitalize">
                                                {table.replace('_', ' ')}
                                            </span>
                                            <Badge variant="secondary">{count}</Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Services Configuration */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle>Cache</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Driver</span>
                                <Badge variant="outline">{systemInfo.cache.driver}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Queue</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Driver</span>
                                <Badge variant="outline">{systemInfo.queue.driver}</Badge>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Session</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Driver</span>
                                <Badge variant="outline">{systemInfo.session.driver}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Lifetime</span>
                                <span className="text-sm text-muted-foreground">
                                    {systemInfo.session.lifetime}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Server Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HardDrive className="h-5 w-5" />
                            Server
                        </CardTitle>
                        <CardDescription>Server configuration details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableBody>
                                <TableRow>
                                    <TableCell className="font-medium">Server Software</TableCell>
                                    <TableCell className="font-mono text-sm">
                                        {systemInfo.server.software}
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Operating System</TableCell>
                                    <TableCell>{systemInfo.server.os}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">PHP SAPI</TableCell>
                                    <TableCell>{systemInfo.server.php_sapi}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Max Execution Time</TableCell>
                                    <TableCell>{systemInfo.server.max_execution_time}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Memory Limit</TableCell>
                                    <TableCell>
                                        <Badge>{systemInfo.server.memory_limit}</Badge>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Upload Max Filesize</TableCell>
                                    <TableCell>{systemInfo.server.upload_max_filesize}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell className="font-medium">Post Max Size</TableCell>
                                    <TableCell>{systemInfo.server.post_max_size}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* PHP Extensions */}
                <Card>
                    <CardHeader>
                        <CardTitle>PHP Extensions</CardTitle>
                        <CardDescription>Required PHP extensions status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {Object.entries(systemInfo.extensions).map(([ext, loaded]) => (
                                <div
                                    key={ext}
                                    className="flex items-center justify-between rounded-lg border p-3"
                                >
                                    <span className="text-sm font-medium">{ext}</span>
                                    {loaded ? (
                                        <Badge className="bg-green-500">
                                            <Check className="h-3 w-3 mr-1" />
                                            Loaded
                                        </Badge>
                                    ) : (
                                        <Badge variant="destructive">
                                            <X className="h-3 w-3 mr-1" />
                                            Missing
                                        </Badge>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

SystemInfoIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'System Info', href: '/admin/system-info' },
    ],
};
