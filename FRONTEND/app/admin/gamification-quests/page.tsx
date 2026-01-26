"use client"

import { useState, useEffect } from "react"
import { Plus, Pencil, Trash2, Save, X, Loader2, AlertCircle, ChevronUp, ChevronDown } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface QuestStep {
  step_number: number
  title: string
  description?: string
  trigger_event: string
  conditions: any
  reward: {
    xp?: number
    coins?: number
  }
}

interface GamificationQuest {
  id?: string
  quest_name: string
  quest_slug: string
  quest_description?: string
  steps: QuestStep[]
  quest_type: 'linear' | 'parallel' | 'choice'
  time_limit_days?: number | null
  is_repeatable: boolean
  completion_xp: number
  completion_coins: number
  completion_badge_id?: string | null
  completion_achievement_id?: string | null
  is_active: boolean
  start_date?: string | null
  end_date?: string | null
  icon_url?: string | null
  banner_image_url?: string | null
}

const TRIGGER_EVENTS = [
  'trip_created',
  'trip_completed',
  'check_in',
  'booking_made',
  'review_posted',
  'business_saved',
  'swipe_like',
]

export default function GamificationQuestsPage() {
  const supabase = createClient()
  const [quests, setQuests] = useState<GamificationQuest[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingQuest, setEditingQuest] = useState<GamificationQuest | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [badges, setBadges] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])

  useEffect(() => {
    loadQuests()
    loadBadges()
    loadAchievements()
  }, [])

  const loadQuests = async () => {
    try {
      const { data, error } = await supabase
        .from('gamification_quests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setQuests(data || [])
    } catch (error) {
      console.error('Error loading quests:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadBadges = async () => {
    const { data } = await supabase.from('gamification_badges').select('id, name')
    setBadges(data || [])
  }

  const loadAchievements = async () => {
    const { data } = await supabase.from('achievements').select('id, name')
    setAchievements(data || [])
  }

  const handleSave = async () => {
    if (!editingQuest) return

    setSaving(true)
    try {
      const questData = {
        ...editingQuest,
        steps: editingQuest.steps || [],
        time_limit_days: editingQuest.time_limit_days || null,
        start_date: editingQuest.start_date || null,
        end_date: editingQuest.end_date || null,
      }

      if (editingQuest.id) {
        const { error } = await supabase
          .from('gamification_quests')
          .update(questData)
          .eq('id', editingQuest.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('gamification_quests')
          .insert(questData)

        if (error) throw error
      }

      await loadQuests()
      setEditingQuest(null)
      setIsCreateModalOpen(false)
    } catch (error: any) {
      console.error('Error saving quest:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quest?')) return

    try {
      const { error } = await supabase
        .from('gamification_quests')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadQuests()
    } catch (error: any) {
      console.error('Error deleting quest:', error)
      alert(`Error: ${error.message}`)
    }
  }

  const addStep = () => {
    if (!editingQuest) return

    const newStepNumber = (editingQuest.steps?.length || 0) + 1
    const newStep: QuestStep = {
      step_number: newStepNumber,
      title: `Step ${newStepNumber}`,
      trigger_event: 'check_in',
      conditions: {},
      reward: { xp: 0, coins: 0 }
    }

    setEditingQuest({
      ...editingQuest,
      steps: [...(editingQuest.steps || []), newStep]
    })
  }

  const removeStep = (stepNumber: number) => {
    if (!editingQuest) return

    const newSteps = editingQuest.steps
      .filter(s => s.step_number !== stepNumber)
      .map((s, idx) => ({ ...s, step_number: idx + 1 }))

    setEditingQuest({
      ...editingQuest,
      steps: newSteps
    })
  }

  const updateStep = (stepNumber: number, updates: Partial<QuestStep>) => {
    if (!editingQuest) return

    const newSteps = editingQuest.steps.map(s =>
      s.step_number === stepNumber ? { ...s, ...updates } : s
    )

    setEditingQuest({
      ...editingQuest,
      steps: newSteps
    })
  }

  const moveStep = (stepNumber: number, direction: 'up' | 'down') => {
    if (!editingQuest) return

    const steps = [...editingQuest.steps]
    const index = steps.findIndex(s => s.step_number === stepNumber)
    if (index === -1) return

    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= steps.length) return

    // Swap steps
    [steps[index], steps[newIndex]] = [steps[newIndex], steps[index]]

    // Renumber steps
    const renumberedSteps = steps.map((s, idx) => ({
      ...s,
      step_number: idx + 1
    }))

    setEditingQuest({
      ...editingQuest,
      steps: renumberedSteps
    })
  }

  const defaultQuest: GamificationQuest = {
    quest_name: '',
    quest_slug: '',
    quest_description: '',
    steps: [],
    quest_type: 'linear',
    is_repeatable: false,
    completion_xp: 0,
    completion_coins: 0,
    is_active: true,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">Gamification Quests</h1>
          <p className="text-slate-400">Create multi-step quests and challenges for users</p>
        </div>
        <button
          onClick={() => {
            setEditingQuest(defaultQuest)
            setIsCreateModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Quest
        </button>
      </div>

      <div className="space-y-4">
        {quests.map((quest) => (
          <div
            key={quest.id}
            className="bg-slate-800 rounded-lg p-4 border border-slate-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{quest.quest_name}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    quest.is_active 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {quest.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                    {quest.quest_type}
                  </span>
                  {quest.is_repeatable && (
                    <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400">
                      Repeatable
                    </span>
                  )}
                </div>
                {quest.quest_description && (
                  <p className="text-slate-400 text-sm mb-2">{quest.quest_description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-2">
                  <span>Steps: {quest.steps?.length || 0}</span>
                  <span>Completion XP: {quest.completion_xp}</span>
                  <span>Completion Coins: {quest.completion_coins}</span>
                </div>
                <div className="text-xs text-slate-500">
                  Slug: {quest.quest_slug}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => {
                    setEditingQuest(quest)
                    setIsCreateModalOpen(true)
                  }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => quest.id && handleDelete(quest.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {quests.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-500" />
            <p>No quests configured yet.</p>
            <p className="text-sm mt-2">Click "Add Quest" to create your first quest.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || editingQuest) && editingQuest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingQuest.id ? 'Edit Quest' : 'Create Quest'}
                </h2>
                <button
                  onClick={() => {
                    setEditingQuest(null)
                    setIsCreateModalOpen(false)
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Quest Name *
                    </label>
                    <input
                      type="text"
                      value={editingQuest.quest_name}
                      onChange={(e) => setEditingQuest({ ...editingQuest, quest_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Quest Slug *
                    </label>
                    <input
                      type="text"
                      value={editingQuest.quest_slug}
                      onChange={(e) => setEditingQuest({ ...editingQuest, quest_slug: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                      placeholder="brasov-adventure"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editingQuest.quest_description || ''}
                    onChange={(e) => setEditingQuest({ ...editingQuest, quest_description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Quest Type
                    </label>
                    <select
                      value={editingQuest.quest_type}
                      onChange={(e) => setEditingQuest({ ...editingQuest, quest_type: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="linear">Linear (sequential)</option>
                      <option value="parallel">Parallel (any order)</option>
                      <option value="choice">Choice (user selects path)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Time Limit (days, optional)
                    </label>
                    <input
                      type="number"
                      value={editingQuest.time_limit_days || ''}
                      onChange={(e) => setEditingQuest({ ...editingQuest, time_limit_days: e.target.value ? parseInt(e.target.value) : null })}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                      placeholder="No limit"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingQuest.is_repeatable}
                      onChange={(e) => setEditingQuest({ ...editingQuest, is_repeatable: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-slate-300">Repeatable</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingQuest.is_active}
                      onChange={(e) => setEditingQuest({ ...editingQuest, is_active: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-slate-300">Active</span>
                  </label>
                </div>

                {/* Quest Steps */}
                <div className="border-t border-slate-700 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">Quest Steps</h3>
                    <button
                      onClick={addStep}
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                    >
                      <Plus className="h-4 w-4" />
                      Add Step
                    </button>
                  </div>

                  <div className="space-y-4">
                    {editingQuest.steps?.map((step, idx) => (
                      <div key={step.step_number} className="bg-slate-700 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-emerald-600 text-white rounded text-sm font-semibold">
                              Step {step.step_number}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => moveStep(step.step_number, 'up')}
                                disabled={idx === 0}
                                className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => moveStep(step.step_number, 'down')}
                                disabled={idx === editingQuest.steps.length - 1}
                                className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                          <button
                            onClick={() => removeStep(step.step_number)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">
                              Step Title *
                            </label>
                            <input
                              type="text"
                              value={step.title}
                              onChange={(e) => updateStep(step.step_number, { title: e.target.value })}
                              className="w-full px-2 py-1.5 bg-slate-600 text-white rounded border border-slate-500 focus:border-emerald-500 focus:outline-none text-sm"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-300 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={step.description || ''}
                              onChange={(e) => updateStep(step.step_number, { description: e.target.value })}
                              className="w-full px-2 py-1.5 bg-slate-600 text-white rounded border border-slate-500 focus:border-emerald-500 focus:outline-none text-sm"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-300 mb-1">
                                Trigger Event *
                              </label>
                              <select
                                value={step.trigger_event}
                                onChange={(e) => updateStep(step.step_number, { trigger_event: e.target.value })}
                                className="w-full px-2 py-1.5 bg-slate-600 text-white rounded border border-slate-500 focus:border-emerald-500 focus:outline-none text-sm"
                              >
                                {TRIGGER_EVENTS.map((event) => (
                                  <option key={event} value={event}>
                                    {event}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-300 mb-1">
                                Conditions (JSON)
                              </label>
                              <input
                                type="text"
                                value={typeof step.conditions === 'string' 
                                  ? step.conditions 
                                  : JSON.stringify(step.conditions)}
                                onChange={(e) => {
                                  try {
                                    const parsed = JSON.parse(e.target.value)
                                    updateStep(step.step_number, { conditions: parsed })
                                  } catch {
                                    updateStep(step.step_number, { conditions: e.target.value as any })
                                  }
                                }}
                                className="w-full px-2 py-1.5 bg-slate-600 text-white rounded border border-slate-500 focus:border-emerald-500 focus:outline-none text-sm font-mono"
                                placeholder='{"city_name": "Brașov"}'
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-slate-300 mb-1">
                                XP Reward
                              </label>
                              <input
                                type="number"
                                value={step.reward.xp || 0}
                                onChange={(e) => updateStep(step.step_number, {
                                  reward: { ...step.reward, xp: parseInt(e.target.value) || 0 }
                                })}
                                className="w-full px-2 py-1.5 bg-slate-600 text-white rounded border border-slate-500 focus:border-emerald-500 focus:outline-none text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-slate-300 mb-1">
                                Coins Reward
                              </label>
                              <input
                                type="number"
                                value={step.reward.coins || 0}
                                onChange={(e) => updateStep(step.step_number, {
                                  reward: { ...step.reward, coins: parseInt(e.target.value) || 0 }
                                })}
                                className="w-full px-2 py-1.5 bg-slate-600 text-white rounded border border-slate-500 focus:border-emerald-500 focus:outline-none text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {(!editingQuest.steps || editingQuest.steps.length === 0) && (
                      <div className="text-center py-8 text-slate-400 text-sm">
                        No steps added yet. Click "Add Step" to create the first step.
                      </div>
                    )}
                  </div>
                </div>

                {/* Completion Rewards */}
                <div className="border-t border-slate-700 pt-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Completion Rewards</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Completion XP
                      </label>
                      <input
                        type="number"
                        value={editingQuest.completion_xp}
                        onChange={(e) => setEditingQuest({ ...editingQuest, completion_xp: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Completion Coins
                      </label>
                      <input
                        type="number"
                        value={editingQuest.completion_coins}
                        onChange={(e) => setEditingQuest({ ...editingQuest, completion_coins: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Completion Badge (Optional)
                      </label>
                      <select
                        value={editingQuest.completion_badge_id || ''}
                        onChange={(e) => setEditingQuest({ ...editingQuest, completion_badge_id: e.target.value || null })}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">None</option>
                        {badges.map((badge) => (
                          <option key={badge.id} value={badge.id}>
                            {badge.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Completion Achievement (Optional)
                      </label>
                      <select
                        value={editingQuest.completion_achievement_id || ''}
                        onChange={(e) => setEditingQuest({ ...editingQuest, completion_achievement_id: e.target.value || null })}
                        className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                      >
                        <option value="">None</option>
                        {achievements.map((achievement) => (
                          <option key={achievement.id} value={achievement.id}>
                            {achievement.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 pt-4 border-t border-slate-700">
                  <button
                    onClick={() => {
                      setEditingQuest(null)
                      setIsCreateModalOpen(false)
                    }}
                    className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editingQuest.quest_name || !editingQuest.quest_slug}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Quest
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
