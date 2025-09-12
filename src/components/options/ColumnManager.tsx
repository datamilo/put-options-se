import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Settings, GripVertical, Save } from 'lucide-react';
import { ColumnPreference, useUserPreferences } from '@/hooks/useUserPreferences';
import { OptionData } from '@/types/options';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ColumnManagerProps {
  visibleColumns: (keyof OptionData)[];
  onVisibilityChange: (column: keyof OptionData, visible: boolean) => void;
  onColumnOrderChange: (newOrder: (keyof OptionData)[]) => void;
}

const SortableColumnItem: React.FC<{
  column: ColumnPreference;
  onVisibilityChange: (visible: boolean) => void;
}> = ({ column, onVisibilityChange }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatColumnName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace(/_/g, ' ');
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-3 p-3 bg-card rounded-lg border hover:bg-accent transition-colors"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <Checkbox
        checked={column.visible}
        onCheckedChange={(checked) => onVisibilityChange(!!checked)}
        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      
      <span className="flex-1 text-sm font-medium">
        {formatColumnName(column.key)}
      </span>
      
      <Badge variant={column.visible ? "default" : "secondary"} className="text-xs">
        {column.visible ? "Visible" : "Hidden"}
      </Badge>
    </div>
  );
};

export const ColumnManager: React.FC<ColumnManagerProps> = ({
  visibleColumns,
  onVisibilityChange,
  onColumnOrderChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { columnPreferences, saveColumnPreferences, isLoading } = useUserPreferences();
  const [localPreferences, setLocalPreferences] = useState<ColumnPreference[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Initialize default columns if no preferences exist
  const defaultColumns: (keyof OptionData)[] = [
    'StockName', 'OptionName', 'ExpiryDate', 'DaysToExpiry', 'StrikePrice',
    'Premium', 'NumberOfContractsBasedOnLimit', '1_2_3_ProbOfWorthless_Weighted'
  ];

  // Get all available columns from OptionData type
  const getAllColumns = (): (keyof OptionData)[] => {
    return [
      'StockName', 'OptionName', 'ExpiryDate', 'FinancialReport', 'X-Day', 'Premium',
      'PoW_Simulation_Mean_Earnings', '100k_Invested_Loss_Mean', '1_2_3_ProbOfWorthless_Weighted',
      'ProbWorthless_Bayesian_IsoCal', '1_ProbOfWorthless_Original', '2_ProbOfWorthless_Calibrated',
      '3_ProbOfWorthless_Historical_IV', 'Lower_Bound_at_Accuracy', 'LossAtBadDecline', 'LossAtWorstDecline',
      'PoW_Stats_MedianLossPct', 'PoW_Stats_WorstLossPct', 'PoW_Stats_MedianLoss', 'PoW_Stats_WorstLoss',
      'PoW_Stats_MedianProbOfWorthless', 'PoW_Stats_MinProbOfWorthless', 'PoW_Stats_MaxProbOfWorthless',
      'LossAt100DayWorstDecline', 'LossAt_2008_100DayWorstDecline', 'Mean_Accuracy', 'Lower_Bound_HistMedianIV_at_Accuracy',
      'Lower_Bound', 'Lower_Bound_HistMedianIV', 'Bid_Ask_Mid_Price', 'Option_Price_Min', 'NumberOfContractsBasedOnLimit',
      'Bid', 'ProfitLossPctLeastBad', 'Loss_Least_Bad', 'IV_AllMedianIV_Maximum100DaysToExp_Ratio', 'StockPrice',
      'DaysToExpiry', 'AskBidSpread', 'Underlying_Value', 'StrikePrice', 'StockPrice_After_2008_100DayWorstDecline',
      'LossAt50DayWorstDecline', 'LossAt_2008_50DayWorstDecline', 'ProfitLossPctBad', 'ProfitLossPctWorst',
      'ProfitLossPct100DayWorst', 'ImpliedVolatility', 'TodayStockMedianIV_Maximum100DaysToExp',
      'AllMedianIV_Maximum100DaysToExp', 'ExpiryDate_Lower_Bound_Minus_Pct_Based_on_Accuracy', 'StrikeBelowLowerAtAcc',
      'Ask', 'WorstHistoricalDecline', 'BadHistoricalDecline', 'ImpliedVolatilityUntilExpiry',
      'StockPrice_After_100DayWorstDecline', 'StockPrice_After_50DayWorstDecline', 'StockPrice_After_2008_50DayWorstDecline',
      '100DayMaxPrice', '100DayMaxPriceDate', '50DayMaxPrice', '50DayMaxPriceDate', 'Historical100DaysWorstDecline',
      'Historical50DaysWorstDecline', '2008_100DaysWorstDecline', '2008_50DaysWorstDecline', 'IV_ClosestToStrike',
      'IV_UntilExpiryClosestToStrike', 'LowerBoundClosestToStrike', 'LowerBoundDistanceFromCurrentPrice',
      'LowerBoundDistanceFromStrike', 'ImpliedDownPct', 'ToStrikePct', 'SafetyMultiple', 'SigmasToStrike',
      'ProbAssignment', 'SafetyCategory', 'CushionMinusIVPct', 'PotentialLossAtLowerBound'
    ];
  };

  useEffect(() => {
    const allColumns = getAllColumns();
    
    // Always ensure ALL columns are included
    const existingPrefsMap = new Map(columnPreferences.map(pref => [pref.key, pref]));
    
    const allPrefs = allColumns.map((col, index) => {
      const existingPref = existingPrefsMap.get(col);
      return existingPref || {
        key: col,
        visible: defaultColumns.includes(col),
        order: existingPrefsMap.size + index
      };
    });
    
    // Sort by existing order or add new ones at the end
    allPrefs.sort((a, b) => {
      const aHasOrder = existingPrefsMap.has(a.key);
      const bHasOrder = existingPrefsMap.has(b.key);
      
      if (aHasOrder && bHasOrder) {
        return a.order - b.order;
      } else if (aHasOrder) {
        return -1;
      } else if (bHasOrder) {
        return 1;
      } else {
        return a.order - b.order;
      }
    });
    
    setLocalPreferences(allPrefs);
  }, [columnPreferences]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setLocalPreferences((items) => {
        const oldIndex = items.findIndex((item) => item.key === active.id);
        const newIndex = items.findIndex((item) => item.key === over?.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Update order values
        return newItems.map((item, index) => ({
          ...item,
          order: index
        }));
      });
    }
  };

  const handleVisibilityChange = (columnKey: string, visible: boolean) => {
    setLocalPreferences(prev => 
      prev.map(col => 
        col.key === columnKey 
          ? { ...col, visible }
          : col
      )
    );
  };

  const handleSave = async () => {
    await saveColumnPreferences(localPreferences);
    
    // Update parent component with both visibility and order
    const visibleCols = localPreferences
      .filter(col => col.visible)
      .sort((a, b) => a.order - b.order)
      .map(col => col.key as keyof OptionData);
    
    onColumnOrderChange(visibleCols);
    setIsOpen(false);
  };

  const visibleCount = localPreferences.filter(col => col.visible).length;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="ml-2">
          <Settings className="h-4 w-4 mr-1" />
          Columns ({visibleCount})
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Table Columns</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Drag to reorder columns and check/uncheck to show/hide them. Click Save to persist your preferences.
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {!isLoading && localPreferences.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localPreferences.map(col => col.key)}
                strategy={verticalListSortingStrategy}
              >
                {localPreferences
                  .sort((a, b) => a.order - b.order)
                  .map((column) => (
                    <SortableColumnItem
                      key={column.key}
                      column={column}
                      onVisibilityChange={(visible) => 
                        handleVisibilityChange(column.key, visible)
                      }
                    />
                  ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
        
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {visibleCount} of {localPreferences.length} columns visible
          </p>
          
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="h-4 w-4 mr-1" />
              Save Preferences
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};