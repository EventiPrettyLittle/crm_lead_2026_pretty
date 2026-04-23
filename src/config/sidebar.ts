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
    Puzzle,
    Euro,
    Workflow,
    Clock,
    Map
} from "lucide-react"

export const sidebarLinks = [
    {
        title: "Dashboard",
        href: "/",
        icon: Home,
    },
    {
        title: "Leads",
        icon: Users,
        subItems: [
            {
                title: "Tutti i Lead",
                href: "/leads",
                icon: Users,
            },
            {
                title: "Importa Database",
                href: "/leads/import",
                icon: Database,
            },
        ]
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
        title: "Deal",
        href: "/deals",
        icon: Workflow,
    },
    {
        title: "Incassi & Pagamenti",
        href: "/finance",
        icon: Euro,
    },
    {
        title: "Presentazione",
        href: "/presentation",
        icon: MonitorPlay,
    },
    {
        title: "Attività",
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
