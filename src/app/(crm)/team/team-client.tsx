'use client'

import React, { useState } from "react";
import { 
  Users, 
  Euro, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Plus, 
  Calendar, 
  CreditCard, 
  Clock, 
  History,
  FileText,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface TeamClientProps {
  initialStats: {
    totalEarned: number;
    totalPaid: number;
    totalPending: number;
    membersSummary: any[];
    operationsLog: any[];
  };
  currentUser: any;
  handleAddMember: (formData: FormData) => Promise<void>;
  handleDeleteMember: (id: string) => Promise<void>;
  handleUpdatePayment: (
    assignmentId: string,
    isPaid: boolean,
    method?: string,
    date?: string,
    notes?: string
  ) => Promise<void>;
}

export default function TeamClientComponent({
  initialStats,
  currentUser,
  handleAddMember,
  handleDeleteMember,
  handleUpdatePayment
}: TeamClientProps) {
  const [activeTab, setActiveTab] = useState("members");
  const [newMemberName, setNewMemberName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Stato per la modale di registrazione pagamento
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [payMethod, setPayMethod] = useState("BONIFICO");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [payNotes, setPayNotes] = useState("");
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  // Azione per creare un membro del team
  const onSubmitMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    setIsAdding(true);
    try {
      const formData = new FormData();
      formData.append("name", newMemberName);
      await handleAddMember(formData);
      setNewMemberName("");
      toast.success("Membro del team aggiunto con successo!");
    } catch (error) {
      toast.error("Errore nell'aggiunta del membro del team");
    } finally {
      setIsAdding(false);
    }
  };

  // Azione per eliminare un membro
  const onDeleteMember = async (id: string) => {
    if (confirm("Sei sicuro di voler eliminare questo membro del team?")) {
      try {
        await handleDeleteMember(id);
        toast.success("Membro del team rimosso");
      } catch (error) {
        toast.error("Errore durante l'eliminazione");
      }
    }
  };

  // Azione per registrare il pagamento
  const onSavePayment = async () => {
    if (!selectedAssignment) return;

    setIsSubmittingPay(true);
    try {
      await handleUpdatePayment(
        selectedAssignment.assignmentId,
        true,
        payMethod,
        payDate,
        payNotes
      );
      toast.success(`Pagamento registrato per ${selectedAssignment.clientName}`);
      setSelectedAssignment(null);
      setPayNotes("");
    } catch (error) {
      toast.error("Errore nella registrazione del pagamento");
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Azione per annullare il pagamento (marcare come non pagato)
  const onCancelPayment = async (assignmentId: string, clientName: string) => {
    if (confirm(`Vuoi contrassegnare l'evento di ${clientName} come "Non Pagato"?`)) {
      try {
        await handleUpdatePayment(assignmentId, false);
        toast.success("Stato pagamento ripristinato a 'Non Pagato'");
      } catch (error) {
        toast.error("Errore durante l'operazione");
      }
    }
  };

  // Filtra i membri o gli eventi in base alla ricerca
  const filteredMembers = initialStats.membersSummary.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Raccogliamo tutti gli eventi di tutti i membri per la tabella dei saldi eventi
  const allEvents = initialStats.membersSummary.flatMap(m => 
    m.events.map((e: any) => ({
      ...e,
      memberName: m.name,
      memberId: m.id
    }))
  ).sort((a, b) => {
    const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
    const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
    return dateB - dateA; // Più recenti prima
  });

  const filteredEvents = allEvents.filter(e => 
    e.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-600">
            <Users className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Gestione Organico</span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Dashboard <span className="text-indigo-600">Team</span>
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Gestisci gli operatori dei Live Show, imposta i compensi e monitora i saldi.
          </p>
        </div>

        {/* Form di creazione rapida */}
        <form onSubmit={onSubmitMember} className="flex gap-2 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm max-w-md w-full md:w-auto">
          <Input
            placeholder="Nome operatore..."
            value={newMemberName}
            onChange={(e) => setNewMemberName(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-slate-50 rounded-xl text-xs font-bold"
            disabled={isAdding}
          />
          <Button type="submit" disabled={isAdding} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-xs uppercase px-4 flex gap-1">
            <Plus className="h-4 w-4" /> Add
          </Button>
        </form>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border-slate-100 shadow-sm bg-gradient-to-br from-indigo-50/50 to-white overflow-hidden relative">
          <div className="absolute right-3 top-3 bg-indigo-100/50 text-indigo-600 p-2 rounded-2xl">
            <Euro className="h-5 w-5" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Costo Totale Live Show</CardDescription>
            <CardTitle className="text-3xl font-black text-slate-900">
              €{initialStats.totalEarned.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-400 font-medium">Totale compensi pianificati per tutti gli eventi</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-100 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white overflow-hidden relative">
          <div className="absolute right-3 top-3 bg-emerald-100/50 text-emerald-600 p-2 rounded-2xl">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Totale Pagato</CardDescription>
            <CardTitle className="text-3xl font-black text-emerald-600">
              €{initialStats.totalPaid.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-400 font-medium">Compensi regolarmente liquidati e tracciati</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-slate-100 shadow-sm bg-gradient-to-br from-amber-50/50 to-white overflow-hidden relative">
          <div className="absolute right-3 top-3 bg-amber-100/50 text-amber-600 p-2 rounded-2xl">
            <Clock className="h-5 w-5" />
          </div>
          <CardHeader className="pb-2">
            <CardDescription className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Saldo da Pagare</CardDescription>
            <CardTitle className="text-3xl font-black text-amber-600">
              €{initialStats.totalPending.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-[11px] text-slate-400 font-medium">Compensi in attesa di essere corrisposti</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs di Navigazione */}
      <Tabs defaultValue="members" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <TabsList className="bg-slate-100 p-1 rounded-2xl h-auto self-start">
            <TabsTrigger value="members" className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-indigo-600">
              <Users className="h-3.5 w-3.5 mr-2" /> Team & Andamenti
            </TabsTrigger>
            <TabsTrigger value="events" className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-indigo-600">
              <CreditCard className="h-3.5 w-3.5 mr-2" /> Dettaglio Eventi & Saldi
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-indigo-600">
              <History className="h-3.5 w-3.5 mr-2" /> Riepilogo Operazioni
            </TabsTrigger>
          </TabsList>

          {/* Cerca */}
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filtra per operatore o cliente..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border-slate-200 rounded-2xl text-xs font-bold shadow-sm"
            />
          </div>
        </div>

        {/* Content 1: Lista Membri */}
        <TabsContent value="members" className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Rendimento e Situazione Operatori</h3>
            <Badge variant="secondary" className="rounded-xl font-bold bg-slate-50 text-slate-600 border border-slate-100 px-3 py-1">
              {filteredMembers.length} Operatori
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="font-bold text-xs uppercase text-slate-400">Nome Operatore</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Eventi Svolti</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-400 text-right">Guadagno Generato</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-400 text-right">Liquidato</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-400 text-right">Saldo Residuo</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length > 0 ? (
                  filteredMembers.map((member) => (
                    <TableRow key={member.id} className="border-slate-100 hover:bg-slate-50/50">
                      <TableCell className="font-black text-slate-800 text-sm uppercase italic">{member.name}</TableCell>
                      <TableCell className="font-bold text-center text-slate-600">{member.eventsCount}</TableCell>
                      <TableCell className="font-black text-right text-slate-850">
                        €{member.totalEarned.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="font-bold text-right text-emerald-600">
                        €{member.totalPaid.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className={`font-black text-right ${member.totalPending > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                        €{member.totalPending.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={member.eventsCount > 0}
                          onClick={() => onDeleteMember(member.id)}
                          className="text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50"
                          title={member.eventsCount > 0 ? "Impossibile eliminare: ha eventi assegnati" : "Elimina operatore"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400 font-bold">
                      Nessun operatore corrisponde ai criteri di ricerca
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Content 2: Dettaglio Eventi & Saldi */}
        <TabsContent value="events" className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Saldi Operatori divisi per Evento</h3>
            <Badge variant="secondary" className="rounded-xl font-bold bg-slate-50 text-slate-600 border border-slate-100 px-3 py-1">
              {filteredEvents.length} Partecipazioni
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="font-bold text-xs uppercase text-slate-400">Operatore</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-400">Cliente / Evento</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-400">Data Evento</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-400">Location</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-400 text-right">Importo Compenso</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Stato</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-400 text-center">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((evt: any) => (
                    <TableRow key={evt.assignmentId} className="border-slate-100 hover:bg-slate-50/50">
                      <TableCell className="font-black text-slate-800 text-sm uppercase italic">{evt.memberName}</TableCell>
                      <TableCell className="font-bold text-slate-700">{evt.clientName}</TableCell>
                      <TableCell className="text-slate-500 font-medium text-xs">
                        {evt.eventDate ? new Date(evt.eventDate).toLocaleDateString('it-IT') : 'Data non impostata'}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs font-semibold">{evt.location}</TableCell>
                      <TableCell className="font-black text-right text-slate-800">
                        €{evt.amount.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-center">
                        {evt.isPaid ? (
                          <Badge className="bg-emerald-100 hover:bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] uppercase px-2.5 py-0.5">
                            Pagato ({evt.paymentMethod})
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-100 hover:bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] uppercase px-2.5 py-0.5">
                            Da Pagare
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {evt.isPaid ? (
                          <Button
                            variant="outline"
                            onClick={() => onCancelPayment(evt.assignmentId, evt.clientName)}
                            className="rounded-xl border-slate-200 hover:border-red-200 text-[10px] font-bold uppercase text-slate-500 hover:text-red-600 px-3 py-1 h-auto"
                          >
                            Annulla Pag.
                          </Button>
                        ) : (
                          <Button
                            onClick={() => {
                              setSelectedAssignment(evt);
                              setPayDate(new Date().toISOString().split("T")[0]);
                            }}
                            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-[10px] font-bold uppercase px-3 py-1 h-auto"
                          >
                            Paga
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-400 font-bold">
                      Nessun evento assegnato corrisponde alla ricerca
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Content 3: Riepilogo Operazioni */}
        <TabsContent value="history" className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-slate-100 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Registro Storico Transazioni e Pagamenti Liquidati</h3>
            <Badge variant="secondary" className="rounded-xl font-bold bg-slate-50 text-slate-600 border border-slate-100 px-3 py-1">
              {initialStats.operationsLog.length} Operazioni
            </Badge>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="font-bold text-xs uppercase text-slate-400">Data Operazione</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-400">Membro del Team</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-400">Cliente / Evento</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-400">Metodo</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-400 text-right">Importo Liquidato</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-slate-400">Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialStats.operationsLog.length > 0 ? (
                  initialStats.operationsLog.map((log: any) => (
                    <TableRow key={log.id} className="border-slate-100 hover:bg-slate-50/50">
                      <TableCell className="text-slate-500 font-medium text-xs">
                        {log.paymentDate ? new Date(log.paymentDate).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </TableCell>
                      <TableCell className="font-black text-slate-800 text-sm uppercase italic">{log.teamMemberName}</TableCell>
                      <TableCell className="font-bold text-slate-700">{log.clientName}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`rounded-xl font-bold text-[9px] uppercase ${log.paymentMethod === 'BONIFICO' ? 'border-blue-200 text-blue-700 bg-blue-50/20' : 'border-emerald-200 text-emerald-700 bg-emerald-50/20'}`}>
                          {log.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-black text-right text-emerald-600">
                        €{log.amount.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs italic">{log.notes || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400 font-bold">
                      Nessuna operazione registrata finora
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Registrazione Pagamento */}
      <Dialog open={!!selectedAssignment} onOpenChange={(open) => !open && setSelectedAssignment(null)}>
        <DialogContent className="rounded-3xl border-slate-100 shadow-lg max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 uppercase italic">
              Registra <span className="text-indigo-600">Pagamento</span>
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-xs font-semibold">
              Stai registrando il pagamento a {selectedAssignment?.memberName} per il live show del cliente {selectedAssignment?.clientName}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Compenso visualizzato in evidenza */}
            <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-100">
              <span className="text-xs font-black text-slate-500 uppercase">Importo da Liquidare</span>
              <span className="text-2xl font-black text-indigo-600">
                €{selectedAssignment?.amount.toLocaleString("it-IT", { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Metodo di pagamento */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Metodo Pagamento</label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger className="rounded-xl border-slate-200 text-xs font-bold bg-white">
                  <SelectValue placeholder="Scegli metodo..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl bg-white border-slate-200">
                  <SelectItem value="BONIFICO" className="text-xs font-bold text-slate-700">Bonifico Bancario</SelectItem>
                  <SelectItem value="CONTANTI" className="text-xs font-bold text-slate-700">Contanti</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Data pagamento */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Data di Pagamento</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="pl-9 bg-white border-slate-200 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            {/* Note pagamento */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Note (Opzionale)</label>
              <Input
                placeholder="es: Pagato acconto, rif. contabili..."
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                className="bg-white border-slate-200 rounded-xl text-xs font-bold"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedAssignment(null)}
              className="rounded-xl border-slate-200 hover:bg-slate-50 font-bold text-xs uppercase"
            >
              Annulla
            </Button>
            <Button
              onClick={onSavePayment}
              disabled={isSubmittingPay}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold text-xs uppercase flex gap-1"
            >
              Conferma Pagamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
