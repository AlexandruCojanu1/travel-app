"use client"

import { useState, useEffect } from "react"
import { Plus, Edit, Trash2, GripVertical, ChevronDown, ChevronUp, Printer } from "lucide-react"
import { Button } from "@/components/shared/ui/button"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { MenuSectionDialog } from "./menu-section-dialog"
import { MenuItemDialog } from "./menu-item-dialog"
import { toast } from "sonner"

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  grams?: number
  allergens: string[]
  dietary_tags: string[]
  image_url?: string
  is_available: boolean
}

interface MenuSection {
  id: string
  name: string
  items: MenuItem[]
  order: number
  is_expanded: boolean
}

interface MenuManagerProps {
  businessId: string
}

const ALLERGENS = ['Gluten', 'Dairy', 'Nuts', 'Eggs', 'Soy', 'Fish', 'Shellfish']
const DIETARY_TAGS = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten-Free', 'Dairy-Free']

export function MenuManager({ businessId }: MenuManagerProps) {
  const [sections, setSections] = useState<MenuSection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false)
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<MenuSection | null>(null)
  const [editingItem, setEditingItem] = useState<{ sectionId: string; item: MenuItem | null } | null>(null)

  useEffect(() => {
    loadMenu()
  }, [businessId])

  async function loadMenu() {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('business_resources')
      .select('*')
      .eq('business_id', businessId)
      .in('resource_type', ['menu_section', 'menu_item'])
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error loading menu:', error)
      // If resource_type filter fails, try without it
      const { data: allData, error: allError } = await supabase
        .from('business_resources')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: true })
      
      if (allError) {
        console.error('Error loading all resources:', allError)
        setIsLoading(false)
        return
      }
      
      // Filter client-side
      const filteredData = (allData || []).filter((r: any) => 
        r.resource_type === 'menu_section' || r.resource_type === 'menu_item'
      )
      
      if (filteredData.length > 0) {
        processMenuData(filteredData)
      } else {
        setSections([])
      }
      setIsLoading(false)
      return
    }

    processMenuData(data || [])
    setIsLoading(false)
  }

  function processMenuData(data: any[]) {
    // Group items by section
    const sectionsMap = new Map<string, MenuSection>()
    
    data.forEach((resource: any) => {
      if (resource.resource_type === 'menu_section') {
        sectionsMap.set(resource.id, {
          id: resource.id,
          name: resource.name,
          items: [],
          order: resource.attributes?.order || 0,
          is_expanded: true,
        })
      } else if (resource.resource_type === 'menu_item') {
        const sectionId = resource.attributes?.section_id
        if (sectionId && sectionsMap.has(sectionId)) {
          const attrs = resource.attributes || {}
          sectionsMap.get(sectionId)!.items.push({
            id: resource.id,
            name: resource.name,
            description: resource.description || '',
            price: resource.base_price || attrs.price || 0,
            grams: attrs.grams,
            allergens: attrs.allergens || [],
            dietary_tags: attrs.dietary_tags || [],
            image_url: resource.image_url || attrs.image_url,
            is_available: resource.is_active !== false,
          })
        }
      }
    })

    setSections(Array.from(sectionsMap.values()).sort((a, b) => a.order - b.order))
  }

  async function handleSaveSection(sectionName: string) {
    const supabase = createClient()
    
    try {
      if (editingSection) {
        const { error } = await supabase
          .from('business_resources')
          .update({ name: sectionName })
          .eq('id', editingSection.id)

        if (error) {
          console.error('Error updating section:', error)
          toast.error('Eroare la actualizarea secțiunii: ' + error.message)
          return
        }

        toast.success('Secțiunea a fost actualizată cu succes')
        await loadMenu()
        setIsSectionDialogOpen(false)
        setEditingSection(null)
      } else {
        const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.order)) : -1
        const { error } = await supabase
          .from('business_resources')
          .insert({
            business_id: businessId,
            resource_type: 'menu_section',
            kind: 'menu_section', // Add kind column
            name: sectionName,
            attributes: { order: maxOrder + 1 },
            is_active: true,
          })

        if (error) {
          console.error('Error creating section:', error)
          toast.error('Eroare la crearea secțiunii: ' + error.message)
          return
        }

        toast.success('Secțiunea a fost creată cu succes')
        await loadMenu()
        setIsSectionDialogOpen(false)
      }
    } catch (error: any) {
      console.error('Unexpected error:', error)
      toast.error('Eroare neașteptată: ' + (error?.message || 'Eroare necunoscută'))
    }
  }

  async function handleSaveItem(itemData: Omit<MenuItem, 'id'>, sectionId: string) {
    const supabase = createClient()
    const attributes = {
      section_id: sectionId,
      grams: itemData.grams,
      allergens: itemData.allergens,
      dietary_tags: itemData.dietary_tags,
      price: itemData.price,
      image_url: itemData.image_url,
    }

    if (editingItem?.item) {
      const { error } = await supabase
        .from('business_resources')
        .update({
          name: itemData.name,
          description: itemData.description,
          base_price: itemData.price,
          is_active: itemData.is_available,
          image_url: itemData.image_url,
          attributes,
        })
        .eq('id', editingItem.item.id)

      if (!error) {
        await loadMenu()
        setIsItemDialogOpen(false)
        setEditingItem(null)
      }
    } else {
      const { error } = await supabase
        .from('business_resources')
        .insert({
          business_id: businessId,
          resource_type: 'menu_item',
          kind: 'menu_item', // Add kind column
          name: itemData.name,
          description: itemData.description,
          base_price: itemData.price,
          is_active: itemData.is_available,
          image_url: itemData.image_url,
          attributes,
        })

      if (!error) {
        await loadMenu()
        setIsItemDialogOpen(false)
        setEditingItem(null)
      }
    }
  }

  async function handleDeleteSection(sectionId: string) {
    if (!confirm('Are you sure? This will delete all items in this section.')) return

    const supabase = createClient()
    // Delete section and all its items
    await supabase
      .from('business_resources')
      .delete()
      .eq('id', sectionId)
    
    await supabase
      .from('business_resources')
      .delete()
      .eq('attributes->>section_id', sectionId)

    await loadMenu()
  }

  async function handleDeleteItem(itemId: string) {
    if (!confirm('Are you sure you want to delete this item?')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('business_resources')
      .delete()
      .eq('id', itemId)

    if (!error) {
      await loadMenu()
    }
  }

  function toggleSection(sectionId: string) {
    setSections(prev => prev.map(s =>
      s.id === sectionId ? { ...s, is_expanded: !s.is_expanded } : s
    ))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-slate-600">Loading menu...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Menu Management</h3>
          <p className="text-sm text-slate-600 mt-1">
            Organize your menu with sections and items
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Menu
          </Button>
          <Button
            onClick={() => {
              setEditingSection(null)
              setIsSectionDialogOpen(true)
            }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Section
          </Button>
        </div>
      </div>

      {/* Menu Sections */}
      {sections.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300">
          <p className="text-slate-600 mb-4">No menu sections yet</p>
          <Button
            onClick={() => {
              setEditingSection(null)
              setIsSectionDialogOpen(true)
            }}
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Section
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section) => (
            <div
              key={section.id}
              className="border-2 border-slate-200 rounded-xl overflow-hidden"
            >
              {/* Section Header */}
              <div className="flex items-center justify-between p-4 bg-slate-50">
                <div className="flex items-center gap-3 flex-1">
                  <GripVertical className="h-5 w-5 text-slate-400" />
                  <h4 className="font-semibold text-slate-900">{section.name}</h4>
                  <span className="text-sm text-slate-500">
                    ({section.items.length} {section.items.length === 1 ? 'item' : 'items'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingItem({ sectionId: section.id, item: null })
                      setIsItemDialogOpen(true)
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Item
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingSection(section)
                      setIsSectionDialogOpen(true)
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteSection(section.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="p-2 rounded-lg hover:bg-slate-200"
                  >
                    {section.is_expanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Section Items */}
              {section.is_expanded && (
                <div className="p-4 space-y-3">
                  {section.items.length === 0 ? (
                    <p className="text-center text-slate-500 py-4">
                      No items in this section yet
                    </p>
                  ) : (
                    section.items.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all",
                          item.is_available
                            ? "border-slate-200 bg-white"
                            : "border-slate-200 bg-slate-50 opacity-75"
                        )}
                      >
                        <div className="flex gap-4">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <h5 className="font-semibold text-slate-900">{item.name}</h5>
                                {item.description && (
                                  <p className="text-sm text-slate-600 mt-1">{item.description}</p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-slate-900">{item.price} RON</p>
                                {item.grams && (
                                  <p className="text-xs text-slate-500">{item.grams}g</p>
                                )}
                              </div>
                            </div>
                            {(item.allergens.length > 0 || item.dietary_tags.length > 0) && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {item.dietary_tags.map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {item.allergens.map((allergen) => (
                                  <span
                                    key={allergen}
                                    className="px-2 py-1 text-xs bg-yellow-50 text-yellow-700 rounded"
                                  >
                                    {allergen}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-3">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setEditingItem({ sectionId: section.id, item })
                                  setIsItemDialogOpen(true)
                                }}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <MenuSectionDialog
        isOpen={isSectionDialogOpen}
        onClose={() => {
          setIsSectionDialogOpen(false)
          setEditingSection(null)
        }}
        onSave={handleSaveSection}
        section={editingSection}
      />

      <MenuItemDialog
        isOpen={isItemDialogOpen}
        onClose={() => {
          setIsItemDialogOpen(false)
          setEditingItem(null)
        }}
        onSave={handleSaveItem}
        item={editingItem?.item || null}
        sectionId={editingItem?.sectionId || ''}
        allergens={ALLERGENS}
        dietaryTags={DIETARY_TAGS}
      />
    </div>
  )
}

