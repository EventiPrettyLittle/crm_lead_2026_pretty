'use server'

import { getTeamStats, createTeamMember, deleteTeamMember, updateTeamAssignmentPayment, updateTeamMemberPhone } from "@/actions/team";
import TeamClientComponent from "./team-client";
import { getCurrentUser } from "@/actions/auth";

export default async function TeamPage() {
  const stats = await getTeamStats();
  const user = await getCurrentUser();

  // Azioni server-side passate al client per facilità d'uso
  const handleAddMember = async (formData: FormData) => {
    'use server'
    const name = formData.get("name") as string;
    const phone = formData.get("phone") as string;
    if (name) {
      await createTeamMember(name, phone);
    }
  };

  const handleDeleteMember = async (id: string) => {
    'use server'
    await deleteTeamMember(id);
  };

  const handleUpdatePayment = async (
    assignmentId: string,
    isPaid: boolean,
    method?: string,
    date?: string,
    notes?: string
  ) => {
    'use server'
    await updateTeamAssignmentPayment(assignmentId, isPaid, method, date ? new Date(date) : undefined, notes);
  };

  const handleUpdatePhone = async (id: string, phone: string) => {
    'use server'
    await updateTeamMemberPhone(id, phone);
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50/50 min-h-screen space-y-8">
      <TeamClientComponent 
        initialStats={stats}
        currentUser={user}
        handleAddMember={handleAddMember}
        handleDeleteMember={handleDeleteMember}
        handleUpdatePayment={handleUpdatePayment}
        handleUpdatePhone={handleUpdatePhone}
      />
    </div>
  );
}
