"use client"

import React, { useState, useEffect } from 'react'
import { Calendar, ArrowRight, ArrowLeft, MapPin, X } from 'lucide-react'
import { Button } from '@/components/shared/ui/button'
import { Slider } from '@/components/shared/ui/slider'
import { useAppStore } from '@/store/app-store'
import { useVacationStore, Vacation } from '@/store/vacation-store'
import { getActiveCities } from '@/services/auth/city.service'
import { motion, AnimatePresence } from 'framer-motion'

interface CreateVacationDialogProps {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
    editingVacation?: Vacation | null
    onSuccess?: (vacationId: string) => void
}

type Step = 1 | 2 | 3

export function CreateVacationDialog({
    isOpen,
    onOpenChange,
    editingVacation,
    onSuccess,
}: CreateVacationDialogProps) {
    const { currentCity, openCitySelector } = useAppStore()
    const { createVacation, updateVacation } = useVacationStore()
    const [step, setStep] = useState<Step>(1)
    const [title, setTitle] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [budget, setBudget] = useState([2000])
    const [selectedCity, setSelectedCity] = useState<{
        id: string
        name: string
        country: string
    } | null>(null)
    const [cities, setCities] = useState<Array<{ id: string; name: string; country: string }>>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        // Load cities for dropdown
        getActiveCities().then((data) => {
            setCities(data.map((c) => ({ id: c.id, name: c.name, country: c.country })))
        })
    }, [])

    useEffect(() => {
        // If editing, populate form with existing data
        if (editingVacation) {
            setTitle(editingVacation.title)
            setStartDate(editingVacation.startDate)
            setEndDate(editingVacation.endDate)
            setBudget([editingVacation.budgetTotal])
            setSelectedCity({
                id: editingVacation.cityId,
                name: editingVacation.cityName,
                country: '', // Will be updated when cities load
            })
        } else if (currentCity) {
            setSelectedCity({
                id: currentCity.id,
                name: currentCity.name,
                country: currentCity.country,
            })
        }
    }, [editingVacation, currentCity, isOpen])

    // Reset form when dialog closes
    useEffect(() => {
        if (!isOpen) {
            setStep(1)
            setTitle('')
            setStartDate('')
            setEndDate('')
            setBudget([2000])
            setError(null)
            setIsSubmitting(false)
            if (!editingVacation && currentCity) {
                setSelectedCity({
                    id: currentCity.id,
                    name: currentCity.name,
                    country: currentCity.country,
                })
            }
        }
    }, [isOpen])

    const handleNext = () => {
        if (step < 3) {
            setStep((step + 1) as Step)
        }
    }

    const handleBack = () => {
        if (step > 1) {
            setStep((step - 1) as Step)
        }
    }

    const handleFinish = async () => {
        if (!selectedCity || !startDate || !endDate) {
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            if (editingVacation) {
                // Update existing vacation
                const result = await updateVacation(editingVacation.id, {
                    title: title || `Vacanță la ${selectedCity.name}`,
                    cityId: selectedCity.id,
                    cityName: selectedCity.name,
                    startDate,
                    endDate,
                    budgetTotal: budget[0],
                })

                if (!result.success) {
                    setError(result.error || 'Eroare la actualizare')
                    setIsSubmitting(false)
                    return
                }

                onSuccess?.(editingVacation.id)
            } else {
                // Create new vacation
                const result = await createVacation({
                    title: title || `Vacanță la ${selectedCity.name}`,
                    cityId: selectedCity.id,
                    cityName: selectedCity.name,
                    startDate,
                    endDate,
                    budgetTotal: budget[0],
                    status: 'planning',
                })

                if (!result.success) {
                    setError(result.error || 'Eroare la creare')
                    setIsSubmitting(false)
                    return
                }

                onSuccess?.(result.vacationId!)
            }

            onOpenChange(false)
        } catch (err: any) {
            setError(err.message || 'Eroare neașteptată')
        } finally {
            setIsSubmitting(false)
        }
    }

    const canProceedStep1 = selectedCity && startDate && endDate && new Date(endDate) >= new Date(startDate)
    const canFinish = canProceedStep1 && budget[0] > 0

    // Get min date (today)
    const today = new Date().toISOString().split('T')[0]

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                onClick={() => onOpenChange(false)}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">
                                    {editingVacation ? 'Editează Vacanța' : 'Vacanță Nouă'}
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {step === 1 && 'Alege destinația și datele'}
                                    {step === 2 && 'Stabilește bugetul'}
                                    {step === 3 && 'Revizuiește și salvează'}
                                </p>
                            </div>
                            <button
                                onClick={() => onOpenChange(false)}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-gray-400" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                                {error}
                            </div>
                        )}

                        {/* Step 1: City & Dates */}
                        {step === 1 && (
                            <div className="space-y-5">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Nume vacanță (opțional)
                                    </label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder={selectedCity ? `Vacanță la ${selectedCity.name}` : 'ex: Aventură în munți'}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                    />
                                </div>

                                {/* City Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Destinație *
                                    </label>
                                    <select
                                        value={selectedCity?.id || ''}
                                        onChange={(e) => {
                                            const city = cities.find((c) => c.id === e.target.value)
                                            if (city) {
                                                setSelectedCity(city)
                                            }
                                        }}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all appearance-none bg-white"
                                    >
                                        <option value="">Selectează un oraș...</option>
                                        {cities.map((city) => (
                                            <option key={city.id} value={city.id}>
                                                {city.name}, {city.country}
                                            </option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={openCitySelector}
                                        className="mt-2 text-sm text-primary hover:underline flex items-center gap-1"
                                    >
                                        <MapPin className="h-3 w-3" />
                                        Răsfoiește toate orașele
                                    </button>
                                </div>

                                {/* Date Range */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Data început *
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                min={today}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Data sfârșit *
                                        </label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                min={startDate || today}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {startDate && endDate && new Date(endDate) < new Date(startDate) && (
                                    <p className="text-sm text-red-600">
                                        Data de sfârșit trebuie să fie după data de început
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Step 2: Budget */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-4">
                                        Buget total: <span className="text-primary font-bold">{budget[0].toLocaleString()} RON</span>
                                    </label>
                                    <Slider
                                        value={budget}
                                        onValueChange={setBudget}
                                        min={500}
                                        max={20000}
                                        step={100}
                                        className="w-full"
                                    />
                                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                                        <span>500 RON</span>
                                        <span>20,000 RON</span>
                                    </div>
                                </div>

                                <div className="bg-primary/5 rounded-xl p-4">
                                    <p className="text-sm text-primary">
                                        <strong>Sfat:</strong> Acesta este bugetul total pentru vacanță. Poți ajusta costurile individuale ulterior în planificare.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Review */}
                        {step === 3 && (
                            <div className="space-y-4">
                                <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-5 space-y-4">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Titlu</p>
                                        <p className="font-semibold text-gray-900">
                                            {title || `Vacanță la ${selectedCity?.name}`}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Destinație</p>
                                        <p className="font-semibold text-gray-900">
                                            {selectedCity?.name}, {selectedCity?.country}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Perioada</p>
                                        <p className="font-semibold text-gray-900">
                                            {startDate && new Date(startDate).toLocaleDateString('ro-RO', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}{' '}
                                            -{' '}
                                            {endDate && new Date(endDate).toLocaleDateString('ro-RO', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Buget</p>
                                        <p className="font-semibold text-gray-900">
                                            {budget[0].toLocaleString()} RON
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step Indicator */}
                        <div className="flex items-center justify-center gap-2">
                            {[1, 2, 3].map((s) => (
                                <div
                                    key={s}
                                    className={`h-2 rounded-full transition-all ${s <= step ? 'bg-primary w-6' : 'bg-gray-200 w-2'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between gap-3">
                            {step > 1 ? (
                                <Button
                                    variant="outline"
                                    onClick={handleBack}
                                    className="flex items-center gap-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Înapoi
                                </Button>
                            ) : (
                                <div />
                            )}

                            {step < 3 ? (
                                <Button
                                    onClick={handleNext}
                                    disabled={!canProceedStep1}
                                    className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white"
                                >
                                    Următorul
                                    <ArrowRight className="h-4 w-4" />
                                </Button>
                            ) : (
                                <Button
                                    onClick={handleFinish}
                                    disabled={!canFinish || isSubmitting}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-white"
                                >
                                    {isSubmitting ? 'Se salvează...' : editingVacation ? 'Salvează modificările' : 'Creează vacanța'}
                                </Button>
                            )}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    )
}
