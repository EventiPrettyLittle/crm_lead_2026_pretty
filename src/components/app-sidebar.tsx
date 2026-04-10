'use client'

import { useState, useEffect } from 'react'

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarFooter,
    SidebarHeader,
} from "@/components/ui/sidebar"
import { sidebarLinks } from "@/config/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { getSystemSettings } from "@/actions/settings-actions"
import { cn } from "@/lib/utils"
import { User, LogOut, ChevronRight, LayoutGrid } from "lucide-react"

export function AppSidebar() {
    const pathname = usePathname();
    const [logoSettings, setLogoSettings] = useState({ logoUrl: '', logoWidth: 150 });

    useEffect(() => {
        getSystemSettings().then(setLogoSettings);
    }, []);

    const [openIntegrations, setOpenIntegrations] = useState(false);

    // Auto-apri il menu integrazioni se siamo in una delle sue pagine
    useEffect(() => {
        const isIntegrationActive = sidebarLinks.some(item => 
            item.title === "Integrazioni" && item.subItems?.some(sub => pathname === sub.href)
        );
        if (isIntegrationActive) setOpenIntegrations(true);
    }, [pathname]);

    return (
        <Sidebar className="border-r border-slate-200/60 bg-white/50 backdrop-blur-xl">
            <SidebarHeader className="py-8 px-6">
                <Link href="/" className="flex items-center gap-3 group">
                    {logoSettings.logoUrl ? (
                        <div className="flex flex-col items-start gap-1">
                            <img 
                                src={logoSettings.logoUrl} 
                                alt="Logo" 
                                style={{ width: `${Math.max(logoSettings.logoWidth || 180, 180)}px` }}
                                className="object-contain transition-transform group-hover:scale-110 duration-500 filter drop-shadow-sm"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-50 transition-transform group-hover:rotate-12">
                                <LayoutGrid className="h-6 w-6" />
                            </div>
                            <div>
                                <span className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600">
                                    PLATINUM
                                </span>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                    CRM Logistics
                                </p>
                            </div>
                        </div>
                    )}
                </Link>
            </SidebarHeader>

            <SidebarContent className="px-3 pt-4">
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1.5">
                            {sidebarLinks.map((item) => {
                                const hasSubItems = item.subItems && item.subItems.length > 0;
                                const isActive = pathname === item.href || (hasSubItems && item.subItems?.some(sub => pathname === sub.href));
                                
                                if (hasSubItems) {
                                    return (
                                        <SidebarMenuItem key={item.title}>
                                            <SidebarMenuButton 
                                                onClick={() => setOpenIntegrations(!openIntegrations)}
                                                className={cn(
                                                    "h-12 rounded-2xl transition-all duration-300 px-4 group w-full",
                                                    isActive 
                                                        ? "bg-indigo-50 text-indigo-700 font-bold" 
                                                        : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"
                                                )}
                                            >
                                                <div className="flex items-center gap-4 w-full">
                                                    <div className={cn(
                                                        "h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-300",
                                                        isActive 
                                                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                                                            : "bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-sm"
                                                    )}>
                                                        <item.icon className="h-4.5 w-4.5" />
                                                    </div>
                                                    <span className="text-sm tracking-tight flex-1 text-left">{item.title}</span>
                                                    <ChevronRight className={cn(
                                                        "h-4 w-4 opacity-50 transition-transform duration-300",
                                                        openIntegrations && "rotate-90"
                                                    )} />
                                                </div>
                                            </SidebarMenuButton>

                                            {openIntegrations && (
                                                <div className="mt-1 ml-4 space-y-1 animate-in slide-in-from-top-2 duration-300">
                                                    {item.subItems?.map((sub) => {
                                                        const isSubActive = pathname === sub.href;
                                                        return (
                                                            <Link 
                                                                key={sub.title} 
                                                                href={sub.href}
                                                                className={cn(
                                                                    "flex items-center gap-3 h-10 px-4 rounded-xl text-[13px] transition-all",
                                                                    isSubActive 
                                                                        ? "bg-indigo-100/50 text-indigo-700 font-bold" 
                                                                        : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
                                                                )}
                                                            >
                                                                <sub.icon className="h-3.5 w-3.5" />
                                                                {sub.title}
                                                            </Link>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </SidebarMenuItem>
                                    );
                                }

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton 
                                            asChild 
                                            className={cn(
                                                "h-12 rounded-2xl transition-all duration-300 px-4 group",
                                                isActive 
                                                    ? "bg-indigo-50 text-indigo-700 font-bold" 
                                                    : "text-slate-500 hover:bg-slate-100/80 hover:text-slate-900"
                                            )}
                                        >
                                            <Link href={item.href || '#'} className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-8 w-8 rounded-xl flex items-center justify-center transition-all duration-300",
                                                    isActive 
                                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
                                                        : "bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-sm"
                                                )}>
                                                    <item.icon className="h-4.5 w-4.5" />
                                                </div>
                                                <span className="text-sm tracking-tight flex-1">{item.title}</span>
                                                {isActive && <ChevronRight className="h-4 w-4 opacity-50" />}
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="p-6 mt-auto">
                <div className="p-4 rounded-[2rem] bg-slate-900 text-white shadow-2xl relative overflow-hidden group border border-slate-800">
                    <div className="absolute top-0 right-0 -mr-4 -mt-4 h-16 w-16 bg-indigo-500/20 rounded-full blur-2xl transition-all group-hover:scale-150" />
                    
                    <UserSection />
                </div>
            </SidebarFooter>
        </Sidebar>
    )
}

function UserSection() {
    const [user, setUser] = useState<{name: string, email: string} | null>(null);

    useEffect(() => {
        import("@/actions/auth").then(m => m.getCurrentUser()).then(setUser);
    }, []);

    const name = user?.name 
        ? (user.name.includes('@') ? user.name.split('@')[0] : user.name)
        : "Luca Vitale";
    const status = user ? "Active Session" : "Admin Account";

    return (
        <div className="flex items-center gap-3 relative z-10">
            <Link href="/settings" className="flex flex-1 items-center gap-3 hover:opacity-80 transition-opacity min-w-0">
                <div className="h-10 w-10 shrink-0 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-all">
                    <User className="h-5 w-5 text-indigo-300" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                    <p className="text-xs font-bold leading-none truncate">{name}</p>
                    <p className="text-[10px] opacity-60 font-medium truncate mt-0.5">{status}</p>
                </div>
            </Link>
            <Link href="/api/auth/google/logout" className="p-2 rounded-xl hover:bg-white/10 transition-all text-slate-400 hover:text-rose-400">
                <LogOut className="h-4 w-4" />
            </Link>
        </div>
    );
}
