'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { User } from 'lucide-react'

export function UserNav() {
    const [user, setUser] = useState<{name: string} | null>(null);

    useEffect(() => {
        import("@/actions/auth").then(m => m.getCurrentUser()).then(setUser);
    }, []);

    const displayName = user?.name 
        ? (user.name.includes('@') ? user.name.split('@')[0] : user.name)
        : "Luca Vitale";

    const initials = displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    return (
        <Link 
            href="/settings" 
            title="Impostazioni Utente"
            className="h-10 w-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm shadow-sm group hover:bg-indigo-600 hover:text-white transition-all cursor-pointer overflow-hidden"
        >
            {initials}
        </Link>
    );
}
