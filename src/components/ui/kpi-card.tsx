import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "./card"

export interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: {
    value: string
    direction: "up" | "down" | "neutral"
  }
  icon?: LucideIcon
  variant?: "default" | "success" | "warning" | "danger" | "info"
  className?: string
}

const variantStyles = {
  default: "border-border bg-card",
  success: "border-success/30 bg-success/5",
  warning: "border-warning/30 bg-warning/5",
  danger: "border-destructive/30 bg-destructive/5",
  info: "border-info/30 bg-info/5",
}

const trendStyles = {
  up: "text-success",
  down: "text-destructive",
  neutral: "text-muted-foreground",
}

export function KPICard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  variant = "default",
  className,
}: KPICardProps) {
  return (
    <Card className={cn("border-2", variantStyles[variant], className)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold font-mono tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p className={cn("text-xs font-medium flex items-center gap-1", trendStyles[trend.direction])}>
                {trend.direction === "up" && "↑"}
                {trend.direction === "down" && "↓"}
                {trend.value}
              </p>
            )}
          </div>
          {Icon && (
            <div className="ml-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
