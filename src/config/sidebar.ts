import { 
    Home, 
    Users, 
    Calendar, 
    FileText, 
    Settings, 
    Phone, 
    LayoutDashboard, 
    MessageSquare, 
    Database, 
    Wallet, 
    MonitorPlay, 
    Puzzle 
} from "lucide-react"

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
        title: "Calendario",
        href: "/calendar",
        icon: Calendar,
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
        title: "Presentazione",
        href: "/presentation",
        icon: MonitorPlay,
    },
    {
        title: "Activities",
        href: "/activities",
        icon: Phone,
    },
    {
        title: "Integrazioni",
        icon: Puzzle,
        subItems: [
            {
                title: "Google Sheets Sync",
                href: "/sync-sheets",
                icon: Database,
            },
            {
                title: "WhatsApp",
                href: "/whatsapp",
                icon: MessageSquare,
            }
        ]
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
    },
]
