"use client"

import React, { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
    Drawer,
    DrawerContent,
    DrawerTitle,
    DrawerDescription,
} from '@/components/shared/ui/drawer'
import { useUIStore } from '@/store/ui-store'
import { getBusinessById, type Business } from '@/services/business/business.service'
import { BusinessDetailsContent } from './business-details-content'

export function BusinessDetailsDrawer() {
    const { isBusinessDrawerOpen, selectedBusinessId, closeBusinessDrawer } = useUIStore()
    const [business, setBusiness] = useState<Business | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        async function loadBusiness() {
            if (!selectedBusinessId) return
            setIsLoading(true)
            try {
                const data = await getBusinessById(selectedBusinessId)
                setBusiness(data)
            } catch (error) {
                console.error('Error loading business in drawer:', error)
            } finally {
                setIsLoading(false)
            }
        }

        if (isBusinessDrawerOpen && selectedBusinessId) {
            loadBusiness()
        } else {
            setBusiness(null)
        }
    }, [isBusinessDrawerOpen, selectedBusinessId])

    if (!isBusinessDrawerOpen) return null

    return (
        <Drawer open={isBusinessDrawerOpen} onOpenChange={(open) => !open && closeBusinessDrawer()}>
            <DrawerContent className="max-h-[95vh] h-[95vh] rounded-t-[40px] border-none shadow-2xl p-0 flex flex-col md:max-w-5xl md:left-1/2 md:-translate-x-1/2 md:w-full" showClose={false}>
                <VisuallyHidden>
                    <DrawerTitle>{business?.name || 'Detalii Business'}</DrawerTitle>
                    <DrawerDescription>Detallii despre locație, program și recenzii.</DrawerDescription>
                </VisuallyHidden>
                <div className="mx-auto w-12 h-1.5 bg-slate-200 rounded-full my-4 flex-shrink-0" />

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                            <p className="text-slate-500 font-medium">Se încarcă detaliile...</p>
                        </div>
                    ) : business ? (
                        <BusinessDetailsContent
                            business={business}
                            onClose={closeBusinessDrawer}
                        />
                    ) : (
                        <div className="text-center py-20">
                            <p className="text-slate-500">Negăsit.</p>
                        </div>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    )
}

function VisuallyHidden({ children }: { children: React.ReactNode }) {
    return (
        <span className="sr-only">
            {children}
        </span>
    )
}
