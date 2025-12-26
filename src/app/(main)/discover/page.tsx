'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Yeseva_One } from 'next/font/google'
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'
import { Bookmark, Send, Info, MessageSquare, SlidersHorizontal, Check, X, Briefcase, Heart, Sparkles, Languages, Church, Scale, Globe, Wallet, Baby, Home, Users, TrendingUp, Plane, Building2, User, Activity, Wine, Cigarette, Coffee, Bone, Trophy, Music, Gamepad2, Palette, Lock } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useProfileNavigator, Profile } from '@/hooks/useProfileNavigator'
import { usePlan } from '@/hooks/usePlan'
import ProfileCard from '@/components/Discover/ProfileCard'

const yesevaOne = Yeseva_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
})

export default function DiscoverPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const navigator = useProfileNavigator()
    const { currentProfile, setProfiles, addProfiles, next } = navigator
    const [showInfo, setShowInfo] = useState(false)
    const [showPreMessage, setShowPreMessage] = useState(false)
    const [showAnonComment, setShowAnonComment] = useState(false)
    const [preMessageText, setPreMessageText] = useState('')
    const [anonCommentText, setAnonCommentText] = useState('')
    const [sending, setSending] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [filters, setFilters] = useState({
        minAge: 18,
        maxAge: 100,
        gender: 'Todos',
        province: 'Todas',
        relationshipGoal: 'Todos'
    })

    const isFetching = useRef(false)
    const { plan, consumeAction } = usePlan()
    const [limitModal, setLimitModal] = useState({ open: false, title: '', message: '' })



    // Pre-loading e Auto-prefetch
    useEffect(() => {
        // Image Pre-loading for active and next profiles
        if (currentProfile) {
            const prefetchPhotos = (p: Profile) => {
                const urls = Array.from(new Set([p.avatar_url, ...(p.photos || [])].filter(url => typeof url === 'string' && url.trim() !== '')))
                urls.forEach(url => {
                    const img = new Image()
                    img.src = url
                })
            }

            prefetchPhotos(currentProfile)
            navigator.queue.slice(0, 2).forEach(prefetchPhotos)
        }

        // Auto-prefetch: Se estivermos perto do fim da fila, procurar mais
        if (userId && navigator.queue.length < 3) {
            fetchProfiles(userId, filters, true)
        }
    }, [currentProfile?.id, navigator.queue.length, userId])

    // Motion values for swipe
    const x = useMotionValue(0)
    const rotate = useTransform(x, [-200, 200], [-25, 25])

    // Unused transforms removed (handled in component)

    const [showMatchModal, setShowMatchModal] = useState(false)
    const [matchDetails, setMatchDetails] = useState<{ match_id: string; profile: Profile } | null>(null)
    const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null)

    useEffect(() => {
        const checkUser = async () => {
            // 1. Try local session first (Fast/Offline)
            const { data: { session } } = await supabase.auth.getSession()

            let user = session?.user || null

            if (!user) {
                // 2. If no local session, try server verification
                const { data: { user: serverUser } } = await supabase.auth.getUser()
                user = serverUser
            }

            if (!user) {
                router.push('/login')
                return
            }
            setUserId(user.id)
            fetchProfiles(user.id, filters)

            // Fetch current user profile for the match modal
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
            if (profile) setCurrentUserProfile(profile)
        }
        checkUser()
    }, [])

    // Enforce Plan Limits on Filters
    useEffect(() => {
        if (showFilters && !plan.limits.filters && currentUserProfile) {
            setFilters(prev => ({
                ...prev,
                gender: currentUserProfile.gender_interest || 'Todos',
                province: currentUserProfile.province || 'Todas',
                relationshipGoal: currentUserProfile.relationship_goal || 'Todos'
            }))
        }
    }, [showFilters, plan.limits.filters, currentUserProfile])

    const fetchProfiles = async (currentUserId: string, currentFilters = filters, append = false) => {
        if (isFetching.current) return
        try {
            isFetching.current = true
            if (!append) setLoading(true)

            // Get profiles excluding current user and those already interacted with
            const [{ data: interactions }, { data: dislikes }, { data: archived }] = await Promise.all([
                supabase.from('likes').select('to_user_id').eq('from_user_id', currentUserId),
                supabase.from('dislikes').select('to_user_id').eq('from_user_id', currentUserId),
                supabase.from('archived_profiles').select('profile_id').eq('user_id', currentUserId)
            ])

            const interactedIds = [
                currentUserId,
                ...(interactions?.map((i: { to_user_id: string }) => i.to_user_id) || []),
                ...(dislikes?.map((d: { to_user_id: string }) => d.to_user_id) || []),
                ...(archived?.map((a: { profile_id: string }) => a.profile_id) || [])
            ]

            // If appending, also exclude profiles already in the current list
            const currentQueueIds = navigator.queue.map(p => p.id)
            const currentId = currentProfile?.id
            const excludeIds = append
                ? [...new Set([...interactedIds, ...currentQueueIds, ...(currentId ? [currentId] : [])])]
                : interactedIds

            let query = supabase
                .from('profiles')
                .select('*')
                .not('id', 'in', `(${excludeIds.join(',')})`)
                .gte('age', currentFilters.minAge)
                .lte('age', currentFilters.maxAge)

            if (currentFilters.gender !== 'Todos') {
                query = query.eq('gender', currentFilters.gender)
            }

            if (currentFilters.province !== 'Todas') {
                query = query.eq('province', currentFilters.province)
            }

            if (currentFilters.relationshipGoal !== 'Todos') {
                query = query.eq('relationship_goal', currentFilters.relationshipGoal)
            }

            const { data: profilesData, error } = await query.limit(10)

            if (error) {
                console.error('Supabase error details:', {
                    message: error.message,
                    details: error.details,
                    hint: error.hint,
                    code: error.code
                })
                throw error
            }

            if (append) {
                if (profilesData && profilesData.length > 0) {
                    addProfiles(profilesData)
                }
            } else {
                setProfiles(profilesData || [])
            }
        } catch (err) {
            console.error('Erro ao buscar perfis:', err)
        } finally {
            isFetching.current = false
            if (!append) setLoading(false)
        }
    }

    // Resolve current photo for PREFETCH only (Component handles display)
    const profilePhotos = currentProfile
        ? Array.from(new Set([currentProfile.avatar_url, ...(currentProfile.photos || [])].filter(p => typeof p === 'string' && p.trim() !== '')))
        : []

    // Direction state for robust exit animations
    const [exitDir, setExitDir] = useState<'left' | 'right' | 'down'>('right')

    // Variants for Top Card
    const swipeVariants = {
        initial: { scale: 1, opacity: 1, x: 0, rotate: 0 }, // Starts full size to match bg card
        animate: {
            scale: 1,
            opacity: 1,
            x: 0,
            rotate: 0,
            transition: {
                type: "spring",
                stiffness: 300,
                damping: 25,
                duration: 0.3
            }
        },
        exit: (direction: 'left' | 'right' | 'down') => ({
            x: direction === 'right' ? 1000 : direction === 'left' ? -1000 : 0,
            y: direction === 'down' ? 1000 : 0,
            opacity: 0,
            scale: 1, // Exit at full scale
            rotate: direction === 'right' ? 20 : direction === 'left' ? -20 : 0,
            transition: { duration: 0.4, ease: "easeIn" }
        })
    }

    const handleSwipe = (direction: 'left' | 'right') => {
        if (!currentProfile || !userId) return

        const profileId = currentProfile.id
        const profileSnapshot = { ...currentProfile }

        // OPTIMISTIC UPDATES: Update UI and History immediately in memory
        setExitDir(direction)
        const action = direction === 'right' ? 'like' : 'dislike'
        next(action)

        // Background DB Operations
        const dbOp = async () => {
            try {
                if (direction === 'right') {
                    const { data, error } = await supabase.rpc('like_user', {
                        target_user_id: profileId
                    })
                    if (error) throw error

                    if (data?.is_match) {
                        setMatchDetails({ match_id: data.match_id, profile: profileSnapshot })
                        setShowMatchModal(true)
                    }
                } else {
                    await supabase.from('dislikes').insert({ from_user_id: userId, to_user_id: profileId })
                }
            } catch (err) {
                console.error('Error persisting swipe:', err)
            }
        }
        dbOp()
    }

    const onDragEnd = (_: any, info: any) => {
        const swipe = info.offset.x
        const velocity = info.velocity.x

        if (swipe > 100 || (swipe > 50 && velocity > 500)) {
            handleSwipe('right')
        } else if (swipe < -100 || (swipe < -50 && velocity < -500)) {
            handleSwipe('left')
        }
    }

    const handleArchive = async () => {
        if (!currentProfile || !userId) return

        // Check Limit
        if (plan.limits.archive < 999999 && plan.usage.archive >= plan.limits.archive) {
            setLimitModal({
                open: true,
                title: 'Limite de Arquivos',
                message: 'Atingiste o limite do teu plano.\n\nPlano Sanzala: máx 5 perfis\nPlano VIP: máx 10 perfis\nPlano Premium: Sem limitações'
            })
            return
        }

        const profileId = currentProfile.id
        const profileSnapshot = { ...currentProfile } // Snapshot for verifying UI update if needed

        // Optimistic update
        setExitDir('down')
        next('archive')

        await supabase.from('archived_profiles').insert({ user_id: userId, profile_id: profileId })
        // Increment usage locally? usePlan does optimistic update on consume, but this is manual check.
        // We rely on simple check for now, perfectly accurate usage update would require refetch or manual increment.
        plan.usage.archive += 1
    }

    const sendPreMatchMessage = async () => {
        if (!preMessageText.trim() || !userId || !currentProfile) return

        // Check Limit
        if (!plan.limits.preMatch) {
            setLimitModal({
                open: true,
                title: 'Mensagem Pre-Match',
                message: 'Apenas membros Premium podem enviar mensagens antes do Match. Destaca-te na multidão!'
            })
            return
        }

        const profileId = currentProfile.id
        setSending(true)

        // Optimistic UI Update
        setShowPreMessage(false)
        setPreMessageText('')
        setExitDir('right')
        next('like')

        try {
            await supabase.from('pre_match_messages').insert({
                from_user_id: userId,
                to_user_id: profileId,
                content: preMessageText.trim()
            })
        } catch (err) {
            console.error('Error sending pre-match message:', err)
            // Optional: revert logic if needed, but for now simple log.
        } finally {
            setSending(false)
        }
    }

    const sendAnonComment = async () => {
        if (!anonCommentText.trim() || !currentProfile) return

        // Check Limit
        const canComment = await consumeAction('comments', 1)
        if (!canComment) {
            setLimitModal({
                open: true,
                title: 'Limite de Segredos',
                message: 'Atingiste o limite diário de segredos.\n\nPlano Sanzala: máx 3 por dia\nPlano VIP: máx 7 por dia\nPlano Premium: Sem limitações'
            })
            return
        }

        setSending(true)
        try {
            // Send comment AND Like the user to facilitate future matching
            await Promise.all([
                supabase.from('anonymous_comments').insert({
                    to_user_id: currentProfile.id,
                    from_user_id: userId, // Internal only
                    content: anonCommentText.trim()
                }),
                supabase.rpc('like_user', { target_user_id: currentProfile.id })
            ])

            setShowAnonComment(false)
            setAnonCommentText('')
        } finally {
            setSending(false)
        }
    }

    // Styles for Background Cards
    const getStackStyle = (index: number) => {
        // Full screen static stack
        return {
            scale: 1,
            y: 0,
            zIndex: 10 - index,
            filter: 'none', // No brightness dimming
            originY: 0.5
        }
    }

    return (
        <div className="relative h-full w-full bg-black overflow-hidden flex flex-col">
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-white text-xl animate-pulse">A procurar corações...</div>
                </div>
            ) : (!currentProfile || !currentProfile.id) ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden z-[50] bg-black">
                    {/* Background Glow */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] aspect-square bg-gradient-to-br from-[#ff0800]/20 via-transparent to-[#ff9900]/20 blur-[120px] rounded-full pointer-events-none" />

                    <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
                        <div className="w-28 h-28 rounded-[38px] bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center mb-10 shadow-2xl">
                            <SlidersHorizontal className="text-[#ff9900]" size={42} />
                        </div>

                        <h2 className={`${yesevaOne.className} text-white text-3xl mb-4`}>
                            Sem mais corações...
                        </h2>

                        <p className="text-gray-400 text-sm leading-relaxed mb-12 px-6">
                            Exploraste todos os perfis na tua área com estes filtros. Tenta expandir a tua busca!
                        </p>

                        <div className="flex flex-col gap-3 w-full">
                            <button
                                onClick={() => fetchProfiles(userId!, filters)}
                                className="w-full py-5 rounded-[24px] bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-bold text-lg shadow-[0_10px_30px_rgba(255,8,0,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 group"
                            >
                                <Sparkles size={20} className="group-hover:rotate-12 transition-transform" />
                                Tentar de Novo
                            </button>
                            <button
                                onClick={() => setShowFilters(true)}
                                className="w-full py-5 rounded-[24px] bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all active:scale-95 backdrop-blur-xl"
                            >
                                Ajustar Filtros
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="relative flex-1 w-full overflow-hidden">
                    {/* STACK IMPLEMENTATION */}



                    {/* Correct Background Rendering Order: Furthest first */}
                    {(navigator.queue.length > 1) && (
                        <ProfileCard
                            key={navigator.queue[1].id}
                            profile={navigator.queue[1]}
                            isFront={false}
                            style={getStackStyle(1)}
                        />
                    )}

                    {(navigator.queue.length > 0) && (
                        <ProfileCard
                            key={navigator.queue[0].id}
                            profile={navigator.queue[0]}
                            isFront={false}
                            style={getStackStyle(0)}
                        />
                    )}

                    {/* Main Swipe Area (Top Card) */}
                    <AnimatePresence custom={exitDir}>
                        <ProfileCard
                            key={currentProfile.id}
                            profile={currentProfile}
                            isFront={true}
                            dragHandlers={{ onDragEnd: onDragEnd }}
                            dragX={x}
                            style={{ x, rotate, zIndex: 20 }}
                            variants={swipeVariants}
                        />
                    </AnimatePresence>

                    {/* Bottom Actions Bar - Floating above the Glass NavBar */}
                    <div className="absolute bottom-28 left-0 right-0 px-6 z-30 flex items-center justify-between max-w-lg mx-auto w-full">
                        <button
                            onClick={() => setShowFilters(true)}
                            className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white transition-all hover:bg-white/20 active:scale-90"
                        >
                            <SlidersHorizontal size={24} />
                        </button>

                        <button
                            onClick={handleArchive}
                            className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-2xl border border-white/20 flex items-center justify-center text-white transition-all hover:bg-white/10 active:scale-90"
                        >
                            <Bookmark size={24} />
                        </button>

                        <button
                            onClick={() => setShowPreMessage(true)}
                            className="w-20 h-20 rounded-full bg-gradient-to-br from-[#ff0800] to-[#ff9900] flex items-center justify-center text-white shadow-2xl shadow-[#ff0800]/40 transition-all hover:scale-110 active:scale-95 border-2 border-white/20"
                        >
                            <Send size={32} />
                        </button>

                        <button
                            onClick={() => setShowInfo(true)}
                            className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white transition-all hover:bg-white/20 active:scale-90"
                        >
                            <Info size={24} />
                        </button>

                        <button
                            onClick={() => setShowAnonComment(true)}
                            className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white transition-all hover:bg-white/20 active:scale-90"
                        >
                            <MessageSquare size={24} />
                        </button>
                    </div>
                </div>
            )}

            {/* Slide-up Bottom Sheets (Always available) */}

            {/* Profile Info Sheet */}
            <AnimatePresence>
                {showInfo && currentProfile && (
                    <>
                        <motion.div key="info-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowInfo(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
                        />
                        <motion.div key="info-modal"
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 h-[85vh] bg-[#0A0A0A] rounded-t-[40px] z-[70] p-8 pb-24 overflow-y-auto no-scrollbar border-t border-white/10 shadow-2xl"
                        >
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />



                            <h2 className={`${yesevaOne.className} text-3xl text-white mb-8`}>Sobre {currentProfile.first_name} {currentProfile.last_name}</h2>
                            <div className="space-y-6 pb-20">
                                {/* Bio */}
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/5 mb-8">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Heart className="text-[#ff9900]" size={18} />
                                        <span className="text-white text-xs font-bold uppercase tracking-widest">Bio</span>
                                    </div>
                                    <p className="text-gray-400 leading-relaxed italic">"{currentProfile.bio || 'Sem biografia disponível.'}"</p>
                                </div>

                                <div className="space-y-8">
                                    {/* Trabalho e Estudo */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <Briefcase className="text-blue-500" size={20} />
                                            <h3 className="text-white text-lg font-bold">Trabalho e Estudo</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Ocupação</div>
                                                <div className="text-gray-300 text-sm font-medium">{currentProfile.occupation || 'Não informado'}</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Escolaridade</div>
                                                <div className="text-gray-300 text-sm font-medium">{currentProfile.education || 'Não informado'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Estilo de Vida */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <User className="text-[#ff9900]" size={20} />
                                            <h3 className="text-white text-lg font-bold">Estilo de Vida</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Activity className="text-green-500" size={14} />
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Altura</span>
                                                </div>
                                                <div className="text-gray-300 text-sm">{currentProfile.height ? `${currentProfile.height} cm` : 'Não informado'}</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Cigarette className="text-gray-400" size={14} />
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Fumar</span>
                                                </div>
                                                <div className="text-gray-300 text-sm">{currentProfile.smoking || 'Não informado'}</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Wine className="text-purple-400" size={14} />
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Beber</span>
                                                </div>
                                                <div className="text-gray-300 text-sm">{currentProfile.drinking || 'Não informado'}</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Activity className="text-blue-400" size={14} />
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Exercício</span>
                                                </div>
                                                <div className="text-gray-300 text-sm">{currentProfile.exercise || 'Não informado'}</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Coffee className="text-yellow-600" size={14} />
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Dieta</span>
                                                </div>
                                                <div className="text-gray-300 text-sm">{currentProfile.diet || 'Não informado'}</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Bone className="text-orange-400" size={14} />
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Pets</span>
                                                </div>
                                                <div className="text-gray-300 text-sm">{currentProfile.pets || 'Não informado'}</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 col-span-2">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Baby className="text-blue-300" size={14} />
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Filhos</span>
                                                </div>
                                                <div className="text-gray-300 text-sm">{currentProfile.children || 'Não informado'}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Desejos de Vida */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <Sparkles className="text-[#ff9900]" size={20} />
                                            <h3 className="text-white text-lg font-bold">Desejos de Vida</h3>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Família */}
                                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Heart className="text-pink-500" size={16} />
                                                    <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Família e Relacionamentos</span>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 mb-4">
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-1">Quer Casar?</div>
                                                        <div className="text-sm text-white">{currentProfile.want_marry || '---'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-1">Quer Filhos?</div>
                                                        <div className="text-sm text-white">{currentProfile.want_children_future || '---'}</div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    {[
                                                        { label: 'Formar Família', val: currentProfile.want_form_family, icon: Home },
                                                        { label: 'Fortalecer Laços', val: currentProfile.want_strengthen_family, icon: Users }
                                                    ].map((item, i) => (
                                                        <div key={i} className={`flex items-center gap-3 text-sm ${item.val ? 'text-white' : 'text-gray-600'}`}>
                                                            {item.val ? <Check size={14} className="text-[#ff9900]" /> : <X size={14} />}
                                                            <div className="flex items-center gap-2">
                                                                <item.icon size={14} className={item.val ? "text-[#ff9900]" : "opacity-50"} />
                                                                <span>{item.label}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Finanças */}
                                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Wallet className="text-green-500" size={16} />
                                                    <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Finanças e Patrimônio</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {[
                                                        { label: 'Estabilidade Financeira', val: currentProfile.want_financial_stability, icon: Sparkles },
                                                        { label: 'Casa Própria', val: currentProfile.want_buy_house, icon: Home },
                                                        { label: 'Negócio Próprio', val: currentProfile.want_own_business, icon: Building2 }
                                                    ].map((item, i) => (
                                                        <div key={i} className={`flex items-center gap-3 text-sm ${item.val ? 'text-white' : 'text-gray-600'}`}>
                                                            {item.val ? <Check size={14} className="text-[#ff9900]" /> : <X size={14} />}
                                                            <div className="flex items-center gap-2">
                                                                <item.icon size={14} className={item.val ? "text-[#ff9900]" : "opacity-50"} />
                                                                <span>{item.label}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Carreira */}
                                            <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <Briefcase className="text-blue-500" size={16} />
                                                    <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Carreira e Pessoal</span>
                                                </div>
                                                <div className="space-y-2">
                                                    {[
                                                        { label: 'Crescer Profissionalmente', val: currentProfile.want_professional_growth, icon: TrendingUp },
                                                        { label: 'Viajar', val: currentProfile.want_travel, icon: Plane },
                                                        { label: 'Curtir a Vida', val: currentProfile.want_enjoy_life, icon: Sparkles }
                                                    ].map((item, i) => (
                                                        <div key={i} className={`flex items-center gap-3 text-sm ${item.val ? 'text-white' : 'text-gray-600'}`}>
                                                            {item.val ? <Check size={14} className="text-[#ff9900]" /> : <X size={14} />}
                                                            <div className="flex items-center gap-2">
                                                                <item.icon size={14} className={item.val ? "text-[#ff9900]" : "opacity-50"} />
                                                                <span>{item.label}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Interesses e Atividades */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <Trophy className="text-yellow-500" size={20} />
                                            <h3 className="text-white text-lg font-bold">Interesses</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {[
                                                { label: 'Esportes', items: currentProfile.sports, icon: Trophy, color: 'text-yellow-500' },
                                                { label: 'Hobbies', items: currentProfile.hobbies, icon: Gamepad2, color: 'text-purple-500' },
                                                { label: 'Música', items: currentProfile.music_dance, icon: Music, color: 'text-pink-500' },
                                                { label: 'Cultura', items: currentProfile.lifestyle_culture, icon: Palette, color: 'text-blue-400' }
                                            ].map((section) => (
                                                <div key={section.label} className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <section.icon className={section.color} size={16} />
                                                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">{section.label}</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {section.items && section.items.length > 0 ? (
                                                            section.items.map(tag => (
                                                                <span key={tag} className="px-3 py-1 rounded-full bg-white/10 text-xs text-white border border-white/10">
                                                                    {tag}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-gray-600 text-xs italic">Nenhum selecionado</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Outras Informações */}
                                    <div>
                                        <div className="flex items-center gap-3 mb-6">
                                            <Globe className="text-[#ff9900]" size={20} />
                                            <h3 className="text-white text-lg font-bold">Outros</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <Languages className="text-blue-400" size={16} />
                                                    <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Idiomas</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {(currentProfile.languages && currentProfile.languages.length > 0) || currentProfile.other_language ? (
                                                        <>
                                                            {currentProfile.languages?.map(l => (
                                                                <span key={l} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-200 text-xs border border-blue-500/20">{l}</span>
                                                            ))}
                                                            {currentProfile.other_language && (
                                                                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-200 text-xs border border-blue-500/20">{currentProfile.other_language}</span>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <span className="text-gray-600 text-xs italic">Não informado</span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Church className="text-purple-400" size={16} />
                                                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Religião</span>
                                                    </div>
                                                    <div className="text-sm text-white">{currentProfile.other_religion || currentProfile.religion || '---'}</div>
                                                </div>
                                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Scale className="text-emerald-400" size={16} />
                                                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Política</span>
                                                    </div>
                                                    <div className="text-sm text-white">{currentProfile.other_political || currentProfile.political_view || '---'}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Pre-Match Message Sheet */}
            <AnimatePresence>
                {showPreMessage && currentProfile && (
                    <>
                        <motion.div key="prematch-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowPreMessage(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
                        />
                        <motion.div key="prematch-modal"
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] rounded-t-[40px] z-[70] p-8 pb-24 border-t border-white/10"
                        >
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
                            <h2 className={`${yesevaOne.className} text-2xl text-white mb-2 text-center`}>Mensagem Direta</h2>
                            <p className="text-gray-500 text-center text-sm mb-8 italic">Impressiona {currentProfile.first_name} antes do match!</p>
                            <textarea
                                value={preMessageText}
                                onChange={(e) => setPreMessageText(e.target.value)}
                                placeholder="Escreve algo especial..."
                                className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff9900]/50 transition-all resize-none mb-6"
                            />
                            <button
                                onClick={sendPreMatchMessage}
                                disabled={sending || !preMessageText.trim()}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-bold text-lg shadow-lg active:scale-95 transition-all disabled:opacity-50"
                            >
                                {sending ? 'A enviar...' : 'Enviar Mensagem'}
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Anonymous Comment Sheet */}
            <AnimatePresence>
                {showAnonComment && currentProfile && (
                    <>
                        <motion.div key="anon-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowAnonComment(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
                        />
                        <motion.div key="anon-modal"
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] rounded-t-[40px] z-[70] p-8 pb-24 border-t border-white/10"
                        >
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
                            <h2 className={`${yesevaOne.className} text-2xl text-white mb-2 text-center`}>Comentário Anónimo</h2>
                            <p className="text-gray-500 text-center text-sm mb-8 italic">Diz o que sentes, sem revelares quem és.</p>
                            <textarea
                                value={anonCommentText}
                                onChange={(e) => setAnonCommentText(e.target.value)}
                                placeholder="O que achas deste perfil?"
                                className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff9900]/50 transition-all resize-none mb-6"
                            />
                            <button
                                onClick={sendAnonComment}
                                disabled={sending || !anonCommentText.trim()}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-bold text-lg shadow-lg active:scale-95 transition-all disabled:opacity-50"
                            >
                                {sending ? 'A enviar...' : 'Enviar Comentário'}
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Filters Sheet */}
            <AnimatePresence>
                {showFilters && (
                    <>
                        <motion.div key="filters-backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowFilters(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
                        />
                        <motion.div key="filters-modal"
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] rounded-t-[40px] z-[70] p-8 pb-32 border-t border-white/10 overflow-y-auto no-scrollbar max-h-[90vh]"
                        >
                            <button
                                onClick={() => setShowFilters(false)}
                                className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
                            <h2 className={`${yesevaOne.className} text-2xl text-white mb-6 text-center`}>Filtros de Descoberta</h2>

                            {/* Age Filter */}
                            <div className="mb-8">
                                <label className="text-gray-400 text-sm font-bold uppercase tracking-widest block mb-4">Idade: {filters.minAge} - {filters.maxAge}</label>
                                <div className="flex gap-4 items-center">
                                    <input
                                        type="range" min="18" max="100" value={filters.minAge}
                                        onChange={(e) => setFilters({ ...filters, minAge: parseInt(e.target.value) })}
                                        className="flex-1 accent-[#ff9900]"
                                    />
                                    <input
                                        type="range" min="18" max="100" value={filters.maxAge}
                                        onChange={(e) => setFilters({ ...filters, maxAge: parseInt(e.target.value) })}
                                        className="flex-1 accent-[#ff9900]"
                                    />
                                </div>
                            </div>

                            {/* Gender Filter */}
                            <div className="mb-8 relative">
                                <label className="text-gray-400 text-sm font-bold uppercase tracking-widest block mb-4">Gênero</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['Todos', 'Masculino', 'Feminino', 'Outro'].map(opt => (
                                        <button
                                            key={opt}
                                            onClick={() => setFilters({ ...filters, gender: opt })}
                                            className={`py-3 rounded-xl border transition-all ${filters.gender === opt ? 'bg-[#ff9900] border-[#ff9900] text-white' : 'bg-white/5 border-white/10 text-gray-400'}`}
                                            disabled={!plan.limits.filters}
                                        >
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                                {!plan.limits.filters && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl border border-white/5">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-[#ff9900]/20 flex items-center justify-center text-[#ff9900]">
                                                <Lock size={20} />
                                            </div>
                                            <span className="text-white text-xs font-bold uppercase tracking-widest">Plano VIP</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Province Filter */}
                            <div className="mb-8 relative">
                                <label className="text-gray-400 text-sm font-bold uppercase tracking-widest block mb-4">Província</label>
                                <select
                                    value={filters.province}
                                    onChange={(e) => setFilters({ ...filters, province: e.target.value })}
                                    disabled={!plan.limits.filters}
                                    className="w-full py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#ff9900] disabled:opacity-50"
                                >
                                    <option value="Todas" className="bg-[#1A1A1A]">Todas as Províncias</option>
                                    {['Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango', 'Cuanza Norte', 'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla', 'Luanda', 'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico', 'Namibe', 'Uíge', 'Zaire'].map(p => (
                                        <option key={p} value={p} className="bg-[#1A1A1A]">{p}</option>
                                    ))}
                                </select>
                                {!plan.limits.filters && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl border border-white/5">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-[#ff9900]/20 flex items-center justify-center text-[#ff9900]">
                                                <Lock size={20} />
                                            </div>
                                            <span className="text-white text-xs font-bold uppercase tracking-widest">Plano VIP</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Relationship Goal Filter */}
                            <div className="mb-10 relative">
                                <label className="text-gray-400 text-sm font-bold uppercase tracking-widest block mb-4">Intenção de Relacionamento</label>
                                <select
                                    value={filters.relationshipGoal}
                                    onChange={(e) => setFilters({ ...filters, relationshipGoal: e.target.value })}
                                    disabled={!plan.limits.filters}
                                    className="w-full py-4 px-6 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[#ff9900] disabled:opacity-50"
                                >
                                    <option value="Todos" className="bg-[#1A1A1A]">Todos os Objetivos</option>
                                    {['Relacionamento Sério', 'Amizade', 'Ficar', 'Encontro Casual'].map(g => (
                                        <option key={g} value={g} className="bg-[#1A1A1A]">{g}</option>
                                    ))}
                                </select>
                                {!plan.limits.filters && (
                                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl border border-white/5">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-full bg-[#ff9900]/20 flex items-center justify-center text-[#ff9900]">
                                                <Lock size={20} />
                                            </div>
                                            <span className="text-white text-xs font-bold uppercase tracking-widest">Plano VIP</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => {
                                    setShowFilters(false)
                                    fetchProfiles(userId!, filters)
                                }}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-bold text-lg shadow-lg active:scale-95 transition-all"
                            >
                                Aplicar Filtros
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Limit Modal */}
            <AnimatePresence>
                {limitModal.open && (
                    <>
                        <motion.div key="limit-backdrop"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80]"
                            onClick={() => setLimitModal(prev => ({ ...prev, open: false }))}
                        />
                        <motion.div key="limit-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="fixed inset-4 m-auto h-fit max-w-sm bg-[#1A1A1A] rounded-[32px] border border-[#ff9900]/30 p-8 z-[90] text-center overflow-hidden"
                        >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#ff9900]/10 blur-[80px] pointer-events-none" />
                            <div className="relative z-10">
                                <div className="w-20 h-20 mx-auto rounded-full bg-[#ff9900]/10 flex items-center justify-center mb-6 border border-[#ff9900]/20">
                                    <Lock size={40} className="text-[#ff9900]" />
                                </div>
                                <h3 className={`${yesevaOne.className} text-2xl text-white mb-2`}>{limitModal.title}</h3>
                                <p className="text-gray-400 text-sm mb-8 leading-relaxed whitespace-pre-line">
                                    {limitModal.message}
                                </p>
                                <button
                                    onClick={() => router.push('/plans')}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-bold text-lg shadow-lg shadow-orange-500/20 active:scale-95 transition-all mb-4"
                                >
                                    Ver Planos VIP
                                </button>
                                <button
                                    onClick={() => setLimitModal(prev => ({ ...prev, open: false }))}
                                    className="text-gray-500 text-sm font-semibold hover:text-white transition-colors"
                                >
                                    Fechar
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Match Modal */}
            <AnimatePresence>
                {showMatchModal && matchDetails && (
                    <motion.div key="match-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex flex-col items-center justify-center p-6"
                    >
                        {/* Animated Background Hearts */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {[...Array(6)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{
                                        opacity: 0,
                                        scale: 0,
                                        x: Math.random() * 400 - 200,
                                        y: Math.random() * 400 - 200,
                                        rotate: Math.random() * 360
                                    }}
                                    animate={{
                                        opacity: [0, 0.4, 0],
                                        scale: [0, 1.5, 0],
                                        y: [0, -400],
                                        rotate: i % 2 === 0 ? 360 : -360
                                    }}
                                    transition={{
                                        duration: 3 + Math.random() * 2,
                                        repeat: Infinity,
                                        delay: Math.random() * 2
                                    }}
                                    className="absolute top-1/2 left-1/2 text-[#ff2d00]/20"
                                >
                                    <Heart size={40 + Math.random() * 60} fill="currentColor" />
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            className="relative z-10 flex flex-col items-center max-w-sm w-full"
                        >
                            <div className="mb-12 relative flex items-center justify-center">
                                <motion.div
                                    initial={{ x: -20, rotate: -10 }}
                                    animate={{ x: 10, rotate: -12 }}
                                    className="w-36 h-36 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl relative z-10"
                                >
                                    <img
                                        src={currentUserProfile?.avatar_url || '/default-avatar.png'}
                                        className="w-full h-full object-cover"
                                        alt="Tu"
                                    />
                                </motion.div>
                                <motion.div
                                    initial={{ x: 20, rotate: 10 }}
                                    animate={{ x: -10, rotate: 12 }}
                                    className="w-36 h-36 rounded-[40px] overflow-hidden border-4 border-white shadow-2xl relative z-20 -ml-12"
                                >
                                    <img
                                        src={matchDetails.profile.avatar_url || '/default-avatar.png'}
                                        className="w-full h-full object-cover"
                                        alt={matchDetails.profile.first_name}
                                    />
                                </motion.div>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.4, type: "spring" }}
                                    className="absolute -bottom-4 z-[30] bg-[#ff2d00] p-3 rounded-2xl shadow-xl shadow-[#ff2d00]/40"
                                >
                                    <Heart size={24} fill="white" className="text-white" />
                                </motion.div>
                            </div>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-center mb-12"
                            >
                                <h1 className={`${yesevaOne.className} text-5xl text-white mb-4 drop-shadow-[0_10px_10px_rgba(255,45,0,0.3)]`}>
                                    É um Match!
                                </h1>
                                <p className="text-gray-300 text-lg px-4 text-center leading-relaxed">
                                    Tu e a <span className="text-[#ff9900] font-bold">{matchDetails.profile.first_name}</span> curtiram-se mutuamente. Podem começar a conversar agora!
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="flex flex-col gap-4 w-full"
                            >
                                <button
                                    onClick={() => router.push(`/chat/${matchDetails.match_id}`)}
                                    className="w-full py-5 rounded-[24px] bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-black uppercase tracking-[0.2em] text-sm shadow-[0_15px_30px_rgba(255,8,0,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    <MessageSquare size={20} fill="currentColor" />
                                    Enviar Mensagem
                                </button>
                                <button
                                    onClick={() => setShowMatchModal(false)}
                                    className="w-full py-5 rounded-[24px] bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all active:scale-95 backdrop-blur-xl"
                                >
                                    Continuar a Deslizar
                                </button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    )
}
