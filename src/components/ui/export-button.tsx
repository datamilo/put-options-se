import * as React from "react"
import { Download, FileDown, FileText } from "lucide-react"
import { Button } from "./button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu"

export interface ExportButtonProps {
  onExportCSV?: () => void
  onExportPNG?: () => void
  onExportPDF?: () => void
  label?: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function ExportButton({
  onExportCSV,
  onExportPNG,
  onExportPDF,
  label = "Export",
  variant = "outline",
  size = "sm",
  className,
}: ExportButtonProps) {
  const exportOptions = [
    { label: "Export as CSV", icon: FileText, onClick: onExportCSV },
    { label: "Export as PNG", icon: FileDown, onClick: onExportPNG },
    { label: "Export as PDF", icon: FileDown, onClick: onExportPDF },
  ].filter((option) => option.onClick)

  // If only one export option, show as simple button
  if (exportOptions.length === 1) {
    const option = exportOptions[0]
    return (
      <Button
        variant={variant}
        size={size}
        onClick={option.onClick}
        className={className}
      >
        <Download className="h-4 w-4 mr-2" />
        {label}
      </Button>
    )
  }

  // If multiple export options, show dropdown menu
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <Download className="h-4 w-4 mr-2" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {exportOptions.map((option) => (
          <DropdownMenuItem key={option.label} onClick={option.onClick}>
            <option.icon className="h-4 w-4 mr-2" />
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Utility function to export data to CSV
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return

  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers.map((header) => {
        const value = row[header]
        // Escape quotes and wrap in quotes if contains comma
        if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value
      }).join(",")
    ),
  ].join("\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")
  const url = URL.createObjectURL(blob)
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  link.style.visibility = "hidden"
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Utility function to export chart to PNG
export function exportChartToPNG(chartElementId: string, filename: string) {
  const element = document.getElementById(chartElementId)
  if (!element) {
    console.error(`Element with id '${chartElementId}' not found`)
    return
  }

  // For Plotly charts
  if ((window as any).Plotly) {
    ;(window as any).Plotly.downloadImage(chartElementId, {
      format: "png",
      filename: filename.replace(".png", ""),
      width: 1200,
      height: 800,
    })
  } else {
    console.warn("Plotly not found. PNG export requires Plotly.js")
  }
}
