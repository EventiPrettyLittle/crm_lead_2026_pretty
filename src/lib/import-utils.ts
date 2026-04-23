import { read, utils } from 'xlsx';
import Papa from 'papaparse';
import { parse, isValid } from 'date-fns';

export const COLUMN_MAPPING = {
    externalId: 'Email', // Using Email as unique ID 
    leadCreatedAt: 'Data e Ora di Creazione', // Generic, we'll see row 1
    countryCode: 'Codice Paese',
    eventType: 'Tipologia Evento',
    guestsCount: 'Numero invitati',
    productInterest: 'Prodotto',
    eventDate: 'Data Evento',
    eventLocation: 'Luogo Evento',
    firstName: 'Nome',
    lastName: 'Cognome',
    phoneRaw: 'Telefono',
    email: 'Email',
    preferredContactTime: 'Quando preferisci essere contattato'
} as const;

export type LeadImportRow = Record<string, any>;

export type ParsedLead = {
    externalId: string;
    leadCreatedAt?: Date;
    countryCode?: string;
    eventType?: string;
    guestsCount?: string;
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
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const targetNorm = normalize(target);
    
    // Exact match first
    const key = Object.keys(row).find(k => normalize(k) === targetNorm);
    if (key) return row[key];

    // Keyword match second (more aggressive)
    const keywords: Record<string, string[]> = {
        'invitati': ['invitati', 'guests', 'numero'],
        'contattato': ['contattato', 'preferisci', 'orario', 'quando'],
        'email': ['email', 'posta'],
        'telefono': ['telefono', 'cell', 'phone'],
        'location': ['location', 'luogo', 'villa', 'ristorante'],
        'data': ['data', 'event', 'date'],
    };

    // Find if the target has a keyword we recognize
    const targetKeywords = Object.keys(keywords).find(k => targetNorm.includes(k));
    if (targetKeywords) {
        const matchingKey = Object.keys(row).find(k => {
            const kn = normalize(k);
            return keywords[targetKeywords].some(kw => kn.includes(kw));
        });
        if (matchingKey) return row[matchingKey];
    }

    return undefined;
};

export const mapRowToLead = (row: LeadImportRow): ParsedLead => {
    const getVal = (target: string) => getRowValue(row, target);
    
    // Mapping intelligenti con fallbacks
    const guests = getVal('Numero invitati') || getVal('invitati') || getVal('guests') || getVal('quantità');
    const contact = getVal('Quando preferisci essere contattato') || getVal('preferisci') || getVal('contatto') || getVal('orario');
    const fName = getVal(COLUMN_MAPPING.firstName) || getVal('nome') || getVal('first name') || '';
    const lName = getVal(COLUMN_MAPPING.lastName) || getVal('cognome') || getVal('last name') || '';
    const email = getVal(COLUMN_MAPPING.email) || getVal('email') || getVal('mail') || '';
    const phone = getVal(COLUMN_MAPPING.phoneRaw) || getVal('telefono') || getVal('cell') || getVal('phone') || '';
    
    // Generazione ID univoco robusto
    // Se non c'è email, usiamo una combinazione di nome-cognome-telefono o un timestamp
    let externalId = String(email || '').trim();
    if (!externalId) {
        externalId = `import-${String(fName).toLowerCase()}-${String(lName).toLowerCase()}-${String(phone).replace(/\s/g, '')}`;
        // Fallback estremo se tutto è vuoto
        if (externalId === 'import---') {
            externalId = `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        }
    }
    
    return {
        externalId,
        leadCreatedAt: parseDate(getVal(COLUMN_MAPPING.leadCreatedAt) || getVal('data creazione') || getVal('created at')),
        countryCode: String(getVal(COLUMN_MAPPING.countryCode) || getVal('paese') || ''),
        eventType: String(getVal(COLUMN_MAPPING.eventType) || getVal('evento') || ''),
        guestsCount: String(guests || ''),
        productInterest: String(getVal(COLUMN_MAPPING.productInterest) || getVal('prodotto') || ''),
        eventDate: parseDate(getVal(COLUMN_MAPPING.eventDate) || getVal('data evento')),
        eventLocation: String(getVal(COLUMN_MAPPING.eventLocation) || getVal('location') || ''),
        firstName: String(fName).trim(),
        lastName: String(lName).trim(),
        phoneRaw: String(phone).trim(),
        email: String(email).trim(),
        preferredContactTime: String(contact || '').trim(),
    };
};

export const parseLeadsFile = async (file: File): Promise<ParsedLead[]> => {
    const buffer = await file.arrayBuffer();
    let rows: LeadImportRow[] = [];

    try {
        if (file.name.endsWith('.csv')) {
            const text = new TextDecoder().decode(buffer);
            const result = Papa.parse<LeadImportRow>(text, { 
                header: true, 
                skipEmptyLines: true,
                transformHeader: (header) => header.trim() 
            });
            rows = result.data;
        } else {
            // Excel
            const wb = read(buffer);
            const sheetName = wb.SheetNames[0];
            const sheet = wb.Sheets[sheetName];
            rows = utils.sheet_to_json(sheet);
        }

        return rows
            .map(mapRowToLead)
            .filter(l => l.firstName || l.email || l.phoneRaw); // Filtriamo solo righe totalmente vuote
    } catch (err) {
        console.error("Error parsing file:", err);
        throw new Error("Formato file non valido o danneggiato.");
    }
};
