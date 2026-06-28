import { Head, router, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { route } from '@/lib/route';
import toast from 'react-hot-toast';
import { Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeleteConfirmationModal } from '@/components/delete-confirmation-modal';
import { TableActions } from '@/components/table-actions';

type GlobalSetting = {
    id: string;
    key: string;
    value: string;
    type: 'string' | 'boolean' | 'integer' | 'float' | 'json';
    group?: string;
    description?: string;
    is_encrypted: boolean;
    is_public: boolean;
    created_at: string;
    updated_at: string;
};

type Props = {
    settings: Record<string, GlobalSetting[]>;
};

type SettingFormData = {
    key: string;
    value: string;
    type: 'string' | 'boolean' | 'integer' | 'float' | 'json';
    group: string;
    description: string;
    is_encrypted: boolean;
    is_public: boolean;
};

const settingTypes = [
    { value: 'string', label: 'String' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'integer', label: 'Integer' },
    { value: 'float', label: 'Float' },
    { value: 'json', label: 'JSON' },
];

export default function GlobalSettingsIndex({ settings }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [settingToDelete, setSettingToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [editingValues, setEditingValues] = useState<Record<string, any>>({});

    const { data, setData, post, processing, errors, reset } = useForm<SettingFormData>({
        key: '',
        value: '',
        type: 'string',
        group: 'general',
        description: '',
        is_encrypted: false,
        is_public: false,
    });

    const groups = Object.keys(settings).length > 0 ? Object.keys(settings) : ['general'];
    const [activeTab, setActiveTab] = useState(groups[0] || 'general');

    const handleOpenDialog = () => {
        reset();
        setDialogOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const submitPromise = new Promise((resolve, reject) => {
            post(route('admin.settings.store'), {
                onSuccess: () => {
                    setDialogOpen(false);
                    reset();
                    resolve('success');
                },
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    reject(firstError || 'Failed to create setting');
                },
            });
        });

        toast.promise(submitPromise, {
            loading: 'Creating setting...',
            success: 'Setting created successfully!',
            error: (err) => err.toString(),
        });
    };

    const handleValueChange = (key: string, value: any) => {
        setEditingValues((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSaveSettings = () => {
        const settingsToUpdate = Object.entries(editingValues).map(([key, value]) => {
            const setting = Object.values(settings)
                .flat()
                .find((s) => s.key === key);
            return {
                key,
                value: value,
                type: setting?.type || 'string',
            };
        });

        if (settingsToUpdate.length === 0) {
            toast.error('No changes to save');
            return;
        }

        const updatePromise = new Promise((resolve, reject) => {
            router.post(
                route('admin.settings.update'),
                { settings: settingsToUpdate },
                {
                    onSuccess: () => {
                        setEditingValues({});
                        resolve('success');
                    },
                    onError: () => {
                        reject('Failed to update settings');
                    },
                }
            );
        });

        toast.promise(updatePromise, {
            loading: 'Updating settings...',
            success: 'Settings updated successfully!',
            error: 'Could not update settings',
        });
    };

    const handleDelete = (settingId: string) => {
        setSettingToDelete(settingId);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = () => {
        if (!settingToDelete) return;

        setIsDeleting(true);

        const deletePromise = new Promise((resolve, reject) => {
            router.delete(route('admin.settings.destroy', settingToDelete), {
                onSuccess: () => {
                    setDeleteDialogOpen(false);
                    setSettingToDelete(null);
                    setIsDeleting(false);
                    resolve('success');
                },
                onError: () => {
                    setIsDeleting(false);
                    reject('Failed to delete setting');
                },
            });
        });

        toast.promise(deletePromise, {
            loading: 'Deleting setting...',
            success: 'Setting deleted successfully!',
            error: 'Could not delete setting',
        });
    };

    const renderValueInput = (setting: GlobalSetting) => {
        const currentValue = editingValues[setting.key] ?? setting.value;

        if (setting.type === 'boolean') {
            return (
                <Switch
                    checked={currentValue === 'true' || currentValue === true}
                    onCheckedChange={(checked) =>
                        handleValueChange(setting.key, checked ? 'true' : 'false')
                    }
                />
            );
        }

        if (setting.type === 'json') {
            return (
                <Textarea
                    value={currentValue}
                    onChange={(e) => handleValueChange(setting.key, e.target.value)}
                    placeholder="JSON value"
                    rows={3}
                />
            );
        }

        return (
            <Input
                type={setting.type === 'integer' || setting.type === 'float' ? 'number' : 'text'}
                value={currentValue}
                onChange={(e) => handleValueChange(setting.key, e.target.value)}
                placeholder="Enter value"
                step={setting.type === 'float' ? '0.01' : undefined}
            />
        );
    };

    return (
        <>
            <Head title="Global Settings" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Global Settings</h1>
                        <p className="text-sm text-muted-foreground">
                            Manage system-wide configuration settings
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={handleOpenDialog} variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Setting
                        </Button>
                        {Object.keys(editingValues).length > 0 && (
                            <Button onClick={handleSaveSettings}>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes ({Object.keys(editingValues).length})
                            </Button>
                        )}
                    </div>
                </div>

                {/* Settings Tables */}
                <Card>
                    <CardHeader>
                        <CardTitle>Configuration Settings</CardTitle>
                        <CardDescription>
                            Configure system-wide settings that apply to all applications
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {groups.length === 0 || Object.values(settings).flat().length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-muted-foreground">No settings configured yet</p>
                                <Button className="mt-4" onClick={handleOpenDialog}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Your First Setting
                                </Button>
                            </div>
                        ) : (
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList>
                                    {groups.map((group) => (
                                        <TabsTrigger key={group} value={group}>
                                            {group.charAt(0).toUpperCase() + group.slice(1)}{' '}
                                            ({settings[group]?.length || 0})
                                        </TabsTrigger>
                                    ))}
                                </TabsList>

                                {groups.map((group) => (
                                    <TabsContent key={group} value={group}>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Key</TableHead>
                                                    <TableHead>Value</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Description</TableHead>
                                                    <TableHead>Flags</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {settings[group]?.map((setting) => (
                                                    <TableRow key={setting.id}>
                                                        <TableCell>
                                                            <code className="text-sm font-medium">
                                                                {setting.key}
                                                            </code>
                                                        </TableCell>
                                                        <TableCell className="max-w-md">
                                                            {renderValueInput(setting)}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">
                                                                {setting.type}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-sm text-muted-foreground">
                                                            {setting.description || '-'}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-1">
                                                                {setting.is_encrypted && (
                                                                    <Badge variant="secondary">
                                                                        Encrypted
                                                                    </Badge>
                                                                )}
                                                                {setting.is_public && (
                                                                    <Badge variant="secondary">
                                                                        Public
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <TableActions
                                                                onDelete={() => handleDelete(setting.id)}
                                                                showView={false}
                                                                showEdit={false}
                                                            />
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Add Setting Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add New Setting</DialogTitle>
                        <DialogDescription>
                            Create a new global configuration setting
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="key">
                                Key <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="key"
                                value={data.key}
                                onChange={(e) => setData('key', e.target.value)}
                                placeholder="setting_key"
                                className={errors.key ? 'border-red-500' : ''}
                            />
                            {errors.key && (
                                <p className="text-sm font-medium text-red-600">{errors.key}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">
                                Type <span className="text-red-500">*</span>
                            </Label>
                            <Select value={data.type} onValueChange={(value: any) => setData('type', value)}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {settingTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.type && (
                                <p className="text-sm font-medium text-red-600">{errors.type}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="value">
                                Value <span className="text-red-500">*</span>
                            </Label>
                            {data.type === 'json' ? (
                                <Textarea
                                    id="value"
                                    value={data.value}
                                    onChange={(e) => setData('value', e.target.value)}
                                    placeholder='{"key": "value"}'
                                    rows={3}
                                    className={errors.value ? 'border-red-500' : ''}
                                />
                            ) : (
                                <Input
                                    id="value"
                                    type={data.type === 'integer' || data.type === 'float' ? 'number' : 'text'}
                                    value={data.value}
                                    onChange={(e) => setData('value', e.target.value)}
                                    placeholder="Enter value"
                                    step={data.type === 'float' ? '0.01' : undefined}
                                    className={errors.value ? 'border-red-500' : ''}
                                />
                            )}
                            {errors.value && (
                                <p className="text-sm font-medium text-red-600">{errors.value}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="group">Group</Label>
                            <Input
                                id="group"
                                value={data.group}
                                onChange={(e) => setData('group', e.target.value)}
                                placeholder="general"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={data.description}
                                onChange={(e) => setData('description', e.target.value)}
                                placeholder="Describe what this setting does"
                                rows={2}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label>Encrypted</Label>
                                <p className="text-sm text-muted-foreground">
                                    Encrypt this value in database
                                </p>
                            </div>
                            <Switch
                                checked={data.is_encrypted}
                                onCheckedChange={(checked) => setData('is_encrypted', checked)}
                            />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div>
                                <Label>Public</Label>
                                <p className="text-sm text-muted-foreground">
                                    Available in public API
                                </p>
                            </div>
                            <Switch
                                checked={data.is_public}
                                onCheckedChange={(checked) => setData('is_public', checked)}
                            />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creating...' : 'Create'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Are you sure you want to delete this setting?"
                description="This action cannot be undone. The setting will be permanently deleted."
                confirmText="Delete setting"
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
            />
        </>
    );
}

GlobalSettingsIndex.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Global Settings', href: '/admin/settings' },
    ],
};
