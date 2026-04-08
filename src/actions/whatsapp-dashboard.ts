'use server'

import prisma from "@/lib/prisma"
import { serializePrisma } from "@/lib/serialize"

export async function getRecentWhatsAppActivities() {
    try {
        const activities = await prisma.activity.findMany({
            where: {
                type: "WHATSAPP"
            },
            include: {
                lead: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });

        return { success: true, activities: serializePrisma(activities) };
    } catch (error) {
        console.error("Error fetching WhatsApp activities:", error);
        return { success: false, error: "Impossibile recuperare le attività" };
    }
}
