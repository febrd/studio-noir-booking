
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Minus } from 'lucide-react';

interface WalkinTimeExtensionManagerProps {
  baseTimeMinutes: number;
  studioType: 'self_photo' | 'regular';
  additionalTime: number;
  onAdditionalTimeChange: (minutes: number) => void;
  disabled?: boolean;
}

export const WalkinTimeExtensionManager = ({
  baseTimeMinutes,
  studioType,
  additionalTime,
  onAdditionalTimeChange,
  disabled = false
}: WalkinTimeExtensionManagerProps) => {
  const extensionCostPer5Min = studioType === 'self_photo' ? 5000 : 15000;
  
  const calculateExtensionCost = (minutes: number) => {
    if (minutes <= 0) return 0;
    return Math.ceil(minutes / 5) * extensionCostPer5Min;
  };

  const addTime = (minutes: number) => {
    const newTime = Math.max(0, additionalTime + minutes);
    onAdditionalTimeChange(newTime);
  };

  const handleManualInput = (value: string) => {
    const minutes = parseInt(value) || 0;
    onAdditionalTimeChange(Math.max(0, minutes));
  };

  const totalTime = baseTimeMinutes + additionalTime;
  const extensionCost = calculateExtensionCost(additionalTime);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Manajemen Waktu</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-xs">Waktu Dasar</Label>
            <p className="font-medium">{baseTimeMinutes} menit</p>
          </div>
          <div>
            <Label className="text-xs">Total Waktu</Label>
            <p className="font-medium">{totalTime} menit</p>
          </div>
        </div>

        <div>
          <Label className="text-xs">Tambahan Waktu (menit)</Label>
          <div className="flex items-center space-x-2 mt-1">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => addTime(-5)}
              disabled={disabled || additionalTime <= 0}
            >
              <Minus className="h-3 w-3" />
            </Button>
            
            <Input
              type="number"
              value={additionalTime}
              onChange={(e) => handleManualInput(e.target.value)}
              className="text-center h-8"
              min="0"
              step="5"
              disabled={disabled}
            />
            
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => addTime(5)}
              disabled={disabled}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          
          {additionalTime > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              Biaya tambahan: Rp {extensionCost.toLocaleString('id-ID')}
              <br />
              ({Math.ceil(additionalTime / 5)} × 5 menit @ Rp {extensionCostPer5Min.toLocaleString('id-ID')})
            </p>
          )}
        </div>

        <div className="pt-2 border-t">
          <div className="flex justify-between text-sm">
            <span>Biaya Paket:</span>
            <span>Akan dihitung otomatis</span>
          </div>
          {extensionCost > 0 && (
            <div className="flex justify-between text-sm">
              <span>Biaya Tambahan Waktu:</span>
              <span>Rp {extensionCost.toLocaleString('id-ID')}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
