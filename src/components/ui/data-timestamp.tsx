import * as React from "react"
import { Clock, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./button"

export interface DataTimestampProps {
  timestamp?: Date | string
  label?: string
  showRefresh?: boolean
  onRefresh?: () => void
  className?: string
}

// Helper function to parse timestamps in "YYYY-MM-DD HH:mm:ss" format
const parseTimestamp = (ts: Date | string): Date => {
  if (ts instanceof Date) return ts
  // Convert "2025-12-19 20:59:59" to "2025-12-19T20:59:59" for proper parsing
  const isoFormat = typeof ts === 'string' ? ts.replace(' ', 'T') : ts
  return new Date(isoFormat)
}

export function DataTimestamp({
  timestamp,
  label = "Last updated",
  showRefresh = false,
  onRefresh,
  className,
}: DataTimestampProps) {
  const [timeAgo, setTimeAgo] = React.useState<string>("")

  React.useEffect(() => {
    if (!timestamp) return

    const date = parseTimestamp(timestamp)

    // Validate the date was parsed correctly
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp format:', timestamp)
      return
    }

    const updateTimeAgo = () => {
      const now = new Date()
      const diff = now.getTime() - date.getTime()
      const minutes = Math.floor(diff / 60000)
      const hours = Math.floor(diff / 3600000)
      const days = Math.floor(diff / 86400000)

      if (days > 0) {
        setTimeAgo(`${days}d ago`)
      } else if (hours > 0) {
        setTimeAgo(`${hours}h ago`)
      } else if (minutes > 0) {
        setTimeAgo(`${minutes}m ago`)
      } else {
        setTimeAgo("Just now")
      }
    }

    updateTimeAgo()
    const interval = setInterval(updateTimeAgo, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [timestamp])

  if (!timestamp) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Clock className="h-4 w-4" />
        <span>{label}: <span className="font-medium">Loading...</span></span>
      </div>
    )
  }

  const date = parseTimestamp(timestamp)
  const formattedDate = isNaN(date.getTime()) ? "Invalid date" : date.toLocaleString()

  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Clock className="h-4 w-4" />
      <span title={formattedDate}>
        {label}: <span className="font-medium">{timeAgo}</span>
      </span>
      {showRefresh && onRefresh && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onRefresh}
          title="Refresh data"
        >
          <RefreshCw className="h-3 w-3" />
          <span className="sr-only">Refresh data</span>
        </Button>
      )}
    </div>
  )
}
