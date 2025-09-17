import React, { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

interface SettingsModalProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  triggerButton?: boolean;
}

export const SettingsModal = ({ isOpen: externalIsOpen, onOpenChange, triggerButton = true }: SettingsModalProps) => {
  const { underlyingValue, setUnderlyingValue, transactionCost, setTransactionCost } = useSettings();
  const [tempValue, setTempValue] = useState(underlyingValue);
  const [tempTransactionCost, setTempTransactionCost] = useState(transactionCost);
  const [inputValue, setInputValue] = useState(underlyingValue.toString());
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  const handleSliderChange = (value: number[]) => {
    const newValue = value[0];
    setTempValue(newValue);
    setInputValue(newValue.toString());
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    const cleanValue = inputValue.replace(/[^0-9]/g, '');
    const value = parseInt(cleanValue, 10);
    if (!isNaN(value)) {
      // Clamp value between 10,000 and 1,000,000
      const clampedValue = Math.max(10000, Math.min(1000000, value));
      setTempValue(clampedValue);
      setInputValue(clampedValue.toString());
    } else {
      // Reset to current tempValue if invalid input
      setInputValue(tempValue.toString());
    }
  };

  const handleTransactionCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleanValue = e.target.value.replace(/[^0-9]/g, '');
    const value = parseInt(cleanValue, 10);
    if (!isNaN(value) && value >= 0) {
      setTempTransactionCost(value);
    }
  };

  const handleSave = () => {
    if (tempValue >= 10000 && tempValue <= 1000000) {
      setUnderlyingValue(tempValue);
      setTransactionCost(tempTransactionCost);
      setIsOpen(false);
      toast.success(`Settings updated: Underlying value ${tempValue.toLocaleString()}, Transaction cost ${tempTransactionCost}`);
    } else {
      toast.error('Please enter a value between 10,000 and 1,000,000');
    }
  };

  const handleCancel = () => {
    setTempValue(underlyingValue);
    setTempTransactionCost(transactionCost);
    setInputValue(underlyingValue.toString());
    setIsOpen(false);
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {triggerButton && (
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setTempValue(underlyingValue);
              setTempTransactionCost(transactionCost);
              setInputValue(underlyingValue.toString());
              setIsOpen(true);
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Calculation Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="underlying-value">
                Underlying Stock Value for Premium Calculation
              </Label>
              <p className="text-sm text-muted-foreground">
                This value is used to calculate the number of contracts and Premium. Default is 100,000.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Value: {formatCurrency(tempValue)}</Label>
                <Slider
                  value={[tempValue]}
                  onValueChange={handleSliderChange}
                  max={1000000}
                  min={10000}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>10,000</span>
                  <span>1,000,000</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="underlying-input">Or enter exact value:</Label>
                <Input
                  id="underlying-input"
                  type="text"
                  value={inputValue}
                  onChange={handleInputChange}
                  onBlur={handleInputBlur}
                  placeholder="100,000"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="transaction-cost">
                Transaction Cost
              </Label>
              <p className="text-sm text-muted-foreground">
                The transaction cost that will be subtracted from the premium calculation. Default is 150.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="transaction-cost-input">Transaction Cost:</Label>
              <Input
                id="transaction-cost-input"
                type="text"
                value={tempTransactionCost.toString()}
                onChange={handleTransactionCostChange}
                placeholder="150"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Apply Settings
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};