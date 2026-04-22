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
  const locationName = (lead as any).locationName || "Villa non specificata";
  
  const cityName = lead.eventCity || "Città";
  const province = lead.eventProvince || "Provincia";
  const region = lead.eventRegion || "Regione";

  const locationEmbedUrl = `https://maps.google.com/maps?saddr=${encodeURIComponent(origin)}&daddr=${encodeURIComponent(location)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="bg-white rounded-[3rem] border border-slate-200/50 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Premium */}
      <div className="px-10 py-6 border-b border-slate-100 flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500">
          <MapPin className="h-4 w-4" />
        </div>
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Location</h3>
      </div>

      <div className="p-10 space-y-8">
        {/* Info Principali */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Nome Location</p>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">{locationName}</h2>
          <div className="flex items-center gap-2 pt-2">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Indirizzo Formattato</p>
            <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-slate-300" />
              {location || "Nessun indirizzo salvato"}
            </div>
          </div>
        </div>

        {/* Box Mappa & Hub */}
        <div className="bg-slate-50/50 rounded-[2.5rem] p-8 border border-slate-100 space-y-6">
          <div className="flex justify-between items-center px-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-indigo-600 rotate-45" />
                <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em]">Hub Logistico Premium</h4>
              </div>
              <p className="text-[10px] font-bold text-slate-500 ml-6">Sede Cardito (NA)</p>
            </div>
            <Badge className="bg-indigo-600/90 text-white border-none py-2 px-6 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100">
              Dati Certificati
            </Badge>
          </div>

          <div className="relative aspect-video rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl group">
             <iframe width="100%" height="100%" frameBorder="0" src={locationEmbedUrl} className="grayscale-[0.1] contrast-[1.1] transition-all group-hover:grayscale-0 duration-1000"></iframe>
             <div className="absolute top-6 left-6 bg-white px-5 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-slate-100">
                <MapPin className="h-4 w-4 text-rose-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Target Location</span>
             </div>
          </div>

          {/* Ripartizione Territoriale Orizzontale */}
          <div className="grid grid-cols-3 gap-4 pt-4">
             <div className="bg-white rounded-[2rem] p-5 flex flex-col items-center justify-center border border-slate-100 shadow-sm group hover:scale-[1.05] transition-transform">
                <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3">
                  <MapPin className="h-5 w-5" />
                </div>
                <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">Città</p>
                <p className="text-xs font-black text-slate-800">{cityName}</p>
             </div>
             <div className="bg-white rounded-[2rem] p-5 flex flex-col items-center justify-center border border-slate-100 shadow-sm group hover:scale-[1.05] transition-transform">
                <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-3">
                  <Landmark className="h-5 w-5" />
                </div>
                <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest mb-1">Prov.</p>
                <p className="text-xs font-black text-slate-800">{province}</p>
             </div>
             <div className="bg-white rounded-[2rem] p-5 flex flex-col items-center justify-center border border-emerald-50 shadow-sm group hover:scale-[1.05] transition-transform">
                <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 mb-3">
                  <Globe className="h-5 w-5" />
                </div>
                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-1">Regione</p>
                <p className="text-xs font-black text-slate-800">{region}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
