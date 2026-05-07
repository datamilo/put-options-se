import { Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getFieldInfo } from "@/data/fieldInfo";

interface FieldInfoTooltipProps {
  fieldName: string;
  className?: string;
}

export function FieldInfoTooltip({ fieldName, className }: FieldInfoTooltipProps) {
  const { t } = useTranslation("common");
  const fieldInfo = getFieldInfo(fieldName);

  if (!fieldInfo) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <Info className={`h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors ${className || ""}`} />
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-sm p-4 space-y-2">
          <div>
            <div className="font-semibold text-sm mb-1">{fieldInfo.name}</div>
            <div className="text-xs text-muted-foreground mb-2">{fieldInfo.category}</div>
          </div>
          
          <div className="space-y-1.5">
            <div>
              <span className="font-medium text-xs">{t("fieldInfoTooltip.whatItIs")}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{fieldInfo.whatItIs}</p>
            </div>
            
            <div>
              <span className="font-medium text-xs">{t("fieldInfoTooltip.whyItMatters")}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{fieldInfo.whyItMatters}</p>
            </div>
            
            {fieldInfo.unit && (
              <div>
                <span className="font-medium text-xs">{t("fieldInfoTooltip.unit")}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{fieldInfo.unit}</p>
              </div>
            )}
            
            {fieldInfo.example && (
              <div>
                <span className="font-medium text-xs">{t("fieldInfoTooltip.example")}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{fieldInfo.example}</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
