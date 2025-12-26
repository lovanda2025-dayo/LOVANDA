import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { PLAN_LIMITS, PlanType, PLANS } from '@/constants/plans'

export interface PlanState {
    type: PlanType
    limits: typeof PLAN_LIMITS['sanzala']
    usage: {
        batidas: number
        stories: number
        comments: number
        archive: number
    }
    loading: boolean
}

export function usePlan() {
    const [plan, setPlan] = useState<PlanState>({
        type: PLANS.SANZALA,
        limits: PLAN_LIMITS.sanzala,
        usage: { batidas: 0, stories: 0, comments: 0, archive: 0 },
        loading: true
    })
    const [userId, setUserId] = useState<string | null>(null)

    const fetchPlan = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setUserId(user.id)

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        if (error) {
            console.error('Error fetching plan (DB Error):', error.message, error.details, error.hint)
            setPlan(prev => ({ ...prev, loading: false }))
            return
        }

        if (!data) {
            console.error('Error fetching plan: No profile found for user', user.id)
            setPlan(prev => ({ ...prev, loading: false }))
            return
        }

        // Daily Reset Logic
        const lastReset = data.last_reset_date ? new Date(data.last_reset_date) : new Date(0)
        const now = new Date()
        const isDifferentDay = lastReset.getDate() !== now.getDate() ||
            lastReset.getMonth() !== now.getMonth() ||
            lastReset.getFullYear() !== now.getFullYear()

        let usage = {
            batidas: data.daily_batidas || 0,
            stories: data.daily_stories || 0,
            comments: data.daily_comments || 0,
            archive: 0 // Archive is total, not daily, need to fetch count separately logic if needed
        }

        const rawPlanTypeLoop = (data.plan_type || '').toLowerCase()
        const currentPlanType = (Object.values(PLANS).includes(rawPlanTypeLoop as PlanType) ? rawPlanTypeLoop : PLANS.SANZALA) as PlanType
        const planLimits = PLAN_LIMITS[currentPlanType]

        if (isDifferentDay) {
            // Reset in DB
            await supabase.from('profiles').update({
                daily_batidas: planLimits.batidas, // Reset to Limit (Wallet Model)
                daily_stories: 0, // Reset to 0 (Usage Counter)
                daily_comments: 0, // Reset to 0 (Usage Counter)
                daily_swipes: 0,
                last_reset_date: new Date().toISOString()
            }).eq('id', user.id)

            // Reset local
            usage = {
                batidas: planLimits.batidas,
                stories: 0,
                comments: 0,
                archive: 0
            }
        }

        // Get Archive Count
        const { count: archiveCount, error: archiveError } = await supabase
            .from('archived_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        if (archiveError) console.error('Error fetching archive count:', archiveError)

        usage.archive = archiveCount || 0

        // Normalize Plan Type
        const rawPlanType = (data.plan_type || '').toLowerCase()
        const validPlanType = (Object.values(PLANS).includes(rawPlanType as PlanType) ? rawPlanType : PLANS.SANZALA) as PlanType

        setPlan({
            type: validPlanType,
            limits: PLAN_LIMITS[validPlanType],
            usage,
            loading: false
        })
    }, [])

    useEffect(() => {
        fetchPlan()
    }, [fetchPlan])

    const canPerformAction = useCallback((action: 'batidas' | 'stories' | 'comments', cost: number = 1) => {
        if (plan.loading) return false

        // Unlim check (999999)
        if (plan.limits[action] >= 999999) return true

        return (plan.usage[action] + cost) <= plan.limits[action]
    }, [plan])

    const consumeAction = useCallback(async (action: 'batidas' | 'stories' | 'comments', cost: number = 1) => {
        if (!userId) return false
        if (!canPerformAction(action, cost)) return false

        // Optimistic Update
        setPlan(prev => ({
            ...prev,
            usage: {
                ...prev.usage,
                [action]: prev.usage[action] + cost
            }
        }))

        // DB Update
        const columnMap: Record<typeof action, string> = {
            batidas: 'daily_batidas',
            stories: 'daily_stories',
            comments: 'daily_comments'
        }

        // Safe increment using RPC would be better but simple update for now
        // We fetch current again to be safe? Or simple increment.
        // Supabase doesn't have native atomic increment without RPC.
        // We will read-modify-write or assume single user usage.

        const { error } = await supabase.rpc('increment_counter', {
            row_id: userId,
            col_name: columnMap[action],
            increment_by: cost
        })

        if (error) {
            // Fallback if RPC doesn't exist (we need to create it or use simple update)
            // Using simple update:
            const { data } = await supabase
                .from('profiles')
                .select(columnMap[action])
                .eq('id', userId)
                .single()

            const colName = columnMap[action]
            const currentVal = data ? (data as any)[colName] : 0

            await supabase.from('profiles').update({
                [colName]: currentVal + cost,
                // last_reset_date: new Date().toISOString() 
            }).eq('id', userId)
        }

        return true
    }, [userId, canPerformAction, plan])

    return {
        plan,
        refreshPlan: fetchPlan,
        canPerformAction,
        consumeAction
    }
}
