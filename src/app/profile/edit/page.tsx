'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Yeseva_One } from 'next/font/google'
import { Camera, X, ArrowLeft, Heart, Wallet, Briefcase, Baby, Home, Users, TrendingUp, Plane, Sparkles, Building2, Check, MapPin, GraduationCap, User, Activity, Wine, Cigarette, Coffee, Bone, Trophy, Music, Gamepad2, Palette, Waves, Footprints, Dumbbell, Swords, Bike, Zap, Book, Tv, Utensils, Flower2, Scissors, Fish, Archive, Mic2, Disc, PartyPopper, HandHeart, Languages, Cloud, Shirt, Cpu, Ticket, Map, Church, Scale, Globe } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import { supabase } from '@/lib/supabase'

const yesevaOne = Yeseva_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
})

const BIO_MAX_LENGTH = 500

const OCCUPATIONS = ['Estudante', 'Trabalhador', 'Empreendedor', 'Desempregado', 'Outro']
const EDUCATIONS = ['Ensino Básico', 'Ensino Médio', 'Licenciatura', 'Mestrado', 'Doutorado']
const SMOKING_OPTIONS = ['Não', 'Sim', 'Socialmente']
const DRINKING_OPTIONS = ['Não', 'Sim', 'Socialmente']
const EXERCISE_OPTIONS = ['Ativo', 'Moderado', 'Ocasional', 'Sedentário']
const DIET_OPTIONS = ['Omnívoro', 'Vegetariano', 'Vegano', 'Outro']
const PETS_OPTIONS = ['Cão', 'Gato', 'Outro', 'Nenhum']
const CHILDREN_OPTIONS = ['Tem', 'Não tem']
const YES_NO_MAYBE = ['Sim', 'Não', 'Talvez']

const SPORTS_OPTIONS = [
    { label: 'Futebol', icon: Trophy },
    { label: 'Basketball', icon: Activity },
    { label: 'Voleibol', icon: Activity },
    { label: 'Natação', icon: Waves },
    { label: 'Corrida / Jogging', icon: Footprints },
    { label: 'Ginástica / Fitness', icon: Dumbbell },
    { label: 'Capoeira / Artes marciais', icon: Swords },
    { label: 'Ciclismo', icon: Bike },
    { label: 'Dança / Zumba', icon: Music },
    { label: 'Skate / Patins', icon: Zap }
]
const HOBBIES_OPTIONS = [
    { label: 'Ler livros', icon: Book },
    { label: 'Assistir filmes / séries', icon: Tv },
    { label: 'Cozinhar / experimentar receitas', icon: Utensils },
    { label: 'Fotografia', icon: Camera },
    { label: 'Viajar / conhecer novos lugares', icon: Map },
    { label: 'Jardinar / cuidar de plantas', icon: Flower2 },
    { label: 'Artesanato / DIY', icon: Scissors },
    { label: 'Jogar videogames', icon: Gamepad2 },
    { label: 'Pescar', icon: Fish },
    { label: 'Colecionar itens (selos, moedas…)', icon: Archive }
]
const MUSIC_OPTIONS = [
    { label: 'Kizomba', icon: Music },
    { label: 'Semba', icon: Music },
    { label: 'Kuduro', icon: Music },
    { label: 'Afrobeat', icon: Music },
    { label: 'Gospel / Música cristã', icon: Music },
    { label: 'Hip-hop / Rap', icon: Mic2 },
    { label: 'Jazz / Blues', icon: Music },
    { label: 'Pop / Top Hits', icon: Music },
    { label: 'Dança tradicional angolana', icon: Music },
    { label: 'DJ / Produção musical', icon: Disc }
]
const LIFESTYLE_OPTIONS = [
    { label: 'Ir a festas e eventos', icon: PartyPopper },
    { label: 'Conhecer restaurantes / comida local', icon: Utensils },
    { label: 'Voluntariado / ajudar comunidade', icon: HandHeart },
    { label: 'Aprender novas línguas', icon: Languages },
    { label: 'Meditação / Yoga', icon: Cloud },
    { label: 'Moda / estilo pessoal', icon: Shirt },
    { label: 'Tecnologia / Gadgets', icon: Cpu },
    { label: 'Fotografia urbana', icon: Camera },
    { label: 'Cinema e teatros', icon: Ticket },
    { label: 'Networking / encontros sociais', icon: Users }
]

const LANGUAGE_OPTIONS = [
    'Português', 'Kimbundu', 'Umbundu', 'Kikongo',
    'Chokwe', 'Ngangela', 'Tchokwe-Luchazi',
    'Français (Francês)', 'Inglês', 'Outro'
]

const RELIGION_OPTIONS = [
    'Católico', 'Evangélico / Protestante',
    'Cristão sem denominação específica', 'Testemunhas de Jeová',
    'Adventista', 'Espírita', 'Religião tradicional africana',
    'Islamismo', 'Ateu / Agnóstico', 'Outro'
]

const POLITICAL_OPTIONS = [
    'Centro', 'Direita', 'Esquerda', 'Liberal',
    'Conservador', 'Progressista', 'Independente',
    'Pan-africanista', 'Ambientalista', 'Outro'
]

interface PhotoItem {
    url: string
    file?: File
    isNew?: boolean
}

export default function EditProfilePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [userId, setUserId] = useState<string | null>(null)

    const [bio, setBio] = useState('')
    const [originalBio, setOriginalBio] = useState('')

    const [occupation, setOccupation] = useState('')
    const [originalOccupation, setOriginalOccupation] = useState('')
    const [education, setEducation] = useState('')
    const [originalEducation, setOriginalEducation] = useState('')

    const [height, setHeight] = useState('')
    const [originalHeight, setOriginalHeight] = useState('')
    const [smoking, setSmoking] = useState('')
    const [originalSmoking, setOriginalSmoking] = useState('')
    const [drinking, setDrinking] = useState('')
    const [originalDrinking, setOriginalDrinking] = useState('')
    const [exercise, setExercise] = useState('')
    const [originalExercise, setOriginalExercise] = useState('')
    const [diet, setDiet] = useState('')
    const [originalDiet, setOriginalDiet] = useState('')
    const [pets, setPets] = useState('')
    const [originalPets, setOriginalPets] = useState('')
    const [children, setChildren] = useState('')
    const [originalChildren, setOriginalChildren] = useState('')

    const [wantMarry, setWantMarry] = useState('')
    const [originalWantMarry, setOriginalWantMarry] = useState('')
    const [wantChildrenFuture, setWantChildrenFuture] = useState('')
    const [originalWantChildrenFuture, setOriginalWantChildrenFuture] = useState('')
    const [wantFormFamily, setWantFormFamily] = useState(false)
    const [originalWantFormFamily, setOriginalWantFormFamily] = useState(false)
    const [wantStrengthenFamily, setWantStrengthenFamily] = useState(false)
    const [originalWantStrengthenFamily, setOriginalWantStrengthenFamily] = useState(false)
    const [wantFinancialStability, setWantFinancialStability] = useState(false)
    const [originalWantFinancialStability, setOriginalWantFinancialStability] = useState(false)
    const [wantBuyHouse, setWantBuyHouse] = useState(false)
    const [originalWantBuyHouse, setOriginalWantBuyHouse] = useState(false)
    const [wantOwnBusiness, setWantOwnBusiness] = useState(false)
    const [originalWantOwnBusiness, setOriginalWantOwnBusiness] = useState(false)
    const [wantProfessionalGrowth, setWantProfessionalGrowth] = useState(false)
    const [originalWantProfessionalGrowth, setOriginalWantProfessionalGrowth] = useState(false)
    const [wantTravel, setWantTravel] = useState(false)
    const [originalWantTravel, setOriginalWantTravel] = useState(false)
    const [wantEnjoyLife, setWantEnjoyLife] = useState(false)
    const [originalWantEnjoyLife, setOriginalWantEnjoyLife] = useState(false)

    const [sports, setSports] = useState<string[]>([])
    const [originalSports, setOriginalSports] = useState<string[]>([])
    const [hobbies, setHobbies] = useState<string[]>([])
    const [originalHobbies, setOriginalHobbies] = useState<string[]>([])
    const [musicDance, setMusicDance] = useState<string[]>([])
    const [originalMusicDance, setOriginalMusicDance] = useState<string[]>([])
    const [lifestyleCulture, setLifestyleCulture] = useState<string[]>([])
    const [originalLifestyleCulture, setOriginalLifestyleCulture] = useState<string[]>([])

    const [languages, setLanguages] = useState<string[]>([])
    const [originalLanguages, setOriginalLanguages] = useState<string[]>([])
    const [otherLanguage, setOtherLanguage] = useState('')
    const [originalOtherLanguage, setOriginalOtherLanguage] = useState('')

    const [religion, setReligion] = useState('')
    const [originalReligion, setOriginalReligion] = useState('')
    const [otherReligion, setOtherReligion] = useState('')
    const [originalOtherReligion, setOriginalOtherReligion] = useState('')

    const [politicalView, setPoliticalView] = useState('')
    const [originalPoliticalView, setOriginalPoliticalView] = useState('')
    const [otherPolitical, setOtherPolitical] = useState('')
    const [originalOtherPolitical, setOriginalOtherPolitical] = useState('')

    const [avatar, setAvatar] = useState<PhotoItem | null>(null)
    const [photos, setPhotos] = useState<PhotoItem[]>([])

    const avatarInputRef = useRef<HTMLInputElement>(null)
    const photoInputRefs = useRef<(HTMLInputElement | null)[]>([])

    const toggleItem = (list: string[], setList: (val: string[]) => void, item: string) => {
        if (list.includes(item)) {
            setList(list.filter(i => i !== item))
        } else {
            setList([...list, item])
        }
    }

    const areArraysEqual = (a: string[], b: string[]) => {
        if (a.length !== b.length) return false
        const sortedA = [...a].sort()
        const sortedB = [...b].sort()
        for (let i = 0; i < sortedA.length; i++) {
            if (sortedA[i] !== sortedB[i]) return false
        }
        return true
    }

    const hasChanges =
        bio !== originalBio ||
        occupation !== originalOccupation ||
        education !== originalEducation ||
        height !== originalHeight ||
        smoking !== originalSmoking ||
        drinking !== originalDrinking ||
        exercise !== originalExercise ||
        diet !== originalDiet ||
        pets !== originalPets ||
        children !== originalChildren ||
        wantMarry !== originalWantMarry ||
        wantChildrenFuture !== originalWantChildrenFuture ||
        wantFormFamily !== originalWantFormFamily ||
        wantStrengthenFamily !== originalWantStrengthenFamily ||
        wantFinancialStability !== originalWantFinancialStability ||
        wantBuyHouse !== originalWantBuyHouse ||
        wantOwnBusiness !== originalWantOwnBusiness ||
        wantProfessionalGrowth !== originalWantProfessionalGrowth ||
        wantTravel !== originalWantTravel ||
        wantEnjoyLife !== originalWantEnjoyLife ||
        otherLanguage !== originalOtherLanguage ||
        religion !== originalReligion ||
        otherReligion !== originalOtherReligion ||
        politicalView !== originalPoliticalView ||
        otherPolitical !== originalOtherPolitical ||
        !areArraysEqual(sports, originalSports) ||
        !areArraysEqual(hobbies, originalHobbies) ||
        !areArraysEqual(musicDance, originalMusicDance) ||
        !areArraysEqual(lifestyleCulture, originalLifestyleCulture) ||
        !areArraysEqual(languages, originalLanguages)

    useEffect(() => {
        loadProfile()
    }, [])

    const loadProfile = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            setUserId(user.id)

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('avatar_url, photos, bio, occupation, education, height, smoking, drinking, exercise, diet, pets, children, want_marry, want_children_future, want_form_family, want_strengthen_family, want_financial_stability, want_buy_house, want_own_business, want_professional_growth, want_travel, want_enjoy_life, sports, hobbies, music_dance, lifestyle_culture, languages, other_language, religion, other_religion, political_view, other_political')
                .eq('id', user.id)
                .single()

            if (profileError) throw profileError

            if (profile?.bio) {
                setBio(profile.bio)
                setOriginalBio(profile.bio)
            }

            if (profile?.occupation) {
                setOccupation(profile.occupation)
                setOriginalOccupation(profile.occupation)
            }

            if (profile?.education) {
                setEducation(profile.education)
                setOriginalEducation(profile.education)
            }

            if (profile?.height) {
                setHeight(profile.height.toString())
                setOriginalHeight(profile.height.toString())
            }

            if (profile?.smoking) {
                setSmoking(profile.smoking)
                setOriginalSmoking(profile.smoking)
            }

            if (profile?.drinking) {
                setDrinking(profile.drinking)
                setOriginalDrinking(profile.drinking)
            }

            if (profile?.exercise) {
                setExercise(profile.exercise)
                setOriginalExercise(profile.exercise)
            }

            if (profile?.diet) {
                setDiet(profile.diet)
                setOriginalDiet(profile.diet)
            }

            if (profile?.pets) {
                setPets(profile.pets)
                setOriginalPets(profile.pets)
            }

            if (profile?.children) {
                setChildren(profile.children)
                setOriginalChildren(profile.children)
            }

            if (profile?.want_marry) {
                setWantMarry(profile.want_marry)
                setOriginalWantMarry(profile.want_marry)
            }

            if (profile?.want_children_future) {
                setWantChildrenFuture(profile.want_children_future)
                setOriginalWantChildrenFuture(profile.want_children_future)
            }

            setWantFormFamily(profile?.want_form_family || false)
            setOriginalWantFormFamily(profile?.want_form_family || false)

            setWantStrengthenFamily(profile?.want_strengthen_family || false)
            setOriginalWantStrengthenFamily(profile?.want_strengthen_family || false)

            setWantFinancialStability(profile?.want_financial_stability || false)
            setOriginalWantFinancialStability(profile?.want_financial_stability || false)

            setWantBuyHouse(profile?.want_buy_house || false)
            setOriginalWantBuyHouse(profile?.want_buy_house || false)

            setWantOwnBusiness(profile?.want_own_business || false)
            setOriginalWantOwnBusiness(profile?.want_own_business || false)

            setWantProfessionalGrowth(profile?.want_professional_growth || false)
            setOriginalWantProfessionalGrowth(profile?.want_professional_growth || false)

            setWantTravel(profile?.want_travel || false)
            setOriginalWantTravel(profile?.want_travel || false)

            setWantEnjoyLife(profile?.want_enjoy_life || false)
            setOriginalWantEnjoyLife(profile?.want_enjoy_life || false)

            if (profile?.sports) {
                setSports(profile.sports)
                setOriginalSports(profile.sports)
            }
            if (profile?.hobbies) {
                setHobbies(profile.hobbies)
                setOriginalHobbies(profile.hobbies)
            }
            if (profile?.music_dance) {
                setMusicDance(profile.music_dance)
                setOriginalMusicDance(profile.music_dance)
            }
            if (profile?.lifestyle_culture) {
                setLifestyleCulture(profile.lifestyle_culture)
                setOriginalLifestyleCulture(profile.lifestyle_culture)
            }

            if (profile?.languages) {
                setLanguages(profile.languages)
                setOriginalLanguages(profile.languages)
            }
            if (profile?.other_language) {
                setOtherLanguage(profile.other_language)
                setOriginalOtherLanguage(profile.other_language)
            }
            if (profile?.religion) {
                setReligion(profile.religion)
                setOriginalReligion(profile.religion)
            }
            if (profile?.other_religion) {
                setOtherReligion(profile.other_religion)
                setOriginalOtherReligion(profile.other_religion)
            }
            if (profile?.political_view) {
                setPoliticalView(profile.political_view)
                setOriginalPoliticalView(profile.political_view)
            }
            if (profile?.other_political) {
                setOtherPolitical(profile.other_political)
                setOriginalOtherPolitical(profile.other_political)
            }

            if (profile?.avatar_url) {
                setAvatar({ url: profile.avatar_url })
            }

            if (profile?.photos && Array.isArray(profile.photos)) {
                setPhotos(profile.photos.map(url => ({ url })))
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao carregar perfil')
        } finally {
            setLoading(false)
        }
    }

    const compressImage = async (file: File): Promise<File> => {
        try {
            const options = {
                maxSizeMB: 1,
                initialQuality: 0.9,
                useWebWorker: true,
                preserveExif: true,
            }
            return await imageCompression(file, options)
        } catch (err) {
            console.error('Erro na compressão:', err)
            return file
        }
    }

    const uploadImage = async (file: File, path: string): Promise<string> => {
        const compressedFile = await compressImage(file)

        const { data, error } = await supabase.storage
            .from('photos')
            .upload(path, compressedFile, { upsert: true })

        if (error) throw error

        const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(path)

        return publicUrl
    }

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const previewUrl = URL.createObjectURL(file)
        setAvatar({ url: previewUrl, file, isNew: true })
    }

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0]
        if (!file) return

        const previewUrl = URL.createObjectURL(file)
        const newPhotos = [...photos]
        newPhotos[index] = { url: previewUrl, file, isNew: true }
        setPhotos(newPhotos)
    }

    const handleAddPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (photos.length >= 6) return

        const previewUrl = URL.createObjectURL(file)
        setPhotos([...photos, { url: previewUrl, file, isNew: true }])
    }

    const handleRemovePhoto = (index: number) => {
        const newPhotos = photos.filter((_, i) => i !== index)
        setPhotos(newPhotos)
    }

    const handleSave = async () => {
        if (!userId) return
        if (!avatar) {
            setError('A foto de perfil é obrigatória')
            return
        }
        if (bio.length > BIO_MAX_LENGTH) {
            setError(`A bio não pode ter mais de ${BIO_MAX_LENGTH} caracteres`)
            return
        }

        try {
            setSaving(true)
            setError('')

            let avatarUrl = avatar.url
            if (avatar.isNew && avatar.file) {
                const path = `${userId}/avatar-${Date.now()}.jpg`
                avatarUrl = await uploadImage(avatar.file, path)
            }

            const photoUrls: string[] = []
            for (let i = 0; i < photos.length; i++) {
                const photo = photos[i]
                if (photo.isNew && photo.file) {
                    const path = `${userId}/photo-${i}-${Date.now()}.jpg`
                    const url = await uploadImage(photo.file, path)
                    photoUrls.push(url)
                } else {
                    photoUrls.push(photo.url)
                }
            }

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    avatar_url: avatarUrl,
                    photos: photoUrls,
                    bio: bio.trim(),
                    occupation: occupation || null,
                    education: education || null,
                    height: height ? parseInt(height) : null,
                    smoking: smoking || null,
                    drinking: drinking || null,
                    exercise: exercise || null,
                    diet: diet || null,
                    pets: pets || null,
                    children: children || null,
                    want_marry: wantMarry || null,
                    want_children_future: wantChildrenFuture || null,
                    want_form_family: wantFormFamily,
                    want_strengthen_family: wantStrengthenFamily,
                    want_financial_stability: wantFinancialStability,
                    want_buy_house: wantBuyHouse,
                    want_own_business: wantOwnBusiness,
                    want_professional_growth: wantProfessionalGrowth,
                    want_travel: wantTravel,
                    want_enjoy_life: wantEnjoyLife,
                    sports,
                    hobbies,
                    music_dance: musicDance,
                    lifestyle_culture: lifestyleCulture,
                    languages,
                    other_language: otherLanguage,
                    religion,
                    other_religion: otherReligion,
                    political_view: politicalView,
                    other_political: otherPolitical,
                })
                .eq('id', userId)

            if (updateError) throw updateError

            setOriginalBio(bio.trim())
            setOriginalSports(sports)
            setOriginalHobbies(hobbies)
            setOriginalMusicDance(musicDance)
            setOriginalLifestyleCulture(lifestyleCulture)
            setOriginalLanguages(languages)
            setOriginalOtherLanguage(otherLanguage)
            setOriginalReligion(religion)
            setOriginalOtherReligion(otherReligion)
            setOriginalPoliticalView(politicalView)
            setOriginalOtherPolitical(otherPolitical)
            router.push('/profile')
        } catch (err: any) {
            setError(err.message || 'Erro ao salvar fotos')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="fixed inset-0 h-[100dvh] w-full bg-black flex items-center justify-center">
                <div className="text-white text-xl">Carregando...</div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 h-[100dvh] w-full bg-black overflow-hidden flex flex-col">
            <div className="flex-1 w-full overflow-y-auto no-scrollbar">
                <div className="min-h-full">
                    {/* Header */}
                    <div className="sticky top-0 z-50 flex items-center justify-between mb-8 p-6 bg-black/80 backdrop-blur-xl border-b border-white/5 mx-[-1.5rem] mt-[-1.5rem]">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className={`${yesevaOne.className} text-3xl text-white`}>
                            Editar Perfil
                        </h1>
                        <div className="w-10" />
                    </div>

                    <div className="p-6 pt-0">
                        {error && (
                            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 animate-fade-in">
                                {error}
                            </div>
                        )}

                        {/* Avatar Section */}
                        <div className="mb-6 p-6 rounded-2xl bg-[#1A1A1A]/50 backdrop-blur-sm border border-[#333333] hover:border-[#ff9900]/30 transition-all duration-300">
                            <div className="flex items-center gap-3 mb-2">
                                <Camera className="text-[#ff9900]" size={22} />
                                <h2 className="text-white text-xl font-bold">Foto de Perfil</h2>
                            </div>
                            <p className="text-gray-400 text-sm mb-6">Esta é a foto principal do seu perfil</p>
                            <div className="flex justify-center">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-full bg-[#1A1A1A] border-2 border-[#333333] overflow-hidden relative group-hover:border-[#ff9900] transition-all duration-300 shadow-xl shadow-black/50">
                                        {avatar ? (
                                            <img
                                                src={avatar.url}
                                                alt="Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                <Camera size={40} />
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => avatarInputRef.current?.click()}
                                        className="absolute inset-0 rounded-full bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border-2 border-[#ff9900]/0 group-hover:border-[#ff9900]"
                                    >
                                        <Camera size={32} className="text-white" />
                                    </button>
                                    <input
                                        ref={avatarInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarChange}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Additional Photos Section */}
                        <div className="mb-6 p-6 rounded-2xl bg-[#1A1A1A]/50 backdrop-blur-sm border border-[#333333] hover:border-[#ff9900]/30 transition-all duration-300">
                            <div className="flex items-center gap-3 mb-2">
                                <Sparkles className="text-[#ff9900]" size={22} />
                                <h2 className="text-white text-xl font-bold">Galeria de Fotos</h2>
                            </div>
                            <p className="text-gray-400 text-sm mb-6">
                                Adicione até 6 fotos adicionais • {photos.length}/6
                            </p>
                            <div className="grid grid-cols-3 gap-4">
                                {photos.map((photo, index) => (
                                    <div key={index} className="relative group aspect-square">
                                        <div className="w-full h-full rounded-2xl bg-[#1A1A1A] border-2 border-[#333333] overflow-hidden group-hover:border-[#ff9900] transition-all duration-300 shadow-lg">
                                            <img
                                                src={photo.url}
                                                alt={`Foto ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <button
                                            onClick={() => photoInputRefs.current[index]?.click()}
                                            className="absolute inset-0 rounded-2xl bg-black/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center border-2 border-[#ff9900]/0 group-hover:border-[#ff9900]"
                                        >
                                            <Camera size={24} className="text-white" />
                                        </button>
                                        <button
                                            onClick={() => handleRemovePhoto(index)}
                                            className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 shadow-lg"
                                        >
                                            <X size={16} />
                                        </button>
                                        <input
                                            ref={el => { photoInputRefs.current[index] = el }}
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handlePhotoChange(e, index)}
                                            className="hidden"
                                        />
                                    </div>
                                ))}

                                {photos.length < 6 && (
                                    <div className="relative group aspect-square">
                                        <button
                                            onClick={() => document.getElementById('add-photo-input')?.click()}
                                            className="w-full h-full rounded-2xl bg-[#1A1A1A] border-2 border-dashed border-[#333333] flex items-center justify-center hover:border-[#ff9900]/50 hover:bg-[#ff9900]/5 transition-all duration-300 group shadow-inner"
                                        >
                                            <Camera size={32} className="text-zinc-600 group-hover:text-[#ff9900] transition-colors" />
                                        </button>
                                        <input
                                            id="add-photo-input"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleAddPhoto}
                                            className="hidden"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bio Section */}
                        <div className="mb-6 p-6 rounded-2xl bg-[#1A1A1A]/50 backdrop-blur-sm border border-[#333333] hover:border-[#ff9900]/30 transition-all duration-300">
                            <div className="flex items-center gap-3 mb-2">
                                <Heart className="text-[#ff9900]" size={22} />
                                <h2 className="text-white text-xl font-bold">Bio</h2>
                            </div>
                            <p className="text-gray-400 text-sm mb-4">Conte um pouco sobre você</p>
                            <textarea
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                maxLength={BIO_MAX_LENGTH}
                                placeholder="Escreva sua bio aqui..."
                                className="w-full h-32 p-4 rounded-xl bg-[#1A1A1A] border-2 border-[#333333] text-white placeholder-gray-500 resize-none focus:outline-none focus:border-[#ff9900]/50 focus:bg-black/50 transition-all duration-300 shadow-inner"
                            />
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-xs text-gray-500">
                                    {bio.length}/{BIO_MAX_LENGTH} caracteres
                                </span>
                                {bio !== originalBio && (
                                    <span className="text-xs text-[#ff9900] animate-pulse">• Não salvo</span>
                                )}
                            </div>
                        </div>

                        {/* Location and Occupation Section */}
                        <div className="mb-8 p-6 rounded-2xl bg-[#1A1A1A]/50 backdrop-blur-sm border border-[#333333] hover:border-[#ff9900]/30 transition-all duration-300">
                            <div className="flex items-center gap-3 mb-2">
                                <MapPin className="text-[#ff9900]" size={22} />
                                <h2 className="text-white text-xl font-bold">Trabalho e Estudo</h2>
                            </div>
                            <p className="text-gray-400 text-sm mb-8">Conte-nos sobre sua vida profissional</p>

                            {/* Occupation */}
                            <div className="mb-0">
                                <div className="flex items-center gap-2 mb-4">
                                    <Briefcase className="text-blue-500" size={16} />
                                    <label className="text-white text-xs font-semibold uppercase tracking-wider">Sua Ocupação</label>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {OCCUPATIONS.map((occ) => (
                                        <button
                                            key={occ}
                                            onClick={() => setOccupation(occ)}
                                            className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${occupation === occ
                                                ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg shadow-orange-900/20'
                                                : 'bg-[#1A1A1A] border border-[#333333] text-gray-500 hover:border-[#444444]'
                                                }`}
                                        >
                                            {occ}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="my-8 border-t border-[#333333]"></div>

                            {/* Education */}
                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-4">
                                    <GraduationCap className="text-indigo-400" size={16} />
                                    <label className="text-white text-xs font-semibold uppercase tracking-wider">Escolaridade</label>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {EDUCATIONS.map((edu) => (
                                        <button
                                            key={edu}
                                            onClick={() => setEducation(edu)}
                                            className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 text-left px-4 ${education === edu
                                                ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg shadow-orange-900/20'
                                                : 'bg-[#1A1A1A] border border-[#333333] text-gray-400 hover:border-[#444444]'
                                                }`}
                                        >
                                            {edu}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Lifestyle Section */}
                        <div className="mb-8 p-6 rounded-2xl bg-[#1A1A1A]/50 backdrop-blur-sm border border-[#333333] hover:border-[#ff9900]/30 transition-all duration-300">
                            <div className="flex items-center gap-3 mb-2">
                                <User className="text-[#ff9900]" size={22} />
                                <h2 className="text-white text-xl font-bold">Estilo de Vida</h2>
                            </div>
                            <p className="text-gray-400 text-sm mb-8">Mais detalhes que ajudam nas combinações</p>

                            {/* Height */}
                            <div className="mb-0">
                                <div className="flex items-center gap-2 mb-4">
                                    <Activity className="text-green-500" size={16} />
                                    <label className="text-white text-xs font-semibold uppercase tracking-wider">Sua Altura</label>
                                </div>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={height}
                                        onChange={(e) => setHeight(e.target.value)}
                                        min="100"
                                        max="250"
                                        placeholder="0"
                                        className="w-full p-4 pr-12 rounded-xl bg-[#1A1A1A] border border-[#333333] text-white placeholder-gray-600 focus:outline-none focus:border-[#ff9900]/50 focus:bg-black/50 transition-all duration-300 shadow-inner"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">cm</span>
                                </div>
                            </div>

                            <div className="my-8 border-t border-[#333333]"></div>

                            {/* Smoking & Drinking */}
                            <div className="grid grid-cols-1 gap-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Cigarette className="text-gray-400" size={16} />
                                        <label className="text-white text-xs font-semibold uppercase tracking-wider">Hábito de Fumar</label>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {SMOKING_OPTIONS.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => setSmoking(opt)}
                                                className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${smoking === opt
                                                    ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg shadow-orange-900/20'
                                                    : 'bg-[#1A1A1A] border border-[#333333] text-gray-500 hover:border-[#444444]'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Wine className="text-purple-400" size={16} />
                                        <label className="text-white text-xs font-semibold uppercase tracking-wider">Hábito de Beber</label>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {DRINKING_OPTIONS.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => setDrinking(opt)}
                                                className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${drinking === opt
                                                    ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg shadow-orange-900/20'
                                                    : 'bg-[#1A1A1A] border border-[#333333] text-gray-500 hover:border-[#444444]'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="my-8 border-t border-[#333333]"></div>

                            {/* Exercise & Diet */}
                            <div className="grid grid-cols-1 gap-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Activity className="text-blue-400" size={16} />
                                        <label className="text-white text-xs font-semibold uppercase tracking-wider">Atividade Física</label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {EXERCISE_OPTIONS.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => setExercise(opt)}
                                                className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${exercise === opt
                                                    ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg shadow-orange-900/20'
                                                    : 'bg-[#1A1A1A] border border-[#333333] text-gray-500 hover:border-[#444444]'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Coffee className="text-yellow-600" size={16} />
                                        <label className="text-white text-xs font-semibold uppercase tracking-wider">Sua Dieta</label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {DIET_OPTIONS.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => setDiet(opt)}
                                                className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${diet === opt
                                                    ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg shadow-orange-900/20'
                                                    : 'bg-[#1A1A1A] border border-[#333333] text-gray-500 hover:border-[#444444]'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="my-8 border-t border-[#333333]"></div>

                            {/* Pets & Children */}
                            <div className="grid grid-cols-1 gap-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Bone className="text-orange-400" size={16} />
                                        <label className="text-white text-xs font-semibold uppercase tracking-wider">Animais de Estimação</label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PETS_OPTIONS.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => setPets(opt)}
                                                className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${pets === opt
                                                    ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg shadow-orange-900/20'
                                                    : 'bg-[#1A1A1A] border border-[#333333] text-gray-500 hover:border-[#444444]'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Baby className="text-blue-300" size={16} />
                                        <label className="text-white text-xs font-semibold uppercase tracking-wider">Sobre Filhos</label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {CHILDREN_OPTIONS.map((opt) => (
                                            <button
                                                key={opt}
                                                onClick={() => setChildren(opt)}
                                                className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${children === opt
                                                    ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg shadow-orange-900/20'
                                                    : 'bg-[#1A1A1A] border border-[#333333] text-gray-500 hover:border-[#444444]'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Life Wishes Section */}
                        <div className="mb-8 p-6 rounded-2xl bg-[#1A1A1A]/50 backdrop-blur-sm border border-[#333333] hover:border-[#ff9900]/30 transition-all duration-300">
                            <div className="flex items-center gap-3 mb-2">
                                <Sparkles className="text-[#ff9900]" size={24} />
                                <h2 className="text-white text-xl font-bold">Desejos de Vida</h2>
                            </div>
                            <p className="text-gray-400 text-sm mb-8">Seus objetivos e aspirações para o futuro</p>

                            {/* Family & Relationships */}
                            <div className="mb-10">
                                <div className="flex items-center gap-2 mb-6">
                                    <Heart className="text-pink-500" size={18} />
                                    <h3 className="text-white font-semibold uppercase tracking-wider text-xs">Família e Relacionamentos</h3>
                                </div>

                                <div className="space-y-6">
                                    {/* Want to Marry */}
                                    <div>
                                        <label className="text-gray-400 text-xs font-medium mb-3 block uppercase tracking-tight">Quer casar?</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {YES_NO_MAYBE.map((opt) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => setWantMarry(opt)}
                                                    className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${wantMarry === opt
                                                        ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg shadow-orange-900/20'
                                                        : 'bg-[#1A1A1A] border border-[#333333] text-gray-500 hover:border-[#444444]'
                                                        }`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Want Children Future */}
                                    <div>
                                        <label className="text-gray-400 text-xs font-medium mb-3 block uppercase tracking-tight">Quer ter filhos?</label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {YES_NO_MAYBE.map((opt) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => setWantChildrenFuture(opt)}
                                                    className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 ${wantChildrenFuture === opt
                                                        ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg shadow-orange-900/20'
                                                        : 'bg-[#1A1A1A] border border-[#333333] text-gray-500 hover:border-[#444444]'
                                                        }`}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Multi-select options */}
                                    <div className="grid grid-cols-1 gap-3">
                                        <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${wantFormFamily
                                            ? 'bg-[#ff9900]/10 border-[#ff9900] text-white'
                                            : 'bg-[#1A1A1A] border-[#333333] text-gray-400'
                                            }`}>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={wantFormFamily}
                                                onChange={(e) => setWantFormFamily(e.target.checked)}
                                            />
                                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${wantFormFamily ? 'bg-[#ff9900] border-[#ff9900]' : 'border-[#444444]'
                                                }`}>
                                                {wantFormFamily && <Check size={14} className="text-black" />}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Home size={16} className={wantFormFamily ? 'text-[#ff9900]' : 'text-gray-600'} />
                                                <span className="text-sm">Quer formar uma família</span>
                                            </div>
                                        </label>

                                        <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${wantStrengthenFamily
                                            ? 'bg-[#ff9900]/10 border-[#ff9900] text-white'
                                            : 'bg-[#1A1A1A] border-[#333333] text-gray-400'
                                            }`}>
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                checked={wantStrengthenFamily}
                                                onChange={(e) => setWantStrengthenFamily(e.target.checked)}
                                            />
                                            <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${wantStrengthenFamily ? 'bg-[#ff9900] border-[#ff9900]' : 'border-[#444444]'
                                                }`}>
                                                {wantStrengthenFamily && <Check size={14} className="text-black" />}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Users size={16} className={wantStrengthenFamily ? 'text-[#ff9900]' : 'text-gray-600'} />
                                                <span className="text-sm">Quer fortalecer laços familiares</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-[#333333] mb-8"></div>

                            {/* Finances & Assets */}
                            <div className="mb-10">
                                <div className="flex items-center gap-2 mb-6">
                                    <Wallet className="text-green-500" size={18} />
                                    <h3 className="text-white font-semibold uppercase tracking-wider text-xs">Finanças e Patrimônio</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${wantFinancialStability
                                        ? 'bg-[#ff9900]/10 border-[#ff9900] text-white'
                                        : 'bg-[#1A1A1A] border-[#333333] text-gray-400'
                                        }`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={wantFinancialStability}
                                            onChange={(e) => setWantFinancialStability(e.target.checked)}
                                        />
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${wantFinancialStability ? 'bg-[#ff9900] border-[#ff9900]' : 'border-[#444444]'
                                            }`}>
                                            {wantFinancialStability && <Check size={14} className="text-black" />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={16} className={wantFinancialStability ? 'text-[#ff9900]' : 'text-gray-600'} />
                                            <span className="text-sm">Quer estabilidade financeira</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${wantBuyHouse
                                        ? 'bg-[#ff9900]/10 border-[#ff9900] text-white'
                                        : 'bg-[#1A1A1A] border-[#333333] text-gray-400'
                                        }`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={wantBuyHouse}
                                            onChange={(e) => setWantBuyHouse(e.target.checked)}
                                        />
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${wantBuyHouse ? 'bg-[#ff9900] border-[#ff9900]' : 'border-[#444444]'
                                            }`}>
                                            {wantBuyHouse && <Check size={14} className="text-black" />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Home size={16} className={wantBuyHouse ? 'text-[#ff9900]' : 'text-gray-600'} />
                                            <span className="text-sm">Quer construir/comprar uma casa</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${wantOwnBusiness
                                        ? 'bg-[#ff9900]/10 border-[#ff9900] text-white'
                                        : 'bg-[#1A1A1A] border-[#333333] text-gray-400'
                                        }`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={wantOwnBusiness}
                                            onChange={(e) => setWantOwnBusiness(e.target.checked)}
                                        />
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${wantOwnBusiness ? 'bg-[#ff9900] border-[#ff9900]' : 'border-[#444444]'
                                            }`}>
                                            {wantOwnBusiness && <Check size={14} className="text-black" />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Building2 size={16} className={wantOwnBusiness ? 'text-[#ff9900]' : 'text-gray-600'} />
                                            <span className="text-sm">Quer abrir o seu próprio negócio</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="border-t border-[#333333] mb-8"></div>

                            {/* Career & Personal */}
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <Briefcase className="text-blue-500" size={18} />
                                    <h3 className="text-white font-semibold uppercase tracking-wider text-xs">Carreira e Pessoal</h3>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${wantProfessionalGrowth
                                        ? 'bg-[#ff9900]/10 border-[#ff9900] text-white'
                                        : 'bg-[#1A1A1A] border-[#333333] text-gray-400'
                                        }`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={wantProfessionalGrowth}
                                            onChange={(e) => setWantProfessionalGrowth(e.target.checked)}
                                        />
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${wantProfessionalGrowth ? 'bg-[#ff9900] border-[#ff9900]' : 'border-[#444444]'
                                            }`}>
                                            {wantProfessionalGrowth && <Check size={14} className="text-black" />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <TrendingUp size={16} className={wantProfessionalGrowth ? 'text-[#ff9900]' : 'text-gray-600'} />
                                            <span className="text-sm">Quer crescer profissionalmente</span>
                                        </div>
                                    </label>
                                    <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${wantTravel
                                        ? 'bg-[#ff9900]/10 border-[#ff9900] text-white'
                                        : 'bg-[#1A1A1A] border-[#333333] text-gray-400'
                                        }`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={wantTravel}
                                            onChange={(e) => setWantTravel(e.target.checked)}
                                        />
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${wantTravel ? 'bg-[#ff9900] border-[#ff9900]' : 'border-[#444444]'
                                            }`}>
                                            {wantTravel && <Check size={14} className="text-black" />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Plane size={16} className={wantTravel ? 'text-[#ff9900]' : 'text-gray-600'} />
                                            <span className="text-sm">Quer viajar</span>
                                        </div>
                                    </label>

                                    <label className={`flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 cursor-pointer ${wantEnjoyLife
                                        ? 'bg-[#ff9900]/10 border-[#ff9900] text-white'
                                        : 'bg-[#1A1A1A] border-[#333333] text-gray-400'
                                        }`}>
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={wantEnjoyLife}
                                            onChange={(e) => setWantEnjoyLife(e.target.checked)}
                                        />
                                        <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${wantEnjoyLife ? 'bg-[#ff9900] border-[#ff9900]' : 'border-[#444444]'
                                            }`}>
                                            {wantEnjoyLife && <Check size={14} className="text-black" />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Sparkles size={16} className={wantEnjoyLife ? 'text-[#ff9900]' : 'text-gray-600'} />
                                            <span className="text-sm">Quer curtir a vida</span>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Interests & Activities Section */}
                        <div className="mb-8 p-6 rounded-2xl bg-[#1A1A1A]/50 backdrop-blur-sm border border-[#333333] hover:border-[#ff9900]/30 transition-all duration-300">
                            <div className="flex items-center gap-3 mb-2">
                                <Sparkles className="text-[#ff9900]" size={24} />
                                <h2 className="text-white text-xl font-bold">Interesses e Atividades</h2>
                            </div>
                            <p className="text-gray-400 text-sm mb-8">O que você gosta de fazer e ouvir</p>

                            {/* Sports */}
                            <div className="mb-10">
                                <div className="flex items-center gap-2 mb-6">
                                    <Trophy className="text-yellow-500" size={18} />
                                    <h3 className="text-white font-semibold uppercase tracking-wider text-xs">Esportes</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {SPORTS_OPTIONS.map((opt) => {
                                        const Icon = opt.icon
                                        return (
                                            <button
                                                key={opt.label}
                                                onClick={() => toggleItem(sports, setSports, opt.label)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border flex items-center gap-2 ${sports.includes(opt.label)
                                                    ? 'bg-[#ff9900]/10 border-[#ff9900] text-white shadow-lg shadow-orange-900/20'
                                                    : 'bg-[#1A1A1A] border-[#333333] text-gray-400 hover:border-[#444444]'
                                                    }`}
                                            >
                                                <Icon size={14} className={sports.includes(opt.label) ? 'text-[#ff9900]' : 'text-gray-500'} />
                                                {opt.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="border-t border-[#333333] mb-8"></div>

                            {/* Hobbies */}
                            <div className="mb-10">
                                <div className="flex items-center gap-2 mb-6">
                                    <Gamepad2 className="text-purple-500" size={18} />
                                    <h3 className="text-white font-semibold uppercase tracking-wider text-xs">Hobbies / Atividades</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {HOBBIES_OPTIONS.map((opt) => {
                                        const Icon = opt.icon
                                        return (
                                            <button
                                                key={opt.label}
                                                onClick={() => toggleItem(hobbies, setHobbies, opt.label)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border flex items-center gap-2 ${hobbies.includes(opt.label)
                                                    ? 'bg-[#ff9900]/10 border-[#ff9900] text-white shadow-lg shadow-orange-900/20'
                                                    : 'bg-[#1A1A1A] border-[#333333] text-gray-400 hover:border-[#444444]'
                                                    }`}
                                            >
                                                <Icon size={14} className={hobbies.includes(opt.label) ? 'text-[#ff9900]' : 'text-gray-500'} />
                                                {opt.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="border-t border-[#333333] mb-8"></div>

                            {/* Music & Dance */}
                            <div className="mb-10">
                                <div className="flex items-center gap-2 mb-6">
                                    <Music className="text-pink-500" size={18} />
                                    <h3 className="text-white font-semibold uppercase tracking-wider text-xs">Música e Dança</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {MUSIC_OPTIONS.map((opt) => {
                                        const Icon = opt.icon
                                        return (
                                            <button
                                                key={opt.label}
                                                onClick={() => toggleItem(musicDance, setMusicDance, opt.label)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border flex items-center gap-2 ${musicDance.includes(opt.label)
                                                    ? 'bg-[#ff9900]/10 border-[#ff9900] text-white shadow-lg shadow-orange-900/20'
                                                    : 'bg-[#1A1A1A] border-[#333333] text-gray-400 hover:border-[#444444]'
                                                    }`}
                                            >
                                                <Icon size={14} className={musicDance.includes(opt.label) ? 'text-[#ff9900]' : 'text-gray-500'} />
                                                {opt.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="border-t border-[#333333] mb-8"></div>

                            {/* Lifestyle & Culture */}
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <Palette className="text-blue-400" size={18} />
                                    <h3 className="text-white font-semibold uppercase tracking-wider text-xs">Estilo de Vida e Cultura</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {LIFESTYLE_OPTIONS.map((opt) => {
                                        const Icon = opt.icon
                                        return (
                                            <button
                                                key={opt.label}
                                                onClick={() => toggleItem(lifestyleCulture, setLifestyleCulture, opt.label)}
                                                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border flex items-center gap-2 ${lifestyleCulture.includes(opt.label)
                                                    ? 'bg-[#ff9900]/10 border-[#ff9900] text-white shadow-lg shadow-orange-900/20'
                                                    : 'bg-[#1A1A1A] border-[#333333] text-gray-400 hover:border-[#444444]'
                                                    }`}
                                            >
                                                <Icon size={14} className={lifestyleCulture.includes(opt.label) ? 'text-[#ff9900]' : 'text-gray-500'} />
                                                {opt.label}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Other Information Section */}
                        <div className="mb-8 p-6 rounded-2xl bg-[#1A1A1A]/50 backdrop-blur-sm border border-[#333333] hover:border-[#ff9900]/30 transition-all duration-300">
                            <div className="flex items-center gap-3 mb-2">
                                <Globe className="text-[#ff9900]" size={24} />
                                <h2 className="text-white text-xl font-bold">Outras Informações</h2>
                            </div>
                            <p className="text-gray-400 text-sm mb-8">Idiomas, crenças e visão de mundo</p>

                            {/* Languages */}
                            <div className="mb-10">
                                <div className="flex items-center gap-2 mb-6">
                                    <Languages className="text-blue-400" size={18} />
                                    <h3 className="text-white font-semibold uppercase tracking-wider text-xs">Idiomas</h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {LANGUAGE_OPTIONS.map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => toggleItem(languages, setLanguages, opt)}
                                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${languages.includes(opt)
                                                ? 'bg-[#ff9900]/10 border-[#ff9900] text-white'
                                                : 'bg-[#1A1A1A] border-[#333333] text-gray-400'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                {languages.includes('Outro') && (
                                    <input
                                        type="text"
                                        value={otherLanguage}
                                        onChange={(e) => setOtherLanguage(e.target.value)}
                                        placeholder="Especifique o idioma..."
                                        className="w-full mt-4 p-4 rounded-xl bg-[#1A1A1A] border border-[#333333] text-white placeholder-gray-600 focus:outline-none focus:border-[#ff9900]/50 transition-all shadow-inner"
                                    />
                                )}
                            </div>

                            <div className="border-t border-[#333333] mb-8"></div>

                            {/* Religion */}
                            <div className="mb-10">
                                <div className="flex items-center gap-2 mb-6">
                                    <Church className="text-purple-400" size={18} />
                                    <h3 className="text-white font-semibold uppercase tracking-wider text-xs">Religião / Crenças</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {RELIGION_OPTIONS.map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setReligion(opt)}
                                            className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 text-left px-4 border ${religion === opt
                                                ? 'bg-[#ff9900]/10 border-[#ff9900] text-white'
                                                : 'bg-[#1A1A1A] border-[#333333] text-gray-400'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                {religion === 'Outro' && (
                                    <input
                                        type="text"
                                        value={otherReligion}
                                        onChange={(e) => setOtherReligion(e.target.value)}
                                        placeholder="Especifique sua religião..."
                                        className="w-full mt-4 p-4 rounded-xl bg-[#1A1A1A] border border-[#333333] text-white placeholder-gray-600 focus:outline-none focus:border-[#ff9900]/50 transition-all shadow-inner"
                                    />
                                )}
                            </div>

                            <div className="border-t border-[#333333] mb-8"></div>

                            {/* Politics */}
                            <div>
                                <div className="flex items-center gap-2 mb-6">
                                    <Scale className="text-emerald-400" size={18} />
                                    <h3 className="text-white font-semibold uppercase tracking-wider text-xs">Visão Política / Ideologia</h3>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {POLITICAL_OPTIONS.map((opt) => (
                                        <button
                                            key={opt}
                                            onClick={() => setPoliticalView(opt)}
                                            className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 text-left px-4 border ${politicalView === opt
                                                ? 'bg-[#ff9900]/10 border-[#ff9900] text-white'
                                                : 'bg-[#1A1A1A] border-[#333333] text-gray-400'
                                                }`}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                {politicalView === 'Outro' && (
                                    <input
                                        type="text"
                                        value={otherPolitical}
                                        onChange={(e) => setOtherPolitical(e.target.value)}
                                        placeholder="Especifique sua visão política..."
                                        className="w-full mt-4 p-4 rounded-xl bg-[#1A1A1A] border border-[#333333] text-white placeholder-gray-600 focus:outline-none focus:border-[#ff9900]/50 transition-all shadow-inner"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Fixed Bottom Button */}
                        <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black via-black to-transparent z-20 pb-10">
                            <div className="max-w-md mx-auto">
                                <button
                                    onClick={handleSave}
                                    disabled={saving || !avatar || !hasChanges}
                                    className={`w-full py-4 rounded-full font-bold text-lg shadow-lg transition-all active:scale-[0.98] ${saving || !avatar || !hasChanges
                                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-orange-900/20 hover:shadow-orange-900/40 hover:scale-[1.02]'
                                        }`}
                                >
                                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
