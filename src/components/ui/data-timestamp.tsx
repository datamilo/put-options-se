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
  if (!timestamp) {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Clock className="h-4 w-4" />
        <span>{label}: <span className="font-medium">Loading...</span></span>
      </div>
    )
  }

  const date = parseTimestamp(timestamp)

  if (isNaN(date.getTime())) {
    console.warn('Invalid timestamp format:', timestamp)
    return (
      <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
        <Clock className="h-4 w-4" />
        <span>{label}: <span className="font-medium">Invalid date</span></span>
      </div>
    )
  }

  // Format as YYYY-MM-DD HH:MM
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const formattedTimestamp = `${year}-${month}-${day} ${hours}:${minutes}`

  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Clock className="h-4 w-4" />
      <span>
        {label}: <span className="font-medium">{formattedTimestamp}</span>
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
