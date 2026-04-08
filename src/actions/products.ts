'use server'

import prisma from "@/lib/prisma"
import { revalidatePath } from 'next/cache'
import { serializePrisma } from "@/lib/serialize"

export async function getProducts() {
    try {
        const products = await prisma.$queryRawUnsafe(`SELECT * FROM public."Product" ORDER BY "name" ASC`);
        return serializePrisma(products);
    } catch (error) {
        console.error("error fetching products:", error);
        return [];
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
