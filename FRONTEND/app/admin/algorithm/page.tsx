"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Slider } from "@/components/shared/ui/slider"
import { Button } from "@/components/shared/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shared/ui/card"
import { Save, RefreshCw, AlertCircle, Check } from "lucide-react"
import { toast } from "sonner"
import { Toaster } from "sonner"

type AlgorithmSettings = {
  split_ratio_hotel: number
  split_ratio_food: number
  split_ratio_activity: number
  weight_price_fit: number
  weight_distance: number
  weight_affinity: number
  weight_rating: number
  penalty_per_km: number
}

export default function AlgorithmTunerPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<AlgorithmSettings>({
    split_ratio_hotel: 0.4,
    split_ratio_food: 0.3,
    split_ratio_activity: 0.3,
    weight_price_fit: 0.3,
    weight_distance: 0.2,
    weight_affinity: 0.3,
    weight_rating: 0.2,
    penalty_per_km: 10.0,
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("algorithm_settings")
        .select("*")
        .eq("id", 1)
        .single()

      if (error) throw error

      if (data) {
        setSettings({
          split_ratio_hotel: Number(data.split_ratio_hotel),
          split_ratio_food: Number(data.split_ratio_food),
          split_ratio_activity: Number(data.split_ratio_activity),
          weight_price_fit: Number(data.weight_price_fit),
          weight_distance: Number(data.weight_distance),
          weight_affinity: Number(data.weight_affinity),
          weight_rating: Number(data.weight_rating),
          penalty_per_km: Number(data.penalty_per_km),
        })
      }
    } catch (error) {
      console.error("Error loading settings:", error)
      toast.error("Failed to load algorithm settings")
    } finally {
      setLoading(false)
    }
  }

  const handleBudgetSplitChange = (
    type: "hotel" | "food" | "activity",
    value: number[]
  ) => {
    const newValue = value[0] / 100
    const current = { ...settings }
    
    if (type === "hotel") {
      current.split_ratio_hotel = newValue
    } else if (type === "food") {
      current.split_ratio_food = newValue
    } else {
      current.split_ratio_activity = newValue
    }

    // Auto-adjust others to sum to 100%
    const total = current.split_ratio_hotel + current.split_ratio_food + current.split_ratio_activity
    if (total !== 1.0) {
      const remaining = 1.0 - newValue
      const otherSum = total - newValue
      if (type === "hotel") {
        current.split_ratio_food = (current.split_ratio_food / otherSum) * remaining
        current.split_ratio_activity = (current.split_ratio_activity / otherSum) * remaining
      } else if (type === "food") {
        current.split_ratio_hotel = (current.split_ratio_hotel / (current.split_ratio_hotel + current.split_ratio_activity)) * remaining
        current.split_ratio_activity = (current.split_ratio_activity / (current.split_ratio_hotel + current.split_ratio_activity)) * remaining
      } else {
        current.split_ratio_hotel = (current.split_ratio_hotel / (current.split_ratio_hotel + current.split_ratio_food)) * remaining
        current.split_ratio_food = (current.split_ratio_food / (current.split_ratio_hotel + current.split_ratio_food)) * remaining
      }
    }

    setSettings(current)
  }

  const handleWeightChange = (
    type: "price" | "distance" | "affinity" | "rating",
    value: number[]
  ) => {
    const newValue = value[0] / 10 // Convert 0-10 slider to 0-1
    const current = { ...settings }
    
    if (type === "price") {
      current.weight_price_fit = newValue
    } else if (type === "distance") {
      current.weight_distance = newValue
    } else if (type === "affinity") {
      current.weight_affinity = newValue
    } else {
      current.weight_rating = newValue
    }

    // Auto-normalize weights to sum to 1.0
    const total = current.weight_price_fit + current.weight_distance + current.weight_affinity + current.weight_rating
    if (total > 0) {
      current.weight_price_fit = current.weight_price_fit / total
      current.weight_distance = current.weight_distance / total
      current.weight_affinity = current.weight_affinity / total
      current.weight_rating = current.weight_rating / total
    }

    setSettings(current)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Validate constraints before saving
      const splitTotal = settings.split_ratio_hotel + settings.split_ratio_food + settings.split_ratio_activity
      const weightsTotal = settings.weight_price_fit + settings.weight_distance + settings.weight_affinity + settings.weight_rating

      if (Math.abs(splitTotal - 1.0) > 0.01) {
        toast.error(`Budget split ratios must sum to 100% (currently ${(splitTotal * 100).toFixed(1)}%)`)
        setSaving(false)
        return
      }

      if (Math.abs(weightsTotal - 1.0) > 0.01) {
        toast.error(`Scoring weights must sum to 1.0 (currently ${weightsTotal.toFixed(2)})`)
        setSaving(false)
        return
      }

      const { error } = await supabase
        .from("algorithm_settings")
        .upsert({
          id: 1,
          ...settings,
          updated_at: new Date().toISOString(),
        })

      if (error) {
        // Check if error is constraint violation
        if (error.message?.includes("check_split_ratios_sum") || error.message?.includes("check_weights_sum")) {
          toast.error("Invalid settings: Constraints violated. Please check your values.")
        } else {
          throw error
        }
        return
      }

      toast.success("Algorithm settings saved successfully!")
    } catch (error) {
      console.error("Error saving settings:", error)
      toast.error("Failed to save algorithm settings")
    } finally {
      setSaving(false)
    }
  }

  const budgetTotal = (settings.split_ratio_hotel + settings.split_ratio_food + settings.split_ratio_activity) * 100
  const weightsTotal = (settings.weight_price_fit + settings.weight_distance + settings.weight_affinity + settings.weight_rating) * 10

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Toaster />
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">MOVA Smart Budget Algorithm Tuner</h1>
        <p className="text-slate-400">
          Configure the recommendation engine weights and budget allocation ratios.
        </p>
      </div>

      {/* Budget Split Section */}
      <Card className="mb-6 bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Budget Split Ratios</CardTitle>
          <CardDescription className="text-slate-400">
            How to allocate the total budget across categories (must sum to 100%)
          </CardDescription>
          {Math.abs(budgetTotal - 100) > 0.1 && (
            <div className="flex items-center gap-2 mt-2 text-amber-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Total: {budgetTotal.toFixed(1)}% - Adjust to sum to 100%</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Hotel</label>
              <span className="text-sm text-slate-400">
                {(settings.split_ratio_hotel * 100).toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[settings.split_ratio_hotel * 100]}
              onValueChange={(v) => handleBudgetSplitChange("hotel", v)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Food</label>
              <span className="text-sm text-slate-400">
                {(settings.split_ratio_food * 100).toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[settings.split_ratio_food * 100]}
              onValueChange={(v) => handleBudgetSplitChange("food", v)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Activities</label>
              <span className="text-sm text-slate-400">
                {(settings.split_ratio_activity * 100).toFixed(1)}%
              </span>
            </div>
            <Slider
              value={[settings.split_ratio_activity * 100]}
              onValueChange={(v) => handleBudgetSplitChange("activity", v)}
              min={0}
              max={100}
              step={1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Weights Section */}
      <Card className="mb-6 bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Scoring Weights</CardTitle>
          <CardDescription className="text-slate-400">
            Relative importance of each factor in the recommendation score (0-10 scale, auto-normalized)
          </CardDescription>
          {Math.abs(weightsTotal - 10) > 0.1 && (
            <div className="flex items-center gap-2 mt-2 text-blue-400 text-sm">
              <Check className="w-4 h-4" />
              <span>Weights will be auto-normalized to sum to 1.0</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Price Fit</label>
              <span className="text-sm text-slate-400">
                {(settings.weight_price_fit * 10).toFixed(1)}/10
              </span>
            </div>
            <Slider
              value={[settings.weight_price_fit * 10]}
              onValueChange={(v) => handleWeightChange("price", v)}
              min={0}
              max={10}
              step={0.1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Distance</label>
              <span className="text-sm text-slate-400">
                {(settings.weight_distance * 10).toFixed(1)}/10
              </span>
            </div>
            <Slider
              value={[settings.weight_distance * 10]}
              onValueChange={(v) => handleWeightChange("distance", v)}
              min={0}
              max={10}
              step={0.1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">User Affinity</label>
              <span className="text-sm text-slate-400">
                {(settings.weight_affinity * 10).toFixed(1)}/10
              </span>
            </div>
            <Slider
              value={[settings.weight_affinity * 10]}
              onValueChange={(v) => handleWeightChange("affinity", v)}
              min={0}
              max={10}
              step={0.1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Rating</label>
              <span className="text-sm text-slate-400">
                {(settings.weight_rating * 10).toFixed(1)}/10
              </span>
            </div>
            <Slider
              value={[settings.weight_rating * 10]}
              onValueChange={(v) => handleWeightChange("rating", v)}
              min={0}
              max={10}
              step={0.1}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Penalty Section */}
      <Card className="mb-6 bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Distance Penalty</CardTitle>
          <CardDescription className="text-slate-400">
            Score deduction per kilometer from anchor point
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-slate-300">Penalty per km</label>
              <span className="text-sm text-slate-400">
                {settings.penalty_per_km.toFixed(1)} points/km
              </span>
            </div>
            <Slider
              value={[settings.penalty_per_km]}
              onValueChange={(v) => setSettings({ ...settings, penalty_per_km: v[0] })}
              min={0}
              max={50}
              step={0.5}
              className="w-full"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={loadSettings}
          variant="outline"
          className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Reset
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || Math.abs(budgetTotal - 100) > 0.1}
          className="bg-emerald-600 hover:bg-emerald-700 text-white"
        >
          {saving ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
