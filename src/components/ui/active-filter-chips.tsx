import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "./badge"
import { Button } from "./button"
import { cn } from "@/lib/utils"

export interface ActiveFilter {
  id: string
  label: string
  value: string
}

export interface ActiveFilterChipsProps {
  filters: ActiveFilter[]
  onRemove: (id: string) => void
  onClearAll?: () => void
  resultCount?: number
  totalCount?: number
  className?: string
}

export function ActiveFilterChips({
  filters,
  onRemove,
  onClearAll,
  resultCount,
  totalCount,
  className,
}: ActiveFilterChipsProps) {
  if (filters.length === 0) return null

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant="secondary"
          className="gap-1 pl-2 pr-1 py-1 hover:bg-secondary/80"
        >
          <span className="text-xs">
            {filter.label}: <span className="font-semibold">{filter.value}</span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4 p-0 hover:bg-transparent"
            onClick={() => onRemove(filter.id)}
          >
            <X className="h-3 w-3" />
            <span className="sr-only">Remove {filter.label} filter</span>
          </Button>
        </Badge>
      ))}
      {filters.length > 1 && onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs"
          onClick={onClearAll}
        >
          Clear all
        </Button>
      )}
      {resultCount !== undefined && totalCount !== undefined && (
        <span className="text-sm text-muted-foreground ml-2">
          Showing <span className="font-semibold font-mono">{resultCount}</span> of{" "}
          <span className="font-semibold font-mono">{totalCount}</span> (
          {((resultCount / totalCount) * 100).toFixed(1)}%)
        </span>
      )}
    </div>
  )
}
