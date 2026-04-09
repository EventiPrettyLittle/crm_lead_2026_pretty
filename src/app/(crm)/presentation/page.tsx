'use client'

import { useState, useEffect } from 'react'
import { 
    Folder, 
    File, 
    FileText, 
    Image as ImageIcon, 
    Play, 
    Plus, 
    Upload, 
    MoreVertical, 
    Trash2, 
    ChevronRight, 
    Home,
    Search,
    Loader2,
    X,
    Maximize2,
    Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getFiles, createFolder, uploadFile, deleteEntry } from '@/actions/presentation-actions'
import { cn } from '@/lib/utils'

export default function PresentationPage() {
    const [path, setPath] = useState<string[]>([])
    const [entries, setEntries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreatingFolder, setIsCreatingFolder] = useState(false)
    const [newFolderName, setNewFolderName] = useState("")
    const [selectedEntry, setSelectedEntry] = useState<any | null>(null)
    const [showPreview, setShowPreview] = useState(false)

    const currentPathStr = path.join('/')

    const loadEntries = async () => {
        setLoading(true)
        try {
            const data = await getFiles(currentPathStr)
            setEntries(data)
        } catch (error) {
            toast.error("Errore nel caricamento dei file")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadEntries()
    }, [path])

    const handleCreateFolder = async () => {
        if (!newFolderName) return
        const res = await createFolder(newFolderName, currentPathStr)
        if (res.success) {
            setNewFolderName("")
            setIsCreatingFolder(false)
            loadEntries()
            toast.success("Cartella creata")
        } else {
            toast.error(res.error)
        }
    }

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        
        const formData = new FormData()
        formData.append('file', file)
        
        setLoading(true)
        const res = await uploadFile(formData, currentPathStr)
        if (res.success) {
            toast.success("File caricato")
            loadEntries()
        } else {
            toast.error(res.error)
        }
        setLoading(false)
    }

    const handleDelete = async (name: string, isDir: boolean) => {
        if (!confirm(`Sei sicuro di voler eliminare ${name}?`)) return
        const res = await deleteEntry(name, currentPathStr, isDir)
        if (res.success) {
            toast.success("Eliminato")
            loadEntries()
        } else {
            toast.error(res.error)
        }
    }

    const getIcon = (entry: any) => {
        if (entry.isDir) return <Folder className="w-10 h-10 text-indigo-500 fill-indigo-50" />
        const ext = entry.ext.toLowerCase()
        if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) return <ImageIcon className="w-10 h-10 text-rose-500" />
        if (['.mp4', '.mov', '.webm'].includes(ext)) return <Play className="w-10 h-10 text-indigo-600 fill-indigo-100" />
        if (ext === '.pdf') return <FileText className="w-10 h-10 text-orange-500" />
        return <File className="w-10 h-10 text-slate-400" />
    }

    const handleEntryClick = (entry: any) => {
        if (entry.isDir) {
            setPath([...path, entry.name])
        } else {
            setSelectedEntry(entry)
            setShowPreview(true)
        }
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black italic tracking-tighter text-slate-900">Presentazione</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 ml-1">Premium Showcase Hub</p>
                </div>

                <div className="flex gap-3">
                    <div className="relative">
                        <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                            onChange={handleUpload}
                        />
                        <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 h-12 px-6 font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-indigo-100 transition-transform active:scale-95">
                            <Upload className="w-4 h-4" />
                            Carica File
                        </Button>
                    </div>
                    <Button 
                        onClick={() => setIsCreatingFolder(true)}
                        variant="outline" 
                        className="rounded-2xl border-slate-200 h-12 px-6 font-black text-xs uppercase tracking-widest gap-2 hover:bg-slate-50 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Nuova Cartella
                    </Button>
                </div>
            </div>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                <button 
                    onClick={() => setPath([])}
                    className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors"
                >
                    <Home className="w-3.5 h-3.5" />
                    Root
                </button>
                {path.map((folder, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        <button 
                            onClick={() => setPath(path.slice(0, idx + 1))}
                            className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            {folder}
                        </button>
                    </div>
                ))}
            </div>

            {/* Content Grid */}
            <div className="relative">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-[2.5rem]">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {/* Create Folder Inline Modal */}
                    {isCreatingFolder && (
                        <Card className="rounded-[2rem] border-2 border-dashed border-indigo-200 bg-indigo-50/30 flex flex-col p-4 animate-in zoom-in duration-200">
                            <div className="flex-1 flex flex-col gap-3 justify-center">
                                <Folder className="w-8 h-8 text-indigo-400 mx-auto" />
                                <Input 
                                    autoFocus
                                    placeholder="Nome cartella..." 
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}
                                    className="h-9 text-xs font-bold rounded-xl border-slate-200 focus:bg-white"
                                />
                            </div>
                            <div className="flex gap-2 mt-4">
                                <Button onClick={handleCreateFolder} size="sm" className="flex-1 rounded-xl bg-indigo-600 font-black text-[10px] h-8">Crea</Button>
                                <Button onClick={() => setIsCreatingFolder(false)} variant="ghost" size="sm" className="flex-1 rounded-xl font-black text-[10px] h-8">Annulla</Button>
                            </div>
                        </Card>
                    )}

                    {entries.map((entry) => (
                        <div key={entry.name} className="group relative">
                            <Card 
                                onClick={() => handleEntryClick(entry)}
                                className="rounded-[2rem] border-none shadow-sm shadow-slate-200/50 bg-white hover:shadow-xl hover:shadow-indigo-100 transition-all cursor-pointer overflow-hidden aspect-square flex flex-col items-center justify-center gap-4 group-hover:-translate-y-1 duration-300"
                            >
                                <div className="transition-transform duration-500 group-hover:scale-110">
                                    {getIcon(entry)}
                                </div>
                                <div className="px-4 text-center">
                                    <p className="text-[11px] font-black text-slate-700 truncate w-full max-w-[120px]">
                                        {entry.name}
                                    </p>
                                    {!entry.isDir && (
                                        <Badge className="bg-slate-50 text-slate-400 border-none font-black text-[8px] uppercase px-2 py-0 mt-1">
                                            {entry.ext.substring(1)}
                                        </Badge>
                                    )}
                                </div>
                            </Card>
                            
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleDelete(entry.name, entry.isDir)
                                }}
                                className="absolute top-3 right-3 p-2 rounded-xl bg-rose-50 text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}

                    {entries.length === 0 && !isCreatingFolder && (
                        <div className="col-span-full py-20 text-center space-y-4">
                            <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto">
                                <Search className="w-8 h-8 text-slate-200" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Nessun file qui</h3>
                                <p className="text-[10px] text-slate-300 font-bold uppercase mt-1">Inizia a caricare le tue presentazioni</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Fullscreen Preview Showcase */}
            {showPreview && selectedEntry && (
                <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
                    <div className="absolute top-6 right-6 flex gap-4">
                        <Button asChild variant="ghost" className="text-white hover:bg-white/10 rounded-2xl h-12 px-6 font-black uppercase text-xs gap-2">
                            <a href={selectedEntry.url} download={selectedEntry.name}>
                                <Download className="w-5 h-5" />
                                Scarica
                            </a>
                        </Button>
                        <Button 
                            onClick={() => setShowPreview(false)}
                            variant="ghost" 
                            className="bg-white/10 text-white hover:bg-white/20 rounded-2xl h-12 w-12 flex items-center justify-center"
                        >
                            <X className="w-6 h-6" />
                        </Button>
                    </div>

                    <div className="w-full max-w-6xl max-h-[80vh] flex items-center justify-center relative group">
                        {['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(selectedEntry.ext.toLowerCase()) ? (
                            <img 
                                src={selectedEntry.url} 
                                alt={selectedEntry.name}
                                className="max-w-full max-h-full object-contain rounded-[2rem] shadow-2xl ring-1 ring-white/10"
                            />
                        ) : ['.mp4', '.mov', '.webm', '.ogg'].includes(selectedEntry.ext.toLowerCase()) ? (
                            <div className="w-full aspect-video rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-500/20 ring-4 ring-white/5">
                                <video 
                                    src={selectedEntry.url} 
                                    controls 
                                    autoPlay 
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : selectedEntry.ext.toLowerCase() === '.pdf' ? (
                            <iframe 
                                src={selectedEntry.url} 
                                className="w-full h-[80vh] rounded-[2rem] shadow-2xl border-none" 
                                title={selectedEntry.name}
                            />
                        ) : (
                            <div className="text-center text-white space-y-6">
                                <File className="w-32 h-32 text-white/20 mx-auto" />
                                <p className="text-2xl font-black italic">Anteprima non disponibile per questo file</p>
                                <Button asChild className="bg-white text-slate-900 hover:bg-slate-100 rounded-2xl h-14 px-10 font-bold">
                                    <a href={selectedEntry.url} download={selectedEntry.name}>Scarica File</a>
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 text-center text-white/40">
                        <p className="text-[10px] font-black uppercase tracking-[0.5em]">{selectedEntry.name}</p>
                    </div>
                </div>
            )}
        </div>
    )
}
