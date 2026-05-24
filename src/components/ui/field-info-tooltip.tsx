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
  const { t: tCommon } = useTranslation("common");
  const { t, i18n } = useTranslation("fieldInfo");

  const fieldMeta = getFieldInfo(fieldName);
  if (!fieldMeta) return null;

  if (!i18n.exists(`${fieldName}.whatItIs`, { ns: "fieldInfo" })) return null;

  const unit = i18n.exists(`${fieldName}.unit`, { ns: "fieldInfo" }) ? t(`${fieldName}.unit`) : null;
  const example = i18n.exists(`${fieldName}.example`, { ns: "fieldInfo" }) ? t(`${fieldName}.example`) : null;

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <span onClick={e => e.stopPropagation()} style={{ display: "inline-flex" }}>
            <Info className={`h-4 w-4 text-muted-foreground hover:text-foreground cursor-help transition-colors ${className || ""}`} />
          </span>
        </TooltipTrigger>
        <TooltipContent className="w-72 max-h-[50vh] overflow-y-auto overflow-x-hidden p-3 space-y-2">
          <div>
            <div className="font-semibold text-sm mb-1">{t(`${fieldName}.name`)}</div>
            <div className="text-xs text-muted-foreground mb-2">{t(`${fieldName}.category`)}</div>
          </div>

          <div className="space-y-1.5">
            <div>
              <span className="font-medium text-xs">{tCommon("fieldInfoTooltip.whatItIs")}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{t(`${fieldName}.whatItIs`)}</p>
            </div>

            <div>
              <span className="font-medium text-xs">{tCommon("fieldInfoTooltip.whyItMatters")}</span>
              <p className="text-xs text-muted-foreground mt-0.5">{t(`${fieldName}.whyItMatters`)}</p>
            </div>

            {unit && (
              <div>
                <span className="font-medium text-xs">{tCommon("fieldInfoTooltip.unit")}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{unit}</p>
              </div>
            )}

            {example && (
              <div>
                <span className="font-medium text-xs">{tCommon("fieldInfoTooltip.example")}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{example}</p>
              </div>
            )}

            {fieldMeta.colorCoding && (
              <div>
                <span className="font-medium text-xs">{tCommon("fieldInfoTooltip.colorCoding")}</span>
                <div className="mt-0.5 space-y-1">
                  {fieldMeta.colorCoding.map((item) => (
                    <div key={item.labelKey} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className={`inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0 ${item.color}`} />
                      {t(item.labelKey)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
