"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/shared/ui/dialog"
import { Button } from "@/components/shared/ui/button"
import { Label } from "@/components/shared/ui/label"
import { Input } from "@/components/shared/ui/input"
import { format } from "date-fns"
import { Percent, DollarSign } from "lucide-react"

interface PriceAdjustmentDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (date: Date, price: number | null, percentage?: number) => void
  date: Date | null
  currentPrice: number
  overridePrice?: number | null
}

export function PriceAdjustmentDialog({
  isOpen,
  onClose,
  onSave,
  date,
  currentPrice,
  overridePrice,
}: PriceAdjustmentDialogProps) {
  const [mode, setMode] = useState<'fixed' | 'percentage'>('fixed')
  const [fixedPrice, setFixedPrice] = useState<string>("")
  const [percentage, setPercentage] = useState<string>("")

  useEffect(() => {
    if (overridePrice) {
      setFixedPrice(overridePrice.toString())
      setMode('fixed')
    } else {
      setFixedPrice(currentPrice.toString())
      setPercentage("0")
    }
  }, [overridePrice, currentPrice, isOpen])

  function handleSubmit() {
    if (!date) return

    if (mode === 'fixed') {
      const price = parseFloat(fixedPrice)
      if (isNaN(price) || price < 0) return
      onSave(date, price)
    } else {
      const perc = parseFloat(percentage)
      if (isNaN(perc)) return
      onSave(date, null, perc)
    }

    onClose()
  }

  function calculatePercentagePrice(): number {
    const perc = parseFloat(percentage || "0")
    return currentPrice * (1 + perc / 100)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Price</DialogTitle>
        </DialogHeader>
        
        {date && (
          <div className="space-y-4 py-4">
            <div>
              <Label>Date</Label>
              <Input
                value={format(date, 'MMMM dd, yyyy')}
                disabled
                className="mt-1"
              />
            </div>

            <div>
              <Label>Base Price</Label>
              <Input
                value={`${currentPrice.toFixed(2)} RON`}
                disabled
                className="mt-1"
              />
            </div>

            <div>
              <Label>Adjustment Mode</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant={mode === 'fixed' ? 'default' : 'outline'}
                  onClick={() => setMode('fixed')}
                  className="flex-1"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Fixed Price
                </Button>
                <Button
                  type="button"
                  variant={mode === 'percentage' ? 'default' : 'outline'}
                  onClick={() => setMode('percentage')}
                  className="flex-1"
                >
                  <Percent className="h-4 w-4 mr-2" />
                  Percentage
                </Button>
              </div>
            </div>

            {mode === 'fixed' ? (
              <div>
                <Label>Price (RON) *</Label>
                <Input
                  type="number"
                  value={fixedPrice}
                  onChange={(e) => setFixedPrice(e.target.value)}
                  placeholder="Enter price"
                  className="mt-1"
                  min="0"
                  step="0.01"
                />
              </div>
            ) : (
              <div>
                <Label>Percentage Adjustment *</Label>
                <Input
                  type="number"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  placeholder="e.g., 20 for +20%, -10 for -10%"
                  className="mt-1"
                  step="1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Final price: {calculatePercentagePrice().toFixed(2)} RON
                </p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>Preview:</strong> {mode === 'fixed' 
                  ? `${parseFloat(fixedPrice || "0").toFixed(2)} RON`
                  : `${calculatePercentagePrice().toFixed(2)} RON (${percentage}%)`
                }
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Save Price
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

