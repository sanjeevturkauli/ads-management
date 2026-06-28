import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { route } from '@/lib/route';
import { Search, Filter, Calendar as CalendarIcon, User, Activity, FileText, Eye, X } from 'lucide-react';
import { format } from 'date-fns';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type AuditLog = {
    id: string;
    user_id: string;
    action: string;
    module: string;
    auditable_type?: string;
    auditable_id?: string;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
    ip_address: string;
    user_agent: string;
    browser?: string;
    device?: string;
    platform?: string;
    description?: string;
    created_at: string;
    user?: {
        id: string;
        name: string;
        email: string;
    };
};

type Props = {
    auditLogs: {
        data: AuditLog[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    modules: string[];
    actions: string[];
    filters: {
        search?: string;
        module?: string;
        action?: string;
        user_id?: string;
        date_from?: string;
        date_to?: string;
    };
};

const actionColors: Record<string, string> = {
    created: 'bg-green-500',
    updated: 'bg-blue-500',
    deleted: 'bg-red-500',
    viewed: 'bg-gray-500',
    enabled: 'bg-green-500',
    disabled: 'bg-yellow-500',
    revoked: 'bg-red-500',
    generated: 'bg-blue-500',
    login: 'bg-green-500',
    logout: 'bg-gray-500',
};

export default function AuditLogsIndex({ auditLogs, modules, actions, filters }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
    const [dateFrom, setDateFrom] = useState<Date | undefined>(
        filters.date_from ? new Date(filters.date_from) : undefined
    );
    const [dateTo, setDateTo] = useState<Date | undefined>(
        filters.date_to ? new Date(filters.date_to) : undefined
    );

    const handleSearch = (value: string) => {
        setSearch(value);
        router.get(
            route('admin.audit-logs.index'),
            { ...filters, search: value },
            { preserveState: true, replace: true }
        );
    };

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route('admin.audit-logs.index'),
            { ...filters, [key]: value === '' ? undefined : value },
            { preserveState: true, replace: true }
        );
    };

    const clearFilters = () => {
        setSearch('');
        setDateFrom(undefined);
        setDateTo(undefined);
        router.get(route('admin.audit-logs.index'), {}, { preserveState: true, replace: true });
    };

    const handleDateFromChange = (date: Date | undefined) => {
        setDateFrom(date);
        if (date) {
            handleFilterChange('date_from', format(date, 'yyyy-MM-dd'));
        } else {
            handleFilterChange('date_from', '');
        }
    };

    const handleDateToChange = (date: Date | undefined) => {
        setDateTo(date);
        if (date) {
            handleFilterChange('date_to', format(date, 'yyyy-MM-dd'));
        } else {
            handleFilterChange('date_to', '');
        }
    };

    const hasActiveFilters = Object.keys(filters).some(
        (key) => filters[key as keyof typeof filters]
    );

    const openDetails = (log: AuditLog) => {
        setSelectedLog(log);
        setDetailsDialogOpen(true);
    };

    const getActionColor = (action: string) => {
        return actionColors[action.toLowerCase()] || 'bg-gray-500';
    };

    const formatJson = (data: Record<string, any>) => {
        return JSON.stringify(data, null, 2);
    };

    return (
        <>
            <Head title="Audit Logs" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div>
                    <h1 className="text-2xl font-bold">Audit Logs</h1>
                    <p className="text-sm text-muted-foreground">
                        Track all system activities and changes
                    </p>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Activity Log</CardTitle>
                                <CardDescription>
                                    View and filter system audit logs
                                </CardDescription>
                            </div>
                            {hasActiveFilters && (
                                <Button variant="outline" size="sm" onClick={clearFilters}>
                                    <X className="mr-2 h-4 w-4" />
                                    Clear Filters
                                </Button>
                            )}
                        </div>

                        {/* Search and Filters - All in One Row */}
                        <div className="flex items-center gap-2 pt-4 flex-wrap">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search logs..."
                                    value={search}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>

                            <Select
                                value={filters.module || ''}
                                onValueChange={(value) => handleFilterChange('module', value)}
                            >
                                <SelectTrigger className="w-[160px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="All Modules" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Modules</SelectItem>
                                    {modules.map((module) => (
                                        <SelectItem key={module} value={module}>
                                            {module}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.action || ''}
                                onValueChange={(value) => handleFilterChange('action', value)}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <Activity className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="All Actions" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Actions</SelectItem>
                                    {actions.map((action) => (
                                        <SelectItem key={action} value={action}>
                                            {action}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-[160px] justify-start text-left font-normal',
                                            !dateFrom && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateFrom ? format(dateFrom, 'dd-MM-yyyy') : 'From Date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateFrom}
                                        onSelect={handleDateFromChange}
                                        initialFocus
                                        captionLayout="dropdown-buttons"
                                        fromYear={2020}
                                        toYear={new Date().getFullYear()}
                                        className="rounded-lg border"
                                    />
                                </PopoverContent>
                            </Popover>

                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-[160px] justify-start text-left font-normal',
                                            !dateTo && 'text-muted-foreground'
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {dateTo ? format(dateTo, 'dd-MM-yyyy') : 'To Date'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={dateTo}
                                        onSelect={handleDateToChange}
                                        initialFocus
                                        captionLayout="dropdown-buttons"
                                        fromYear={2020}
                                        toYear={new Date().getFullYear()}
                                        className="rounded-lg border"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {auditLogs.data.length === 0 ? (
                            <div className="text-center py-8">
                                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">
                                    {hasActiveFilters
                                        ? 'No logs match your filters'
                                        : 'No audit logs recorded yet'}
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Timestamp</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Action</TableHead>
                                        <TableHead>Module</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Device</TableHead>
                                        <TableHead>IP Address</TableHead>
                                        <TableHead className="text-right">Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {auditLogs.data.map((log) => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-mono text-xs">
                                                {new Date(log.created_at).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                                {log.user ? (
                                                    <div>
                                                        <div className="font-medium">
                                                            {log.user.name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {log.user.email}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        System
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={`${getActionColor(log.action)} text-white`}
                                                >
                                                    {log.action}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{log.module}</Badge>
                                            </TableCell>
                                            <TableCell className="max-w-md">
                                                <span className="text-sm">
                                                    {log.description || '-'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div>{log.browser || 'Unknown'}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {log.device || 'Unknown'} •{' '}
                                                        {log.platform || 'Unknown'}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">
                                                {log.ip_address}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openDetails(log)}
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}

                        {/* Pagination */}
                        {auditLogs.last_page > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    Showing page {auditLogs.current_page} of {auditLogs.last_page} ({auditLogs.total} total)
                                </p>
                                <div className="flex gap-1">
                                    {/* Previous Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.get(
                                                route('admin.audit-logs.index'),
                                                { ...filters, page: auditLogs.current_page - 1 },
                                                { preserveState: true }
                                            )
                                        }
                                        disabled={auditLogs.current_page === 1}
                                    >
                                        Previous
                                    </Button>

                                    {/* Page Numbers */}
                                    {Array.from({ length: Math.min(auditLogs.last_page, 10) }, (_, i) => {
                                        const page = i + 1;
                                        if (
                                            page <= 3 ||
                                            page > auditLogs.last_page - 3 ||
                                            Math.abs(page - auditLogs.current_page) <= 1
                                        ) {
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={
                                                        auditLogs.current_page === page
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        router.get(
                                                            route('admin.audit-logs.index'),
                                                            { ...filters, page },
                                                            { preserveState: true }
                                                        )
                                                    }
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        } else if (page === 4 || page === auditLogs.last_page - 3) {
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
                                                route('admin.audit-logs.index'),
                                                { ...filters, page: auditLogs.current_page + 1 },
                                                { preserveState: true }
                                            )
                                        }
                                        disabled={auditLogs.current_page === auditLogs.last_page}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Details Dialog */}
            <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
                <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Audit Log Details</DialogTitle>
                        <DialogDescription>
                            Complete information about this activity
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-4">
                            {/* Basic Info */}
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Action
                                    </label>
                                    <div className="mt-1">
                                        <Badge
                                            className={`${getActionColor(selectedLog.action)} text-white`}
                                        >
                                            {selectedLog.action}
                                        </Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Module
                                    </label>
                                    <div className="mt-1">
                                        <Badge variant="outline">{selectedLog.module}</Badge>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        User
                                    </label>
                                    <p className="mt-1">
                                        {selectedLog.user
                                            ? `${selectedLog.user.name} (${selectedLog.user.email})`
                                            : 'System'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Timestamp
                                    </label>
                                    <p className="mt-1 font-mono text-sm">
                                        {new Date(selectedLog.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        IP Address
                                    </label>
                                    <p className="mt-1 font-mono text-sm">
                                        {selectedLog.ip_address}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Device Info
                                    </label>
                                    <p className="mt-1 text-sm">
                                        {selectedLog.browser} • {selectedLog.device} •{' '}
                                        {selectedLog.platform}
                                    </p>
                                </div>
                            </div>

                            {selectedLog.description && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Description
                                    </label>
                                    <p className="mt-1 text-sm">{selectedLog.description}</p>
                                </div>
                            )}

                            {selectedLog.auditable_type && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Resource
                                    </label>
                                    <p className="mt-1 text-sm">
                                        {selectedLog.auditable_type} (ID: {selectedLog.auditable_id})
                                    </p>
                                </div>
                            )}

                            {/* Old Values */}
                            {selectedLog.old_values &&
                                Object.keys(selectedLog.old_values).length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Old Values
                                        </label>
                                        <pre className="mt-1 rounded-md bg-muted p-4 text-xs overflow-x-auto whitespace-pre-wrap break-all">
                                            {formatJson(selectedLog.old_values)}
                                        </pre>
                                    </div>
                                )}

                            {/* New Values */}
                            {selectedLog.new_values &&
                                Object.keys(selectedLog.new_values).length > 0 && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            New Values
                                        </label>
                                        <pre className="mt-1 rounded-md bg-muted p-4 text-xs overflow-x-auto whitespace-pre-wrap break-all">
                                            {formatJson(selectedLog.new_values)}
                                        </pre>
                                    </div>
                                )}

                            {/* User Agent */}
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                    User Agent
                                </label>
                                <p className="mt-1 text-xs text-muted-foreground break-all leading-relaxed">
                                    {selectedLog.user_agent}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

AuditLogsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Audit Logs', href: '/admin/audit-logs' },
    ],
};
