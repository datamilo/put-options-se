import React, { useState } from 'react';
import { useSettings } from '@/contexts/SettingsContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Settings } from 'lucide-react';
import { toast } from 'sonner';

export const SettingsModal = () => {
  const { underlyingValue, setUnderlyingValue } = useSettings();
  const [tempValue, setTempValue] = useState(underlyingValue);
  const [isOpen, setIsOpen] = useState(false);

  const handleSliderChange = (value: number[]) => {
    setTempValue(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
    if (!isNaN(value) && value >= 1000 && value <= 1000000) {
      setTempValue(value);
    }
  };

  const handleSave = () => {
    if (tempValue >= 1000 && tempValue <= 1000000) {
      setUnderlyingValue(tempValue);
      setIsOpen(false);
      toast.success(`Underlying value updated to $${tempValue.toLocaleString()}`);
    } else {
      toast.error('Please enter a value between $1,000 and $1,000,000');
    }
  };

  const handleCancel = () => {
    setTempValue(underlyingValue);
    setIsOpen(false);
  };

  const formatCurrency = (value: number) => {
    return `$${value.toLocaleString()}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => {
            setTempValue(underlyingValue);
            setIsOpen(true);
          }}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
      </DialogTrigger>
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
                This value is used to calculate the number of contracts and Premium. Default is $100,000.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Current Value: {formatCurrency(tempValue)}</Label>
                <Slider
                  value={[tempValue]}
                  onValueChange={handleSliderChange}
                  max={1000000}
                  min={1000}
                  step={1000}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>$1,000</span>
                  <span>$1,000,000</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="underlying-input">Or enter exact value:</Label>
                <Input
                  id="underlying-input"
                  type="text"
                  value={formatCurrency(tempValue)}
                  onChange={handleInputChange}
                  placeholder="$100,000"
                />
              </div>
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