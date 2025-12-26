'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Yeseva_One } from 'next/font/google'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Heart,
    MessageCircle,
    Clock,
    Search,
    MoreHorizontal,
    User,
    Send,
    ChevronLeft,
    Briefcase, Activity, Cigarette, Wine, Coffee, Bone, Baby, Sparkles, Trophy, Gamepad2, Music, Palette, Globe, Languages, Church, Scale, Wallet, TrendingUp, Plane, Building2, Check, X
}
    from 'lucide-react'
import { Profile } from '@/hooks/useProfileNavigator'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'

const yesevaOne = Yeseva_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
})

interface Match {
    id: string
    user: {
        id: string
        first_name: string
        age: number
        avatar_url: string
    }
    created_at: string
    is_new: boolean
}

interface Conversation {
    match_id: string
    other_user: {
        id: string
        first_name: string
        avatar_url: string
    }
    last_message: {
        message_text: string | null
        message_image_url: string | null
        created_at: string
        is_read: boolean
        sender_id: string
    }
}

interface PreMatchMessage {
    id: string
    sender: {
        id: string
        first_name: string
        avatar_url: string
        age: number
    }
    content: string
    created_at: string
}

interface PreMatchMessageSent {
    id: string
    recipient: {
        id: string
        first_name: string
        avatar_url: string
        age: number
    }
    content: string
    created_at: string
}

export default function InboxPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [matches, setMatches] = useState<Match[]>([])
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [preMatchMessages, setPreMatchMessages] = useState<PreMatchMessage[]>([])
    const [preMatchSentMessages, setPreMatchSentMessages] = useState<PreMatchMessageSent[]>([])
    const [userId, setUserId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'matches' | 'chats' | 'pre-match'>('matches')
    const [preMatchView, setPreMatchView] = useState<'received' | 'sent'>('received')



    // Profile Details Sheet State
    const [viewingProfile, setViewingProfile] = useState<Profile | null>(null)

    const handleViewProfile = async (profileId: string) => {
        try {
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', profileId)
                .single()

            if (error) throw error
            if (profile) setViewingProfile(profile)
        } catch (err) {
            console.error('Error fetching profile details:', err)
        }
    }

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUserId(user.id)
            await loadData(user.id)
        }
        init()
    }, [])

    const loadData = async (currentUserId: string) => {
        try {
            setLoading(true)

            // Load matches
            const { data: matchesData, error: matchesError } = await supabase
                .from('matches')
                .select(`
                    id,
                    created_at,
                    user_a,
                    user_b
                `)
                .or(`user_a.eq.${currentUserId},user_b.eq.${currentUserId}`)
                .order('created_at', { ascending: false })

            if (matchesError) throw matchesError

            const formattedMatches: Match[] = []
            const activeConversations: Conversation[] = []

            for (const match of matchesData) {
                const otherUserId = match.user_a === currentUserId ? match.user_b : match.user_a

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, first_name, age, avatar_url')
                    .eq('id', otherUserId)
                    .single()

                if (!profile) continue

                const { data: lastMessage } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('match_id', match.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle()

                if (lastMessage) {
                    activeConversations.push({
                        match_id: match.id,
                        other_user: {
                            id: profile.id,
                            first_name: profile.first_name,
                            avatar_url: profile.avatar_url
                        },
                        last_message: {
                            message_text: lastMessage.message_text,
                            message_image_url: lastMessage.message_image_url,
                            created_at: lastMessage.created_at,
                            is_read: lastMessage.is_read,
                            sender_id: lastMessage.sender_id
                        }
                    })
                } else {
                    formattedMatches.push({
                        id: match.id,
                        user: {
                            id: profile.id,
                            first_name: profile.first_name,
                            age: profile.age,
                            avatar_url: profile.avatar_url
                        },
                        created_at: match.created_at,
                        is_new: true
                    })
                }
            }

            // Load pre-match messages (received)
            const { data: preMessagesData, error: preErr } = await supabase
                .from('pre_match_messages')
                .select(`
                    id,
                    content,
                    created_at,
                    from_user_id
                `)
                .eq('to_user_id', currentUserId)
                .order('created_at', { ascending: false })

            if (preErr) throw preErr

            const formattedPreMessages: PreMatchMessage[] = []
            for (const msg of preMessagesData) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, first_name, avatar_url, age')
                    .eq('id', msg.from_user_id)
                    .single()

                if (profile) {
                    formattedPreMessages.push({
                        id: msg.id,
                        content: msg.content,
                        created_at: msg.created_at,
                        sender: {
                            id: profile.id,
                            first_name: profile.first_name,
                            avatar_url: profile.avatar_url,
                            age: profile.age
                        }
                    })
                }
            }

            // Filter out pre-match messages from users with whom there is already a match
            const matchedUserIds = new Set([
                ...formattedMatches.map(m => m.user.id),
                ...activeConversations.map(c => c.other_user.id)
            ])

            const finalPreMessages = formattedPreMessages.filter(msg => !matchedUserIds.has(msg.sender.id))

            // Load pre-match messages (sent)
            const { data: sentPreMessagesData, error: sentPreErr } = await supabase
                .from('pre_match_messages')
                .select(`
                    id,
                    content,
                    created_at,
                    to_user_id
                `)
                .eq('from_user_id', currentUserId)
                .order('created_at', { ascending: false })

            if (sentPreErr) throw sentPreErr

            const formattedSentPreMessages: PreMatchMessageSent[] = []
            for (const msg of sentPreMessagesData) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, first_name, avatar_url, age')
                    .eq('id', msg.to_user_id)
                    .single()

                if (profile) {
                    formattedSentPreMessages.push({
                        id: msg.id,
                        content: msg.content,
                        created_at: msg.created_at,
                        recipient: {
                            id: profile.id,
                            first_name: profile.first_name,
                            avatar_url: profile.avatar_url,
                            age: profile.age
                        }
                    })
                }
            }

            setMatches(formattedMatches)
            setConversations(activeConversations.sort((a, b) =>
                new Date(b.last_message.created_at).getTime() - new Date(a.last_message.created_at).getTime()
            ))
            setPreMatchMessages(finalPreMessages)
            setPreMatchSentMessages(formattedSentPreMessages)
        } catch (err) {
            console.error('Erro ao carregar inbox:', err)
        } finally {
            setLoading(false)
        }
    }

    const [replying, setReplying] = useState<string | null>(null)

    const handleReply = async (profileId: string, preMessageId: string) => {
        try {
            setReplying(profileId)
            const currentUserId = userId || (await supabase.auth.getUser()).data.user?.id
            if (!currentUserId) return

            let matchId: string | null = null

            // 1. Try the robust RPC first (Best case)
            try {
                const { data, error } = await supabase.rpc('confirm_match_on_reply', {
                    target_user_id: profileId
                })
                if (!error && data?.[0]?.is_match) {
                    matchId = data[0].match_id
                }
            } catch (rpcErr) {
                console.warn('RPC confirm_match_on_reply not available, falling back to client logic.', rpcErr)
            }

            // 2. Fallback logic if RPC failed or didn't return a match
            if (!matchId) {
                // A. Ensure we like the user (triggering match if they liked us)
                await supabase.rpc('like_user', { target_user_id: profileId })

                // B. Find match ID using DB logic match(user_a, user_b)
                const userA = currentUserId < profileId ? currentUserId : profileId
                const userB = currentUserId < profileId ? profileId : currentUserId

                // C. Poll for the match (trigger latency)
                for (let i = 0; i < 5; i++) {
                    const { data: match } = await supabase
                        .from('matches')
                        .select('id')
                        .eq('user_a', userA)
                        .eq('user_b', userB)
                        .maybeSingle()

                    if (match) {
                        matchId = match.id
                        break
                    }
                    await new Promise(r => setTimeout(r, 500))
                }
            }

            // 3. Delete the message in any case (we responded)
            await supabase
                .from('pre_match_messages')
                .delete()
                .eq('id', preMessageId)

            // 4. Redirect or Refresh
            if (matchId) {
                router.push(`/chat/${matchId}`)
            } else {
                console.error('Match not found after reply. (Old message without like?)')
                await loadData(currentUserId)
            }
        } catch (err) {
            console.error('Erro ao responder:', err)
        } finally {
            setReplying(null)
        }
    }

    return (
        <div className="min-h-[100dvh] w-full bg-black flex flex-col relative">
            {/* Header */}
            <header className="pt-12 pb-6 px-6 relative z-10 flex items-center justify-center bg-black">
                <h1 className={`${yesevaOne.className} text-3xl text-white tracking-tight`}>
                    Chats
                </h1>
            </header>

            {/* Tab Switcher */}
            <div className="px-6 mb-6 relative z-10">
                <div className="flex p-1 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/5">
                    <button
                        onClick={() => setActiveTab('matches')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex flex-col items-center gap-1 ${activeTab === 'matches' ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Heart size={16} fill={activeTab === 'matches' ? 'currentColor' : 'none'} />
                        Matches
                        {matches.length > 0 && <div className="w-1 h-1 rounded-full bg-white animate-pulse" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('pre-match')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex flex-col items-center gap-1 ${activeTab === 'pre-match' ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        <Send size={16} fill={activeTab === 'pre-match' ? 'currentColor' : 'none'} />
                        Mensagens Pré-Match
                        {preMatchMessages.length > 0 && <div className="w-1 h-1 rounded-full bg-white animate-pulse" />}
                    </button>
                    <button
                        onClick={() => setActiveTab('chats')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-300 flex flex-col items-center gap-1 ${activeTab === 'chats' ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        <MessageCircle size={16} fill={activeTab === 'chats' ? 'currentColor' : 'none'} />
                        Conversas
                        {conversations.some((c: Conversation) => !c.last_message.is_read && c.last_message.sender_id !== userId) && (
                            <div className="w-1 h-1 rounded-full bg-white animate-pulse" />
                        )}
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
                            <p className="text-gray-500 text-sm font-medium italic">A carregar mensagens...</p>
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
                                    {activeTab === 'matches' ? 'Quem curtiu, apareceu' :
                                        activeTab === 'chats' ? 'Aqui a conversa flui' :
                                            'Alguém te enviou algo'}
                                </p>
                                <div className="h-0.5 w-12 bg-gradient-to-r from-[#ff9900] to-transparent rounded-full" />
                            </div>

                            {activeTab === 'matches' && (
                                <div className="space-y-4">
                                    {matches.length === 0 ? (
                                        <div className="py-20 text-center opacity-40">
                                            <Heart className="mx-auto mb-4" size={48} />
                                            <p className="text-sm">Ainda não tens novos matches.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            {matches.map((match: Match) => (
                                                <div
                                                    key={match.id}
                                                    onClick={() => router.push(`/chat/${match.id}`)}
                                                    className="group relative aspect-[3/4] rounded-3xl overflow-hidden border border-white/5 bg-[#1A1A1A]/40 backdrop-blur-sm shadow-xl transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                                                >
                                                    <img
                                                        src={match.user.avatar_url || '/default-avatar.png'}
                                                        alt={match.user.first_name}
                                                        className="absolute inset-0 w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                                                    <div className="absolute bottom-0 left-0 right-0 p-4">
                                                        <p className="text-white font-bold text-sm leading-tight">
                                                            {match.user.first_name}, {match.user.age}
                                                        </p>
                                                        <div className="flex items-center gap-1 mt-1">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                                            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Novo Match</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === 'pre-match' && (
                                <>
                                    <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl w-fit">
                                        <button
                                            onClick={() => setPreMatchView('received')}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${preMatchView === 'received' ? 'bg-[#ff9900] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Recebidas
                                        </button>
                                        <button
                                            onClick={() => setPreMatchView('sent')}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${preMatchView === 'sent' ? 'bg-[#ff9900] text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                        >
                                            Enviadas
                                        </button>
                                    </div>

                                    {preMatchView === 'received' && (
                                        <div className="space-y-4">
                                            {preMatchMessages.length === 0 ? (
                                                <div className="py-20 text-center opacity-40">
                                                    <Send className="mx-auto mb-4" size={48} />
                                                    <p className="text-sm">Nenhuma mensagem recebida ainda.</p>
                                                </div>
                                            ) : (
                                                preMatchMessages.map((msg: PreMatchMessage) => (
                                                    <div
                                                        key={msg.id}
                                                        onClick={() => handleViewProfile(msg.sender.id)}
                                                        className="group relative p-4 rounded-[32px] bg-[#1A1A1A]/40 backdrop-blur-sm border border-white/5 hover:border-[#ff9900]/30 transition-all active:scale-[0.98] overflow-hidden cursor-pointer"
                                                    >
                                                        <div className="flex flex-col gap-4">
                                                            <div className="flex gap-4 items-center">
                                                                <div className="relative shrink-0">
                                                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 group-hover:border-[#ff9900]/40 transition-colors">
                                                                        <img
                                                                            src={msg.sender.avatar_url || '/default-avatar.png'}
                                                                            alt={msg.sender.first_name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#ff9900] rounded-full flex items-center justify-center border-2 border-[#1A1A1A]">
                                                                        <Send size={10} className="text-white" />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <h3 className="text-white font-bold truncate text-sm">{msg.sender.first_name}, {msg.sender.age}</h3>
                                                                        <span className="text-[10px] text-gray-500">{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: pt })}</span>
                                                                    </div>
                                                                    <p className="text-[#ff9900] text-sm font-medium line-clamp-2 bg-[#ff9900]/5 p-3 rounded-2xl border border-[#ff9900]/10 italic">
                                                                        "{msg.content}"
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleReply(msg.sender.id, msg.id)
                                                                }}
                                                                disabled={replying === msg.sender.id}
                                                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                                            >
                                                                {replying === msg.sender.id ? (
                                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                                ) : (
                                                                    <>
                                                                        <MessageCircle size={14} fill="currentColor" />
                                                                        Responder agora
                                                                    </>
                                                                )}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                                ))}
                                        </div>
                                    )}

                                    {preMatchView === 'sent' && (
                                        <div className="space-y-4">
                                            {preMatchSentMessages.length === 0 ? (
                                                <div className="py-20 text-center opacity-40">
                                                    <Send className="mx-auto mb-4" size={48} />
                                                    <p className="text-sm">Nenhuma mensagem enviada.</p>
                                                </div>
                                            ) : (
                                                preMatchSentMessages.map((msg: PreMatchMessageSent) => (
                                                    <div
                                                        key={msg.id}
                                                        onClick={() => handleViewProfile(msg.recipient.id)}
                                                        className="group relative p-4 rounded-[32px] bg-[#1A1A1A]/40 backdrop-blur-sm border border-white/5 hover:border-[#ff9900]/30 transition-all active:scale-[0.98] overflow-hidden cursor-pointer"
                                                    >
                                                        <div className="flex flex-col gap-4">
                                                            <div className="flex gap-4 items-center">
                                                                <div className="relative shrink-0">
                                                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 group-hover:border-[#ff9900]/40 transition-colors">
                                                                        <img
                                                                            src={msg.recipient.avatar_url || '/default-avatar.png'}
                                                                            alt={msg.recipient.first_name}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#ff9900] rounded-full flex items-center justify-center border-2 border-[#1A1A1A]">
                                                                        <Send size={10} className="text-white" />
                                                                    </div>
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex justify-between items-center mb-1">
                                                                        <h3 className="text-white font-bold truncate text-sm">Para: {msg.recipient.first_name}, {msg.recipient.age}</h3>
                                                                        <span className="text-[10px] text-gray-500">{formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: pt })}</span>
                                                                    </div>
                                                                    <p className="text-gray-400 text-sm font-medium line-clamp-2 bg-white/5 p-3 rounded-2xl border border-white/5 italic">
                                                                        "{msg.content}"
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </>
                            )}

                            {activeTab === 'chats' && (
                                <div className="space-y-3">
                                    {conversations.length === 0 ? (
                                        <div className="py-20 text-center opacity-40">
                                            <MessageCircle className="mx-auto mb-4" size={48} />
                                            <p className="text-sm">Nenhuma conversa ativa ainda.</p>
                                        </div>
                                    ) : (
                                        conversations.map((conv: Conversation) => (
                                            <div
                                                key={conv.match_id}
                                                onClick={() => router.push(`/chat/${conv.match_id}`)}
                                                className="group p-4 rounded-3xl bg-[#1A1A1A]/40 backdrop-blur-sm border border-white/5 flex items-center gap-4 hover:border-white/20 hover:bg-[#1A1A1A]/60 transition-all active:scale-[0.98] cursor-pointer"
                                            >
                                                <div className="relative">
                                                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white/10 group-hover:border-[#ff9900]/50 transition-colors">
                                                        <img
                                                            src={conv.other_user.avatar_url || '/default-avatar.png'}
                                                            alt={conv.other_user.first_name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    {!conv.last_message.is_read && conv.last_message.sender_id !== userId && (
                                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-[#ff0800] to-[#ff9900] rounded-full border-2 border-black animate-pulse" />
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <h3 className="text-white font-bold truncate text-sm">
                                                            {conv.other_user.first_name}
                                                        </h3>
                                                        <span className="text-[9px] text-gray-500 font-medium whitespace-nowrap uppercase tracking-tighter">
                                                            {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: true, locale: pt })}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                                        {conv.last_message.sender_id === userId && (
                                                            <span className="text-gray-600 text-[10px] font-black uppercase shrink-0">Tu:</span>
                                                        )}
                                                        <p className={`text-xs truncate ${!conv.last_message.is_read && conv.last_message.sender_id !== userId ? 'text-[#ff9900] font-bold' : 'text-gray-400'}`}>
                                                            {conv.last_message.message_image_url ? '📷 Foto' : conv.last_message.message_text}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreHorizontal className="text-gray-600" size={18} />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Profile Details Sheet */}
            <AnimatePresence>
                {viewingProfile && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setViewingProfile(null)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60]"
                        />
                        <motion.div
                            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 h-[85dvh] bg-[#0A0A0A] rounded-t-[40px] z-[70] p-8 pb-[calc(6rem+env(safe-area-inset-bottom))] overflow-y-auto no-scrollbar border-t border-white/10 shadow-2xl"
                        >
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />

                            <h2 className={`${yesevaOne.className} text-3xl text-white mb-8`}>Sobre {viewingProfile.first_name} {viewingProfile.last_name}</h2>

                            {/* Photo Gallery - Carousel-like or Grid */}
                            {viewingProfile.photos && viewingProfile.photos.length > 0 && (
                                <div className="mb-8">
                                    <h3 className="text-white text-lg font-bold mb-4 flex items-center gap-2">
                                        <Palette className="text-[#ff9900]" size={20} />
                                        Galeria de Fotos
                                    </h3>
                                    <div className="flex overflow-x-auto gap-4 pb-4 no-scrollbar snap-x">
                                        {[viewingProfile.avatar_url, ...viewingProfile.photos].filter(Boolean).map((photo, idx) => (
                                            <div key={idx} className="flex-shrink-0 w-48 h-64 rounded-2xl overflow-hidden border border-white/10 snap-center">
                                                <img src={photo} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6 pb-[calc(5rem+env(safe-area-inset-bottom))]">
                                {/* Bio */}
                                <div className="p-6 rounded-3xl bg-white/5 border border-white/5 mb-8">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Heart className="text-[#ff9900]" size={18} />
                                        <span className="text-white text-xs font-bold uppercase tracking-widest">Bio</span>
                                    </div>
                                    <p className="text-gray-400 leading-relaxed italic">"{viewingProfile.bio || 'Sem biografia disponível.'}"</p>
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
                                                <div className="text-gray-300 text-sm font-medium">{viewingProfile.occupation || 'Não informado'}</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-medium">Escolaridade</div>
                                                <div className="text-gray-300 text-sm font-medium">{viewingProfile.education || 'Não informado'}</div>
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
                                                <div className="text-gray-300 text-sm">{viewingProfile.height ? `${viewingProfile.height} cm` : 'Não informado'}</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Cigarette className="text-gray-400" size={14} />
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Fumar</span>
                                                </div>
                                                <div className="text-gray-300 text-sm">{viewingProfile.smoking || 'Não informado'}</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Wine className="text-purple-400" size={14} />
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Beber</span>
                                                </div>
                                                <div className="text-gray-300 text-sm">{viewingProfile.drinking || 'Não informado'}</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Activity className="text-blue-400" size={14} />
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Exercício</span>
                                                </div>
                                                <div className="text-gray-300 text-sm">{viewingProfile.exercise || 'Não informado'}</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Coffee className="text-yellow-600" size={14} />
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Dieta</span>
                                                </div>
                                                <div className="text-gray-300 text-sm">{viewingProfile.diet || 'Não informado'}</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Bone className="text-orange-400" size={14} />
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Pets</span>
                                                </div>
                                                <div className="text-gray-300 text-sm">{viewingProfile.pets || 'Não informado'}</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 col-span-2">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Baby className="text-blue-300" size={14} />
                                                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Filhos</span>
                                                </div>
                                                <div className="text-gray-300 text-sm">{viewingProfile.children || 'Não informado'}</div>
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
                                                        <div className="text-sm text-white">{viewingProfile.want_marry || '---'}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-xs text-gray-500 mb-1">Quer Filhos?</div>
                                                        <div className="text-sm text-white">{viewingProfile.want_children_future || '---'}</div>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    {[
                                                        { label: 'Formar Família', val: viewingProfile.want_form_family, icon: User }, // reused icon since Home/Users not imported locally
                                                        { label: 'Fortalecer Laços', val: viewingProfile.want_strengthen_family, icon: User }
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
                                                        { label: 'Estabilidade Financeira', val: viewingProfile.want_financial_stability, icon: Sparkles },
                                                        { label: 'Casa Própria', val: viewingProfile.want_buy_house, icon: User },
                                                        { label: 'Negócio Próprio', val: viewingProfile.want_own_business, icon: Building2 }
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
                                                        { label: 'Crescer Profissionalmente', val: viewingProfile.want_professional_growth, icon: TrendingUp },
                                                        { label: 'Viajar', val: viewingProfile.want_travel, icon: Plane },
                                                        { label: 'Curtir a Vida', val: viewingProfile.want_enjoy_life, icon: Sparkles }
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
                                                { label: 'Esportes', items: viewingProfile.sports, icon: Trophy, color: 'text-yellow-500' },
                                                { label: 'Hobbies', items: viewingProfile.hobbies, icon: Gamepad2, color: 'text-purple-500' },
                                                { label: 'Música', items: viewingProfile.music_dance, icon: Music, color: 'text-pink-500' },
                                                { label: 'Cultura', items: viewingProfile.lifestyle_culture, icon: Palette, color: 'text-blue-400' }
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
                                                    {(viewingProfile.languages && viewingProfile.languages.length > 0) || viewingProfile.other_language ? (
                                                        <>
                                                            {viewingProfile.languages?.map(l => (
                                                                <span key={l} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-200 text-xs border border-blue-500/20">{l}</span>
                                                            ))}
                                                            {viewingProfile.other_language && (
                                                                <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-200 text-xs border border-blue-500/20">{viewingProfile.other_language}</span>
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
                                                    <div className="text-sm text-white">{viewingProfile.other_religion || viewingProfile.religion || '---'}</div>
                                                </div>
                                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Scale className="text-emerald-400" size={16} />
                                                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Política</span>
                                                    </div>
                                                    <div className="text-sm text-white">{viewingProfile.other_political || viewingProfile.political_view || '---'}</div>
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

            {/* Background Texture & Effects */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="fixed inset-0 -z-10 bg-black pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#ff0800]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[-10%] w-[40%] h-[40%] bg-[#ff9900]/10 rounded-full blur-[100px]" />
            </div>

        </div>
    )
}
