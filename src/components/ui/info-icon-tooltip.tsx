import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InfoIconTooltipProps {
  title?: string;
  content: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  delayDuration?: number;
}

/**
 * Reusable component: Info icon with tooltip
 * Usage: <InfoIconTooltip title="Title" content="Tooltip text" />
 */
export const InfoIconTooltip: React.FC<InfoIconTooltipProps> = ({
  title,
  content,
  side = 'right',
  delayDuration = 200,
}) => {
  return (
    <TooltipProvider delayDuration={delayDuration}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label={title ? `${title} information` : 'More information'}
          >
            <Info className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-sm">
          {title && <p className="font-semibold mb-2">{title}</p>}
          <div className="text-sm whitespace-pre-wrap">{content}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
