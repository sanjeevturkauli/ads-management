import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { route } from '@/lib/route';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { Plus, Trash2, Edit, Calendar, Search, Filter, X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Switch } from '@/components/ui/switch';
import { DatePicker } from '@/components/date-picker';
import { ButtonGroup } from '@/components/ui/button-group';

// ─── Types ────────────────────────────────────────────────────────────────────

type Announcement = {
    id: string;
    application_id: string;
    message: string;
    start_date: string;
    end_date: string;
    status: 'active' | 'inactive';
    created_at: string;
    updated_at: string;
    creator?: { name: string };
    updater?: { name: string };
};

type Application = {
    id: string;
    name: string;
    package_name: string;
};

type Props = {
    application: Application;
    announcements: {
        data: Announcement[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnnouncementsIndex({ application, announcements }: Props) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [deletingAnnouncementId, setDeletingAnnouncementId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [formData, setFormData] = useState({
        message: '',
        start_date: undefined as Date | undefined,
        end_date: undefined as Date | undefined,
        status: 'active' as 'active' | 'inactive',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});

    const resetForm = () => {
        setFormData({ message: '', start_date: undefined, end_date: undefined, status: 'active' });
        setErrors({});
    };

    const handleCreate = async () => {
        const promise = fetch(route('admin.applications.announcements.store', application.id), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
            },
            body: JSON.stringify({
                message: formData.message,
                start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : '',
                end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : '',
                status: formData.status,
            }),
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    if (data.errors) setErrors(data.errors);
                    throw new Error(data.message || 'Failed to create announcement');
                }
                setIsCreateOpen(false);
                resetForm();
                router.reload({ only: ['announcements'] });
                return data;
            });

        toast.promise(promise, {
            loading: 'Creating announcement...',
            success: 'Announcement created successfully',
            error: (err) => err.message || 'Failed to create announcement',
        });
    };

    const handleUpdate = async () => {
        if (!editingAnnouncement) return;

        const promise = fetch(route('admin.applications.announcements.update', [application.id, editingAnnouncement.id]), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
            },
            body: JSON.stringify({
                message: formData.message,
                start_date: formData.start_date ? format(formData.start_date, 'yyyy-MM-dd') : '',
                end_date: formData.end_date ? format(formData.end_date, 'yyyy-MM-dd') : '',
                status: formData.status,
            }),
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    if (data.errors) setErrors(data.errors);
                    throw new Error(data.message || 'Failed to update announcement');
                }
                setIsEditOpen(false);
                setEditingAnnouncement(null);
                resetForm();
                router.reload({ only: ['announcements'] });
                return data;
            });

        toast.promise(promise, {
            loading: 'Updating announcement...',
            success: 'Announcement updated successfully',
            error: (err) => err.message || 'Failed to update announcement',
        });
    };

    const handleToggleStatus = async (announcement: Announcement) => {
        const newStatus = announcement.status === 'active' ? 'inactive' : 'active';

        const promise = fetch(route('admin.applications.announcements.update', [application.id, announcement.id]), {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
            },
            body: JSON.stringify({
                message: announcement.message,
                start_date: announcement.start_date,
                end_date: announcement.end_date,
                status: newStatus,
            }),
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed to toggle status');
                router.reload({ only: ['announcements'] });
                return data;
            });

        toast.promise(promise, {
            loading: 'Updating status...',
            success: `Announcement ${newStatus}`,
            error: (err) => err.message || 'Failed to toggle status',
        });
    };

    const handleDelete = async () => {
        if (!deletingAnnouncementId) return;

        setIsDeleting(true);

        const promise = fetch(route('admin.applications.announcements.destroy', [application.id, deletingAnnouncementId]), {
            method: 'DELETE',
            headers: {
                'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content,
            },
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed to delete announcement');
                setIsDeleteOpen(false);
                setDeletingAnnouncementId(null);
                setIsDeleting(false);
                router.reload({ only: ['announcements'] });
                return data;
            })
            .catch((err) => {
                setIsDeleting(false);
                throw err;
            });

        toast.promise(promise, {
            loading: 'Deleting announcement...',
            success: 'Announcement deleted successfully',
            error: (err) => err.message || 'Failed to delete announcement',
        });
    };

    const openDeleteDialog = (announcementId: string) => {
        setDeletingAnnouncementId(announcementId);
        setIsDeleteOpen(true);
    };

    const openEditDialog = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        setFormData({
            message: announcement.message,
            start_date: new Date(announcement.start_date),
            end_date: new Date(announcement.end_date),
            status: announcement.status,
        });
        setErrors({});
        setIsEditOpen(true);
    };

    const isExpired = (endDate: string) => {
        return new Date(endDate) < new Date();
    };

    const isCurrent = (startDate: string, endDate: string) => {
        const now = new Date();
        return new Date(startDate) <= now && new Date(endDate) >= now;
    };

    const clearFilters = () => {
        setSearch('');
        setStatusFilter('');
    };

    const hasActiveFilters = search || statusFilter;

    // Client-side filtering
    const filteredAnnouncements = announcements.data.filter((announcement) => {
        const matchesSearch = !search || announcement.message.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || announcement.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <>
            <Head title={`Announcements - ${application.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.visit(route('admin.applications.show', application.id))}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">Announcements</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage announcements for {application.name}
                        </p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsCreateOpen(true); }}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Announcement
                    </Button>
                </div>

                {/* Table Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Announcements</CardTitle>
                                <CardDescription>
                                    Manage app announcements with date ranges
                                </CardDescription>
                            </div>
                            {hasActiveFilters && (
                                <Button variant="outline" size="sm" onClick={clearFilters}>
                                    <X className="mr-2 h-4 w-4" />
                                    Clear Filters
                                </Button>
                            )}
                        </div>

                        {/* Filters */}
                        <div className="flex items-center gap-2 pt-4">
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search announcements..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-8"
                                />
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[160px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Status</SelectItem>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {filteredAnnouncements.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No announcements found</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Message</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>End Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>State</TableHead>
                                        <TableHead>Created By</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredAnnouncements.map((announcement) => (
                                        <TableRow key={announcement.id}>
                                            <TableCell className="max-w-xs">
                                                <p className="truncate">{announcement.message}</p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {format(new Date(announcement.start_date), 'dd MMM yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {format(new Date(announcement.end_date), 'dd MMM yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Switch
                                                        checked={announcement.status === 'active'}
                                                        onCheckedChange={() => handleToggleStatus(announcement)}
                                                    />
                                                    <span className="text-sm">
                                                        {announcement.status === 'active' ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {isCurrent(announcement.start_date, announcement.end_date) && announcement.status === 'active' ? (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                        Live
                                                    </Badge>
                                                ) : isExpired(announcement.end_date) ? (
                                                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                                                        Expired
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                        Scheduled
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    {announcement.creator?.name || '-'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <ButtonGroup>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openEditDialog(announcement)}
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openDeleteDialog(announcement.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </ButtonGroup>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}

                        {/* Pagination */}
                        {announcements.last_page > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-6">
                                {announcements.current_page > 1 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.visit(route('admin.applications.announcements.index', { application: application.id, page: announcements.current_page - 1 }))}
                                    >
                                        Previous
                                    </Button>
                                )}
                                <span className="text-sm text-muted-foreground">
                                    Page {announcements.current_page} of {announcements.last_page}
                                </span>
                                {announcements.current_page < announcements.last_page && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => router.visit(route('admin.applications.announcements.index', { application: application.id, page: announcements.current_page + 1 }))}
                                    >
                                        Next
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Add Announcement</DialogTitle>
                        <DialogDescription>
                            Create a new announcement for your app users
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Message</Label>
                            <Textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Enter announcement message"
                                rows={4}
                                className={errors.message ? 'border-red-500' : ''}
                            />
                            {errors.message && <p className="text-xs text-red-600 font-bold mt-1">{errors.message}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Start Date</Label>
                                <DatePicker
                                    date={formData.start_date}
                                    onDateChange={(date) => setFormData({ ...formData, start_date: date })}
                                    placeholder="Pick start date"
                                    error={!!errors.start_date}
                                />
                                {errors.start_date && <p className="text-xs text-red-600 font-bold mt-1">{errors.start_date}</p>}
                            </div>
                            <div>
                                <Label>End Date</Label>
                                <DatePicker
                                    date={formData.end_date}
                                    onDateChange={(date) => setFormData({ ...formData, end_date: date })}
                                    placeholder="Pick end date"
                                    error={!!errors.end_date}
                                />
                                {errors.end_date && <p className="text-xs text-red-600 font-bold mt-1">{errors.end_date}</p>}
                            </div>
                        </div>
                        <div>
                            <Label>Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}
                            >
                                <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && <p className="text-xs text-red-600 font-bold mt-1">{errors.status}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreate}>Create Announcement</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edit Announcement</DialogTitle>
                        <DialogDescription>
                            Update announcement details
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Message</Label>
                            <Textarea
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                placeholder="Enter announcement message"
                                rows={4}
                                className={errors.message ? 'border-red-500' : ''}
                            />
                            {errors.message && <p className="text-xs text-red-600 font-bold mt-1">{errors.message}</p>}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Start Date</Label>
                                <DatePicker
                                    date={formData.start_date}
                                    onDateChange={(date) => setFormData({ ...formData, start_date: date })}
                                    placeholder="Pick start date"
                                    error={!!errors.start_date}
                                />
                                {errors.start_date && <p className="text-xs text-red-600 font-bold mt-1">{errors.start_date}</p>}
                            </div>
                            <div>
                                <Label>End Date</Label>
                                <DatePicker
                                    date={formData.end_date}
                                    onDateChange={(date) => setFormData({ ...formData, end_date: date })}
                                    placeholder="Pick end date"
                                    error={!!errors.end_date}
                                />
                                {errors.end_date && <p className="text-xs text-red-600 font-bold mt-1">{errors.end_date}</p>}
                            </div>
                        </div>
                        <div>
                            <Label>Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' })}
                            >
                                <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.status && <p className="text-xs text-red-600 font-bold mt-1">{errors.status}</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdate}>Update Announcement</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationModal
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                title="Delete Announcement"
                description="Are you sure you want to delete this announcement? This action cannot be undone."
                confirmText="Delete"
                onConfirm={handleDelete}
                isDeleting={isDeleting}
            />
        </>
    );
}
