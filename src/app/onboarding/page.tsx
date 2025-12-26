'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Yeseva_One } from 'next/font/google'
import imageCompression from 'browser-image-compression'
import { OnboardingProvider, useOnboarding } from '@/context/OnboardingContext'

const yesevaOne = Yeseva_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
})

const PROVINCES_ANGOLA = [
    'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango', 'Cuanza Norte',
    'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla', 'Luanda', 'Lunda Norte',
    'Lunda Sul', 'Malanje', 'Moxico', 'Namibe', 'Uíge', 'Zaire'
]

function OnboardingContent() {
    const router = useRouter()
    const {
        data,
        setFirstName, setLastName, setAge, setProvince,
        setGender, setRelationshipGoal, setGenderInterest,
        setAvatar, addOptionalPhoto
    } = useOnboarding()

    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) router.push('/login')
            else setUserId(user.id)
        }
        checkUser()
    }, [router])

    const handleNext = () => {
        setError(null)
        setStep(prev => prev + 1)
    }

    const handleBack = () => {
        setError(null)
        if (step > 1) setStep(prev => prev - 1)
    }

    const processFile = async (file: File) => {
        const options = {
            maxSizeMB: 1,
            initialQuality: 0.9,
            useWebWorker: true,
        }
        return await imageCompression(file, options)
    }

    const handleAvatarSelect = async (file: File) => {
        try {
            setLoading(true)
            const compressed = await processFile(file)
            const preview = URL.createObjectURL(compressed)
            setAvatar(compressed, preview)
        } catch (err) {
            setError('Erro ao processar imagem.')
        } finally {
            setLoading(false)
        }
    }

    const handleOptionalSelect = async (file: File) => {
        try {
            setLoading(true)
            const compressed = await processFile(file)
            const preview = URL.createObjectURL(compressed)
            addOptionalPhoto(compressed, preview)
        } catch (err) {
            setError('Erro ao processar imagem.')
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        if (!userId || !data.avatarFile) return

        setLoading(true)
        setError(null)

        try {
            // 1. Upload Avatar
            const avatarPath = `${userId}/avatar_${Date.now()}`
            const { error: avErr } = await supabase.storage.from('photos').upload(avatarPath, data.avatarFile)
            if (avErr) throw avErr
            const { data: avData } = supabase.storage.from('photos').getPublicUrl(avatarPath)

            // 2. Upload Optional Photos
            const photoUrls: string[] = []
            for (const file of data.optionalFiles) {
                const path = `${userId}/photo_${Date.now()}_${Math.random()}`
                const { error: phErr } = await supabase.storage.from('photos').upload(path, file)
                if (phErr) throw phErr
                const { data: phData } = supabase.storage.from('photos').getPublicUrl(path)
                photoUrls.push(phData.publicUrl)
            }

            // 3. Save Profile
            const { error: dbErr } = await supabase.from('profiles').upsert({
                id: userId,
                first_name: data.firstName,
                last_name: data.lastName,
                age: parseInt(data.age),
                province: data.province,
                gender: data.gender,
                relationship_goal: data.relationshipGoal,
                gender_interest: data.genderInterest,
                avatar_url: avData.publicUrl,
                photos: photoUrls,
                // Default Plan Initialization
                plan_type: 'sanzala',
                daily_batidas: 10,
                extra_batidas: 0,
                daily_stories: 0,
                daily_comments: 0,
                daily_swipes: 0,
                updated_at: new Date().toISOString()
            })

            if (dbErr) throw dbErr

            router.push('/welcome') // Success redirect
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Erro ao salvar perfil.')
        } finally {
            setLoading(false)
        }
    }

    const isStepValid = () => {
        if (step === 1) return !!(data.firstName && data.lastName && data.age && parseInt(data.age) >= 18 && data.province)
        if (step === 2) return !!data.gender
        if (step === 3) return !!data.relationshipGoal
        if (step === 4) return !!data.genderInterest
        if (step === 5) return !!data.avatarPreview
        return false
    }

    const renderStep1 = () => (
        <div className="space-y-4 w-full">
            <h2 className={`${yesevaOne.className} text-3xl text-white text-center mb-6`}>Conta-nos um pouco de ti</h2>
            <input placeholder="Primeiro nome" value={data.firstName} onChange={e => setFirstName(e.target.value)} className="block w-full px-4 py-4 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white focus:border-[#ff9900] focus:outline-none focus:ring-1 focus:ring-[#ff9900]" />
            <input placeholder="Último nome" value={data.lastName} onChange={e => setLastName(e.target.value)} className="block w-full px-4 py-4 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white focus:border-[#ff9900] focus:outline-none focus:ring-1 focus:ring-[#ff9900]" />
            <input type="number" placeholder="Idade (18+)" value={data.age} onChange={e => setAge(e.target.value)} className="block w-full px-4 py-4 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white focus:border-[#ff9900] focus:outline-none focus:ring-1 focus:ring-[#ff9900]" />
            <select value={data.province} onChange={e => setProvince(e.target.value)} className="block w-full px-4 py-4 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white focus:border-[#ff9900] focus:outline-none focus:ring-1 focus:ring-[#ff9900]">
                <option value="">Selecione a província</option>
                {PROVINCES_ANGOLA.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
        </div>
    )

    const renderStep2 = () => (
        <div className="space-y-4 w-full">
            <h2 className={`${yesevaOne.className} text-3xl text-white text-center mb-6`}>Como te identificas?</h2>
            <div className="grid grid-cols-1 gap-4">
                {['Masculino', 'Feminino', 'Outro'].map(opt => (
                    <button key={opt} onClick={() => setGender(opt)} className={`p-6 rounded-xl border text-lg font-medium transition-all ${data.gender === opt ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] border-transparent text-white' : 'bg-[#1A1A1A] border-[#333333] text-gray-400 hover:border-[#ff9900]'}`}>
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    )

    const renderStep3 = () => (
        <div className="space-y-4 w-full">
            <h2 className={`${yesevaOne.className} text-3xl text-white text-center mb-6`}>O que procuras aqui?</h2>
            <div className="grid grid-cols-1 gap-4">
                {['Relacionamento Sério', 'Amizade', 'Ficar', 'Encontro Casual'].map(opt => (
                    <button key={opt} onClick={() => setRelationshipGoal(opt)} className={`p-6 rounded-xl border text-lg font-medium transition-all ${data.relationshipGoal === opt ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] border-transparent text-white' : 'bg-[#1A1A1A] border-[#333333] text-gray-400 hover:border-[#ff9900]'}`}>
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    )

    const renderStep4 = () => (
        <div className="space-y-4 w-full">
            <h2 className={`${yesevaOne.className} text-3xl text-white text-center mb-6`}>Indica teu gênero de interesse</h2>
            <div className="grid grid-cols-1 gap-4">
                {['Masculino', 'Feminino', 'Outro'].map(opt => (
                    <button key={opt} onClick={() => setGenderInterest(opt)} className={`p-6 rounded-xl border text-lg font-medium transition-all ${data.genderInterest === opt ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] border-transparent text-white' : 'bg-[#1A1A1A] border-[#333333] text-gray-400 hover:border-[#ff9900]'}`}>
                        {opt}
                    </button>
                ))}
            </div>
        </div>
    )

    const renderStep5 = () => (
        <div className="space-y-8 w-full">
            <h2 className={`${yesevaOne.className} text-3xl text-white text-center`}>Queremos ver quem és!</h2>
            <div className="flex flex-col items-center">
                <p className="text-gray-400 mb-4">Foto de Perfil (Obrigatória)</p>
                <label className="relative w-40 h-40 rounded-full bg-[#1A1A1A] border-2 border-dashed border-[#333333] flex items-center justify-center cursor-pointer hover:border-[#ff9900] transition-colors overflow-hidden">
                    {data.avatarPreview ? <img src={data.avatarPreview} alt="Avatar" className="w-full h-full object-cover" /> : <span className="text-4xl text-gray-600">+</span>}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleAvatarSelect(e.target.files[0])} />
                </label>
            </div>
            <div className="space-y-4">
                <p className="text-gray-400 text-center">Outras fotos ({data.optionalPreviews.length}/6)</p>
                <div className="grid grid-cols-3 gap-2">
                    {data.optionalPreviews.map((src, idx) => (
                        <div key={idx} className="aspect-square rounded-lg bg-[#1A1A1A] overflow-hidden">
                            <img src={src} alt={`Foto ${idx}`} className="w-full h-full object-cover" />
                        </div>
                    ))}
                    {data.optionalPreviews.length < 6 && (
                        <label className="aspect-square rounded-lg bg-[#1A1A1A] border-2 border-dashed border-[#333333] flex items-center justify-center cursor-pointer hover:border-[#ff9900] transition-colors">
                            <span className="text-2xl text-gray-600">+</span>
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleOptionalSelect(e.target.files[0])} />
                        </label>
                    )}
                </div>
            </div>
        </div>
    )

    return (
        <div className="fixed inset-0 h-[100dvh] w-full bg-black flex flex-col items-center p-6 pb-[calc(env(safe-area-inset-bottom)+1.5rem)] overflow-hidden">
            <div className="w-full h-2 bg-[#333333] rounded-full mb-8 mt-4">
                <div className="h-full bg-gradient-to-r from-[#ff0800] to-[#ff9900] rounded-full transition-all duration-500 ease-out" style={{ width: `${(step / 5) * 100}%` }}></div>
            </div>
            <div className="flex-1 w-full max-w-sm flex items-center overflow-y-auto no-scrollbar">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
                {step === 4 && renderStep4()}
                {step === 5 && renderStep5()}
            </div>
            {error && <div className="w-full max-w-sm mb-4 text-red-400 text-sm text-center bg-red-900/20 py-2 px-4 rounded-lg border border-red-900/50">{error}</div>}
            <div className="w-full max-w-sm flex gap-4 mt-8 mb-12">
                {step > 1 && <button onClick={handleBack} className="flex-1 py-4 rounded-full border border-[#333333] text-white font-bold text-lg hover:bg-[#1A1A1A] transition-colors active:scale-95">Voltar</button>}
                <button onClick={step === 5 ? handleSubmit : handleNext} disabled={loading || !isStepValid()} className={`flex-1 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isStepValid() ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white' : 'bg-[#1A1A1A] text-gray-500 border border-[#333333]'}`}>
                    {loading ? 'Salvando...' : step === 5 ? 'Concluir' : 'Avançar'}
                </button>
            </div>
        </div>
    )
}

export default function OnboardingPage() {
    return (
        <OnboardingProvider>
            <OnboardingContent />
        </OnboardingProvider>
    )
}
