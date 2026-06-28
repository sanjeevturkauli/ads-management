import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEvent } from 'react';
import { route } from '@/lib/route';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

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
};

type FormData = {
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
};

type Props = {
    application: Application;
};

export default function ApplicationEdit({ application }: Props) {
    const { data, setData, put, processing, errors } = useForm<FormData>({
        name: application.name,
        package_name: application.package_name,
        platform: application.platform,
        status: application.status,
        icon_url: application.icon_url || '',
        description: application.description || '',
        current_version: application.current_version,
        ads_enabled: application.ads_enabled,
        maintenance_mode: application.maintenance_mode,
        force_update: application.force_update,
        minimum_version: application.minimum_version || '',
        latest_version: application.latest_version || '',
        review_dialog_enabled: application.review_dialog_enabled,
    });

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        // Client-side validation
        if (!data.name.trim()) {
            toast.error('Application name is required');
            return;
        }
        
        if (!data.package_name.trim()) {
            toast.error('Package name is required');
            return;
        }
        
        if (!data.platform) {
            toast.error('Please select a platform');
            return;
        }
        
        if (!data.current_version.trim()) {
            toast.error('Version is required');
            return;
        }
        
        // Create promise for toast
        const updatePromise = new Promise((resolve, reject) => {
            put(route('admin.applications.update', application.id), {
                onSuccess: () => resolve('success'),
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    reject(firstError || 'Failed to update application');
                },
            });
        });

        toast.promise(updatePromise, {
            loading: 'Updating application...',
            success: 'Application updated successfully!',
            error: (err) => err.toString(),
        });
    };

    return (
        <>
            <Head title={`Edit ${application.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('admin.applications.show', application.id)}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Edit Application</h1>
                        <p className="text-sm text-muted-foreground">{application.name}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                Update the basic details of your application
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">
                                            Application Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="My Awesome App"
                                            className={errors.name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                        />
                                        {errors.name && (
                                            <p className="text-sm font-medium text-red-600">{errors.name}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="package_name">
                                            Package Name <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="package_name"
                                            value={data.package_name}
                                            onChange={(e) => setData('package_name', e.target.value)}
                                            placeholder="com.example.myapp"
                                            className={errors.package_name ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                        />
                                        {errors.package_name && (
                                            <p className="text-sm font-medium text-red-600">
                                                {errors.package_name}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="platform">
                                            Platform <span className="text-red-500">*</span>
                                        </Label>
                                        <Select
                                            value={data.platform}
                                            onValueChange={(value: 'android' | 'ios') =>
                                                setData('platform', value)
                                            }
                                        >
                                            <SelectTrigger className={errors.platform ? 'border-red-500 focus:ring-red-500 w-full' : 'w-full'}>
                                                <SelectValue placeholder="Select platform" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="android">🤖 Android</SelectItem>
                                                <SelectItem value="ios">🍎 iOS</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.platform && (
                                            <p className="text-sm font-medium text-red-600">{errors.platform}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status</Label>
                                        <Select
                                            value={data.status}
                                            onValueChange={(
                                                value: 'active' | 'inactive' | 'maintenance' | 'archived'
                                            ) => setData('status', value)}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                <SelectItem value="maintenance">Maintenance</SelectItem>
                                                <SelectItem value="archived">Archived</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="version">
                                            Current Version <span className="text-red-500">*</span>
                                        </Label>
                                        <Input
                                            id="version"
                                            value={data.current_version}
                                            onChange={(e) => setData('current_version', e.target.value)}
                                            placeholder="1.0.0"
                                            className={errors.current_version ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                        />
                                        {errors.current_version && (
                                            <p className="text-sm font-medium text-red-600">{errors.current_version}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="icon_url">Icon URL</Label>
                                        <Input
                                            id="icon_url"
                                            value={data.icon_url}
                                            onChange={(e) => setData('icon_url', e.target.value)}
                                            placeholder="https://example.com/icon.png"
                                            className={errors.icon_url ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                        />
                                        {errors.icon_url && (
                                            <p className="text-sm font-medium text-red-600">{errors.icon_url}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Enter application description..."
                                    rows={3}
                                    className={errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                />
                                {errors.description && (
                                    <p className="text-sm font-medium text-red-600">{errors.description}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Version Management */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Version Management</CardTitle>
                            <CardDescription>
                                Configure version requirements and update policies
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="minimum_version">Minimum Version</Label>
                                    <Input
                                        id="minimum_version"
                                        value={data.minimum_version}
                                        onChange={(e) => setData('minimum_version', e.target.value)}
                                        placeholder="1.0.0"
                                        className={errors.minimum_version ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                    />
                                    {errors.minimum_version && (
                                        <p className="text-sm font-medium text-red-600">
                                            {errors.minimum_version}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="latest_version">Latest Version</Label>
                                    <Input
                                        id="latest_version"
                                        value={data.latest_version}
                                        onChange={(e) => setData('latest_version', e.target.value)}
                                        placeholder="1.0.0"
                                        className={errors.latest_version ? 'border-red-500 focus-visible:ring-red-500' : ''}
                                    />
                                    {errors.latest_version && (
                                        <p className="text-sm font-medium text-red-600">
                                            {errors.latest_version}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label>Force Update</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Require users to update to the latest version
                                    </p>
                                </div>
                                <Switch
                                    checked={data.force_update}
                                    onCheckedChange={(checked) => setData('force_update', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Features */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Features & Settings</CardTitle>
                            <CardDescription>
                                Configure application features and behaviors
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label>Ads Enabled</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Enable advertisements in this application
                                    </p>
                                </div>
                                <Switch
                                    checked={data.ads_enabled}
                                    onCheckedChange={(checked) => setData('ads_enabled', checked)}
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label>Maintenance Mode</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Display maintenance message to users
                                    </p>
                                </div>
                                <Switch
                                    checked={data.maintenance_mode}
                                    onCheckedChange={(checked) =>
                                        setData('maintenance_mode', checked)
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label>Review Dialog</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Show app review prompt to users
                                    </p>
                                </div>
                                <Switch
                                    checked={data.review_dialog_enabled}
                                    onCheckedChange={(checked) =>
                                        setData('review_dialog_enabled', checked)
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                        <Button variant="outline" asChild>
                            <Link href={route('admin.applications.show', application.id)}>
                                Cancel
                            </Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

ApplicationEdit.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Applications', href: '/admin/applications' },
        { title: 'Edit' },
    ],
};
