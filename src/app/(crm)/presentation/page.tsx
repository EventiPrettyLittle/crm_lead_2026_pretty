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
    Link as LinkIcon,
    Trash2, 
    ChevronRight, 
    Home,
    Search,
    Loader2,
    X,
    Download,
    Video,
    Pencil
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { getFiles, createFolder, saveFile, deleteEntry, renameEntry } from '@/actions/presentation-actions'
import { cn } from '@/lib/utils'

export default function PresentationPage() {
    const [path, setPath] = useState<any[]>([]) // Array di oggetti cartella
    const [entries, setEntries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreatingFolder, setIsCreatingFolder] = useState(false)
    const [isAddingLink, setIsAddingLink] = useState(false)
    const [newFolderName, setNewFolderName] = useState("")
    const [selectedEntry, setSelectedEntry] = useState<any | null>(null)
    const [showPreview, setShowPreview] = useState(false)

    // Form per link
    const [linkData, setLinkData] = useState({ name: '', url: '', kind: 'VIDEO' })

    const currentParentId = path.length > 0 ? path[path.length - 1].id : null

    const loadEntries = async () => {
        setLoading(true)
        try {
            const data = await getFiles(currentParentId)
            setEntries(data as any)
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
        const res = await createFolder(newFolderName, currentParentId)
        if (res.success) {
            setNewFolderName("")
            setIsCreatingFolder(false)
            loadEntries()
            toast.success("Cartella creata")
        } else {
            toast.error(res.error)
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        
        if (file.size > 3 * 1024 * 1024) return toast.error("Immagine troppo grande (max 3MB)")

        const reader = new FileReader()
        reader.onloadend = async () => {
            const base64 = reader.result as string
            const res = await saveFile({
                name: file.name,
                kind: 'IMAGE',
                url: base64,
                parentId: currentParentId
            })
            if (res.success) {
                toast.success("Immagine caricata")
                loadEntries()
            }
        }
        reader.readAsDataURL(file)
    }

    const handleSaveLink = async () => {
        if (!linkData.name || !linkData.url) return toast.error("Compila tutti i campi")
        const res = await saveFile({
            ...linkData,
            parentId: currentParentId
        })
        if (res.success) {
            toast.success("Collegamento salvato")
            setLinkData({ name: '', url: '', kind: 'VIDEO' })
            setIsAddingLink(false)
            loadEntries()
        }
    }

    const handleRename = async (id: string, currentName: string) => {
        const newName = prompt("Inserisci il nuovo nome:", currentName)
        if (!newName || newName === currentName) return
        
        const res = await renameEntry(id, newName)
        if (res.success) {
            toast.success("Rinominato")
            loadEntries()
        } else {
            toast.error(res.error)
        }
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Eliminare ${name}? (Se è una cartella verranno eliminati anche i file all'interno)`)) return
        const res = await deleteEntry(id)
        if (res.success) {
            toast.success("Eliminato")
            loadEntries()
        } else {
            toast.error(res.error)
        }
    }

    const getIcon = (entry: any) => {
        if (entry.type === 'FOLDER') return <Folder className="w-10 h-10 text-indigo-500 fill-indigo-50" />
        if (entry.kind === 'IMAGE') return <ImageIcon className="w-10 h-10 text-rose-500" />
        if (entry.kind === 'VIDEO') return <Play className="w-10 h-10 text-indigo-600 fill-indigo-100" />
        if (entry.kind === 'PDF') return <FileText className="w-10 h-10 text-orange-500" />
        return <File className="w-10 h-10 text-slate-400" />
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black italic tracking-tighter text-slate-900">Presentazione</h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 ml-1">Database Cloud Hub</p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <div className="relative">
                        <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer z-10" onChange={handleImageUpload} />
                        <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 h-12 px-6 font-black text-[10px] uppercase gap-2 shadow-lg transition-transform active:scale-95">
                            <Upload className="w-4 h-4" />
                            Aggiungi Foto
                        </Button>
                    </div>
                    <Button onClick={() => setIsAddingLink(true)} className="rounded-2xl bg-slate-900 hover:bg-black h-12 px-6 font-black text-[10px] uppercase gap-2">
                        <LinkIcon className="w-4 h-4" />
                        Aggiungi Link (Video/PDF)
                    </Button>
                    <Button onClick={() => setIsCreatingFolder(true)} variant="outline" className="rounded-2xl border-slate-200 h-12 px-6 font-black text-[10px] uppercase gap-2">
                        <Plus className="w-4 h-4" />
                        Nuova Cartella
                    </Button>
                </div>
            </div>

            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                <button onClick={() => setPath([])} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors">
                    <Home className="w-3.5 h-3.5" /> Root
                </button>
                {path.map((folder, idx) => (
                    <div key={folder.id} className="flex items-center gap-2">
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        <button onClick={() => setPath(path.slice(0, idx + 1))} className="text-[10px] font-black uppercase text-slate-400 hover:text-indigo-600 transition-colors">
                            {folder.name}
                        </button>
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="relative min-h-[400px]">
                {loading && (
                    <div className="absolute inset-0 bg-white/50 backdrop-blur-[2px] z-10 flex items-center justify-center rounded-[2.5rem]">
                        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {/* Folder Creator */}
                    {isCreatingFolder && (
                        <Card className="rounded-[2rem] border-2 border-dashed border-indigo-200 bg-indigo-50/30 p-4 animate-in zoom-in duration-200 flex flex-col justify-center gap-4">
                            <Folder className="w-8 h-8 text-indigo-400 mx-auto" />
                            <Input autoFocus placeholder="Nome..." value={newFolderName} onChange={e => setNewFolderName(e.target.value)} className="h-9 text-xs font-bold rounded-xl" onKeyDown={e => e.key === 'Enter' && handleCreateFolder()}/>
                            <div className="flex gap-2">
                                <Button onClick={handleCreateFolder} size="sm" className="flex-1 rounded-xl bg-indigo-600 text-[10px] font-black">Crea</Button>
                                <Button onClick={() => setIsCreatingFolder(false)} variant="ghost" size="sm" className="flex-1 rounded-xl text-[10px] font-black">X</Button>
                            </div>
                        </Card>
                    )}

                    {/* Link Creator */}
                    {isAddingLink && (
                        <Card className="col-span-2 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 animate-in slide-in-from-top-2 duration-300 space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nuovo Collegamento</h4>
                                <Button onClick={() => setIsAddingLink(false)} variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-full"><X className="w-4 h-4"/></Button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Input placeholder="Titolo..." value={linkData.name} onChange={e => setLinkData({...linkData, name: e.target.value})} className="h-10 rounded-xl font-bold text-xs" />
                                <select 
                                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-[10px] font-black uppercase"
                                    value={linkData.kind}
                                    onChange={e => setLinkData({...linkData, kind: e.target.value})}
                                >
                                    <option value="VIDEO">Video (YouTube/Drive)</option>
                                    <option value="PDF">Documento PDF</option>
                                </select>
                            </div>
                            <Input placeholder="Incolla l'URL qui..." value={linkData.url} onChange={e => setLinkData({...linkData, url: e.target.value})} className="h-10 rounded-xl font-bold text-xs" />
                            <Button onClick={handleSaveLink} className="w-full rounded-xl bg-indigo-600 font-black text-[10px] uppercase h-10">Salva nel Drive</Button>
                        </Card>
                    )}

                    {entries.map((item) => (
                        <div key={item.id} className="group relative">
                            <Card 
                                onClick={() => item.type === 'FOLDER' ? setPath([...path, item]) : (setSelectedEntry(item), setShowPreview(true))}
                                className="rounded-[2rem] border-none shadow-sm shadow-slate-200/50 bg-white hover:shadow-xl hover:shadow-indigo-100 transition-all cursor-pointer overflow-hidden aspect-square flex flex-col items-center justify-center gap-4 group-hover:-translate-y-1 duration-300"
                            >
                                <div className="transition-transform duration-500 group-hover:scale-110">{getIcon(item)}</div>
                                <div className="px-4 text-center">
                                    <p className="text-[11px] font-black text-slate-700 truncate w-full max-w-[120px]">{item.name}</p>
                                    {item.type === 'FILE' && <Badge className="bg-slate-50 text-slate-400 border-none font-black text-[8px] uppercase px-2 mt-1">{item.kind}</Badge>}
                                </div>
                            </Card>
                            {/* Action Buttons */}
                            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                <button onClick={(e) => { e.stopPropagation(); handleRename(item.id, item.name); }} className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-colors">
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id, item.name); }} className="p-2 rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Preview Popup */}
            {showPreview && selectedEntry && (
                <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
                    <Button onClick={() => setShowPreview(false)} variant="ghost" className="absolute top-6 right-6 bg-white/10 text-white hover:bg-white/20 rounded-2xl h-12 w-12"><X className="w-6 h-6"/></Button>
                    <div className="w-full max-w-5xl h-[80vh] flex items-center justify-center rounded-[3rem] overflow-hidden bg-black/20 relative shadow-2xl">
                        {selectedEntry.kind === 'IMAGE' ? (
                            <img src={selectedEntry.url} className="max-w-full max-h-full object-contain" />
                        ) : selectedEntry.kind === 'VIDEO' || selectedEntry.kind === 'PDF' ? (
                            <iframe 
                                src={
                                    selectedEntry.url.includes('youtube.com') 
                                        ? selectedEntry.url.replace('watch?v=', 'embed/') 
                                        : selectedEntry.url.includes('drive.google.com')
                                            ? selectedEntry.url.replace('/view', '/preview').replace('/edit', '/preview')
                                            : selectedEntry.url
                                } 
                                className="w-full h-full border-none bg-white" 
                                allow="autoplay; shadow-none" 
                                allowFullScreen
                            />
                        ) : (
                            <iframe src={selectedEntry.url} className="w-full h-full border-none bg-white" />
                        )}
                    </div>
                    <p className="mt-8 text-[10px] font-black uppercase tracking-[0.5em] text-white/40">{selectedEntry.name}</p>
                </div>
            )}
        </div>
    )
}
