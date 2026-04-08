import { describe, it, expect, vi, beforeEach } from 'vitest'
import { deleteAllLeads } from '../actions/lead-actions'
import prisma from '../lib/prisma'

// Mock prisma
vi.mock('../lib/prisma', () => ({
    default: {
        activity: { deleteMany: vi.fn() },
        quoteItem: { deleteMany: vi.fn() },
        quote: { deleteMany: vi.fn() },
        appointment: { deleteMany: vi.fn() },
        lead: { deleteMany: vi.fn() },
    },
}))

// Mock next/cache
vi.mock('next/cache', () => ({
    revalidatePath: vi.fn(),
}))

describe('deleteAllLeads Action', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should call deleteMany on all related models and then lead', async () => {
        const result = await deleteAllLeads();

        expect(prisma.activity.deleteMany).toHaveBeenCalled()
        expect(prisma.quoteItem.deleteMany).toHaveBeenCalled()
        expect(prisma.quote.deleteMany).toHaveBeenCalled()
        expect(prisma.appointment.deleteMany).toHaveBeenCalled()
        expect(prisma.lead.deleteMany).toHaveBeenCalled()

        expect(result.success).toBe(true)
    })

    it('should return success: false if a deletion fails', async () => {
        (prisma.lead.deleteMany as any).mockRejectedValueOnce(new Error('DB Error'))

        const result = await deleteAllLeads();

        expect(result.success).toBe(false)
    })
})
