"use client";

import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Maximize2, Globe, Landmark, Map, Info, Compass, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Lead } from "@prisma/client";

interface LeadLocationActionsProps {
  lead: Lead;
}

export function LeadLocationActions({ lead }: LeadLocationActionsProps) {
  const origin = "Via Fosse Ardeatine 30, 80024 Cardito (NA)";
  const location = lead.eventLocation || "";
  const locationName = (lead as any).locationName || "Location non specificata";
  
  const cityName = lead.eventCity || "-";
  const province = lead.eventProvince || "-";
  const region = lead.eventRegion || "-";

  const locationEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  const directionsEmbedUrl = `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(location)}&output=embed`;

  return (
    <div className="rounded-[2.5rem] border border-slate-200/60 bg-white overflow-hidden shadow-2xl transition-all hover:shadow-indigo-100/50 mt-6 font-sans">
      <div className="flex flex-col lg:flex-row min-h-[420px]">
        
        {/* LATO SINISTRO: MAPPA (PIÙ GRANDE) */}
        <div className="lg:w-[60%] p-8 bg-slate-50/50 border-r border-slate-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
                <Navigation className="h-5 w-5 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">Hub Logistico Pretty</span>
                <p className="text-xs font-bold text-slate-900 tracking-tight">Sede Cardito (NA)</p>
              </div>
            </div>
            <Badge className="bg-white text-indigo-600 border border-indigo-100 px-4 py-2 text-[10px] font-black uppercase rounded-xl">Dati Certificati</Badge>
          </div>

          <div className="flex-1 relative rounded-[2rem] overflow-hidden border-4 border-white shadow-xl group">
            <iframe
              width="100%"
              height="100%"
              frameBorder="0"
              src={locationEmbedUrl}
              className="grayscale-[0.2] contrast-[1.1] group-hover:grayscale-0 transition-all duration-700"
              title="Preview Map"
            ></iframe>
            <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-5 py-2.5 rounded-2xl shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2">
               <p className="text-[10px] font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                  <MapPin className="h-4 w-4 text-rose-500" /> Target Location
               </p>
            </div>
          </div>

          <div className="mt-6 bg-slate-900 rounded-[2rem] p-5 flex items-center justify-between text-white shadow-2xl">
              <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/5">
                      <Map className="h-5 w-5 text-indigo-400" />
                  </div>
                  <div className="overflow-hidden max-w-[280px]">
                      <p className="text-[8px] font-black opacity-40 uppercase tracking-[0.2em] mb-0.5 whitespace-nowrap">Indirizzo Destinazione Ufficiale</p>
                      <p className="text-xs font-bold text-white truncate leading-tight">{location}</p>
                  </div>
              </div>
              <div className="flex items-center gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-9 rounded-xl font-bold text-white hover:bg-white/10 flex items-center gap-2">
                        <Maximize2 className="h-4 w-4" /> <span className="hidden sm:inline">MASSIMIZZA</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-6xl h-[85vh] p-2 rounded-[3.5rem] border-none">
                      <iframe width="100%" height="100%" frameBorder="0" src={locationEmbedUrl} className="rounded-[3.2rem]"></iframe>
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-black text-[10px] px-4 shadow-lg shadow-indigo-900/40">
                         PERCORSO
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-7xl h-[90vh] p-2 rounded-[4rem] border-none">
                      <iframe width="100%" height="100%" frameBorder="0" src={directionsEmbedUrl} className="rounded-[3.7rem]"></iframe>
                    </DialogContent>
                  </Dialog>
              </div>
          </div>
        </div>

        {/* LATO DESTRO: VALORI (DETTAGLI TERRITORIALI) */}
        <div className="lg:w-[40%] p-10 flex flex-col justify-between bg-slate-50/20">
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-[2.2rem] shadow-sm border border-slate-100">
               <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2 leading-none">Nome Location</p>
               <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">{locationName}</h2>
            </div>

            <div className="space-y-5">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Ripartizione Territoriale</p>
               
               <div className="grid gap-3">
                  {/* CITTÀ */}
                  <div className="flex items-center gap-5 p-5 bg-white rounded-[1.8rem] border border-slate-100 shadow-sm transition-all hover:bg-slate-50 hover:scale-[1.02] cursor-default group">
                     <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                        <MapPin className="h-6 w-6" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Città</p>
                        <p className="text-lg font-black text-slate-800 leading-none">{cityName}</p>
                     </div>
                  </div>

                  {/* PROVINCIA */}
                  <div className="flex items-center gap-5 p-5 bg-white rounded-[1.8rem] border border-slate-100 shadow-sm transition-all hover:bg-slate-50 hover:scale-[1.02] cursor-default group">
                     <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                        <Landmark className="h-6 w-6" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Provincia</p>
                        <p className="text-lg font-black text-slate-800 leading-none">{province}</p>
                     </div>
                  </div>

                  {/* REGIONE */}
                  <div className="flex items-center gap-5 p-5 bg-white rounded-[1.8rem] border border-emerald-100 shadow-sm transition-all hover:bg-slate-50 hover:scale-[1.02] cursor-default group">
                     <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-sm">
                        <ShieldCheck className="h-6 w-6" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Regione</p>
                        <p className="text-lg font-black text-slate-800 leading-none">{region}</p>
                     </div>
                  </div>
               </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center opacity-40">
             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.3em]">Pretty Logistics Analysis - 2026</p>
          </div>
        </div>

      </div>
    </div>
  );
}
