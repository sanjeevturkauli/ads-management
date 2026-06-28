import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { FormEvent, useEffect, useRef } from 'react';
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

type FormData = {
    name: string;
    package_name: string;
    platform: 'android' | 'ios' | '';
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
    create_default_ads: boolean;
};

export default function ApplicationCreate() {
    const { data, setData, post, processing, errors } = useForm<FormData>({
        name: '',
        package_name: '',
        platform: '',
        status: 'active',
        icon_url: '',
        description: '',
        current_version: '1.0.0',
        ads_enabled: true,
        maintenance_mode: false,
        force_update: false,
        minimum_version: '1.0.0',
        latest_version: '1.0.0',
        review_dialog_enabled: false,
        create_default_ads: false,
    });

    // Refs for all input fields
    const nameRef = useRef<HTMLInputElement>(null);
    const packageNameRef = useRef<HTMLInputElement>(null);
    const platformRef = useRef<HTMLButtonElement>(null);
    const versionRef = useRef<HTMLInputElement>(null);

    // Auto scroll to first error field
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            const firstErrorField = Object.keys(errors)[0];
            
            // Map error field names to refs
            const fieldRefs: Record<string, React.RefObject<HTMLElement>> = {
                name: nameRef,
                package_name: packageNameRef,
                platform: platformRef,
                current_version: versionRef,
            };

            const ref = fieldRefs[firstErrorField];
            if (ref?.current) {
                ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                ref.current.focus();
            }
        }
    }, [errors]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        
        // Frontend validation
        if (!data.name.trim()) {
            toast.error('Application name is required');
            nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            nameRef.current?.focus();
            return;
        }
        
        if (!data.package_name.trim()) {
            toast.error('Package name is required');
            packageNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            packageNameRef.current?.focus();
            return;
        }
        
        if (!data.platform) {
            toast.error('Please select a platform');
            platformRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            platformRef.current?.focus();
            return;
        }
        
        if (!data.current_version.trim()) {
            toast.error('Version is required');
            versionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            versionRef.current?.focus();
            return;
        }
        
        // Backend validation with toast.promise
        const createPromise = new Promise((resolve, reject) => {
            post(route('admin.applications.store'), {
                onSuccess: () => resolve('success'),
                onError: (errors) => {
                    const firstError = Object.values(errors)[0];
                    reject(firstError || 'Failed to create application');
                },
            });
        });

        toast.promise(createPromise, {
            loading: 'Creating application...',
            success: 'Application created successfully!',
            error: (err) => err.toString(),
        });
    };

    return (
        <>
            <Head title="Create Application" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild>
                        <Link href={route('admin.applications.index')}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">Create New Application</h1>
                        <p className="text-sm text-muted-foreground">
                            Add a new mobile application to the system
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Basic Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Basic Information</CardTitle>
                            <CardDescription>
                                Enter the basic details of your application
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
                                            ref={nameRef}
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
                                            ref={packageNameRef}
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
                                            <SelectTrigger ref={platformRef} className={errors.platform ? 'border-red-500 focus:ring-red-500 w-full' : 'w-full'}>
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
                                            ref={versionRef}
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

                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div className="space-y-0.5">
                                    <Label>Create Default Ad Units</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Automatically create default ad units (Banner, Interstitial,
                                        etc.)
                                    </p>
                                </div>
                                <Switch
                                    checked={data.create_default_ads}
                                    onCheckedChange={(checked) =>
                                        setData('create_default_ads', checked)
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex justify-end gap-4">
                        <Button variant="outline" asChild>
                            <Link href={route('admin.applications.index')}>Cancel</Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            {processing ? 'Creating...' : 'Create Application'}
                        </Button>
                    </div>
                </form>
            </div>
        </>
    );
}

ApplicationCreate.layout = {
    breadcrumbs: [
        { title: 'Dashboard', href: '/admin/dashboard' },
        { title: 'Applications', href: '/admin/applications' },
        { title: 'Create' },
    ],
};
