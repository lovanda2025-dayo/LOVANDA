'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface OnboardingData {
    firstName: string
    lastName: string
    age: string
    province: string
    gender: string
    relationshipGoal: string
    genderInterest: string
    avatarFile: File | null
    avatarPreview: string | null
    optionalFiles: File[]
    optionalPreviews: string[]
}

interface OnboardingContextType {
    data: OnboardingData
    setFirstName: (val: string) => void
    setLastName: (val: string) => void
    setAge: (val: string) => void
    setProvince: (val: string) => void
    setGender: (val: string) => void
    setRelationshipGoal: (val: string) => void
    setGenderInterest: (val: string) => void
    setAvatar: (file: File, preview: string) => void
    addOptionalPhoto: (file: File, preview: string) => void
    reset: () => void
}

const defaultData: OnboardingData = {
    firstName: '',
    lastName: '',
    age: '',
    province: '',
    gender: '',
    relationshipGoal: '',
    genderInterest: '',
    avatarFile: null,
    avatarPreview: null,
    optionalFiles: [],
    optionalPreviews: []
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

export function OnboardingProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<OnboardingData>(defaultData)

    const update = (key: keyof OnboardingData, value: any) => {
        setData(prev => ({ ...prev, [key]: value }))
    }

    const setAvatar = (file: File, preview: string) => {
        setData(prev => ({ ...prev, avatarFile: file, avatarPreview: preview }))
    }

    const addOptionalPhoto = (file: File, preview: string) => {
        if (data.optionalFiles.length < 6) {
            setData(prev => ({
                ...prev,
                optionalFiles: [...prev.optionalFiles, file],
                optionalPreviews: [...prev.optionalPreviews, preview]
            }))
        }
    }

    const reset = () => setData(defaultData)

    return (
        <OnboardingContext.Provider value={{
            data,
            setFirstName: (val) => update('firstName', val),
            setLastName: (val) => update('lastName', val),
            setAge: (val) => update('age', val),
            setProvince: (val) => update('province', val),
            setGender: (val) => update('gender', val),
            setRelationshipGoal: (val) => update('relationshipGoal', val),
            setGenderInterest: (val) => update('genderInterest', val),
            setAvatar,
            addOptionalPhoto,
            reset
        }}>
            {children}
        </OnboardingContext.Provider>
    )
}

export function useOnboarding() {
    const context = useContext(OnboardingContext)
    if (context === undefined) {
        throw new Error('useOnboarding must be used within an OnboardingProvider')
    }
    return context
}
