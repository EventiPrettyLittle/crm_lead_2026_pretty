import { Decimal } from "@prisma/client/runtime/library";

export function serializePrisma<T>(data: T): T {
    return JSON.parse(
        JSON.stringify(data, (key, value) => {
            // Handle Decimal objects from Prisma specifically
            if (value && typeof value === 'object' && value.constructor && value.constructor.name === 'Decimal') {
                return Number(value);
            }
            // Also handle Decimal if it's already been stringified/parsed but still has the structure
            if (value && typeof value === 'object' && 'd' in value && 'e' in value && 's' in value) {
                return Number(value);
            }
            return value;
        })
    );
}
