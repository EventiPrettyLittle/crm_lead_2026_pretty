'use client'

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteLead } from "@/actions/leads"
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
import { useRouter } from "next/navigation"

interface DeleteLeadButtonProps {
    leadId: string;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
    size?: "default" | "sm" | "lg" | "icon";
    showText?: boolean;
}

export function DeleteLeadButton({ leadId, variant = "destructive", size = "sm", showText = true }: DeleteLeadButtonProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleDelete = async () => {
        setLoading(true);
        try {
            const result = await deleteLead(leadId);
            if (result.success) {
                toast.success("Lead eliminato con successo");
                router.push('/leads');
            } else {
                toast.error("Errore durante l'eliminazione del lead");
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
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-9 w-9 rounded-xl text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-all"
                    title="Elimina Lead"
                >
                    <Trash2 className="h-5 w-5" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[2rem] border-slate-200 shadow-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-xl font-bold">Conferma Eliminazione</AlertDialogTitle>
                    <AlertDialogDescription>
                        Sei sicuro di voler eliminare questo lead? Questa azione è permanente e non può essere annullata.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="rounded-xl border-slate-200">Annulla</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-lg shadow-rose-100"
                        disabled={loading}
                    >
                        {loading ? "Eliminazione..." : "Sì, elimina"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
