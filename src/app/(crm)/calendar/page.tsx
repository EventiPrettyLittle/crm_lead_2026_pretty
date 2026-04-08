import GoogleCalendar from "@/components/calendar/google-calendar";

export default function CalendarPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Appointments & Calendar</h1>
            <GoogleCalendar />
        </div>
    )
}
