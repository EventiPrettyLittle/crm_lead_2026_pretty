import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Upload } from "lucide-react"
import { getDashboardStats } from "@/actions/dashboard"

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex space-x-2">
          <Button asChild>
            <Link href="/leads/import">
              <Upload className="mr-2 h-4 w-4" />
              Import Leads
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Total Leads</h3>
          <div className="text-2xl font-bold">{stats.totalLeads}</div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Today's Tasks</h3>
          <div className="text-2xl font-bold">{stats.todayTasks}</div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Pipeline Value</h3>
          <div className="text-2xl font-bold">€{stats.pipelineValue.toFixed(2)}</div>
        </div>
        <div className="p-6 bg-card rounded-lg border shadow-sm">
          <h3 className="text-sm font-medium text-muted-foreground">Conversion Rate</h3>
          <div className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</div>
        </div>
      </div>
    </div>
  )
}
