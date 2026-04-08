"use client";

import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Maximize2, Globe, Landmark, Map, Info, Compass } from "lucide-react";
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
  
  // Utilizzo dei nuovi campi strutturati salvati nel DB
  const cityName = lead.eventCity || "-";
  const province = lead.eventProvince || "-";
  const region = lead.eventRegion || "-";

  const locationEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=&z=16&ie=UTF8&iwloc=&output=embed`;
  const directionsEmbedUrl = `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(location)}&output=embed`;

  return (
    <div className="group relative overflow-hidden rounded-[2.5rem] border border-slate-200/60 bg-white p-7 shadow-2xl transition-all hover:shadow-indigo-100/50 mt-6 font-sans">
      <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-indigo-50/40 blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
      
      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">
              <Navigation className="h-4 w-4 animate-bounce" /> Hub Logistico Premium
            </span>
            <p className="text-sm font-bold text-slate-900 tracking-tight">Sede Cardito (NA)</p>
          </div>
          <Badge className="bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-none px-4 py-2 text-[10px] font-bold uppercase rounded-full shadow-lg">Dati Certificati</Badge>
        </div>

        {/* Mappa Preview */}
        <div className="relative h-[260px] w-full overflow-hidden rounded-[2rem] border-2 border-white shadow-xl group-hover:shadow-2xl transition-all duration-500">
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            src={locationEmbedUrl}
            className="rounded-[1.9rem] grayscale-[0.2] contrast-[1.1] hover:grayscale-0 transition-all duration-500"
            title="Preview Map"
          ></iframe>
          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-4 py-2 rounded-2xl shadow-lg border border-slate-100">
             <p className="text-[10px] font-black text-slate-800 flex items-center gap-2 uppercase tracking-widest">
                <MapPin className="h-3.5 w-3.5 text-rose-500" /> Target Location
             </p>
          </div>
        </div>

        {/* Tripletta di Info Geografiche Strutturate */}
        <div className="grid grid-cols-3 gap-2">
           {/* Città */}
           <div className="bg-indigo-50/40 rounded-[1.8rem] p-3 border border-indigo-100/50 text-center transition-all hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 group/box">
             <div className="flex flex-col items-center gap-1">
                 <div className="h-7 w-7 rounded-lg bg-white shadow-sm flex items-center justify-center mb-0.5 group-hover/box:scale-110 transition-transform">
                    <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                 </div>
                 <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Città</span>
                 <p className="text-[10px] font-black text-slate-800 leading-tight break-words px-1">{cityName}</p>
             </div>
           </div>

           {/* Provincia */}
           <div className="bg-indigo-50/40 rounded-[1.8rem] p-3 border border-indigo-100/50 text-center transition-all hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 group/box">
             <div className="flex flex-col items-center gap-1">
                 <div className="h-7 w-7 rounded-lg bg-white shadow-sm flex items-center justify-center mb-0.5 group-hover/box:scale-110 transition-transform">
                    <Landmark className="h-3.5 w-3.5 text-indigo-500" />
                 </div>
                 <span className="text-[8px] font-black text-indigo-400 uppercase tracking-widest">Prov.</span>
                 <p className="text-[10px] font-black text-slate-800 leading-tight px-1">{province}</p>
             </div>
           </div>

           {/* Regione */}
           <div className="bg-emerald-50/30 rounded-[1.8rem] p-3 border border-emerald-100/40 text-center transition-all hover:bg-white hover:shadow-xl hover:shadow-emerald-500/5 group/box">
             <div className="flex flex-col items-center gap-1">
                 <div className="h-7 w-7 rounded-lg bg-white shadow-sm flex items-center justify-center mb-0.5 group-hover/box:scale-110 transition-transform">
                    <Compass className="h-3.5 w-3.5 text-emerald-500" />
                 </div>
                 <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Regione</span>
                 <p className="text-[10px] font-black text-slate-800 leading-tight break-words px-1">{region}</p>
             </div>
           </div>
        </div>

        {/* Indirizzo Completo */}
        {/* Indirizzo Completo */}
        <div className="bg-slate-950 rounded-[2rem] p-4 shadow-2xl relative overflow-hidden group/addr transition-all">
           <div className="absolute right-0 top-0 p-4 opacity-5 group-hover/addr:opacity-10 transition-opacity">
              <Compass className="h-12 w-12 text-white" />
           </div>
           <div className="relative z-10 flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/5">
                 <Map className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="space-y-1 overflow-hidden">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter leading-none">Indirizzo Destinazione Ufficiale</p>
                 <p className="text-[11px] font-bold text-white tracking-tight truncate pr-4 leading-tight">{location}</p>
                 <div className="flex items-center gap-2">
                    <div className="h-0.5 w-6 bg-indigo-500 rounded-full"></div>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Certified</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Bottoni Azione */}
        <div className="grid grid-cols-2 gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-14 rounded-2xl border-slate-200 bg-white hover:bg-indigo-50 hover:text-indigo-700 shadow-sm font-black text-[10px] uppercase tracking-tighter px-2 w-full transition-all flex items-center justify-center">
                 <Maximize2 className="h-4 w-4 mr-2 shrink-0 text-indigo-500" /> 
                 <span className="truncate">Massimizza</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-6xl h-[85vh] p-2 rounded-[3.5rem] border-none shadow-[0_0_100px_rgba(0,0,0,0.2)]">
               <iframe width="100%" height="100%" frameBorder="0" src={locationEmbedUrl} className="rounded-[3.2rem]"></iframe>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-xl shadow-indigo-100 font-black text-[10px] uppercase tracking-tighter px-2 w-full transition-all flex items-center justify-center">
                 <Navigation className="h-4 w-4 mr-2 shrink-0" /> 
                 <span className="truncate">Percorso Rapido</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl h-[90vh] p-2 rounded-[4rem] border-none shadow-[0_0_150px_rgba(0,0,0,0.3)]">
               <iframe width="100%" height="100%" frameBorder="0" src={directionsEmbedUrl} className="rounded-[3.7rem]"></iframe>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
