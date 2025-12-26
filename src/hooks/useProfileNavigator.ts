import { useState, useCallback } from 'react'

export interface Profile {
    id: string
    first_name: string
    last_name: string
    age: number
    avatar_url: string
    bio: string
    occupation: string
    company_name: string
    university_name: string
    education: string
    province: string
    relationship_goal: string
    lifestyle_culture: string[]
    interests: string[]
    languages: string[]
    religion: string
    political_view: string
    gender_interest: string
    plan_type: 'sanzala' | 'vip' | 'premium'
    daily_batidas: number
    daily_stories: number
    daily_comments: number
    last_reset_date: string | null
    photos?: string[]
    // New fields
    height?: number
    smoking?: string
    drinking?: string
    exercise?: string
    diet?: string
    pets?: string
    children?: string
    want_marry?: string
    want_children_future?: string
    want_form_family?: boolean
    want_strengthen_family?: boolean
    want_financial_stability?: boolean
    want_buy_house?: boolean
    want_own_business?: boolean
    want_professional_growth?: boolean
    want_travel?: boolean
    want_enjoy_life?: boolean
    sports?: string[]
    hobbies?: string[]
    music_dance?: string[]
    other_language?: string
    other_religion?: string
    other_political?: string
}

export function useProfileNavigator() {
    const [currentProfile, setCurrentProfile] = useState<Profile | null>(null)
    const [queue, setQueue] = useState<Profile[]>([])

    const setProfiles = useCallback((profiles: Profile[]) => {
        if (profiles.length === 0) {
            setCurrentProfile(null)
            setQueue([])
            return
        }
        const [first, ...rest] = profiles
        setCurrentProfile(first)
        setQueue(rest)
    }, [])

    const addProfiles = useCallback((profiles: Profile[]) => {
        if (profiles.length === 0) return

        setCurrentProfile(curr => {
            if (curr === null) {
                // Remove duplicates within the new batch itself
                const uniqueNew = profiles.filter((p, index, self) =>
                    index === self.findIndex((t) => t.id === p.id)
                )

                if (uniqueNew.length === 0) return null

                const [first, ...rest] = uniqueNew
                setQueue(prev => {
                    // Filter duplicates against existing queue
                    const existingIds = new Set(prev.map(p => p.id))
                    const reallyNew = rest.filter(p => !existingIds.has(p.id))
                    return [...prev, ...reallyNew]
                })
                return first
            } else {
                setQueue(prev => {
                    // Filter duplicates against existing queue AND current profile
                    const existingIds = new Set(prev.map(p => p.id))
                    existingIds.add(curr.id)

                    const reallyNew = profiles.filter(p => !existingIds.has(p.id))
                    // Also filter duplicates within new batch
                    const uniqueNew = reallyNew.filter((p, index, self) =>
                        index === self.findIndex((t) => t.id === p.id)
                    )

                    return [...prev, ...uniqueNew]
                })
                return curr
            }
        })
    }, [])

    const next = useCallback((action: 'like' | 'dislike' | 'archive') => {
        if (!currentProfile) return

        if (queue.length === 0) {
            setCurrentProfile(null)
        } else {
            const [nextProfile, ...remaining] = queue
            setCurrentProfile(nextProfile)
            setQueue(remaining)
        }
    }, [currentProfile, queue])

    return {
        currentProfile,
        queue,
        setProfiles,
        addProfiles,
        next
    }
}
