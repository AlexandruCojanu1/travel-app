"use client"

import { useState } from 'react'
import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/shared/ui/sheet'
import { ChatWindow } from './chat-window'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

interface BookingChatButtonProps {
  bookingId: string
  businessId: string
  businessName: string
}

export function BookingChatButton({
  bookingId,
  businessId,
  businessName,
}: BookingChatButtonProps) {
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (isOpen && !conversationId && currentUserId) {
      createOrGetConversation()
    }
  }, [isOpen, conversationId, currentUserId])

  async function createOrGetConversation() {
    setIsLoading(true)
    try {
      const response = await fetch('/api/conversations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          type: 'booking',
          business_id: businessId,
          booking_id: bookingId,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setConversationId(result.conversationId)
      }
    } catch (error) {
      console.error('Error creating conversation:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageCircle className="h-4 w-4 mr-2" />
          Message Business
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle>Chat with {businessName}</SheetTitle>
        </SheetHeader>
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Loading chat...</p>
          </div>
        ) : conversationId && currentUserId ? (
          <div className="flex-1 min-h-0 mt-4">
            <ChatWindow
              conversationId={conversationId}
              currentUserId={currentUserId}
            />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

