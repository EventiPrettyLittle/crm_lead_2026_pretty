'use client'

import { useState, useEffect } from 'react'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab']
const MONTHS = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']

export function LiveClock() {
    const [now, setNow] = useState<Date | null>(null)

    useEffect(() => {
        // Set immediately to avoid hydration flash
        setNow(new Date())
        const interval = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(interval)
    }, [])

    if (!now) return null

    // Format in Italy timezone
    const formatter = new Intl.DateTimeFormat('it-IT', {
        timeZone: 'Europe/Rome',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    })

    const parts = formatter.formatToParts(now)
    const get = (type: string) => parts.find(p => p.type === type)?.value ?? ''

    const hours = get('hour')
    const minutes = get('minute')
    const seconds = get('second')

    const dateParts = new Intl.DateTimeFormat('it-IT', {
        timeZone: 'Europe/Rome',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
    }).formatToParts(now)

    const weekday = dateParts.find(p => p.type === 'weekday')?.value ?? ''
    const day = dateParts.find(p => p.type === 'day')?.value ?? ''
    const month = dateParts.find(p => p.type === 'month')?.value ?? ''

    return (
        <div className="flex flex-col items-center select-none">
            {/* Time */}
            <div className="flex items-baseline gap-0.5 leading-none">
                <span className="text-[1.35rem] font-black tracking-tight text-slate-800 tabular-nums">
                    {hours}<span className="text-slate-300 mx-0.5">:</span>{minutes}
                </span>
                <span className="text-[0.65rem] font-bold text-slate-400 tabular-nums mb-0.5">:{seconds}</span>
            </div>
            {/* Date */}
            <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                    {weekday}
                </span>
                <span className="text-[10px] text-slate-300">·</span>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {day} {month}
                </span>
            </div>
        </div>
    )
}
