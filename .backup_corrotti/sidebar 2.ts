import { Home, Users, Calendar, FileText, Settings, Phone, LayoutDashboard } from "lucide-react"

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
        title: "Preventivi",
        href: "/quotes",
        icon: FileText,
    },
    {
        title: "Calendario",
        href: "/calendar",
        icon: Calendar,
    },
    {
        title: "Quotes",
        href: "/quotes",
        icon: FileText,
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
