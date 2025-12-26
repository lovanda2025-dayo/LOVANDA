'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Yeseva_One } from 'next/font/google'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ChevronLeft,
    Send,
    Image as ImageIcon,
    X,
    MoreVertical,
    Download,
    Maximize2,
    Check,
    CheckCheck,
    Heart,
    Briefcase,
    GraduationCap,
    MapPin,
    Church,
    Sparkles,
    Star,
    Crown,
    Flame,
    Disc, PartyPopper, HandHeart, Cloud, Shirt, Cpu, Ticket, Map, Lock,
    User, PawPrint, Undo2, Bookmark, Info, SlidersHorizontal, Languages, Scale, Globe, Wallet, Baby, Home, Users, TrendingUp, Plane, Building2, Activity, Wine, Cigarette, Coffee, Bone, Trophy, Music, Gamepad2, Palette, Waves, Footprints, Dumbbell, Swords, Bike, Zap, Book, Tv, Utensils, Flower2, Scissors, Fish, Mic2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { pt } from 'date-fns/locale'
import imageCompression from 'browser-image-compression'
import { usePlan } from '@/hooks/usePlan'

const yesevaOne = Yeseva_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
})

interface Message {
    id: string
    match_id: string
    sender_id: string
    receiver_id: string
    message_text: string | null
    message_image_url: string | null
    created_at: string
    is_read: boolean
}

interface OtherUser {
    id: string
    first_name: string
    last_name?: string
    age?: number
    bio?: string
    avatar_url: string
    photos?: string[]
    occupation?: string
    education?: string
    province?: string
    religion?: string
    lifestyle_culture?: string[]
    relationship_goal?: string
    last_seen?: string
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

export default function ChatPage() {
    const params = useParams()
    const router = useRouter()
    const matchId = params.id as string

    const [messages, setMessages] = useState<Message[]>([])
    const [otherUser, setOtherUser] = useState<OtherUser | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [inputText, setInputText] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [selectedImage, setSelectedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [zoomedImage, setZoomedImage] = useState<string | null>(null)
    const [showInfo, setShowInfo] = useState(false)
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)
    const [isReportModalOpen, setIsReportModalOpen] = useState(false)
    const [isBlockModalOpen, setIsBlockModalOpen] = useState(false)
    const [selectedReason, setSelectedReason] = useState<string | null>(null)
    const [reportDetails, setReportDetails] = useState('')
    const [viewportStyle, setViewportStyle] = useState({
        height: '100dvh',
        top: '0px'
    })

    // Batidas State
    const [batidasBalance, setBatidasBalance] = useState(0)
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false)

    useEffect(() => {
        if (typeof window === 'undefined') return

        // 1. Hint the browser to resize content when keyboard appears
        const meta = document.querySelector('meta[name="viewport"]')
        if (meta) {
            const content = meta.getAttribute('content')
            if (content && !content.includes('interactive-widget')) {
                meta.setAttribute('content', content + ', interactive-widget=resizes-content')
            }
        }

        if (!window.visualViewport) return

        const vv = window.visualViewport
        const handleResize = () => {
            window.requestAnimationFrame(() => {
                setViewportStyle({
                    height: `${vv.height}px`,
                    top: `${vv.offsetTop}px`
                })
                // Use instant scroll during resize to prevent jitter
                scrollToBottom(true)
            })
        }

        vv.addEventListener('resize', handleResize)
        vv.addEventListener('scroll', handleResize)

        handleResize()

        return () => {
            vv.removeEventListener('resize', handleResize)
            vv.removeEventListener('scroll', handleResize)
        }
    }, [])

    useEffect(() => {
        let isMounted = true
        let channel: ReturnType<typeof supabase.channel> | null = null

        const initChat = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                if (isMounted) {
                    router.push('/login')
                }
                return
            }

            if (!isMounted) return
            setCurrentUserId(user.id)

            const { data: match } = await supabase
                .from('matches')
                .select('*')
                .eq('id', matchId)
                .single()

            if (!isMounted) return

            if (match) {
                const otherId = match.user_a === user.id ? match.user_b : match.user_a
                const { data: profile } = await supabase
                    .from('profiles')
                    .select(`
                        id, first_name, last_name, avatar_url, age, bio, photos, 
                        occupation, education, province, religion, lifestyle_culture, relationship_goal,
                        height, smoking, drinking, exercise, diet, pets, children,
                        want_marry, want_children_future, want_form_family, want_strengthen_family,
                        want_financial_stability, want_buy_house, want_own_business, want_professional_growth,
                        want_travel, want_enjoy_life, sports, hobbies, music_dance,
                        other_language, other_religion, other_political, political_view, languages
                    `)
                    .eq('id', otherId)
                    .single()

                if (!isMounted) return

                if (profile) {
                    setOtherUser({
                        id: profile.id,
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                        avatar_url: profile.avatar_url,
                        age: profile.age,
                        bio: profile.bio,
                        photos: profile.photos,
                        occupation: profile.occupation,
                        education: profile.education,
                        province: profile.province,
                        religion: profile.religion,
                        lifestyle_culture: profile.lifestyle_culture,
                        relationship_goal: profile.relationship_goal,
                        height: profile.height,
                        smoking: profile.smoking,
                        drinking: profile.drinking,
                        exercise: profile.exercise,
                        diet: profile.diet,
                        pets: profile.pets,
                        children: profile.children,
                        want_marry: profile.want_marry,
                        want_children_future: profile.want_children_future,
                        want_form_family: profile.want_form_family,
                        want_strengthen_family: profile.want_strengthen_family,
                        want_financial_stability: profile.want_financial_stability,
                        want_buy_house: profile.want_buy_house,
                        want_own_business: profile.want_own_business,
                        want_professional_growth: profile.want_professional_growth,
                        want_travel: profile.want_travel,
                        want_enjoy_life: profile.want_enjoy_life,
                        sports: profile.sports,
                        hobbies: profile.hobbies,
                        music_dance: profile.music_dance,
                        other_language: profile.other_language,
                        other_religion: profile.other_religion,
                        other_political: profile.other_political,
                        political_view: profile.political_view,
                        languages: profile.languages
                    })
                }

                // Fetch Batidas Balance
                const { data: userData } = await supabase
                    .from('profiles')
                    .select('daily_batidas, extra_batidas')
                    .eq('id', user.id)
                    .single()

                if (userData) {
                    setBatidasBalance((userData.daily_batidas || 0) + (userData.extra_batidas || 0))
                }
            }

            const { data: msgs } = await supabase
                .from('messages')
                .select('*')
                .eq('match_id', matchId)
                .order('created_at', { ascending: true })

            if (!isMounted) return

            if (msgs) {
                setMessages(msgs)
                scrollToBottom()
            }
            setLoading(false)

            channel = supabase
                .channel(`chat:${matchId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `match_id=eq.${matchId}`
                    },
                    (payload) => {
                        if (!isMounted) return
                        const newMessage = payload.new as Message
                        setMessages(prev => {
                            if (prev.some(m => m.id === newMessage.id)) return prev
                            return [...prev, newMessage]
                        })
                        scrollToBottom()
                    }
                )
                .subscribe()
        }

        initChat()

        return () => {
            isMounted = false
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [matchId, router])

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = (instant = false) => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({
                behavior: instant ? 'auto' : 'smooth',
                block: 'end'
            })
        }
    }

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        try {
            // Preview
            const reader = new FileReader()
            reader.onloadend = () => {
                setImagePreview(reader.result as string)
            }
            reader.readAsDataURL(file)
            setSelectedImage(file)
        } catch (err) {
            console.error('Erro ao processar imagem:', err)
        }
    }

    const handleSendMessage = async () => {
        if ((!inputText.trim() && !selectedImage) || !currentUserId || !otherUser || sending) return

        // Calculate Cost
        const cost = selectedImage ? 2 : 1

        // Optimistic check
        if (batidasBalance < cost) {
            setIsLimitModalOpen(true)
            return
        }

        setSending(true)

        try {
            // Consume Batidas via RPC
            const { data: consumeData, error: consumeError } = await supabase
                .rpc('consume_batidas', {
                    p_user_id: currentUserId,
                    p_amount: cost
                })

            if (consumeError) throw consumeError

            // RPC returns array of objects, get first one
            const result = consumeData && consumeData[0]
            // @ts-ignore
            if (!result || !result.success) {
                setIsLimitModalOpen(true)
                setSending(false)
                return
            }

            // Update local balance
            // @ts-ignore
            setBatidasBalance((result.new_daily || 0) + (result.new_extra || 0))

            let imageUrl = null

            if (selectedImage) {
                // Compress
                const options = {
                    maxSizeMB: 1,
                    initialQuality: 0.9,
                    useWebWorker: true,
                }
                const compressedFile = await imageCompression(selectedImage, options)

                // Upload to Storage
                const fileName = `${currentUserId}/${Date.now()}_${selectedImage.name}`
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('chat-photos')
                    .upload(fileName, compressedFile)

                if (uploadError) throw uploadError

                const { data: publicUrl } = supabase.storage
                    .from('chat-photos')
                    .getPublicUrl(fileName)

                imageUrl = publicUrl.publicUrl
            }

            const { data, error: sendError } = await supabase
                .from('messages')
                .insert({
                    match_id: matchId,
                    sender_id: currentUserId,
                    receiver_id: otherUser.id,
                    message_text: inputText.trim() || null,
                    message_image_url: imageUrl,
                })
                .select()
                .single()

            if (sendError) throw sendError

            // Optimistic update
            if (data) {
                const newMessage = data as Message
                setMessages(prev => {
                    if (prev.some(m => m.id === newMessage.id)) return prev
                    return [...prev, newMessage]
                })
                scrollToBottom()
            }

            setInputText('')
            setSelectedImage(null)
            setImagePreview(null)
        } catch (err) {
            console.error('Erro ao enviar mensagem:', err)
            // Rollback optimistic balance update if needed (complex, skipping for now)
        } finally {
            setSending(false)
        }
    }


    const handleBlock = async () => {
        if (!currentUserId || !otherUser || !matchId) return

        try {
            // 1. Inserir na tabela de bloqueios
            await supabase.from('blocks').insert({
                blocker_id: currentUserId,
                blocked_id: otherUser.id
            })

            // 2. Remover o match (isso apaga as mensagens por cascata se configurado, 
            // ou apenas remove a visibilidade da conversa)
            await supabase.from('matches').delete().eq('id', matchId)

            router.push('/chat')
        } catch (err) {
            console.error('Erro ao bloquear:', err)
        }
    }

    const handleReport = async () => {
        if (!currentUserId || !otherUser || !selectedReason) return

        try {
            await supabase.from('reports').insert({
                reporter_id: currentUserId,
                reported_id: otherUser.id,
                reason: selectedReason,
                details: selectedReason === 'Outro motivo' ? reportDetails : null
            })

            // Após denunciar, também bloqueamos
            await handleBlock()
            setIsReportModalOpen(false)
            setSelectedReason(null)
            setReportDetails('')
        } catch (err) {
            console.error('Erro ao denunciar:', err)
        }
    }

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-[#ff9900]/20 border-t-[#ff9900] animate-spin" />
                    <p className="text-gray-500 font-medium italic">Ligando corações...</p>
                </div>
            </div>
        )
    }

    return (
        <div
            className="fixed inset-0 bg-black flex flex-col overflow-hidden will-change-[height,transform]"
            style={{
                height: viewportStyle.height,
                transform: `translateY(${viewportStyle.top})`,
                overscrollBehavior: 'none'
            }}
        >
            {/* Header */}
            <header className="h-20 px-4 flex items-center justify-between border-b border-white/5 bg-black/80 backdrop-blur-xl z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/chat')}
                        className="p-2 -ml-2 text-white/70 hover:text-white transition-colors"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={() => setShowInfo(true)}
                        className="flex items-center gap-3 active:opacity-70 transition-opacity"
                    >
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                            <img
                                src={otherUser?.avatar_url || '/default-avatar.png'}
                                alt={otherUser?.first_name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="text-left">
                            <h2 className={`${yesevaOne.className} text-white text-lg`}>
                                {otherUser?.first_name}
                            </h2>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Ativo agora</span>
                            </div>
                        </div>
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    {/* Batidas Counter */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#ff0800] to-[#ff9900] rounded-full shadow-lg shadow-[#ff0800]/20 mr-1">
                        <Heart size={14} className="text-white fill-white" />
                        <span className="text-xs font-bold text-white">{batidasBalance}</span>
                    </div>

                    <button
                        onClick={() => setIsActionMenuOpen(true)}
                        className="p-2 text-white/50 hover:text-white transition-colors"
                    >
                        <MoreVertical size={20} />
                    </button>
                </div>
            </header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4 no-scrollbar">
                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-30 px-12 text-center">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                            <Send size={32} className="text-white" />
                        </div>
                        <h3 className="text-white font-bold mb-2">Inicia a conversa!</h3>
                        <p className="text-xs">Não sejas tímido, dá o primeiro passo com {otherUser?.first_name}.</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isMine = msg.sender_id === currentUserId
                        const isNewDay = idx === 0 ||
                            new Date(msg.created_at).toLocaleDateString() !==
                            new Date(messages[idx - 1].created_at).toLocaleDateString()

                        return (
                            <div key={msg.id} className="flex flex-col gap-2">
                                {isNewDay && (
                                    <div className="flex items-center gap-4 my-4">
                                        <div className="h-px flex-1 bg-white/5" />
                                        <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.2em]">
                                            {new Date(msg.created_at).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </span>
                                        <div className="h-px flex-1 bg-white/5" />
                                    </div>
                                )}

                                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
                                        <div
                                            className={`
                                                relative p-3 rounded-2xl shadow-lg
                                                ${isMine
                                                    ? 'bg-gradient-to-br from-[#ff0800] to-[#ff9900] text-white rounded-tr-none'
                                                    : 'bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-tl-none'}
                                            `}
                                        >
                                            {msg.message_image_url && (
                                                <div
                                                    className="mb-2 rounded-xl overflow-hidden cursor-zoom-in"
                                                    onClick={() => setZoomedImage(msg.message_image_url)}
                                                >
                                                    <img
                                                        src={msg.message_image_url}
                                                        alt="Mensagem"
                                                        className="w-full max-h-60 object-cover"
                                                    />
                                                </div>
                                            )}
                                            {msg.message_text && (
                                                <p className="text-sm leading-relaxed">{msg.message_text}</p>
                                            )}

                                            <div className={`flex items-center gap-1.5 mt-1.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                <span className={`text-[9px] ${isMine ? 'text-white/60' : 'text-gray-500'} font-medium`}>
                                                    {format(new Date(msg.created_at), 'HH:mm', { locale: pt })}
                                                </span>
                                                {isMine && (
                                                    msg.is_read ? <CheckCheck size={10} className="text-blue-300" /> : <Check size={10} className="text-white/60" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-4 bg-black border-t border-white/5 z-30 shrink-0">
                <AnimatePresence>
                    {imagePreview && (
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            className="bg-[#1A1A1A] rounded-2xl p-3 mb-3 border border-white/10 flex items-center gap-3"
                        >
                            <div className="w-16 h-16 rounded-xl overflow-hidden relative shrink-0">
                                <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                <button
                                    onClick={() => {
                                        setSelectedImage(null)
                                        setImagePreview(null)
                                    }}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center text-white"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-[#ff9900] font-black uppercase tracking-wider mb-0.5">A imagem está pronta</p>
                                <p className="text-xs text-gray-400 truncate">Podes adicionar uma legenda abaixo</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex items-end gap-2 bg-[#1A1A1A]/80 border border-white/10 rounded-[28px] p-1.5 pl-4 transition-all">
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 mb-0.5 text-gray-400 hover:text-[#ff9900] transition-colors"
                    >
                        <ImageIcon size={22} />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageSelect}
                    />

                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Escreva uma mensagem..."
                        rows={1}
                        className="flex-1 bg-transparent border-none focus:border-transparent focus:ring-0 focus:outline-none outline-none text-white text-sm py-4 max-h-32 resize-none no-scrollbar placeholder:text-gray-600"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSendMessage()
                            }
                        }}
                    />

                    <button
                        onClick={handleSendMessage}
                        disabled={(!inputText.trim() && !selectedImage) || sending}
                        className={`
                            w-12 h-12 rounded-full flex items-center justify-center transition-all
                            ${(inputText.trim() || selectedImage) && !sending
                                ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg active:scale-95'
                                : 'bg-white/5 text-gray-700'}
                        `}
                    >
                        {sending ? (
                            <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                        ) : (
                            <Send size={18} />
                        )}
                    </button>
                </div>
            </div>

            {/* Image Zoom Modal */}
            <AnimatePresence>
                {zoomedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 flex flex-col"
                    >
                        <div className="p-6 flex justify-between items-center bg-gradient-to-b from-black to-transparent">
                            <button onClick={() => setZoomedImage(null)} className="text-white/70 hover:text-white">
                                <X size={28} />
                            </button>
                            <div className="flex gap-4">
                                <button className="text-white/70 hover:text-white">
                                    <Download size={22} />
                                </button>
                                <button className="text-white/70 hover:text-white">
                                    <Maximize2 size={22} />
                                </button>
                            </div>
                        </div>
                        <div className="flex-1 flex items-center justify-center p-4">
                            <motion.img
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                src={zoomedImage}
                                className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                                alt="Zoomed"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Limit Reached Modal */}
            <AnimatePresence>
                {isLimitModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="fixed inset-0 m-auto w-[90%] max-w-sm h-fit bg-[#1A1A1A] rounded-[32px] border border-white/10 p-8 z-[110] text-center"
                        >
                            <div className="w-20 h-20 rounded-full bg-[#ff0800]/10 flex items-center justify-center mx-auto mb-6">
                                <Heart size={40} className="text-[#ff0800] fill-[#ff0800]" />
                            </div>

                            <h3 className={`${yesevaOne.className} text-2xl text-white mb-2`}>
                                Sem Batidas!
                            </h3>

                            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                                Atingiste o limite de interações. Faz upgrade para continuar a conversar sem limites!
                            </p>

                            <div className="space-y-3">
                                <button
                                    onClick={() => router.push('/plans')}
                                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-bold shadow-lg shadow-[#ff0800]/20 active:scale-95 transition-all"
                                >
                                    Fazer Upgrade
                                </button>
                                <button
                                    onClick={() => setIsLimitModalOpen(false)}
                                    className="w-full py-4 text-gray-500 font-bold hover:text-white transition-colors"
                                >
                                    Agora não
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Action Menu (Block/Report) */}
            <AnimatePresence>
                {isActionMenuOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsActionMenuOpen(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] rounded-t-[32px] border-t border-white/10 p-6 z-[70] pb-10"
                        >
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
                            <div className="space-y-4">
                                <button
                                    onClick={() => {
                                        setIsActionMenuOpen(false)
                                        setIsReportModalOpen(true)
                                    }}
                                    className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 text-white hover:bg-white/10 transition-all active:scale-[0.98]"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                                        <Maximize2 size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold">Denunciar Perfil</p>
                                        <p className="text-xs text-gray-400">Informa-nos sobre comportamentos impróprios</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => {
                                        setIsActionMenuOpen(false)
                                        setIsBlockModalOpen(true)
                                    }}
                                    className="w-full p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 text-red-500 hover:bg-red-500/20 transition-all active:scale-[0.98]"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                                        <X size={20} />
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold">Bloquear Perfil</p>
                                        <p className="text-xs text-red-500/60">Irás parar de ver este utilizador em todo o lado</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setIsActionMenuOpen(false)}
                                    className="w-full p-4 text-center text-gray-500 font-bold"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Report Modal */}
            <AnimatePresence>
                {isReportModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80]"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="fixed inset-4 m-auto h-fit max-w-sm bg-[#1A1A1A] rounded-[32px] border border-white/10 p-6 z-[90] overflow-hidden"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className={`${yesevaOne.className} text-xl text-white`}>Denunciar</h3>
                                <button onClick={() => setIsReportModalOpen(false)} className="p-2 text-gray-500">
                                    <X size={24} />
                                </button>
                            </div>

                            <p className="text-sm text-gray-400 mb-6">Porque desejas denunciar {otherUser?.first_name}?</p>

                            <div className="space-y-2 mb-6 max-h-[40vh] overflow-y-auto no-scrollbar pr-1">
                                {[
                                    'Perfil Falso / Catfish',
                                    'Fotos Impróprias',
                                    'Assédio ou Abuso',
                                    'Conteúdo de Spam',
                                    'Menor de Idade',
                                    'Outro motivo'
                                ].map((reason) => (
                                    <button
                                        key={reason}
                                        onClick={() => setSelectedReason(reason)}
                                        className={`w-full p-4 rounded-xl text-left text-sm transition-all border ${selectedReason === reason
                                            ? 'bg-[#ff9900]/20 border-[#ff9900] text-[#ff9900]'
                                            : 'bg-white/5 border-white/5 text-white hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span>{reason}</span>
                                            {selectedReason === reason && <Check size={16} />}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <AnimatePresence>
                                {selectedReason === 'Outro motivo' && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="mb-6 overflow-hidden"
                                    >
                                        <textarea
                                            value={reportDetails}
                                            onChange={(e) => setReportDetails(e.target.value)}
                                            placeholder="Descreve o problema em detalhe..."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white focus:border-[#ff9900]/40 focus:ring-1 focus:ring-[#ff9900]/40 outline-none resize-none h-24 no-scrollbar"
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-3">
                                <button
                                    onClick={handleReport}
                                    disabled={!selectedReason || (selectedReason === 'Outro motivo' && !reportDetails.trim())}
                                    className={`w-full py-4 rounded-2xl font-bold transition-all ${selectedReason
                                        ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg active:scale-95'
                                        : 'bg-white/5 text-gray-600 disabled:cursor-not-allowed'
                                        }`}
                                >
                                    Confirmar Denúncia
                                </button>
                                <button
                                    onClick={() => {
                                        setIsReportModalOpen(false)
                                        setSelectedReason(null)
                                        setReportDetails('')
                                    }}
                                    className="w-full py-2 text-gray-500 font-bold text-sm"
                                >
                                    Voltar
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Block Confirmation Modal */}
            <AnimatePresence>
                {isBlockModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80]"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="fixed inset-4 m-auto h-fit max-w-sm bg-[#1A1A1A] rounded-[32px] border border-white/10 p-6 z-[90] overflow-hidden"
                        >
                            <div className="flex flex-col items-center text-center py-4">
                                <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500 mb-6">
                                    <X size={32} />
                                </div>
                                <h3 className={`${yesevaOne.className} text-xl text-white mb-2`}>Bloquear Perfil?</h3>
                                <p className="text-sm text-gray-400 mb-8 px-4">
                                    Tens a certeza que desejas bloquear o perfil de {otherUser?.first_name}? Esta ação não pode ser desfeita.
                                </p>

                                <div className="w-full space-y-3">
                                    <button
                                        onClick={handleBlock}
                                        className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold shadow-lg shadow-red-500/20 active:scale-95 transition-all"
                                    >
                                        Bloquear Perfil
                                    </button>
                                    <button
                                        onClick={() => setIsBlockModalOpen(false)}
                                        className="w-full py-2 text-gray-500 font-bold text-sm"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Profile Info Sheet */}
            <AnimatePresence>
                {showInfo && otherUser && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowInfo(false)}
                            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110]"
                        />
                        <motion.div
                            initial={{ y: "100%" }}
                            animate={{ y: 0 }}
                            exit={{ y: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="fixed bottom-0 left-0 right-0 h-[85vh] bg-[#0A0A0A] rounded-t-[40px] z-[120] pb-10 overflow-hidden border-t border-white/10 shadow-2xl flex flex-col"
                        >
                            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto my-3 shrink-0" />

                            <button
                                onClick={() => setShowInfo(false)}
                                className="absolute top-4 right-6 p-2 text-white/50 hover:text-white z-[130] transition-colors"
                            >
                                <X size={24} />
                            </button>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto no-scrollbar">
                                <div className="p-8 space-y-8">
                                    {/* Basic Info at Top */}
                                    <div className="flex items-end justify-between gap-4">
                                        <div>
                                            <h2 className={`${yesevaOne.className} text-[32px] text-white leading-tight`}>
                                                {otherUser.first_name} {otherUser.last_name}
                                            </h2>
                                            {otherUser.relationship_goal && (
                                                <div className="inline-flex items-center gap-2 mt-2 px-4 py-1.5 rounded-full bg-[#ff9900]/10 border border-[#ff9900]/20">
                                                    <span className="text-[#ff9900] text-[11px] font-bold uppercase tracking-wider">{otherUser.relationship_goal}</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className={`${yesevaOne.className} text-white text-[42px] leading-none mb-1`}>
                                            {otherUser.age}
                                        </div>
                                    </div>

                                    {/* Gallery Cards */}
                                    <div className="flex gap-4 overflow-x-auto no-scrollbar -mx-8 px-8 py-2">
                                        {(() => {
                                            const profilePhotos = Array.from(new Set([otherUser.avatar_url, ...(otherUser.photos || [])].filter(p => typeof p === 'string' && p.trim() !== '')))
                                            return profilePhotos.map((photo, idx) => (
                                                <motion.div
                                                    key={idx}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setZoomedImage(photo)}
                                                    className="w-64 aspect-[3/4] rounded-[32px] overflow-hidden shrink-0 border border-white/10 bg-white/5 shadow-2xl relative"
                                                >
                                                    <img src={photo} className="w-full h-full object-cover" alt={`${otherUser.first_name} ${idx + 1}`} />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                                                </motion.div>
                                            ))
                                        })()}
                                    </div>

                                    {/* Bio */}
                                    <div className="p-6 rounded-3xl bg-white/5 border border-white/5">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Heart className="text-[#ff9900]" size={18} />
                                            <span className="text-white text-xs font-bold uppercase tracking-widest">Bio</span>
                                        </div>
                                        <p className="text-gray-400 leading-relaxed italic">"{otherUser.bio || 'Sem biografia disponível.'}"</p>
                                    </div>

                                    {/* --- NEW DETAILED SECTIONS START --- */}

                                    {/* 1. Trabalho e Estudo */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                                                <Briefcase size={18} />
                                            </div>
                                            <h3 className={`${yesevaOne.className} text-xl text-white`}>Trabalho e Estudo</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Briefcase className="text-gray-500" size={16} />
                                                    <span className="text-sm text-gray-400">Profissão</span>
                                                </div>
                                                <span className="text-sm font-medium text-white">{otherUser.occupation || '---'}</span>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <GraduationCap className="text-gray-500" size={16} />
                                                    <span className="text-sm text-gray-400">Escolaridade</span>
                                                </div>
                                                <span className="text-sm font-medium text-white">{otherUser.education || '---'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 2. Estilo de Vida */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                                                <Activity size={18} />
                                            </div>
                                            <h3 className={`${yesevaOne.className} text-xl text-white`}>Estilo de Vida</h3>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { icon: Wine, label: 'Bebida', value: otherUser.drinking },
                                                { icon: Cigarette, label: 'Tabaco', value: otherUser.smoking },
                                                { icon: Dumbbell, label: 'Exercício', value: otherUser.exercise },
                                                { icon: Utensils, label: 'Dieta', value: otherUser.diet },
                                                { icon: PawPrint, label: 'Pets', value: otherUser.pets },
                                                { icon: Baby, label: 'Filhos', value: otherUser.children },
                                            ].map((item, i) => (
                                                <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                        <item.icon size={14} />
                                                        <span className="text-xs uppercase tracking-wider">{item.label}</span>
                                                    </div>
                                                    <span className="text-sm font-medium text-white">{item.value || '---'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 3. Desejos de Vida (Sonhos) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                                                <Star size={18} />
                                            </div>
                                            <h3 className={`${yesevaOne.className} text-xl text-white`}>Desejos de Vida</h3>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                { icon: User, label: 'Formar Família', value: otherUser.want_form_family },
                                                { icon: Users, label: 'Fortalecer Família', value: otherUser.want_strengthen_family },
                                                { icon: Wallet, label: 'Estabilidade Financeira', value: otherUser.want_financial_stability },
                                                { icon: Home, label: 'Casa Própria', value: otherUser.want_buy_house },
                                                { icon: Building2, label: 'Negócio Próprio', value: otherUser.want_own_business },
                                                { icon: TrendingUp, label: 'Crescimento Prof.', value: otherUser.want_professional_growth },
                                                { icon: Plane, label: 'Viajar', value: otherUser.want_travel },
                                                { icon: PartyPopper, label: 'Aproveitar a Vida', value: otherUser.want_enjoy_life },
                                                { icon: HandHeart, label: 'Casar', value: otherUser.want_marry === 'Sim' }, // Assuming String 'Sim' or Boolean logic
                                                { icon: Baby, label: 'Ter Filhos', value: otherUser.want_children_future === 'Sim' || otherUser.want_children_future === 'Talvez' },
                                            ].filter(i => !!i.value).map((item, i) => (
                                                <div key={i} className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs font-bold uppercase tracking-wide flex items-center gap-2">
                                                    <item.icon size={12} />
                                                    {item.label}
                                                </div>
                                            ))}
                                            {[
                                                otherUser.want_form_family, otherUser.want_strengthen_family, otherUser.want_financial_stability,
                                                otherUser.want_buy_house, otherUser.want_own_business, otherUser.want_professional_growth,
                                                otherUser.want_travel, otherUser.want_enjoy_life, otherUser.want_marry, otherUser.want_children_future
                                            ].every(v => !v) && (
                                                    <div className="text-gray-500 text-sm italic w-full text-center py-4 bg-white/5 rounded-2xl">
                                                        Nenhum desejo de vida selecionado.
                                                    </div>
                                                )}
                                        </div>
                                    </div>

                                    {/* 4. Interesses */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400">
                                                <Heart size={18} />
                                            </div>
                                            <h3 className={`${yesevaOne.className} text-xl text-white`}>Interesses</h3>
                                        </div>

                                        {/* Sports */}
                                        {otherUser.sports && otherUser.sports.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider pl-1">
                                                    <Trophy size={12} /> Desportos
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {otherUser.sports.map(tag => (
                                                        <span key={tag} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Hobbies */}
                                        {otherUser.hobbies && otherUser.hobbies.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider pl-1">
                                                    <Gamepad2 size={12} /> Hobbies
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {otherUser.hobbies.map(tag => (
                                                        <span key={tag} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Music/Arts */}
                                        {otherUser.music_dance && otherUser.music_dance.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider pl-1">
                                                    <Music size={12} /> Música & Arte
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {otherUser.music_dance.map(tag => (
                                                        <span key={tag} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Culture (Legacy field) */}
                                        {otherUser.lifestyle_culture && otherUser.lifestyle_culture.length > 0 && (
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase tracking-wider pl-1">
                                                    <Globe size={12} /> Cultura
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {otherUser.lifestyle_culture.map(tag => (
                                                        <span key={tag} className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-xs">{tag}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* 5. Outras Informações */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-xl bg-gray-500/20 text-gray-400">
                                                <Info size={18} />
                                            </div>
                                            <h3 className={`${yesevaOne.className} text-xl text-white`}>Outras Informações</h3>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            {/* Languages */}
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Languages className="text-gray-500" size={14} />
                                                    <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Idiomas</span>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {otherUser.languages && otherUser.languages.length > 0 ? (
                                                        otherUser.languages.map(lang => (
                                                            <span key={lang} className="text-sm text-white">{lang}{lang === otherUser.languages![otherUser.languages!.length - 1] ? '' : ', '}</span>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-gray-500">---</span>
                                                    )}
                                                    {otherUser.other_language && (
                                                        <span className="text-sm text-white">, {otherUser.other_language}</span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Religião */}
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Church className="text-gray-500" size={16} />
                                                    <span className="text-sm text-gray-400">Religião</span>
                                                </div>
                                                <span className="text-sm font-medium text-white">{otherUser.other_religion || otherUser.religion || '---'}</span>
                                            </div>

                                            {/* Política */}
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Scale className="text-gray-500" size={16} />
                                                    <span className="text-sm text-gray-400">Política</span>
                                                </div>
                                                <span className="text-sm font-medium text-white">{otherUser.other_political || otherUser.political_view || '---'}</span>
                                            </div>

                                            {/* Altura */}
                                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <TrendingUp className="text-gray-500" size={16} />
                                                    <span className="text-sm text-gray-400">Altura</span>
                                                </div>
                                                <span className="text-sm font-medium text-white">{otherUser.height ? `${otherUser.height} cm` : '---'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="h-6"></div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Limit Reached Modal */}
            <AnimatePresence>
                {isLimitModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[80]"
                            onClick={() => setIsLimitModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="fixed inset-4 m-auto h-fit max-w-sm bg-[#1A1A1A] rounded-[32px] border border-[#ff9900]/30 p-8 z-[90] text-center overflow-hidden"
                        >
                            {/* Glow */}
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#ff9900]/10 blur-[80px] pointer-events-none" />

                            <div className="relative z-10">
                                <div className="w-20 h-20 mx-auto rounded-full bg-[#ff9900]/10 flex items-center justify-center mb-6 border border-[#ff9900]/20">
                                    <Lock size={40} className="text-[#ff9900]" />
                                </div>

                                <h3 className={`${yesevaOne.className} text-2xl text-white mb-2`}>Limite Atingido</h3>
                                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                                    Atingiste o teu limite diário de batidas. <br />
                                    Faz upgrade para continuares a conversar sem limites!
                                </p>

                                <button
                                    onClick={() => router.push('/plans')}
                                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-bold text-lg shadow-lg shadow-orange-500/20 active:scale-95 transition-all mb-4"
                                >
                                    Ver Planos VIP
                                </button>

                                <button
                                    onClick={() => setIsLimitModalOpen(false)}
                                    className="text-gray-500 text-sm font-semibold hover:text-white transition-colors"
                                >
                                    Voltar amanhã
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Background Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0" />
        </div>
    )
}
