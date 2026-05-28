'use server'

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { serializePrisma } from "@/lib/serialize";

// 1. Recupera la lista di tutti i membri del team
export async function getTeamMembers() {
  try {
    const members = await prisma.teamMember.findMany({
      include: {
        assignments: {
          include: {
            deal: {
              include: {
                lead: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    return serializePrisma(members);
  } catch (error: any) {
    console.error("Error fetching team members:", error);
    return [];
  }
}

// 2. Crea un nuovo membro del team
export async function createTeamMember(name: string) {
  try {
    if (!name || name.trim() === "") {
      throw new Error("Il nome è obbligatorio");
    }

    const member = await prisma.teamMember.create({
      data: { name: name.trim() }
    });

    revalidatePath('/team');
    return { success: true, member: serializePrisma(member) };
  } catch (error: any) {
    console.error("Error creating team member:", error);
    return { success: false, error: error.message };
  }
}

// 3. Elimina un membro del team
export async function deleteTeamMember(id: string) {
  try {
    await prisma.teamMember.delete({
      where: { id }
    });
    revalidatePath('/team');
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting team member:", error);
    return { success: false, error: error.message };
  }
}

// 4. Assegna membri a un Deal/Evento con un compenso
export async function assignTeamMember(dealId: string, teamMemberId: string, amount: number) {
  try {
    const assignment = await prisma.teamAssignment.upsert({
      where: {
        dealId_teamMemberId: {
          dealId,
          teamMemberId
        }
      },
      update: {
        amount: Number(amount)
      },
      create: {
        dealId,
        teamMemberId,
        amount: Number(amount),
        isPaid: false
      }
    });

    revalidatePath('/team');
    revalidatePath('/deals');
    return { success: true, assignment: serializePrisma(assignment) };
  } catch (error: any) {
    console.error("Error assigning team member:", error);
    return { success: false, error: error.message };
  }
}

// 5. Rimuove un membro dal team di un evento
export async function removeTeamAssignment(dealId: string, teamMemberId: string) {
  try {
    await prisma.teamAssignment.delete({
      where: {
        dealId_teamMemberId: {
          dealId,
          teamMemberId
        }
      }
    });
    revalidatePath('/team');
    revalidatePath('/deals');
    return { success: true };
  } catch (error: any) {
    console.error("Error removing team assignment:", error);
    return { success: false, error: error.message };
  }
}

// 6. Ottiene i membri del team assegnati a un deal
export async function getTeamAssignmentsByDeal(dealId: string) {
  try {
    const assignments = await prisma.teamAssignment.findMany({
      where: { dealId },
      include: {
        teamMember: true
      }
    });
    return serializePrisma(assignments);
  } catch (error: any) {
    console.error("Error fetching assignments by deal:", error);
    return [];
  }
}

// 7. Aggiorna lo stato di pagamento per una partecipazione
export async function updateTeamAssignmentPayment(
  assignmentId: string, 
  isPaid: boolean, 
  paymentMethod?: string, 
  paymentDate?: Date | string, 
  notes?: string
) {
  try {
    const dateToUse = paymentDate ? new Date(paymentDate) : (isPaid ? new Date() : null);
    
    const assignment = await prisma.teamAssignment.update({
      where: { id: assignmentId },
      data: {
        isPaid,
        paymentMethod: isPaid ? paymentMethod : null,
        paymentDate: dateToUse,
        notes: notes || null
      },
      include: {
        teamMember: true,
        deal: {
          include: {
            lead: true
          }
        }
      }
    });

    // Registra un'attività di sistema nel lead correlato all'evento per storicizzazione
    if (assignment.deal?.leadId) {
      const actNotes = isPaid 
        ? `💸 Compenso di €${Number(assignment.amount).toLocaleString('it-IT')} pagato a ${assignment.teamMember.name} tramite ${paymentMethod} in data ${dateToUse?.toLocaleDateString('it-IT')}.`
        : `⚠️ Annullato pagamento compenso di €${Number(assignment.amount).toLocaleString('it-IT')} a ${assignment.teamMember.name}.`;

      // Aggiungiamo un'attività
      await prisma.activity.create({
        data: {
          leadId: assignment.deal.leadId,
          type: 'SYSTEM',
          notes: actNotes
        }
      });
      revalidatePath(`/leads/${assignment.deal.leadId}`);
    }

    revalidatePath('/team');
    return { success: true, assignment: serializePrisma(assignment) };
  } catch (error: any) {
    console.error("Error updating team assignment payment:", error);
    return { success: false, error: error.message };
  }
}

// 8. Ottiene statistiche per la dashboard del team
export async function getTeamStats() {
  try {
    const assignments = await prisma.teamAssignment.findMany({
      include: {
        teamMember: true,
        deal: {
          include: {
            lead: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 1. Recuperiamo tutti i membri del team presenti nel DB
    const allMembers = await prisma.teamMember.findMany({
      orderBy: { name: 'asc' }
    });

    const totalEarned = assignments.reduce((acc, a) => acc + Number(a.amount), 0);
    const totalPaid = assignments.filter(a => a.isPaid).reduce((acc, a) => acc + Number(a.amount), 0);
    const totalPending = totalEarned - totalPaid;

    // Raggruppa per membro del team, inizializzando tutti i membri
    const membersDataMap = new Map();
    
    allMembers.forEach(m => {
      membersDataMap.set(m.id, {
        id: m.id,
        name: m.name,
        totalEarned: 0,
        totalPaid: 0,
        totalPending: 0,
        eventsCount: 0,
        events: []
      });
    });
    
    assignments.forEach(a => {
      if (!membersDataMap.has(a.teamMemberId)) {
        // Fallback per integrità se non presente
        membersDataMap.set(a.teamMemberId, {
          id: a.teamMemberId,
          name: a.teamMember.name,
          totalEarned: 0,
          totalPaid: 0,
          totalPending: 0,
          eventsCount: 0,
          events: []
        });
      }

      const mData = membersDataMap.get(a.teamMemberId);
      const amountVal = Number(a.amount);
      mData.totalEarned += amountVal;
      if (a.isPaid) {
        mData.totalPaid += amountVal;
      } else {
        mData.totalPending += amountVal;
      }
      mData.eventsCount += 1;
      mData.events.push({
        assignmentId: a.id,
        dealId: a.dealId,
        clientName: a.deal?.lead ? `${a.deal.lead.firstName || ''} ${a.deal.lead.lastName || ''}`.trim() : 'N/A',
        eventDate: a.deal?.lead?.eventDate || null,
        location: a.deal?.lead?.eventLocation || 'N/A',
        amount: amountVal,
        isPaid: a.isPaid,
        paymentMethod: a.paymentMethod,
        paymentDate: a.paymentDate,
        notes: a.notes
      });
    });

    const membersSummary = Array.from(membersDataMap.values()).sort((a, b) => b.totalEarned - a.totalEarned);

    // Cronologia di tutte le operazioni (pagamenti effettuati)
    const operationsLog = assignments
      .filter(a => a.isPaid)
      .map(a => ({
        id: a.id,
        teamMemberId: a.teamMemberId,
        teamMemberName: a.teamMember.name,
        dealId: a.dealId,
        clientName: a.deal?.lead ? `${a.deal.lead.firstName || ''} ${a.deal.lead.lastName || ''}`.trim() : 'N/A',
        amount: Number(a.amount),
        paymentMethod: a.paymentMethod,
        paymentDate: a.paymentDate,
        notes: a.notes
      }))
      .sort((a, b) => {
        const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
        const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
        return dateB - dateA;
      });

    return serializePrisma({
      totalEarned,
      totalPaid,
      totalPending,
      membersSummary,
      operationsLog
    });
  } catch (error: any) {
    console.error("Error fetching team stats:", error);
    return {
      totalEarned: 0,
      totalPaid: 0,
      totalPending: 0,
      membersSummary: [],
      operationsLog: []
    };
  }
}
