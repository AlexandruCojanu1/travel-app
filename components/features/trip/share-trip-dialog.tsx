"use client"

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/shared/ui/dialog'
import { Button } from '@/components/shared/ui/button'
import { Input } from '@/components/shared/ui/input'
import { Label } from '@/components/shared/ui/label'
import { Copy, Mail, Link2, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Select } from '@/components/shared/ui/select'

interface ShareTripDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  tripId: string
}

export function ShareTripDialog({ isOpen, onOpenChange, tripId }: ShareTripDialogProps) {
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [accessLevel, setAccessLevel] = useState<'view' | 'edit'>('view')
  const [collaboratorEmail, setCollaboratorEmail] = useState('')
  const [isAddingCollaborator, setIsAddingCollaborator] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleGenerateShareLink = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/trips/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          trip_id: tripId,
          is_public: isPublic,
          access_level: accessLevel,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Failed to generate share link')
        return
      }

      setShareUrl(result.shareUrl)
      toast.success('Share link generated!')
    } catch (error) {
      console.error('Error generating share link:', error)
      toast.error('An error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      toast.success('Link copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAddCollaborator = async () => {
    if (!collaboratorEmail.trim()) {
      toast.error('Please enter an email address')
      return
    }

    setIsAddingCollaborator(true)
    try {
      const response = await fetch('/api/trips/collaborate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          trip_id: tripId,
          user_email: collaboratorEmail.trim(),
          role: accessLevel,
        }),
      })

      const result = await response.json()

      if (!result.success) {
        toast.error(result.error || 'Failed to add collaborator')
        return
      }

      toast.success('Collaborator added successfully!')
      setCollaboratorEmail('')
    } catch (error) {
      console.error('Error adding collaborator:', error)
      toast.error('An error occurred')
    } finally {
      setIsAddingCollaborator(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share Trip</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Generate Share Link */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Access Level</Label>
              <Select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as 'view' | 'edit')}
              >
                <option value="view">View Only</option>
                <option value="edit">Can Edit</option>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="public" className="cursor-pointer">
                Make public (anyone with link can access)
              </Label>
            </div>

            <Button
              onClick={handleGenerateShareLink}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Link2 className="h-4 w-4 mr-2" />
                  Generate Share Link
                </>
              )}
            </Button>

            {shareUrl && (
              <div className="space-y-2">
                <Label>Share Link</Label>
                <div className="flex gap-2">
                  <Input value={shareUrl} readOnly className="flex-1" />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Add Collaborator */}
          <div className="border-t pt-4 space-y-4">
            <h3 className="font-semibold">Add Collaborator</h3>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={collaboratorEmail}
                  onChange={(e) => setCollaboratorEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="flex-1"
                />
                <Button
                  onClick={handleAddCollaborator}
                  disabled={isAddingCollaborator || !collaboratorEmail.trim()}
                >
                  {isAddingCollaborator ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

