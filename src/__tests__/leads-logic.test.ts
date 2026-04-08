import { describe, it, expect } from 'vitest'

// Mock lead data
const mockLeads = [
    { id: '1', leadCreatedAt: new Date('2023-01-01'), eventDate: new Date('2023-06-01'), firstName: 'A' },
    { id: '2', leadCreatedAt: new Date('2023-02-01'), eventDate: new Date('2023-05-01'), firstName: 'B' },
    { id: '3', leadCreatedAt: null, eventDate: null, firstName: 'C' },
    { id: '4', leadCreatedAt: new Date('2023-03-01'), eventDate: new Date('2023-04-01'), firstName: 'D' },
];

describe('Leads Sorting Logic', () => {
    it('should sort by leadCreatedAt descending (default)', () => {
        const sorted = [...mockLeads].sort((a, b) => {
            const valA = a.leadCreatedAt ? new Date(a.leadCreatedAt).getTime() : 0;
            const valB = b.leadCreatedAt ? new Date(b.leadCreatedAt).getTime() : 0;
            return valB - valA;
        });

        expect(sorted[0].id).toBe('4'); // 2023-03-01
        expect(sorted[1].id).toBe('2'); // 2023-02-01
        expect(sorted[2].id).toBe('1'); // 2023-01-01
        expect(sorted[3].id).toBe('3'); // null
    });

    it('should sort by eventDate ascending', () => {
        const sorted = [...mockLeads].sort((a, b) => {
            const valA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
            const valB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
            return valA - valB;
        });

        // Current implementation gives nulls as 0, so they come first in ASC
        expect(sorted[0].id).toBe('3'); // null -> 0
        expect(sorted[1].id).toBe('4'); // 2023-04-01
        expect(sorted[2].id).toBe('2'); // 2023-05-01
        expect(sorted[3].id).toBe('1'); // 2023-06-01
    });
});
