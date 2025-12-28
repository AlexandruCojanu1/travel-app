"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { RoomFormDialog } from "./room-form-dialog"

interface Room {
  id: string
  name: string
  base_price: number
  capacity: number
  bed_type: string
  room_size_m2?: number
  amenities: string[]
  images: string[]
  is_active: boolean
  created_at: string
}

interface RoomManagerProps {
  businessId: string
}

const BED_TYPES = ['single', 'double', 'king', 'queen', 'bunk'] as const
const AMENITIES_OPTIONS = [
  'Balcony', 'Sea View', 'WiFi', 'AC', 'TV', 'Mini Bar', 'Safe', 'Room Service'
]

export function RoomManager({ businessId }: RoomManagerProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<Room | null>(null)

  useEffect(() => {
    loadRooms()
  }, [businessId])

  async function loadRooms() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('business_resources')
      .select('*')
      .eq('business_id', businessId)
      .eq('resource_type', 'room')
      .order('created_at', { ascending: false })

    if (data) {
      setRooms(data.map(parseRoomFromResource))
    }
    setIsLoading(false)
  }

  function parseRoomFromResource(resource: any): Room {
    const attrs = resource.attributes || {}
    return {
      id: resource.id,
      name: resource.name,
      base_price: resource.base_price || attrs.base_price || 0,
      capacity: attrs.capacity || 2,
      bed_type: attrs.bed_type || 'double',
      room_size_m2: attrs.room_size_m2,
      amenities: attrs.amenities || [],
      images: attrs.images || [],
      is_active: resource.is_active !== false,
      created_at: resource.created_at,
    }
  }

  async function handleSaveRoom(roomData: Omit<Room, 'id' | 'created_at'>) {
    const supabase = createClient()
    const attributes = {
      capacity: roomData.capacity,
      bed_type: roomData.bed_type,
      room_size_m2: roomData.room_size_m2,
      amenities: roomData.amenities,
      images: roomData.images,
    }

    if (editingRoom) {
      // Update existing room
      const { error } = await supabase
        .from('business_resources')
        .update({
          name: roomData.name,
          base_price: roomData.base_price,
          is_active: roomData.is_active,
          attributes,
        })
        .eq('id', editingRoom.id)

      if (!error) {
        await loadRooms()
        setIsDialogOpen(false)
        setEditingRoom(null)
      }
    } else {
      // Create new room
      const { error } = await supabase
        .from('business_resources')
        .insert({
          business_id: businessId,
          resource_type: 'room',
          name: roomData.name,
          base_price: roomData.base_price,
          is_active: roomData.is_active,
          attributes,
        })

      if (!error) {
        await loadRooms()
        setIsDialogOpen(false)
      }
    }
  }

  async function handleDeleteRoom(roomId: string) {
    if (!confirm('Are you sure you want to delete this room?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('business_resources')
      .delete()
      .eq('id', roomId)

    if (!error) {
      await loadRooms()
    }
  }

  async function handleToggleActive(roomId: string, currentStatus: boolean) {
    const supabase = createClient()
    const { error } = await supabase
      .from('business_resources')
      .update({ is_active: !currentStatus })
      .eq('id', roomId)

    if (!error) {
      await loadRooms()
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-600">Loading rooms...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Room Management</h3>
          <p className="text-sm text-slate-600 mt-1">
            Manage your hotel rooms, pricing, and availability
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingRoom(null)
            setIsDialogOpen(true)
          }}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Room
        </Button>
      </div>

      {/* Rooms Grid */}
      {rooms.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
          <p className="text-slate-600 mb-4">No rooms added yet</p>
          <Button
            onClick={() => {
              setEditingRoom(null)
              setIsDialogOpen(true)
            }}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Room
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={cn(
                "p-6 rounded-xl border-2 transition-all",
                room.is_active
                  ? "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
                  : "border-slate-200 bg-slate-50 opacity-75"
              )}
            >
              {/* Room Image */}
              {room.images && room.images.length > 0 ? (
                <img
                  src={room.images[0]}
                  alt={room.name}
                  className="w-full h-32 object-cover rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-32 bg-slate-200 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-slate-400 text-sm">No image</span>
                </div>
              )}

              {/* Room Info */}
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <h4 className="font-semibold text-slate-900">{room.name}</h4>
                  <button
                    onClick={() => handleToggleActive(room.id, room.is_active)}
                    className="p-1 rounded hover:bg-slate-100"
                  >
                    {room.is_active ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    )}
                  </button>
                </div>

                <div className="text-sm text-slate-600 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Price per night:</span>
                    <span className="font-semibold text-slate-900">{room.base_price} RON</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Capacity:</span>
                    <span>{room.capacity} guests</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bed type:</span>
                    <span className="capitalize">{room.bed_type}</span>
                  </div>
                  {room.room_size_m2 && (
                    <div className="flex items-center justify-between">
                      <span>Size:</span>
                      <span>{room.room_size_m2} m²</span>
                    </div>
                  )}
                </div>

                {/* Amenities */}
                {room.amenities && room.amenities.length > 0 && (
                  <div className="pt-2">
                    <div className="flex flex-wrap gap-1">
                      {room.amenities.slice(0, 3).map((amenity) => (
                        <span
                          key={amenity}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
                        >
                          {amenity}
                        </span>
                      ))}
                      {room.amenities.length > 3 && (
                        <span className="px-2 py-1 text-xs text-slate-500">
                          +{room.amenities.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-200 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingRoom(room)
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
                    onClick={() => handleDeleteRoom(room.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    title="View availability calendar"
                  >
                    <Calendar className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Room Form Dialog */}
      <RoomFormDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setEditingRoom(null)
        }}
        onSave={handleSaveRoom}
        room={editingRoom}
        bedTypes={BED_TYPES}
        amenitiesOptions={AMENITIES_OPTIONS}
      />
    </div>
  )
}

