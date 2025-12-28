"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/shared/ui/dialog"
import { Button } from "@/components/shared/ui/button"
import { Label } from "@/components/shared/ui/label"
import { Input } from "@/components/shared/ui/input"
import { Textarea } from "@/components/shared/ui/textarea"
import { Select, SelectItem } from "@/components/shared/ui/select"
import { format } from "date-fns"

interface BlockDateDialogProps {
  isOpen: boolean
  onClose: () => void
  onBlock: (date: Date, reason: string, notes?: string) => void
  date: Date | null
}

export function BlockDateDialog({ isOpen, onClose, onBlock, date }: BlockDateDialogProps) {
  const [reason, setReason] = useState<string>("")
  const [notes, setNotes] = useState<string>("")

  function handleSubmit() {
    if (!date || !reason) return
    onBlock(date, reason, notes)
    setReason("")
    setNotes("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block Date</DialogTitle>
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
              <Label>Reason *</Label>
              <Select value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1">
                <option value="">Select reason</option>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="private_event">Private Event</SelectItem>
                <SelectItem value="fully_booked">Fully Booked</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </Select>
            </div>

            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!reason}>
            Block Date
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

