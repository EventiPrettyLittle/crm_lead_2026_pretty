'use client'

import { useState, useCallback } from "react";
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    defaultDropAnimationSideEffects,
    DropAnimation
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { Lead } from "@prisma/client";
import { KanbanColumn } from "./kanban-column";
import { updateLeadStage } from "@/actions/leads";
import { LeadCard } from "./lead-card";

// Define stages based on user request
const STAGES = [
    "NUOVO",
    "NON_RISPONDE",
    "CONTATTATO",
    "FOLLOWUP"
];

interface KanbanBoardProps {
    initialLeads: Lead[];
}

export function KanbanBoard({ initialLeads }: KanbanBoardProps) {
    const [leads, setLeads] = useState<Lead[]>(initialLeads);
    const [activeLead, setActiveLead] = useState<Lead | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: any) => {
        const { active } = event;
        const lead = leads.find((l) => l.id === active.id);
        if (lead) setActiveLead(lead);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveLead(null);

        if (!over) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        // Find the lead
        const lead = leads.find((l) => l.id === activeId);
        if (!lead) return;

        // Determine target stage
        // If over a container (stage), stage is overId
        // If over another card, we need to find that card's stage
        let newStage = overId;

        if (!STAGES.includes(overId)) {
            const overLead = leads.find(l => l.id === overId);
            if (overLead) {
                newStage = overLead.stage;
            } else {
                return; // Should not happen
            }
        }

        if (lead.stage !== newStage) {
            // Optimistic update
            setLeads((prev) =>
                prev.map((l) => l.id === activeId ? { ...l, stage: newStage } : l)
            );

            // Server action
            await updateLeadStage(activeId, newStage);
        }
    };

    const dropAnimation: DropAnimation = {
        sideEffects: defaultDropAnimationSideEffects({
            styles: {
                active: {
                    opacity: '0.5',
                },
            },
        }),
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-[calc(100vh-200px)] overflow-x-auto pb-4">
                {STAGES.map((stage) => (
                    <KanbanColumn
                        key={stage}
                        id={stage}
                        title={stage}
                        leads={leads.filter((l) => l.stage === stage)}
                    />
                ))}
            </div>
            <DragOverlay dropAnimation={dropAnimation}>
                {activeLead ? <LeadCard lead={activeLead} /> : null}
            </DragOverlay>
        </DndContext>
    );
}
