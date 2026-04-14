import { read, utils } from 'xlsx';
import Papa from 'papaparse';
import { parse, isValid } from 'date-fns';

export const COLUMN_MAPPING = {
    externalId: 'Email', // Using Email as unique ID since not provided in list
    leadCreatedAt: 'Colonna 1',
    countryCode: 'Codice Paese',
    eventType: 'Tipologia Evento',
    guestsCount: 'Invitati',
    productInterest: 'Prodotto',
    eventDate: 'Data Evento',
    eventLocation: 'Luogo Evento',
    firstName: 'Nome',
    lastName: 'Cognome',
    phoneRaw: 'Telefono',
    email: 'Email',
    preferredContactTime: 'Quando Vorresti Essere Contattato'
} as const;

export type LeadImportRow = Record<string, any>;

export type ParsedLead = {
    externalId: string;
    leadCreatedAt?: Date;
    countryCode?: string;
    eventType?: string;
    guestsCount?: number;
    productInterest?: string;
    eventDate?: Date;
    eventLocation?: string;
    firstName?: string;
    lastName?: string;
    phoneRaw?: string;
    email?: string;
    preferredContactTime?: string;
};

// Helper to parse diverse date formats
const parseDate = (value: string | number | Date | undefined): Date | undefined => {
    if (!value) return undefined;
    if (value instanceof Date) return value;
    if (typeof value === 'number') {
        // Excel serial date (approximate)
        return new Date(Math.round((value - 25569) * 864e5));
    }

    // Try common formats
    const formats = [
        'dd/MM/yyyy', 'yyyy-MM-dd', 'MM/dd/yyyy', 'dd-MM-yyyy', 'yyyy/MM/dd'
    ];

    for (const fmt of formats) {
        const d = parse(String(value), fmt, new Date());
        if (isValid(d)) return d;
    }

    // Fallback to JS date parse
    const d = new Date(value);
    return isValid(d) ? d : undefined;
};
const getRowValue = (row: LeadImportRow, target: string) => {
    const key = Object.keys(row).find(k => k.toLowerCase() === target.toLowerCase());
    return key ? row[key] : undefined;
};

export const mapRowToLead = (row: LeadImportRow): ParsedLead => ({
    externalId: String(getRowValue(row, COLUMN_MAPPING.externalId) || ''),
    leadCreatedAt: parseDate(getRowValue(row, COLUMN_MAPPING.leadCreatedAt)),
    countryCode: String(getRowValue(row, COLUMN_MAPPING.countryCode) || ''),
    eventType: String(getRowValue(row, COLUMN_MAPPING.eventType) || ''),
    guestsCount: Number(getRowValue(row, COLUMN_MAPPING.guestsCount)) || 0,
    productInterest: String(getRowValue(row, COLUMN_MAPPING.productInterest) || ''),
    eventDate: parseDate(getRowValue(row, COLUMN_MAPPING.eventDate)),
    eventLocation: String(getRowValue(row, COLUMN_MAPPING.eventLocation) || ''),
    firstName: String(getRowValue(row, COLUMN_MAPPING.firstName) || ''),
    lastName: String(getRowValue(row, COLUMN_MAPPING.lastName) || ''),
    phoneRaw: String(getRowValue(row, COLUMN_MAPPING.phoneRaw) || ''),
    email: String(getRowValue(row, COLUMN_MAPPING.email) || ''),
    preferredContactTime: String(getRowValue(row, COLUMN_MAPPING.preferredContactTime) || ''),
});

export const parseLeadsFile = async (file: File): Promise<ParsedLead[]> => {
    const buffer = await file.arrayBuffer();
    let rows: LeadImportRow[] = [];

    if (file.name.endsWith('.csv')) {
        const text = new TextDecoder().decode(buffer);
        const result = Papa.parse<LeadImportRow>(text, { header: true, skipEmptyLines: true });
        rows = result.data;
    } else {
        // Excel
        const wb = read(buffer);
        const sheetName = wb.SheetNames[0];
        const sheet = wb.Sheets[sheetName];
        rows = utils.sheet_to_json(sheet);
    }

    return rows.map(mapRowToLead).filter(l => l.externalId);
};
