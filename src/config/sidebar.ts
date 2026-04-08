import { Home, Users, Calendar, FileText, Settings, Phone, LayoutDashboard, MessageSquare, Database, Wallet } from "lucide-react"

export const sidebarLinks = [
    {
        title: "Dashboard",
        href: "/",
        icon: Home,
    },
    {
        title: "Leads",
        href: "/leads",
        icon: Users,
    },
    {
        title: "Pipeline",
        href: "/kanban",
        icon: LayoutDashboard,
    },
    {
        title: "Google Sheets Sync",
        href: "/sync-sheets",
        icon: Database,
    },
    {
        title: "Preventivi",
        href: "/quotes",
        icon: FileText,
    },
    {
        title: "Incassi & Pagamenti",
        href: "/finance",
        icon: Wallet,
    },
    {
        title: "WhatsApp",
        href: "/whatsapp",
        icon: MessageSquare,
    },
    {
        title: "Calendario",
        href: "/calendar",
        icon: Calendar,
    },
    {
        title: "Activities",
        href: "/activities",
        icon: Phone,
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
    },
]
