"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { cn } from "@/lib/utils"
import { RoomFormDialog } from "./room-form-dialog"
import { toast } from "sonner"
import {
  getRoomsByHotel,
  createRoom,
  updateRoom,
  deleteRoom,
  type HotelRoom
} from "@/actions/rooms"

interface RoomManagerProps {
  businessId: string
}

const BED_TYPES = ['single', 'double', 'king', 'queen', 'bunk'] as const
const AMENITIES_OPTIONS = [
  'Balcony', 'Sea View', 'WiFi', 'AC', 'TV', 'Mini Bar', 'Safe', 'Room Service', 'Kitchen'
]

export function RoomManager({ businessId }: RoomManagerProps) {
  const [rooms, setRooms] = useState<HotelRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<HotelRoom | null>(null)

  useEffect(() => {
    if (businessId) {
      loadRooms()
    }
  }, [businessId])

  async function loadRooms() {
    setIsLoading(true)
    try {
      const data = await getRoomsByHotel(businessId)
      setRooms(data)
    } catch (error) {
      console.error('Error loading rooms:', error)
      toast.error('Failed to load rooms')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSaveRoom(roomData: Partial<HotelRoom>) {
    try {
      if (editingRoom) {
        // Update existing room
        await updateRoom(editingRoom.id, roomData)
        toast.success('Room updated successfully')
      } else {
        // Create new room
        // Validate required fields for creation
        if (!roomData.name || !roomData.price_per_night || !roomData.max_guests) {
          toast.error('Missing required fields')
          return
        }

        await createRoom({
          business_id: businessId,
          name: roomData.name,
          room_type: roomData.room_type || 'standard',
          price_per_night: roomData.price_per_night,
          max_guests: roomData.max_guests,
          bed_type: roomData.bed_type || 'double',
          size_sqm: roomData.size_sqm || undefined,
          amenities: roomData.amenities,
          images: roomData.images,
          total_rooms: roomData.total_rooms || 1,
          is_active: roomData.is_active !== false,
        })
        toast.success('Room created successfully')
      }

      await loadRooms()
      setIsDialogOpen(false)
      setEditingRoom(null)

    } catch (error) {
      console.error('Error saving room:', error)
      toast.error('Failed to save room')
    }
  }

  async function handleDeleteRoom(roomId: string) {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) return

    try {
      await deleteRoom(roomId)
      toast.success('Room deleted successfully')

      // Update local state directly for speed
      setRooms(prev => prev.filter(r => r.id !== roomId))
    } catch (error) {
      console.error('Error deleting room:', error)
      toast.error('Failed to delete room')
    }
  }

  async function handleToggleActive(roomId: string, currentStatus: boolean) {
    try {
      await updateRoom(roomId, { is_active: !currentStatus })

      // Optimistic update
      setRooms(prev => prev.map(r =>
        r.id === roomId ? { ...r, is_active: !currentStatus } : r
      ))

      toast.success(currentStatus ? 'Room deactivated' : 'Room activated')
    } catch (error) {
      console.error('Error toggling room status:', error)
      toast.error('Failed to update room status')
    }
  }

  if (isLoading && rooms.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={cn(
                "p-0 rounded-xl border-2 transition-all flex flex-col bg-white overflow-hidden",
                room.is_active
                  ? "border-slate-200 hover:border-blue-300 hover:shadow-lg"
                  : "border-slate-200 opacity-75"
              )}
            >
              {/* Room Image */}
              <div className="relative h-48 w-full bg-slate-100">
                {room.images && room.images.length > 0 ? (
                  <img
                    src={room.images[0]}
                    alt={room.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <span className="text-sm">No image</span>
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-bold shadow-sm",
                    room.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                  )}>
                    {room.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>

              {/* Room Info */}
              <div className="p-5 flex-1 flex flex-col space-y-4">
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-lg text-slate-900 line-clamp-1">{room.name}</h4>
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-blue-600">{room.price_per_night} RON</span>
                      <span className="text-[10px] text-gray-500">/ night</span>
                    </div>
                  </div>

                  <div className="text-sm text-slate-600 space-y-1.5 pt-2">
                    <div className="flex items-center justify-between">
                      <span>Type</span>
                      <span className="font-medium capitalize">{room.room_type}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Max Guests</span>
                      <span className="font-medium">{room.max_guests}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Bed</span>
                      <span className="font-medium capitalize">{room.bed_type}</span>
                    </div>
                    {room.size_sqm && (
                      <div className="flex items-center justify-between">
                        <span>Size</span>
                        <span className="font-medium">{room.size_sqm} m²</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span>Total Rooms</span>
                      <span className="font-medium">{room.total_rooms}</span>
                    </div>
                  </div>

                  {/* Amenities Tags */}
                  {room.amenities && room.amenities.length > 0 && (
                    <div className="pt-3 flex flex-wrap gap-1.5">
                      {room.amenities.slice(0, 3).map((amenity) => (
                        <span
                          key={amenity}
                          className="px-2 py-1 text-[10px] bg-blue-50 text-blue-700 rounded-md font-medium"
                        >
                          {amenity}
                        </span>
                      ))}
                      {room.amenities.length > 3 && (
                        <span className="px-2 py-1 text-[10px] text-slate-500 bg-slate-50 rounded-md h-fit">
                          +{room.amenities.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleToggleActive(room.id, room.is_active)
                    }}
                    title={room.is_active ? "Deactivate" : "Activate"}
                    className="h-9 w-9 p-0"
                  >
                    {room.is_active ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-slate-400" />
                    )}
                  </Button>

                  <div className="flex-1 flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-slate-700"
                      onClick={() => {
                        setEditingRoom(room)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Edit className="h-3.5 w-3.5 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteRoom(room.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
