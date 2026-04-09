import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/sonner"
import { ReminderNotifier } from "@/components/layout/reminder-notifier"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PLATINUM CRM",
  description: "Web-based CRM for lead management",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
