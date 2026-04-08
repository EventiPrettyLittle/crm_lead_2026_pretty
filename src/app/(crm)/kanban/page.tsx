import { getLeads } from "@/actions/leads";
import { KanbanBoard } from "@/components/leads/kanban-board";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Upload } from "lucide-react";
import { AddLeadDialog } from "@/components/leads/add-lead-dialog";

export default async function KanbanPage() {
    const leads = await getLeads();

    return (
        <div className="space-y-4 h-full">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold tracking-tight">Leads Pipeline</h2>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/leads/import">
                            <Upload className="mr-2 h-4 w-4" />
                            Import
                        </Link>
                    </Button>
                    <AddLeadDialog />
                </div>
            </div>

            <KanbanBoard initialLeads={leads} />
        </div>
    );
}
