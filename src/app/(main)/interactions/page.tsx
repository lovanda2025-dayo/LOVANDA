'use client'

import { useState, useEffect } from 'react'
import { Yeseva_One } from 'next/font/google'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Heart,
    MessageSquare,
    Archive,
    User,
    Clock,
    UserMinus,
    MapPin,
    Briefcase,
    GraduationCap,
    Sparkles,
    Church,
    X,
    MessageCircle,
    Undo2, Bookmark, Send, Info, SlidersHorizontal, Check, Languages, Scale, Globe, Wallet, Baby, Home, Users, TrendingUp, Plane, Building2, Activity, Wine, Cigarette, Coffee, Bone, Trophy, Music, Gamepad2, Palette, Waves, Footprints, Dumbbell, Swords, Bike, Zap, Book, Tv, Utensils, Flower2, Scissors, Fish, Mic2, Disc, PartyPopper, HandHeart, Cloud, Shirt, Cpu, Ticket, Map
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import { usePlan } from '@/hooks/usePlan'
import { Lock } from 'lucide-react'

const yesevaOne = Yeseva_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
})

interface Profile {
    id: string
    first_name: string
    last_name?: string
    avatar_url: string
    age: number
    province: string
    bio?: string
    occupation?: string
    education?: string
    lifestyle_culture?: string[]
    religion?: string
    relationship_goal?: string
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
    political_view?: string
    languages?: string[]
}

interface InteractionLike {
    id: string
    from_user: Profile
    created_at: string
}

interface AnonymousComment {
    id: string
    content: string
    created_at: string
    from_user?: Profile
}

interface ArchivedProfile {
    id: string
    profile: Profile
    created_at: string
}

type TabType = 'likes' | 'comments' | 'archived'

export default function InteractionsPage() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState<TabType>('likes')
    const [loading, setLoading] = useState(true)
    const [userId, setUserId] = useState<string | null>(null)
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)

    const [likes, setLikes] = useState<InteractionLike[]>([])
    const [comments, setComments] = useState<AnonymousComment[]>([])
    const [archives, setArchives] = useState<ArchivedProfile[]>([])
    const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null)
    const [showInfo, setShowInfo] = useState(false)

    // Interaction Sheets State
    const [preMessageText, setPreMessageText] = useState('')
    const [anonCommentText, setAnonCommentText] = useState('')
    const [showPreMessage, setShowPreMessage] = useState(false)
    const [showAnonComment, setShowAnonComment] = useState(false)
    const [sending, setSending] = useState(false)

    // Match Modal State
    const [showMatchModal, setShowMatchModal] = useState(false)
    const [lastMatch, setLastMatch] = useState<any>(null)
    const [limitModal, setLimitModal] = useState({ open: false, title: '', message: '' })

    // Plan Limits
    const { plan, consumeAction } = usePlan()

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
                loadAllData(user.id)

                // Fetch current user profile for the match modal
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                if (profile) setCurrentUserProfile(profile)
            } else {
                router.push('/login')
            }
        }
        checkUser()
    }, [])

    const loadAllData = async (currentUserId: string) => {
        setLoading(true)
        try {
            // 1. Fetch Likes Received
            const { data: likesData } = await supabase
                .from('likes')
                .select(`
                    id,
                    created_at,
                    from_user_id
                `)
                .eq('to_user_id', currentUserId)
                .order('created_at', { ascending: false })

            if (likesData) {
                const formattedLikes: InteractionLike[] = []
                for (const like of likesData) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', like.from_user_id)
                        .single()
                    if (profile) {
                        formattedLikes.push({
                            id: like.id,
                            created_at: like.created_at,
                            from_user: profile
                        })
                    }
                }
                setLikes(formattedLikes)
            }

            // 2. Fetch Anonymous Comments
            const { data: commentsData } = await supabase
                .from('anonymous_comments')
                .select('*, from_user_id')
                .eq('to_user_id', currentUserId)
                .order('created_at', { ascending: false })

            if (commentsData) {
                const formattedComments: AnonymousComment[] = []
                for (const comment of commentsData) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', comment.from_user_id)
                        .single()

                    formattedComments.push({
                        ...comment,
                        from_user: profile || undefined
                    })
                }
                setComments(formattedComments)
            }

            // 3. Fetch Archived Profiles
            const { data: archivesData } = await supabase
                .from('archived_profiles')
                .select(`
                    id,
                    created_at,
                    profile_id
                `)
                .eq('user_id', currentUserId)
                .order('created_at', { ascending: false })

            if (archivesData) {
                const formattedArchives: ArchivedProfile[] = []
                for (const arch of archivesData) {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', arch.profile_id)
                        .single()
                    if (profile) {
                        formattedArchives.push({
                            id: arch.id,
                            created_at: arch.created_at,
                            profile: profile
                        })
                    }
                }
                setArchives(formattedArchives)
            }

        } catch (error) {
            console.error('Erro ao carregar interações:', error)
        } finally {
            setLoading(false)
        }
    }

    const unarchiveProfile = async (archiveId: string) => {
        try {
            const { error } = await supabase
                .from('archived_profiles')
                .delete()
                .eq('id', archiveId)

            if (!error) {
                setArchives(archives.filter(a => a.id !== archiveId))
            }
        } catch (err) {
            console.error('Erro ao desarquivar:', err)
        }
    }

    const handleLike = async (profileId: string) => {
        try {
            const { data, error } = await supabase.rpc('like_user', {
                target_user_id: profileId
            })

            if (error) throw error

            if (data?.is_match) {
                setLastMatch({
                    id: data.match_id,
                    user: selectedProfile
                })
                setShowMatchModal(true)
            } else {
                // If not a match, give feedback that the like was sent
                alert('Curtida enviada com sucesso! Se esta pessoa te curtir também, será um Match.')
                setShowInfo(false)
            }

            // Refetch data to update likes list
            if (userId) loadAllData(userId)
        } catch (err) {
            console.error('Erro ao curtir usuario:', err)
            alert('Erro ao processar curtida. Tente novamente.')
        }
    }

    const sendPreMatchMessage = async () => {
        if (!selectedProfile || !preMessageText.trim() || !userId) return

        // Check Limit
        if (!plan.limits.preMatch) {
            setLimitModal({
                open: true,
                title: 'Mensagem Pre-Match',
                message: 'Apenas membros Premium podem enviar mensagens antes do Match. Destaca-te na multidão!'
            })
            return
        }

        setSending(true)
        try {
            const { error } = await supabase
                .from('messages')
                .insert({
                    sender_id: userId,
                    receiver_id: selectedProfile.id,
                    content: preMessageText.trim(),
                    status: 'pre_match'
                })

            if (error) throw error

            setShowPreMessage(false)
            setPreMessageText('')
            setShowInfo(false) // Close details too
            alert('Mensagem enviada com sucesso!')
        } catch (err) {
            console.error('Erro ao enviar mensagem pre-match:', err)
            alert('Erro ao enviar mensagem. Tente novamente.')
        } finally {
            setSending(false)
        }
    }

    const sendAnonComment = async () => {
        if (!selectedProfile || !anonCommentText.trim() || !userId) return

        // Check Limit
        const canComment = await consumeAction('comments', 1)
        if (!canComment) {
            setLimitModal({
                open: true,
                title: 'Limite de Segredos',
                message: 'Já enviaste os teus segredos de hoje. Volta amanhã ou faz upgrade!'
            })
            return
        }

        setSending(true)
        try {
            const { error } = await supabase
                .from('anonymous_comments')
                .insert({
                    from_user_id: userId,
                    to_user_id: selectedProfile.id,
                    content: anonCommentText.trim()
                })

            if (error) throw error

            setShowAnonComment(false)
            setAnonCommentText('')
            setShowInfo(false) // Close details too
            alert('Comentário enviado anonimamente!')
        } catch (err) {
            console.error('Erro ao enviar comentário anónimo:', err)
            alert('Erro ao enviar comentário. Tente novamente.')
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="min-h-[100dvh] w-full bg-black flex flex-col relative">
            {/* Header */}
            <header className="pt-12 pb-6 px-6 relative z-10 flex items-center justify-center bg-black">
                <h1 className={`${yesevaOne.className} text-3xl text-white tracking-tight`}>
                    Interações
                </h1>
            </header>

            {/* Tab Switcher */}
            <div className="px-6 mb-6 relative z-10">
                <div className="flex p-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/5">
                    <button
                        onClick={() => setActiveTab('likes')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex flex-col items-center gap-1 ${activeTab === 'likes' ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Heart size={16} fill={activeTab === 'likes' ? 'currentColor' : 'none'} />
                        Curtidas
                    </button>
                    <button
                        onClick={() => setActiveTab('comments')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex flex-col items-center gap-1 ${activeTab === 'comments' ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        <MessageSquare size={16} fill={activeTab === 'comments' ? 'currentColor' : 'none'} />
                        Segredos
                    </button>
                    <button
                        onClick={() => setActiveTab('archived')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex flex-col items-center gap-1 ${activeTab === 'archived' ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Archive size={16} fill={activeTab === 'archived' ? 'currentColor' : 'none'} />
                        Arquivados
                    </button>
                </div>
            </div>

            {/* Content Section */}
            <div className="px-6 pb-[calc(6rem+env(safe-area-inset-bottom))] relative z-10">
                <AnimatePresence mode="wait">
                    {loading ? (
                        <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center h-full gap-4"
                        >
                            <div className="relative w-12 h-12">
                                <div className="absolute inset-0 rounded-full border-4 border-[#ff9900]/20" />
                                <div className="absolute inset-0 rounded-full border-4 border-[#ff9900] border-t-transparent animate-spin" />
                            </div>
                            <p className="text-gray-500 text-sm font-medium">A carregar interações...</p>
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3 }}
                            className="space-y-6"
                        >
                            {/* Tab Subtitles */}
                            <div className="mb-4">
                                <p className="text-[#ff9900] text-[10px] font-bold uppercase tracking-widest mb-1">
                                    {activeTab === 'likes' ? 'Corações que bateram por ti' :
                                        activeTab === 'comments' ? 'O que te disseram anonimamente?' :
                                            'Arquivados, mas não esquecidos'}
                                </p>
                                <div className="h-0.5 w-12 bg-gradient-to-r from-[#ff9900] to-transparent rounded-full" />
                            </div>

                            {/* Likes Tab */}
                            {activeTab === 'likes' && (
                                likes.length === 0 ? (
                                    <div className="pt-20 text-center opacity-40">
                                        <Heart className="mx-auto mb-4" size={48} />
                                        <p className="text-sm">Ainda não recebeste curtidas.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {likes.map((like) => (
                                            <div key={like.id} className="group relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/5 bg-[#1A1A1A]/40 backdrop-blur-sm">
                                                <button
                                                    onClick={() => {
                                                        setSelectedProfile(like.from_user)
                                                        setShowInfo(true)
                                                    }}
                                                    className="absolute inset-0 w-full h-full"
                                                >
                                                    <img
                                                        src={like.from_user.avatar_url || '/default-avatar.png'}
                                                        alt={like.from_user.first_name}
                                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                                                </button>
                                                <div className="absolute bottom-0 left-0 right-0 p-3 pointer-events-none">
                                                    <p className="text-white font-bold text-sm leading-tight">
                                                        {like.from_user.first_name}, {like.from_user.age}
                                                    </p>
                                                    <p className="text-gray-400 text-[10px] mt-0.5 flex items-center gap-1">
                                                        <Clock size={8} /> {formatDistanceToNow(new Date(like.created_at), { addSuffix: true, locale: pt })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}

                            {/* Comments Tab */}
                            {activeTab === 'comments' && (
                                comments.length === 0 ? (
                                    <div className="pt-20 text-center opacity-40">
                                        <MessageSquare className="mx-auto mb-4" size={48} />
                                        <p className="text-sm">Nenhum comentário anónimo ainda.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {comments.map((comment) => (
                                            <div key={comment.id} className="p-5 rounded-[32px] bg-white/5 backdrop-blur-md border border-white/10 relative overflow-hidden group">
                                                <p className="text-white text-sm leading-relaxed relative z-10 font-medium">
                                                    "{comment.content}"
                                                </p>
                                                <div className="mt-3 flex items-center justify-between relative z-10">
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                                        <Clock size={10} /> {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: pt })}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {comment.from_user && (
                                                            <button
                                                                onClick={() => {
                                                                    if (plan.type !== 'premium') {
                                                                        setLimitModal({
                                                                            open: true,
                                                                            title: 'Revelar Perfil',
                                                                            message: 'Apenas membros Premium podem revelar quem enviou o segredo. Descobre quem foi!'
                                                                        })
                                                                        return
                                                                    }
                                                                    setSelectedProfile(comment.from_user!)
                                                                    setShowInfo(true)
                                                                }}
                                                                className="px-3 py-1.5 rounded-full bg-[#ff9900]/10 border border-[#ff9900]/20 text-[#ff9900] text-[10px] font-bold uppercase tracking-wider hover:bg-[#ff9900]/20 transition-colors"
                                                            >
                                                                Revelar Perfil
                                                            </button>
                                                        )}
                                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-[#ff9900] transition-colors">
                                                            <User size={14} />
                                                        </div>
                                                    </div>
                                                </div>
                                                {/* Decorative Glow */}
                                                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#ff9900]/5 rounded-full blur-2xl group-hover:bg-[#ff9900]/10 transition-colors" />
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}

                            {/* Archived Tab */}
                            {activeTab === 'archived' && (
                                archives.length === 0 ? (
                                    <div className="pt-20 text-center opacity-40">
                                        <Archive className="mx-auto mb-4" size={48} />
                                        <p className="text-sm">Não tens perfis arquivados.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {archives.map((arch) => (
                                            <div key={arch.id} className="p-3 pr-4 rounded-3xl bg-white/5 backdrop-blur-md border border-white/5 flex items-center gap-4 group">
                                                <button
                                                    onClick={() => {
                                                        setSelectedProfile(arch.profile)
                                                        setShowInfo(true)
                                                    }}
                                                    className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 shrink-0"
                                                >
                                                    <img
                                                        src={arch.profile.avatar_url || '/default-avatar.png'}
                                                        alt={arch.profile.first_name}
                                                        className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all"
                                                    />
                                                </button>
                                                <div
                                                    className="flex-1 min-w-0 cursor-pointer"
                                                    onClick={() => {
                                                        setSelectedProfile(arch.profile)
                                                        setShowInfo(true)
                                                    }}
                                                >
                                                    <h3 className="text-white font-bold truncate">{arch.profile.first_name}, {arch.profile.age}</h3>
                                                    <p className="text-gray-500 text-[10px] uppercase font-black">{arch.profile.province}</p>
                                                </div>
                                                <button
                                                    onClick={() => unarchiveProfile(arch.id)}
                                                    className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:bg-[#ff0800]/20 hover:text-[#ff0800] hover:border-[#ff0800]/30 transition-all active:scale-90"
                                                    title="Desarquivar"
                                                >
                                                    <UserMinus size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Profile Details Sheet */}
            <AnimatePresence>
                {showInfo && selectedProfile && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowInfo(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100]"
                        />



                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 h-[85dvh] bg-[#0A0A0A] rounded-t-[40px] z-[110] overflow-hidden border-t border-white/10 shadow-2xl flex flex-col"
                        >
                            <div className="absolute top-6 right-6 z-20">
                                <button
                                    onClick={() => setShowInfo(false)}
                                    className="w-10 h-10 rounded-full bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-12">
                                <div className="flex justify-between items-end mb-8">
                                    <div>
                                        <h2 className={`${yesevaOne.className} text-3xl text-white mb-2`}>
                                            {selectedProfile.first_name}, {selectedProfile.age}
                                        </h2>
                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                                            <Heart className="text-[#ff9900]" size={14} fill="currentColor" />
                                            <span className="text-white text-[11px] font-black uppercase tracking-widest">
                                                {selectedProfile.relationship_goal || 'Relacionamento Sério'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pb-[calc(5rem+env(safe-area-inset-bottom))]">
                                    {/* Bio */}
                                    {selectedProfile.bio && (
                                        <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Sparkles className="text-[#ff9900]" size={16} />
                                                <span className="text-white text-[10px] font-black uppercase tracking-[0.2em]">Bio</span>
                                            </div>
                                            <p className="text-gray-400 leading-relaxed italic text-sm">"{selectedProfile.bio}"</p>
                                        </div>
                                    )}

                                    {/* Photo Gallery Grid */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="h-px flex-1 bg-white/5" />
                                            <span className="text-white/30 text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap">Galeria de Fotos</span>
                                            <div className="h-px flex-1 bg-white/5" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 relative group/photo">
                                                <img
                                                    src={selectedProfile.avatar_url || '/default-avatar.png'}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-110"
                                                    alt="Avatar"
                                                />
                                            </div>
                                            {(selectedProfile.photos || []).map((url, i) => (
                                                <div key={i} className="aspect-[3/4] rounded-2xl overflow-hidden border border-white/10 relative group/photo">
                                                    <img
                                                        src={url}
                                                        className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-110"
                                                        alt={`Photo ${i + 1}`}
                                                    />
                                                </div>
                                            ))}
                                            {((selectedProfile.photos || []).length + 1) % 2 !== 0 && (
                                                <div className="aspect-[3/4] rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                                                    <Sparkles className="text-white/5" size={24} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Detailed Stats Sections */}
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
                                                    <div className="text-gray-300 text-sm font-medium">{selectedProfile.occupation || 'Não informado'}</div>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Escolaridade</div>
                                                    <div className="text-gray-300 text-sm font-medium">{selectedProfile.education || 'Não informado'}</div>
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
                                                    <div className="text-gray-300 text-sm">{selectedProfile.height ? `${selectedProfile.height} cm` : 'Não informado'}</div>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Cigarette className="text-gray-400" size={14} />
                                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Fumar</span>
                                                    </div>
                                                    <div className="text-gray-300 text-sm">{selectedProfile.smoking || 'Não informado'}</div>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Wine className="text-purple-400" size={14} />
                                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Beber</span>
                                                    </div>
                                                    <div className="text-gray-300 text-sm">{selectedProfile.drinking || 'Não informado'}</div>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Activity className="text-blue-400" size={14} />
                                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Exercício</span>
                                                    </div>
                                                    <div className="text-gray-300 text-sm">{selectedProfile.exercise || 'Não informado'}</div>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Coffee className="text-yellow-600" size={14} />
                                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Dieta</span>
                                                    </div>
                                                    <div className="text-gray-300 text-sm">{selectedProfile.diet || 'Não informado'}</div>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Bone className="text-orange-400" size={14} />
                                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Pets</span>
                                                    </div>
                                                    <div className="text-gray-300 text-sm">{selectedProfile.pets || 'Não informado'}</div>
                                                </div>
                                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 col-span-2">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Baby className="text-blue-300" size={14} />
                                                        <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Filhos</span>
                                                    </div>
                                                    <div className="text-gray-300 text-sm">{selectedProfile.children || 'Não informado'}</div>
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
                                                            <div className="text-sm text-white">{selectedProfile.want_marry || '---'}</div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs text-gray-500 mb-1">Quer Filhos?</div>
                                                            <div className="text-sm text-white">{selectedProfile.want_children_future || '---'}</div>
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {[
                                                            { label: 'Formar Família', val: selectedProfile.want_form_family, icon: Home },
                                                            { label: 'Fortalecer Laços', val: selectedProfile.want_strengthen_family, icon: Users }
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
                                                            { label: 'Estabilidade Financeira', val: selectedProfile.want_financial_stability, icon: Sparkles },
                                                            { label: 'Casa Própria', val: selectedProfile.want_buy_house, icon: Home },
                                                            { label: 'Negócio Próprio', val: selectedProfile.want_own_business, icon: Building2 }
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
                                                            { label: 'Crescer Profissionalmente', val: selectedProfile.want_professional_growth, icon: TrendingUp },
                                                            { label: 'Viajar', val: selectedProfile.want_travel, icon: Plane },
                                                            { label: 'Curtir a Vida', val: selectedProfile.want_enjoy_life, icon: Sparkles }
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
                                                    { label: 'Esportes', items: selectedProfile.sports, icon: Trophy, color: 'text-yellow-500' },
                                                    { label: 'Hobbies', items: selectedProfile.hobbies, icon: Gamepad2, color: 'text-purple-500' },
                                                    { label: 'Música', items: selectedProfile.music_dance, icon: Music, color: 'text-pink-500' },
                                                    { label: 'Cultura', items: selectedProfile.lifestyle_culture, icon: Palette, color: 'text-blue-400' }
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
                                                        {(selectedProfile.languages && selectedProfile.languages.length > 0) || selectedProfile.other_language ? (
                                                            <>
                                                                {selectedProfile.languages?.map(l => (
                                                                    <span key={l} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-200 text-xs border border-blue-500/20">{l}</span>
                                                                ))}
                                                                {selectedProfile.other_language && (
                                                                    <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-200 text-xs border border-blue-500/20">{selectedProfile.other_language}</span>
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
                                                        <div className="text-sm text-white">{selectedProfile.other_religion || selectedProfile.religion || '---'}</div>
                                                    </div>
                                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Scale className="text-emerald-400" size={16} />
                                                            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Política</span>
                                                        </div>
                                                        <div className="text-sm text-white">{selectedProfile.other_political || selectedProfile.political_view || '---'}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Button */}
                            {(activeTab === 'likes' || activeTab === 'comments') && (
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0A0A0A] to-transparent">
                                    <button
                                        onClick={() => handleLike(selectedProfile.id)}
                                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-orange-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Heart size={16} fill="currentColor" />
                                        Dar Match!
                                    </button>
                                </div>
                            )}

                            {activeTab === 'archived' && (
                                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0A0A0A] to-transparent flex gap-3">
                                    <button
                                        onClick={() => setShowAnonComment(true)}
                                        className="flex-1 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase text-[10px] tracking-[0.1em] active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Sparkles size={14} className="text-[#ff9900]" />
                                        Segredo
                                    </button>
                                    <button
                                        onClick={() => setShowPreMessage(true)}
                                        className="flex-[1.5] py-4 rounded-2xl bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-black uppercase text-[10px] tracking-[0.1em] shadow-xl shadow-orange-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle size={14} />
                                        Mensagem
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Pre-Match Message Sheet */}
            <AnimatePresence>
                {showPreMessage && selectedProfile && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowPreMessage(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150]"
                        />
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] rounded-t-[40px] z-[160] p-8 pb-12 border-t border-white/10"
                        >
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
                            <h2 className={`${yesevaOne.className} text-2xl text-white mb-2 text-center`}>Mensagem Direta</h2>
                            <p className="text-gray-500 text-center text-sm mb-8 italic">Impressiona {selectedProfile.first_name} antes do match!</p>
                            <textarea
                                value={preMessageText}
                                onChange={(e) => setPreMessageText(e.target.value)}
                                placeholder="Escreve algo especial..."
                                className="w-full h-32 bg-white/5 border border-white/5 rounded-2xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff9900]/50 transition-all resize-none mb-6"
                            />
                            <button
                                onClick={sendPreMatchMessage}
                                disabled={sending || !preMessageText.trim()}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
                            >
                                {sending ? 'A enviar...' : 'Enviar Mensagem'}
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Anonymous Comment Sheet */}
            <AnimatePresence>
                {showAnonComment && selectedProfile && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setShowAnonComment(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150]"
                        />
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A] rounded-t-[40px] z-[160] p-8 pb-12 border-t border-white/10"
                        >
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
                            <h2 className={`${yesevaOne.className} text-2xl text-white mb-2 text-center`}>Comentário Anónimo</h2>
                            <p className="text-gray-500 text-center text-sm mb-8 italic">Diz o que sentes, sem revelares quem és.</p>
                            <textarea
                                value={anonCommentText}
                                onChange={(e) => setAnonCommentText(e.target.value)}
                                placeholder="O que achas deste perfil?"
                                className="w-full h-32 bg-white/5 border border-white/5 rounded-2xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff9900]/50 transition-all resize-none mb-6"
                            />
                            <button
                                onClick={sendAnonComment}
                                disabled={sending || !anonCommentText.trim()}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-50"
                            >
                                {sending ? 'A enviar...' : 'Enviar Comentário'}
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Match Modal */}
            <AnimatePresence>
                {showMatchModal && lastMatch && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-sm text-center"
                        >
                            <div className="relative mb-12">
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.2, type: "spring" }}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                                >
                                    <div className="bg-gradient-to-r from-[#ff0800] to-[#ff9900] p-4 rounded-full shadow-2xl shadow-orange-500/50">
                                        <Heart size={40} className="text-white fill-current" />
                                    </div>
                                </motion.div>

                                <div className="flex items-center justify-center gap-4">
                                    <motion.div
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white/10 rotate-[-4deg]"
                                    >
                                        <img
                                            src={currentUserProfile?.avatar_url || '/default-avatar.png'}
                                            className="w-full h-full object-cover"
                                        />
                                    </motion.div>
                                    <motion.div
                                        initial={{ x: 50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-[#ff9900]/30 rotate-[4deg]"
                                    >
                                        <img
                                            src={lastMatch.user.avatar_url || '/default-avatar.png'}
                                            className="w-full h-full object-cover"
                                        />
                                    </motion.div>
                                </div>
                            </div>

                            <motion.h2
                                className={`${yesevaOne.className} text-5xl text-white mb-4 tracking-tight`}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                It's a Match!
                            </motion.h2>

                            <motion.p
                                className="text-gray-400 mb-10 text-lg"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                            >
                                Tu e o <span className="text-white font-bold">{lastMatch.user.first_name}</span> curtiram-se mutuamente.
                            </motion.p>

                            <div className="space-y-4">
                                <motion.button
                                    onClick={() => router.push(`/chat/${lastMatch.id}`)}
                                    className="w-full py-5 rounded-2xl bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-orange-500/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.5 }}
                                >
                                    <MessageCircle size={20} />
                                    Enviar Mensagem
                                </motion.button>
                                <motion.button
                                    onClick={() => setShowMatchModal(false)}
                                    className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase text-xs tracking-[0.2em] active:scale-95 transition-all"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.6 }}
                                >
                                    Continuar a Explorar
                                </motion.button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>



            {/* Limit Modal - Properly Scoped */}
            <AnimatePresence>
                {limitModal.open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200]"
                            onClick={() => setLimitModal(prev => ({ ...prev, open: false }))}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="fixed inset-4 m-auto h-fit max-w-sm bg-[#1A1A1A] rounded-[32px] border border-[#ff9900]/30 p-8 z-[210] text-center overflow-hidden"
                        >
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#ff9900]/10 blur-[80px] pointer-events-none" />
                            <div className="relative z-10">
                                <div className="w-20 h-20 mx-auto rounded-full bg-[#ff9900]/10 flex items-center justify-center mb-6 border border-[#ff9900]/20">
                                    <Lock size={40} className="text-[#ff9900]" />
                                </div>
                                <h3 className={`${yesevaOne.className} text-xl text-white mb-2`}>{limitModal.title}</h3>
                                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                                    {limitModal.message}
                                </p>
                                <button
                                    onClick={() => router.push('/plans')}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-bold text-lg shadow-lg shadow-orange-500/20 active:scale-95 transition-all mb-4"
                                >
                                    Ver Planos Premium
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

            {/* Background Grain/Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Background Glows */}
            <div className="fixed inset-0 -z-10 bg-black pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff0800]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] bg-[#ff9900]/10 rounded-full blur-[100px]" />
            </div>

        </div >
    )
}
