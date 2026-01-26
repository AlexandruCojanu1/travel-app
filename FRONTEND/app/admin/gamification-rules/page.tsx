"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Save, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface GamificationRule {
  id?: string
  rule_name: string
  rule_type: 'achievement' | 'badge' | 'reward' | 'quest_step'
  trigger_event: string
  conditions: any
  xp_reward: number
  coins_reward: number
  badge_id?: string | null
  achievement_id?: string | null
  priority: number
  is_active: boolean
  description?: string
  metadata?: any
}

const TRIGGER_EVENTS = [
  'trip_created',
  'trip_completed',
  'check_in',
  'booking_made',
  'review_posted',
  'business_saved',
  'swipe_like',
  'swipe_dislike',
]

const CONDITION_TYPES = [
  { value: 'location', label: 'Location' },
  { value: 'count', label: 'Count' },
  { value: 'category', label: 'Category' },
  { value: 'always', label: 'Always True' },
]

export default function GamificationRulesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [rules, setRules] = useState<GamificationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingRule, setEditingRule] = useState<GamificationRule | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [badges, setBadges] = useState<any[]>([])
  const [achievements, setAchievements] = useState<any[]>([])

  useEffect(() => {
    loadRules()
    loadBadges()
    loadAchievements()
  }, [])

  const loadRules = async () => {
    try {
      const { data, error } = await supabase
        .from('gamification_rules')
        .select('*')
        .order('priority', { ascending: false })

      if (error) throw error
      setRules(data || [])
    } catch (error) {
      console.error('Error loading rules:', error)
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
    if (!editingRule) return

    setSaving(true)
    try {
      const ruleData = {
        ...editingRule,
        conditions: typeof editingRule.conditions === 'string' 
          ? JSON.parse(editingRule.conditions) 
          : editingRule.conditions,
        metadata: editingRule.metadata || {}
      }

      if (editingRule.id) {
        // Update
        const { error } = await supabase
          .from('gamification_rules')
          .update(ruleData)
          .eq('id', editingRule.id)

        if (error) throw error
      } else {
        // Create
        const { error } = await supabase
          .from('gamification_rules')
          .insert(ruleData)

        if (error) throw error
      }

      await loadRules()
      setEditingRule(null)
      setIsCreateModalOpen(false)
    } catch (error: any) {
      console.error('Error saving rule:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this rule?')) return

    try {
      const { error } = await supabase
        .from('gamification_rules')
        .delete()
        .eq('id', id)

      if (error) throw error
      await loadRules()
    } catch (error: any) {
      console.error('Error deleting rule:', error)
      alert(`Error: ${error.message}`)
    }
  }

  const defaultRule: GamificationRule = {
    rule_name: '',
    rule_type: 'reward',
    trigger_event: 'trip_created',
    conditions: { type: 'always' },
    xp_reward: 0,
    coins_reward: 0,
    priority: 0,
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
          <h1 className="text-2xl font-bold text-white mb-2">Gamification Rules</h1>
          <p className="text-slate-400">Configure dynamic rules for achievements, badges, and rewards</p>
        </div>
        <button
          onClick={() => {
            setEditingRule(defaultRule)
            setIsCreateModalOpen(true)
          }}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Rule
        </button>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="bg-slate-800 rounded-lg p-4 border border-slate-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{rule.rule_name}</h3>
                  <span className={`px-2 py-1 rounded text-xs ${
                    rule.is_active 
                      ? 'bg-green-500/20 text-green-400' 
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                    {rule.rule_type}
                  </span>
                  <span className="px-2 py-1 rounded text-xs bg-purple-500/20 text-purple-400">
                    {rule.trigger_event}
                  </span>
                </div>
                {rule.description && (
                  <p className="text-slate-400 text-sm mb-2">{rule.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <span>XP: {rule.xp_reward}</span>
                  <span>Coins: {rule.coins_reward}</span>
                  <span>Priority: {rule.priority}</span>
                </div>
                <div className="mt-2">
                  <code className="text-xs bg-slate-900 p-2 rounded text-slate-300">
                    {JSON.stringify(rule.conditions, null, 2)}
                  </code>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => {
                    setEditingRule(rule)
                    setIsCreateModalOpen(true)
                  }}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => rule.id && handleDelete(rule.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {rules.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-slate-500" />
            <p>No rules configured yet.</p>
            <p className="text-sm mt-2">Click "Add Rule" to create your first gamification rule.</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(isCreateModalOpen || editingRule) && editingRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">
                  {editingRule.id ? 'Edit Rule' : 'Create Rule'}
                </h2>
                <button
                  onClick={() => {
                    setEditingRule(null)
                    setIsCreateModalOpen(false)
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Rule Name *
                  </label>
                  <input
                    type="text"
                    value={editingRule.rule_name}
                    onChange={(e) => setEditingRule({ ...editingRule, rule_name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                    placeholder="e.g., First Trip Created"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Rule Type *
                    </label>
                    <select
                      value={editingRule.rule_type}
                      onChange={(e) => setEditingRule({ ...editingRule, rule_type: e.target.value as any })}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="reward">Reward</option>
                      <option value="badge">Badge</option>
                      <option value="achievement">Achievement</option>
                      <option value="quest_step">Quest Step</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Trigger Event *
                    </label>
                    <select
                      value={editingRule.trigger_event}
                      onChange={(e) => setEditingRule({ ...editingRule, trigger_event: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                    >
                      {TRIGGER_EVENTS.map((event) => (
                        <option key={event} value={event}>
                          {event}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Conditions (JSON) *
                  </label>
                  <textarea
                    value={typeof editingRule.conditions === 'string' 
                      ? editingRule.conditions 
                      : JSON.stringify(editingRule.conditions, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value)
                        setEditingRule({ ...editingRule, conditions: parsed })
                      } catch {
                        setEditingRule({ ...editingRule, conditions: e.target.value as any })
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none font-mono text-sm"
                    rows={6}
                    placeholder='{"type": "location", "city_name": "Brașov"}'
                  />
                  <p className="text-xs text-slate-400 mt-1">
                    Examples: {"{"}"type": "location", "city_name": "Brașov"{"}"} or {"{"}"type": "count", "field": "trips_created", "operator": "gte", "value": 5{"}"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      XP Reward
                    </label>
                    <input
                      type="number"
                      value={editingRule.xp_reward}
                      onChange={(e) => setEditingRule({ ...editingRule, xp_reward: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Coins Reward
                    </label>
                    <input
                      type="number"
                      value={editingRule.coins_reward}
                      onChange={(e) => setEditingRule({ ...editingRule, coins_reward: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Badge (Optional)
                    </label>
                    <select
                      value={editingRule.badge_id || ''}
                      onChange={(e) => setEditingRule({ ...editingRule, badge_id: e.target.value || null })}
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
                      Achievement (Optional)
                    </label>
                    <select
                      value={editingRule.achievement_id || ''}
                      onChange={(e) => setEditingRule({ ...editingRule, achievement_id: e.target.value || null })}
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Priority
                    </label>
                    <input
                      type="number"
                      value={editingRule.priority}
                      onChange={(e) => setEditingRule({ ...editingRule, priority: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                    />
                    <p className="text-xs text-slate-400 mt-1">Higher = checked first</p>
                  </div>

                  <div className="flex items-center gap-4 pt-8">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingRule.is_active}
                        onChange={(e) => setEditingRule({ ...editingRule, is_active: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-slate-300">Active</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={editingRule.description || ''}
                    onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg border border-slate-600 focus:border-emerald-500 focus:outline-none"
                    rows={2}
                  />
                </div>

                <div className="flex items-center justify-end gap-4 pt-4">
                  <button
                    onClick={() => {
                      setEditingRule(null)
                      setIsCreateModalOpen(false)
                    }}
                    className="px-4 py-2 text-slate-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving || !editingRule.rule_name}
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
                        Save Rule
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
