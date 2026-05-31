import { useNavigate, useParams } from "react-router"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { AnalyticsDashboard } from "@/widgets/analytics-dashboard"
import { Button } from "@/shared/ui/button"

export function RoomAnalyticsPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    if (!id) return null

    return (
        <div className="flex h-dvh flex-col overflow-hidden">
            <header className="bg-background sticky top-0 z-10 flex items-center gap-2 border-b px-2 py-2 shrink-0">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    aria-label="Back"
                >
                    <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
                </Button>
                <h1 className="text-base font-semibold">Analytics</h1>
            </header>
            <div className="flex-1 overflow-hidden">
                <AnalyticsDashboard roomId={id} />
            </div>
        </div>
    )
}
