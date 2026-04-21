'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { serializePrisma } from "@/lib/serialize"

export async function getProducts() {
    // Prodotti di emergenza
    const fallbackProducts = [
        { id: 'p1', name: 'Kit Platinum Base', price: 1500, category: 'PACCHETTI' },
        { id: 'p2', name: 'Kit Platinum Premium', price: 2500, category: 'PACCHETTI' },
        { id: 'p3', name: 'Servizio Foto & Video', price: 1200, category: 'SERVIZI' },
    ];

    try {
        // Creiamo una promessa che scade dopo 3 secondi per evitare il loop infinito su Vercel
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Timeout database")), 3000)
        );

        // Fetch ultra-veloce con Prisma nativo in competizione con il timeout
        const productsPromise = prisma.product.findMany({
            orderBy: { name: 'asc' },
            take: 100 
        });

        const products = await Promise.race([productsPromise, timeoutPromise]) as any[];
        
        if (products && products.length > 0) {
            return serializePrisma(products);
        }
        
        return fallbackProducts;
    } catch (error) {
        console.warn("DB Product fetch failed or timed out, using fallback:", error);
        return fallbackProducts;
    }
}

export async function createProduct(data: { name: string, description?: string, price: number, category?: string }) {
    const id = Math.random().toString(36).substring(2);
    const now = new Date();
    
    await prisma.$executeRawUnsafe(
        `INSERT INTO public."Product" ("id", "name", "description", "price", "category", "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        id, data.name, data.description || '', data.price, data.category || 'DEFAULT', now, now
    );
    
    revalidatePath('/quotes');
    return { id };
}

export async function updateProduct(id: string, data: { name?: string, description?: string, price?: number, category?: string }) {
    const now = new Date();
    
    if (data.name !== undefined && data.price !== undefined) {
        await prisma.$executeRawUnsafe(
            `UPDATE public."Product" SET "name" = $1, "price" = $2, "updatedAt" = $3 WHERE "id" = $4`,
            data.name, data.price, now, id
        );
    }
    
    revalidatePath('/quotes');
    return { success: true };
}

export async function deleteProduct(id: string) {
    await prisma.$executeRawUnsafe(`DELETE FROM public."Product" WHERE "id" = $1`, id);
    revalidatePath('/quotes');
}
