'use client'

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteAllLeads } from "@/actions/leads"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useState } from "react"
import { toast } from "sonner"

export function DeleteAllLeadsButton() {
    const [loading, setLoading] = useState(false);

    const handleDelete = async () => {
        setLoading(true);
        try {
            const result = await deleteAllLeads();
            if (result.success) {
                toast.success("Tutti i lead sono stati eliminati");
            } else {
                toast.error("Errore durante l'eliminazione dei lead");
            }
        } catch (error) {
            toast.error("Errore di sistema");
        } finally {
            setLoading(false);
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="rounded-[1.5rem] h-12 px-6 font-black text-[11px] uppercase tracking-widest shadow-lg shadow-rose-500/20 transition-all hover:scale-[1.02]">
                    <Trash2 className="mr-2 h-4 w-4 opacity-80" />
                    Svuota
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sei assolutamente sicuro?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Questa azione eliminerà permanentemente tutti i lead, le attività e i preventivi associati. Questa azione non può essere annullata.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={loading}
                    >
                        {loading ? "Eliminazione..." : "Sì, elimina tutto"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
