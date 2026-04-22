import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';

// Define styles
// Version: 1.0.1 - Black Theme - Force Deploy 22/04/2026 16:38
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderBottomWidth: 2,
        borderBottomColor: '#000000',
        paddingBottom: 20,
        marginBottom: 30,
    },
    logoSection: {
        flexDirection: 'column',
    },
    logoText: {
        fontSize: 22,
        color: '#000000',
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    companyTagline: {
        fontSize: 9,
        color: '#666',
        marginTop: 2,
    },
    quoteInfo: {
        textAlign: 'right',
    },
    quoteTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    quoteNumber: {
        fontSize: 14,
        color: '#000000',
        marginTop: 5,
    },
    detailsSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    infoBlock: {
        width: '45%',
    },
    label: {
        fontSize: 9,
        textTransform: 'uppercase',
        color: '#999',
        marginBottom: 5,
        fontWeight: 'bold',
    },
    infoValue: {
        fontSize: 11,
        color: '#333',
        marginBottom: 3,
    },
    table: {
        width: '100%',
        marginBottom: 30,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#F8F9FA',
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
        paddingVertical: 8,
        paddingHorizontal: 5,
    },
    headerCell: {
        fontSize: 9,
        fontWeight: 'bold',
        color: '#495057',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#E9ECEF',
        paddingVertical: 10,
        paddingHorizontal: 5,
        alignItems: 'center',
    },
    cell: {
        fontSize: 9,
        color: '#333',
    },
    
    // Column Widths
    descCell: { width: '30%' },
    qtyCell: { width: '8%', textAlign: 'center' },
    origPriceCell: { width: '15%', textAlign: 'right' },
    discCell: { width: '12%', textAlign: 'center' },
    unitPriceCell: { width: '16%', textAlign: 'right' },
    totalCell: { width: '19%', textAlign: 'right' },
 
    summarySection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    summaryBlock: {
        width: '40%',
        borderTopWidth: 1,
        borderTopColor: '#333',
        paddingTop: 10,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    summaryLabel: {
        fontSize: 10,
        color: '#666',
    },
    summaryValue: {
        fontSize: 11,
        color: '#333',
    },
    grandTotalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    grandTotalLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000000',
    },
    grandTotalValue: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#000000',
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 10,
        textAlign: 'center',
    },
    footerText: {
        fontSize: 8,
        color: '#999',
    },
    paymentInfo: {
        width: '55%',
        marginTop: 20,
        padding: 10,
        backgroundColor: '#F8F9FA',
        borderRadius: 4,
    },
    signatureBlock: {
        marginTop: 40,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    signatureText: {
        fontSize: 9,
        color: '#666',
        textAlign: 'right',
        fontStyle: 'italic',
    }
});

interface QuoteDocumentProps {
    quote: any 
}

export const QuoteDocument = ({ quote }: QuoteDocumentProps) => {
    if (!quote) return null;
    
    const itemsTotal = (quote.items || []).reduce((acc: number, item: any) => acc + Number(item.totalPrice || 0), 0);
    const discount = Number(quote.discountTotal || 0);
    const lead = quote.lead || {};
    const settings = quote.companySettings || {
        companyName: "PRETTYLITTLE.IT srls",
        address: "Corso Umberto 220, 80023 Caivano (NA)",
        vatNumber: "10477641210",
        phone: "+39",
        email: "eventi@prettylittle.it",
        referente: "Luca Vitale"
    };

    // Override fallbacks per sicurezza estrema
    const companyName = settings.companyName || "PRETTYLITTLE.IT srls";
    const address = settings.address || "Corso Umberto 220, 80023 Caivano (NA)";
    const vatNumber = settings.vatNumber || "10477641210";
    const phone = settings.phone || "+39";
    const email = settings.email || "eventi@prettylittle.it";
    const referente = quote.createdBy || settings.referente || "Luca Vitale";

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.logoSection}>
                        {(quote.systemSettings?.logoUrl || true) ? (
                            <Image 
                                src={quote.systemSettings?.logoUrl || "/logo.png"} 
                                style={{ width: quote.systemSettings?.logoWidth || 160, maxHeight: 60, objectFit: 'contain' }} 
                            />
                        ) : (
                            <>
                                <Text style={styles.logoText}>{companyName}</Text>
                                <Text style={styles.companyTagline}>EVENTI & BRAND EXPERIENCE</Text>
                            </>
                        )}
                    </View>
                    <View style={styles.quoteInfo}>
                        <Text style={styles.quoteTitle}>PREVENTIVO</Text>
                        <Text style={styles.quoteNumber}>#{quote.number || 'BOZZA'}</Text>
                        <Text style={[styles.infoValue, { marginTop: 5 }]}>Data: {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('it-IT') : new Date().toLocaleDateString('it-IT')}</Text>
                    </View>
                </View>
 
                <View style={styles.detailsSection}>
                    <View style={styles.infoBlock}>
                        <Text style={styles.label}>EMESSO DA</Text>
                        <Text style={[styles.infoValue, { fontWeight: 'bold' }]}>{companyName}</Text>
                        <Text style={styles.infoValue}>{address}</Text>
                        <Text style={styles.infoValue}>P.IVA: {vatNumber}</Text>
                        <Text style={styles.infoValue}>Email: {email}</Text>
                    </View>
                    <View style={styles.infoBlock}>
                        <Text style={styles.label}>DESTINATARIO</Text>
                        <Text style={[styles.infoValue, { fontWeight: 'bold' }]}>
                            {lead.firstName || 'Cliente'} {lead.lastName || ''}
                        </Text>
                        {lead.email && <Text style={styles.infoValue}>{lead.email}</Text>}
                        {lead.phoneRaw && <Text style={styles.infoValue}>{lead.phoneRaw}</Text>}
                    </View>
                </View>

                {/* Event Details Section */}
                {(lead.eventDate || lead.locationName || lead.eventLocation) && (
                    <View style={{ backgroundColor: '#F8F9FA', padding: 15, borderRadius: 12, marginBottom: 30, borderLeftWidth: 3, borderLeftColor: '#000000' }}>
                        <Text style={[styles.label, { color: '#000000', marginBottom: 10 }]}>Dettagli Logistici Evento</Text>
                        <View style={{ flexDirection: 'row', gap: 40 }}>
                            {lead.eventDate && !isNaN(new Date(lead.eventDate).getTime()) && (
                                <View>
                                    <Text style={[styles.label, { fontSize: 7, marginBottom: 2 }]}>Data Evento</Text>
                                    <Text style={[styles.infoValue, { fontWeight: 'bold' }]}>{new Date(lead.eventDate).toLocaleDateString('it-IT')}</Text>
                                </View>
                            )}
                            {(lead.locationName || lead.eventLocation) && (
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { fontSize: 7, marginBottom: 2 }]}>Luogo / Location</Text>
                                    <Text style={[styles.infoValue, { fontWeight: 'bold' }]}>
                                        {lead.locationName ? `${lead.locationName} - ` : ''}
                                        {lead.eventLocation || '-'}
                                    </Text>
                                </View>
                            )}
                            {lead.guestsCount && (
                                <View>
                                    <Text style={[styles.label, { fontSize: 7, marginBottom: 2 }]}>Invitati</Text>
                                    <Text style={[styles.infoValue, { fontWeight: 'bold' }]}>{lead.guestsCount}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                )}

                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.headerCell, styles.descCell]}>Descrizione Servizio</Text>
                        <Text style={[styles.headerCell, styles.qtyCell]}>Qtà</Text>
                        <Text style={[styles.headerCell, styles.origPriceCell]}>Prezzo Listino</Text>
                        <Text style={[styles.headerCell, styles.discCell]}>Sconto</Text>
                        <Text style={[styles.headerCell, styles.unitPriceCell]}>P. Scontato</Text>
                        <Text style={[styles.headerCell, styles.totalCell]}>Totale</Text>
                    </View>

                    {(quote.items || []).map((item: any) => {
                        const originalPrice = Number(item.originalPrice || item.unitPrice || 0);
                        const unitPrice = Number(item.unitPrice || 0);
                        const hasDiscount = originalPrice > unitPrice;
                        const discPerc = hasDiscount && originalPrice > 0
                            ? Math.round(((originalPrice - unitPrice) / originalPrice) * 100)
                            : 0;

                        return (
                            <View style={styles.tableRow} key={item.id || Math.random()}>
                                <Text style={[styles.cell, styles.descCell]}>{item.description || '-'}</Text>
                                <Text style={[styles.cell, styles.qtyCell]}>{item.quantity || 1}</Text>
                                <Text style={[styles.cell, styles.origPriceCell]}>
                                    €{originalPrice.toFixed(2)}
                                </Text>
                                <Text style={[styles.cell, styles.discCell, { color: discPerc > 0 ? '#D32F2F' : '#333' }]}>
                                    {discPerc > 0 ? `-${discPerc}%` : '-'}
                                </Text>
                                <Text style={[styles.cell, styles.unitPriceCell, { fontWeight: 'bold' }]}>
                                    €{unitPrice.toFixed(2)}
                                </Text>
                                <Text style={[styles.cell, styles.totalCell, { fontWeight: 'bold' }]}>
                                    €{Number(item.totalPrice || 0).toFixed(2)}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                <View style={styles.summarySection}>
                    <View style={styles.paymentInfo}>
                        <Text style={styles.label}>MODALITÀ DI PAGAMENTO</Text>
                        <Text style={styles.infoValue}>{quote.paymentMethod || 'Da concordare'}</Text>
                        {settings.iban && (
                            <Text style={[styles.infoValue, { fontSize: 9, marginTop: 4 }]}>IBAN: {settings.iban}</Text>
                        )}
                        {quote.notes && (
                            <View style={{ marginTop: 10 }}>
                                <Text style={styles.label}>NOTE AGGIUNTIVE</Text>
                                <Text style={[styles.infoValue, { fontSize: 9, lineHeight: 1.4 }]}>{quote.notes}</Text>
                            </View>
                        )}
                    </View>
                    
                    <View style={styles.summaryBlock}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Totale parziale</Text>
                            <Text style={styles.summaryValue}>€{itemsTotal.toFixed(2)}</Text>
                        </View>
                        {discount > 0 && (
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Sconto Extra</Text>
                                <Text style={[styles.summaryValue, { color: '#D32F2F' }]}>- €{discount.toFixed(2)}</Text>
                            </View>
                        )}
                        <View style={styles.grandTotalRow}>
                            <Text style={styles.grandTotalLabel}>Totale Netto</Text>
                            <Text style={styles.grandTotalValue}>€{Number(quote.totalAmount).toFixed(2)}</Text>
                        </View>
                        
                        <View style={styles.signatureBlock}>
                            <View>
                                <Text style={styles.signatureText}>Firmato da:</Text>
                                <Text style={[styles.infoValue, { textAlign: 'right', fontWeight: 'bold', marginTop: 5, fontSize: 13, color: '#000000' }]}>
                                    {referente}
                                </Text>
                                {quote.creatorPhone && (
                                    <Text style={[styles.signatureText, { marginTop: 2 }]}>{quote.creatorPhone}</Text>
                                )}
                                <Text style={[styles.signatureText, { marginTop: 2 }]}>Referente Platform</Text>
                            </View>
                        </View>
                    </View>
                </View>
 
                <View style={styles.footer}>
                    <Text style={styles.footerText}>Documento generato da {companyName} per {lead.firstName} {lead.lastName}.</Text>
                    <Text style={styles.footerText}>Si prega di conservare una copia del presente documento.</Text>
                </View>

            </Page>
        </Document>
    );
};
