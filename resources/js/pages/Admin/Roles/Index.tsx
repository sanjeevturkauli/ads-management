import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { route } from '@/lib/route';
import toast from 'react-hot-toast';
import { Plus, Shield, Users, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal';
import { TableActions } from '@/components/table-actions';

type Permission = {
    id: number;
    name: string;
};

type Role = {
    id: number;
    name: string;
    users_count: number;
    permissions_count: number;
    permissions: Permission[];
};

type Props = {
    roles: {
        data: Role[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    permissions: Record<string, Permission[]>;
};

type RoleFormData = {
    name: string;
    permissions: string[];
};

const defaultRoles = ['admin', 'manager', 'editor', 'viewer'];

export default function RolesIndex({ roles, permissions }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [roleToDelete, setRoleToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    const { data, setData, post, put, processing, errors, reset } = useForm<RoleFormData>({
        name: '',
        permissions: [],
    });

    const permissionGroups = Object.keys(permissions);

    const handleOpenDialog = (role?: Role) => {
        if (role) {
            setEditingRole(role);
            setData({
                name: role.name,
                permissions: role.permissions.map((p) => p.name),
            });
        } else {
            setEditingRole(null);
            reset();
        }
        setDialogOpen(true);
    };

    const handleOpenPermissionsDialog = (role: Role) => {
        setSelectedRole(role);
        setSelectedPermissions(role.permissions.map((p) => p.name));
        setPermissionsDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!data.name.trim()) {
            toast.error('Role name is required');
            return;
        }

        const submitPromise = new Promise((resolve, reject) => {
            if (editingRole) {
                put(route('admin.roles.update', editingRole.id), {
                    onSuccess: () => {
                        setDialogOpen(false);
                        reset();
                        setEditingRole(null);
                        resolve('success');
                    },
                    onError: (errors) => {
                        const firstError = Object.values(errors)[0];
                        reject(firstError || 'Failed to update role');
                    },
                });
            } else {
                post(route('admin.roles.store'), {
                    onSuccess: () => {
                        setDialogOpen(false);
                        reset();
                        resolve('success');
                    },
                    onError: (errors) => {
                        const firstError = Object.values(errors)[0];
                        reject(firstError || 'Failed to create role');
                    },
                });
            }
        });

        toast.promise(submitPromise, {
            loading: editingRole ? 'Updating role...' : 'Creating role...',
            success: editingRole ? 'Role updated successfully!' : 'Role created successfully!',
            error: (err) => err.toString(),
        });
    };

    const handleSyncPermissions = () => {
        if (!selectedRole) return;

        const syncPromise = new Promise((resolve, reject) => {
            router.post(
                route('admin.roles.sync-permissions', selectedRole.id),
                { permissions: selectedPermissions },
                {
                    onSuccess: () => {
                        setPermissionsDialogOpen(false);
                        setSelectedRole(null);
                        setSelectedPermissions([]);
                        resolve('success');
                    },
                    onError: () => {
                        reject('Failed to update permissions');
                    },
                }
            );
        });

        toast.promise(syncPromise, {
            loading: 'Updating permissions...',
            success: 'Permissions updated successfully!',
            error: 'Could not update permissions',
        });
    };

    const handlePermissionToggle = (permissionName: string) => {
        setSelectedPermissions((prev) =>
            prev.includes(permissionName)
                ? prev.filter((p) => p !== permissionName)
                : [...prev, permissionName]
        );
    };

    const handleGroupToggle = (group: string, checked: boolean) => {
        const groupPermissions = permissions[group].map((p) => p.name);
        
        if (checked) {
            setSelectedPermissions((prev) => [...new Set([...prev, ...groupPermissions])]);
        } else {
            setSelectedPermissions((prev) => prev.filter((p) => !groupPermissions.includes(p)));
        }
    };

    const isGroupChecked = (group: string) => {
        const groupPermissions = permissions[group].map((p) => p.name);
        return groupPermissions.every((p) => selectedPermissions.includes(p));
    };

    const handleDelete = (roleId: number) => {
        setRoleToDelete(roleId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!roleToDelete) return;

        setIsDeleting(true);

        const deletePromise = new Promise((resolve, reject) => {
            router.delete(route('admin.roles.destroy', roleToDelete), {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setRoleToDelete(null);
                    setIsDeleting(false);
                    resolve('success');
                },
                onError: () => {
                    setIsDeleting(false);
                    reject('Failed to delete role');
                },
            });
        });

        toast.promise(deletePromise, {
            loading: 'Deleting role...',
            success: 'Role deleted successfully!',
            error: 'Could not delete role',
        });
    };

    const isDefaultRole = (roleName: string) => {
        return defaultRoles.includes(roleName.toLowerCase());
    };

    return (
        <>
            <Head title="Roles & Permissions" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Roles & Permissions</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage user roles and their permissions
                        </p>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Role
                    </Button>
                </div>

                {/* Roles Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Roles ({roles.total})</CardTitle>
                        <CardDescription>
                            Configure roles and assign permissions to control access
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Role Name</TableHead>
                                    <TableHead>Users</TableHead>
                                    <TableHead>Permissions</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {roles.data.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Shield className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-medium">{role.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span>{role.users_count}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleOpenPermissionsDialog(role)}
                                            >
                                                <CheckSquare className="mr-2 h-4 w-4" />
                                                {role.permissions_count} permissions
                                            </Button>
                                        </TableCell>
                                        <TableCell>
                                            {isDefaultRole(role.name) ? (
                                                <Badge variant="secondary">System</Badge>
                                            ) : (
                                                <Badge>Custom</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isDefaultRole(role.name) ? (
                                                <span className="text-xs text-muted-foreground">
                                                    Protected
                                                </span>
                                            ) : (
                                                <TableActions
                                                    onEdit={() => handleOpenDialog(role)}
                                                    onDelete={() => handleDelete(role.id)}
                                                    showView={false}
                                                />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {roles.last_page > 1 && (
                            <div className="flex items-center justify-between pt-4 border-t mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Showing page {roles.current_page} of {roles.last_page} ({roles.total} total)
                                </p>
                                <div className="flex gap-1">
                                    {/* Previous Button */}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            router.get(
                                                route('admin.roles.index'),
                                                { page: roles.current_page - 1 },
                                                { preserveState: true }
                                            )
                                        }
                                        disabled={roles.current_page === 1}
                                    >
                                        Previous
                                    </Button>

                                    {/* Page Numbers */}
                                    {Array.from({ length: Math.min(roles.last_page, 10) }, (_, i) => {
                                        const page = i + 1;
                                        if (
                                            page <= 3 ||
                                            page > roles.last_page - 3 ||
                                            Math.abs(page - roles.current_page) <= 1
                                        ) {
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={
                                                        roles.current_page === page
                                                            ? 'default'
                                                            : 'outline'
                                                    }
                                                    size="sm"
                                                    onClick={() =>
                                                        router.get(
                                                            route('admin.roles.index'),
                                                            { page },
                                                            { preserveState: true }
                                                        )
                                                    }
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        } else if (page === 4 || page === roles.last_page - 3) {
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
                                                route('admin.roles.index'),
                                                { page: roles.current_page + 1 },
                                                { preserveState: true }
                                            )
                                        }
                                        disabled={roles.current_page === roles.last_page}
                                    >
                                        Next
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add/Edit Role Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingRole ? 'Edit Role' : 'Add New Role'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingRole
                                ? 'Update role name and permissions'
                                : 'Create a new role with custom permissions'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Role Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="e.g., Content Manager"
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && (
                                <p className="text-sm font-medium text-red-600">{errors.name}</p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Saving...' : editingRole ? 'Update' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Permissions Dialog */}
            <Dialog open={permissionsDialogOpen} onOpenChange={setPermissionsDialogOpen}>
                <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="pb-4 border-b">
                        <DialogTitle className="text-2xl">
                            Manage Permissions - <span className="text-primary">{selectedRole?.name}</span>
                        </DialogTitle>
                        <DialogDescription className="text-base">
                            Select permissions to assign to this role. Use tabs to navigate between different modules.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-4">
                        <Tabs defaultValue={permissionGroups[0]} className="w-full">
                            <TabsList className="w-full justify-start h-auto flex-wrap gap-2 bg-muted/50 p-2 rounded-lg mb-6">
                                {permissionGroups.map((group) => (
                                    <TabsTrigger 
                                        key={group} 
                                        value={group}
                                        className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-6 py-2.5 rounded-md font-medium"
                                    >
                                        {group.charAt(0).toUpperCase() + group.slice(1)}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {permissionGroups.map((group) => (
                                <TabsContent key={group} value={group} className="space-y-6 mt-0">
                                    <div className="flex items-center space-x-3 bg-muted/30 rounded-lg p-4 border-2 border-dashed">
                                        <Checkbox
                                            id={`group-${group}`}
                                            checked={isGroupChecked(group)}
                                            onCheckedChange={(checked) => handleGroupToggle(group, checked as boolean)}
                                            className="h-5 w-5"
                                        />
                                        <Label htmlFor={`group-${group}`} className="text-base font-semibold cursor-pointer">
                                            Select All {group.charAt(0).toUpperCase() + group.slice(1)} Permissions
                                        </Label>
                                        <Badge variant="secondary" className="ml-auto">
                                            {permissions[group].length} permissions
                                        </Badge>
                                    </div>

                                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                        {permissions[group].map((permission) => (
                                            <div 
                                                key={permission.id} 
                                                className="flex items-center space-x-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                            >
                                                <Checkbox
                                                    id={`permission-${permission.id}`}
                                                    checked={selectedPermissions.includes(permission.name)}
                                                    onCheckedChange={() => handlePermissionToggle(permission.name)}
                                                    className="h-4 w-4"
                                                />
                                                <Label
                                                    htmlFor={`permission-${permission.id}`}
                                                    className="text-sm font-medium cursor-pointer leading-none"
                                                >
                                                    {permission.name.split('.').pop()}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </div>

                    <DialogFooter className="pt-4 border-t">
                        <div className="flex items-center justify-between w-full">
                            <div className="text-sm text-muted-foreground">
                                <Badge variant="outline" className="text-base px-3 py-1">
                                    {selectedPermissions.length} permissions selected
                                </Badge>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setPermissionsDialogOpen(false)}
                                    size="lg"
                                >
                                    Cancel
                                </Button>
                                <Button onClick={handleSyncPermissions} size="lg">
                                    <CheckSquare className="mr-2 h-4 w-4" />
                                    Save Permissions
                                </Button>
                            </div>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Are you sure you want to delete this role?"
                description="This action cannot be undone. Users with this role will lose their permissions."
                confirmText="Delete role"
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
            />
        </>
    );
}

RolesIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Roles & Permissions', href: '/admin/roles' },
    ],
};
