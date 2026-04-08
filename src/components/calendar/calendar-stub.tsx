export default function CalendarStub() {
    return (
        <div className="flex items-center justify-center h-full p-8 border border-dashed rounded-lg bg-muted/50">
            <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold">Google Calendar Integration</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Calendar sync requires OAuth Client ID and Secret from Google Cloud Console.
                    This feature is currently stubbed.
                </p>
                {/* 
                    Implementation steps for real integration:
                    1. Create Google Cloud Project & enable Calendar API
                    2. Configure OAuth consent screen
                    3. Get Client ID/Secret -> add to .env
                    4. Use 'googleapis' npm package to auth and sync events
                */}
            </div>
        </div>
    )
}
