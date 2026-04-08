# Implementation Plan - CRM Leads Enhancements & Demo

## Objective
The objective is to verify and demonstrate the newly implemented features for lead management:
1.  **Mass Delete**: Ability to clear all leads, activities, and quotes.
2.  **Sorting**: Sort leads by "Data Lead" and "Data Evento".
3.  **Visibility**: Added "Data Evento" column to the leads table.

## Status
- **Delete All Leads Server Action**: Done (`src/actions/lead-actions.ts`).
- **Delete Button Component**: Done (`src/components/leads/delete-all-leads-button.tsx`).
- **Leads Table Updates**: Done (`src/components/leads/leads-table.tsx`).
- **Page Integration**: Done (`src/app/leads/page.tsx`).

## Verification Steps
1.  **Code Review**: Verify that `deleteAllLeads` handles relations correctly (Prisma cascade).
2.  **UI Check**: Confirm "Elimina tutto" button is visible and triggers a confirmation.
3.  **Sorting Logic**: Verify `handleSort` correctly toggles between `asc` and `desc`.

## Demo Task
- Use the browser subagent to record a video demonstrating:
    - The new layout with "Data Evento".
    - Clicking headers to sort.
    - Opening the delete confirmation (without confirming, to preserve data for now).

## Troubleshooting
- If the browser subagent fails to connect to `localhost:3000`, I will provide a detailed textual walkthrough and screenshots of the code logic to reassure the user of its functionality.
