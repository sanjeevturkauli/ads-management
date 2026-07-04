import { Link } from '@inertiajs/react';
import { 
    BookOpen, 
    FolderGit2, 
    LayoutGrid,
    Smartphone,
    Megaphone,
    Settings,
    FileText,
    Shield,
    BarChart3,
    LinkIcon
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Applications',
        href: '/admin/applications',
        icon: Smartphone,
    },
    {
        title: 'Ad Networks',
        href: '/admin/ad-networks',
        icon: Megaphone,
    },
    {
        title: 'Global Settings',
        href: '/admin/settings',
        icon: Settings,
    },
    {
        title: 'Audit Logs',
        href: '/admin/audit-logs',
        icon: FileText,
    },
    {
        title: 'Roles & Permissions',
        href: '/admin/roles',
        icon: Shield,
    },
    {
        title: 'Analytics',
        href: '/admin/analytics',
        icon: BarChart3,
    },
    {
        title: 'Accounts',
        href: '/admin/accounts',
        icon: LinkIcon,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'API Documentation',
        href: '/admin/api-documentation',
        icon: BookOpen,
    },
    {
        title: 'System Info',
        href: '/admin/system-info',
        icon: FolderGit2,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/admin/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
