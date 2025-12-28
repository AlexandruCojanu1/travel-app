"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shared/ui/tabs"
import { RoomManager } from "./room-manager"
import { MenuManager } from "./menu-manager"
import { ServiceManager } from "./service-manager"
import { TrailStatusManager } from "./trail-status-manager"
import { Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface InventoryManagerProps {
  businessId: string
  businessType: string
}

export function InventoryManager({ businessId, businessType }: InventoryManagerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [business, setBusiness] = useState<any>(null)

  useEffect(() => {
    async function loadBusiness() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single()

      if (data) {
        setBusiness(data)
      }
      setIsLoading(false)
    }

    if (businessId) {
      loadBusiness()
    }
  }, [businessId])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-airbnb-red" />
      </div>
    )
  }

  // Map business type to manager component
  const getManagerComponent = () => {
    switch (businessType?.toLowerCase()) {
      case 'hotel':
        return <RoomManager businessId={businessId} />
      case 'restaurant':
      case 'food':
        return <MenuManager businessId={businessId} />
      case 'activity':
      case 'activities':
        return <ServiceManager businessId={businessId} />
      case 'nature':
        return <TrailStatusManager businessId={businessId} />
      default:
        return (
          <div className="p-8 text-center text-airbnb-gray">
            <p>Inventory management is not available for this business type.</p>
          </div>
        )
      }
    }

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-airbnb-dark">Inventory & Resources</h2>
        <p className="text-airbnb-gray mt-1">
          Manage your {businessType?.toLowerCase() || 'business'} inventory and resources
        </p>
      </div>

      {getManagerComponent()}
    </div>
  )
}

