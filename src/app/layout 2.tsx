import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "CRM Platform",
  description: "Web-based CRM for lead management",
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SidebarProvider>
          <AppSidebar />
          <main className="w-full">
            <div className="p-4 border-b flex items-center">
              <SidebarTrigger />
              <h1 className="ml-4 font-semibold text-lg">CRM Platform</h1>
            </div>
            <div className="p-4">
              {children}
            </div>
          </main>
        </SidebarProvider>
        <Toaster />
      </body>
    </html>
  )
}
