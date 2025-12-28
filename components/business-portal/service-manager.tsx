"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Clock, Users } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { ServiceFormDialog } from "./service-form-dialog"

interface Service {
  id: string
  name: string
  price: number
  duration_minutes: number
  max_participants: number
  description: string
  image_url?: string
  is_active: boolean
  created_at: string
}

interface ServiceManagerProps {
  businessId: string
}

export function ServiceManager({ businessId }: ServiceManagerProps) {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  useEffect(() => {
    loadServices()
  }, [businessId])

  async function loadServices() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('business_resources')
      .select('*')
      .eq('business_id', businessId)
      .eq('resource_type', 'service')
      .order('created_at', { ascending: false })

    if (data) {
      setServices(data.map(parseServiceFromResource))
    }
    setIsLoading(false)
  }

  function parseServiceFromResource(resource: any): Service {
    const attrs = resource.attributes || {}
    return {
      id: resource.id,
      name: resource.name,
      price: resource.base_price || attrs.price || 0,
      duration_minutes: attrs.duration_minutes || 60,
      max_participants: attrs.max_participants || 1,
      description: resource.description || '',
      image_url: resource.image_url || attrs.image_url,
      is_active: resource.is_active !== false,
      created_at: resource.created_at,
    }
  }

  async function handleSaveService(serviceData: Omit<Service, 'id' | 'created_at'>) {
    const supabase = createClient()
    const attributes = {
      duration_minutes: serviceData.duration_minutes,
      max_participants: serviceData.max_participants,
      image_url: serviceData.image_url,
    }

    if (editingService) {
      const { error } = await supabase
        .from('business_resources')
        .update({
          name: serviceData.name,
          description: serviceData.description,
          base_price: serviceData.price,
          is_active: serviceData.is_active,
          image_url: serviceData.image_url,
          attributes,
        })
        .eq('id', editingService.id)

      if (!error) {
        await loadServices()
        setIsDialogOpen(false)
        setEditingService(null)
      }
    } else {
      const { error } = await supabase
        .from('business_resources')
        .insert({
          business_id: businessId,
          resource_type: 'service',
          name: serviceData.name,
          description: serviceData.description,
          base_price: serviceData.price,
          is_active: serviceData.is_active,
          image_url: serviceData.image_url,
          attributes,
        })

      if (!error) {
        await loadServices()
        setIsDialogOpen(false)
      }
    }
  }

  async function handleDeleteService(serviceId: string) {
    if (!confirm('Are you sure you want to delete this service?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('business_resources')
      .delete()
      .eq('id', serviceId)

    if (!error) {
      await loadServices()
    }
  }

  async function handleToggleActive(serviceId: string, currentStatus: boolean) {
    const supabase = createClient()
    const { error } = await supabase
      .from('business_resources')
      .update({ is_active: !currentStatus })
      .eq('id', serviceId)

    if (!error) {
      await loadServices()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-600">Loading services...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Service Management</h3>
          <p className="text-sm text-slate-600 mt-1">
            Manage your spa services, activities, and experiences
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingService(null)
            setIsDialogOpen(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </div>

      {/* Services Grid */}
      {services.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
          <p className="text-slate-600 mb-4">No services added yet</p>
          <Button
            onClick={() => {
              setEditingService(null)
              setIsDialogOpen(true)
            }}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Service
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div
              key={service.id}
              className={cn(
                "p-6 rounded-xl border-2 transition-all",
                service.is_active
                  ? "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
                  : "border-slate-200 bg-slate-50 opacity-75"
              )}
            >
              {/* Service Image */}
              {service.image_url ? (
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-32 bg-slate-200 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-slate-400 text-sm">No image</span>
                </div>
              )}

              {/* Service Info */}
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-900">{service.name}</h4>
                {service.description && (
                  <p className="text-sm text-slate-600 line-clamp-2">{service.description}</p>
                )}

                <div className="text-sm text-slate-600 space-y-1 pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <span>Price:</span>
                    <span className="font-semibold text-slate-900">{service.price} RON</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Duration:
                    </span>
                    <span>{service.duration_minutes} min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      Max participants:
                    </span>
                    <span>{service.max_participants}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-200 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingService(service)
                      setIsDialogOpen(true)
                    }}
                    className="flex-1"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteService(service.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(service.id, service.is_active)}
                    className={cn(
                      service.is_active
                        ? "text-green-600 hover:text-green-700 hover:bg-green-50"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {service.is_active ? "Active" : "Inactive"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Form Dialog */}
      <ServiceFormDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingService(null)
        }}
        onSave={handleSaveService}
        service={editingService}
      />
    </div>
  )
}

