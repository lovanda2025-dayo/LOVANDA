'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Yeseva_One } from 'next/font/google'
import { motion, AnimatePresence } from 'framer-motion'
import { Ghost, Send, MessageCircle, Heart, MoreHorizontal, Clock, Plus, X, ChevronLeft, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNow } from 'date-fns'
import { pt } from 'date-fns/locale'
import { usePlan } from '@/hooks/usePlan'

const yesevaOne = Yeseva_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
})

interface Story {
    id: string
    content: string
    created_at: string
    comment_count: number
    reaction_count: number
    user_has_reacted?: boolean
}

interface Comment {
    id: string
    content: string
    created_at: string
}

export default function StoriesPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [stories, setStories] = useState<Story[]>([])
    const [newStory, setNewStory] = useState('')
    const [isPosting, setIsPosting] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [expandedStory, setExpandedStory] = useState<string | null>(null)
    const [comments, setComments] = useState<{ [key: string]: Comment[] }>({})
    const [loadingComments, setLoadingComments] = useState<{ [key: string]: boolean }>({})
    const [newComment, setNewComment] = useState('')

    // Plan Limits
    const { consumeAction } = usePlan()
    const [isLimitModalOpen, setIsLimitModalOpen] = useState(false)

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUserId(user.id)
            await loadStories()
        }
        init()
    }, [])

    const loadStories = async () => {
        try {
            setLoading(true)
            const { data: storiesData, error: storiesError } = await supabase
                .from('stories')
                .select(`
                    *,
                    story_comments(id),
                    story_reactions(id, user_id)
                `)
                .order('created_at', { ascending: false })

            if (storiesError) throw storiesError

            const formattedStories = storiesData.map((story: any) => ({
                id: story.id,
                content: story.content,
                created_at: story.created_at,
                comment_count: story.story_comments?.length || 0,
                reaction_count: story.story_reactions?.length || 0,
                user_has_reacted: false // This will be updated below if session available
            }))

            setStories(formattedStories)
        } catch (err) {
            console.error('Erro ao carregar histórias:', err)
        } finally {
            setLoading(false)
        }
    }

    // Refresh reactions when userId is set
    useEffect(() => {
        if (userId && stories.length > 0) {
            const updateStories = async () => {
                const { data: reactions } = await supabase
                    .from('story_reactions')
                    .select('story_id')
                    .eq('user_id', userId)

                if (reactions) {
                    const reactIds = new Set(reactions.map(r => r.story_id))
                    setStories(prev => prev.map(s => ({
                        ...s,
                        user_has_reacted: reactIds.has(s.id)
                    })))
                }
            }
            updateStories()
        }
    }, [userId])

    const handleCreateStory = async () => {
        if (!newStory.trim() || !userId) return

        // Check Limit
        const canPost = await consumeAction('stories', 1)
        if (!canPost) {
            setIsLimitModalOpen(true)
            return
        }

        try {
            setIsPosting(true)
            const { data, error } = await supabase
                .from('stories')
                .insert({
                    content: newStory.trim(),
                    user_id: userId
                })
                .select()
                .single()

            if (error) throw error

            setStories([{
                id: data.id,
                content: data.content,
                created_at: data.created_at,
                comment_count: 0,
                reaction_count: 0,
                user_has_reacted: false
            }, ...stories])

            setNewStory('')
            setShowForm(false)
        } catch (err) {
            console.error('Erro ao postar história:', err)
        } finally {
            setIsPosting(false)
        }
    }

    const handleToggleReaction = async (storyId: string, hasReacted: boolean) => {
        if (!userId) return

        try {
            if (hasReacted) {
                await supabase
                    .from('story_reactions')
                    .delete()
                    .eq('story_id', storyId)
                    .eq('user_id', userId)
            } else {
                await supabase
                    .from('story_reactions')
                    .insert({
                        story_id: storyId,
                        user_id: userId,
                        type: 'like'
                    })
            }

            setStories(stories.map(s => {
                if (s.id === storyId) {
                    return {
                        ...s,
                        reaction_count: hasReacted ? s.reaction_count - 1 : s.reaction_count + 1,
                        user_has_reacted: !hasReacted
                    }
                }
                return s
            }))
        } catch (err) {
            console.error('Erro ao reagir:', err)
        }
    }

    const loadComments = async (storyId: string) => {
        if (loadingComments[storyId]) return

        try {
            setLoadingComments(prev => ({ ...prev, [storyId]: true }))
            const { data, error } = await supabase
                .from('story_comments')
                .select('*')
                .eq('story_id', storyId)
                .order('created_at', { ascending: true })

            if (error) throw error

            setComments(prev => ({ ...prev, [storyId]: data }))
        } catch (err) {
            console.error('Erro ao carregar comentários:', err)
        } finally {
            setLoadingComments(prev => ({ ...prev, [storyId]: false }))
        }
    }

    const handlePostComment = async (storyId: string) => {
        if (!newComment.trim() || !userId) return

        try {
            const { data, error } = await supabase
                .from('story_comments')
                .insert({
                    story_id: storyId,
                    user_id: userId,
                    content: newComment.trim()
                })
                .select()
                .single()

            if (error) throw error

            setComments(prev => ({
                ...prev,
                [storyId]: [...(prev[storyId] || []), data]
            }))
            setStories(stories.map(s => {
                if (s.id === storyId) {
                    return { ...s, comment_count: s.comment_count + 1 }
                }
                return s
            }))
            setNewComment('')
        } catch (err) {
            console.error('Erro ao comentar:', err)
        }
    }

    return (
        <div className="fixed inset-0 h-[100dvh] w-full bg-black overflow-hidden flex flex-col">
            {/* Content Section */}
            <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar relative z-10">
                <div className="max-w-lg mx-auto">
                    {/* Header */}
                    <header className="pt-12 pb-6 px-6 flex items-center justify-center">
                        <h1 className={`${yesevaOne.className} text-3xl text-white tracking-tight text-center`}>
                            Histórias
                        </h1>
                    </header>

                    {/* Subtitle Section */}
                    <div className="mb-8">
                        <p className="text-[#ff9900] text-[10px] font-bold uppercase tracking-widest mb-1">
                            O que sentes, fica aqui em segredo
                        </p>
                        <div className="h-0.5 w-12 bg-gradient-to-r from-[#ff9900] to-transparent rounded-full" />
                    </div>

                    {/* Post Toggle */}
                    <AnimatePresence mode="wait">
                        {!showForm ? (
                            <motion.button
                                key="toggle"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                onClick={() => setShowForm(true)}
                                className="w-full mb-8 p-5 rounded-3xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center gap-4 text-gray-500 hover:bg-white/10 transition-all duration-300 group shadow-lg"
                            >
                                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff0800] to-[#ff9900] flex items-center justify-center text-white shadow-xl shadow-orange-950/20 group-hover:scale-110 transition-transform">
                                    <Plus size={22} />
                                </div>
                                <span className="font-bold text-sm">O que queres contar hoje?</span>
                            </motion.button>
                        ) : (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="mb-8 p-6 rounded-[32px] bg-white/5 backdrop-blur-xl border border-[#ff9900]/30 shadow-2xl relative overflow-hidden"
                            >
                                <div className="flex justify-between items-center mb-4 relative z-10">
                                    <h2 className="text-white font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                                        <Ghost className="text-[#ff9900]" size={14} />
                                        Novo Desabafo Anónimo
                                    </h2>
                                    <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-colors">
                                        <X size={16} />
                                    </button>
                                </div>
                                <textarea
                                    value={newStory}
                                    onChange={(e) => setNewStory(e.target.value)}
                                    placeholder="Escreve aqui o teu segredo... Ninguém saberá que foste tu."
                                    className="w-full h-32 bg-black/40 border border-white/5 rounded-2xl p-4 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#ff9900]/50 transition-all resize-none mb-4 relative z-10"
                                />
                                <div className="flex justify-between items-center relative z-10">
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider flex items-center gap-1">
                                        <Ghost size={10} /> 100% Anónimo
                                    </span>
                                    <button
                                        onClick={handleCreateStory}
                                        disabled={isPosting || !newStory.trim()}
                                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-orange-600/20 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        {isPosting ? 'A postar...' : 'Publicar'}
                                    </button>
                                </div>
                                {/* Glow effect behind form */}
                                <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-[#ff9900]/5 rounded-full blur-3xl pointer-events-none" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Stories List */}
                    <div className="space-y-6">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <div className="relative w-10 h-10">
                                    <div className="absolute inset-0 rounded-full border-4 border-[#ff9900]/20" />
                                    <div className="absolute inset-0 rounded-full border-4 border-[#ff9900] border-t-transparent animate-spin" />
                                </div>
                                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">A carregar histórias...</p>
                            </div>
                        ) : stories.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="py-20 text-center opacity-40"
                            >
                                <Ghost className="mx-auto mb-4" size={48} />
                                <p className="text-sm">Ainda não há histórias. Sê o primeiro!</p>
                            </motion.div>
                        ) : (
                            stories.map((story) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    key={story.id}
                                    className="rounded-[32px] bg-white/5 backdrop-blur-md border border-white/5 overflow-hidden hover:border-white/10 transition-all duration-500 shadow-xl group relative"
                                >
                                    <div className="p-6 relative z-10">
                                        <div className="flex justify-between items-start mb-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 border border-white/5">
                                                    <Ghost size={18} />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Anónimo</span>
                                                    <span className="text-[9px] text-gray-500 uppercase font-bold flex items-center gap-1">
                                                        <Clock size={10} /> {formatDistanceToNow(new Date(story.created_at), { addSuffix: true, locale: pt })}
                                                    </span>
                                                </div>
                                            </div>
                                            <button className="w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-gray-500 transition-colors">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </div>

                                        <p className="text-white leading-relaxed text-base font-medium mb-6 whitespace-pre-wrap px-1">
                                            "{story.content}"
                                        </p>

                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => handleToggleReaction(story.id, !!story.user_has_reacted)}
                                                className={`flex items-center gap-2 group/btn transition-all duration-300 py-2 px-4 rounded-2xl ${story.user_has_reacted ? 'bg-[#ff0800]/10 text-[#ff0800]' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                            >
                                                <Heart size={16} fill={story.user_has_reacted ? 'currentColor' : 'none'} className="transition-transform group-active/btn:scale-125" />
                                                <span className="text-xs font-black">{story.reaction_count}</span>
                                            </button>

                                            <button
                                                onClick={() => {
                                                    if (expandedStory === story.id) {
                                                        setExpandedStory(null)
                                                    } else {
                                                        setExpandedStory(story.id)
                                                        loadComments(story.id)
                                                    }
                                                }}
                                                className={`flex items-center gap-2 group/btn transition-all duration-300 py-2 px-4 rounded-2xl ${expandedStory === story.id ? 'bg-[#ff9900]/10 text-[#ff9900]' : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'}`}
                                            >
                                                <MessageCircle size={16} className="transition-transform group-active/btn:scale-125" />
                                                <span className="text-xs font-black">{story.comment_count}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Subtle Glow inside card */}
                                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-[#ff9900]/5 rounded-full blur-2xl group-hover:bg-[#ff9900]/10 transition-colors pointer-events-none" />

                                    {/* Comments Section */}
                                    <AnimatePresence>
                                        {expandedStory === story.id && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-white/5 bg-black/40 overflow-hidden"
                                            >
                                                <div className="p-6">
                                                    <h3 className="text-white text-[10px] font-black uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                                        Comentários
                                                        {loadingComments[story.id] && <div className="w-1.5 h-1.5 bg-[#ff9900] rounded-full animate-pulse" />}
                                                    </h3>

                                                    <div className="space-y-4 mb-6 max-h-60 overflow-y-auto no-scrollbar pr-2">
                                                        {comments[story.id]?.length === 0 && !loadingComments[story.id] ? (
                                                            <p className="text-gray-600 text-[10px] font-bold uppercase text-center py-4 tracking-widest italic leading-relaxed">Ninguém comentou ainda.<br />Sê o primeiro a dizer algo!</p>
                                                        ) : (
                                                            comments[story.id]?.map((comment) => (
                                                                <motion.div
                                                                    initial={{ opacity: 0, x: -10 }}
                                                                    animate={{ opacity: 1, x: 0 }}
                                                                    key={comment.id}
                                                                    className="flex gap-3 items-start group/comment"
                                                                >
                                                                    <div className="w-7 h-7 rounded-xl bg-white/5 flex items-center justify-center text-gray-500 flex-shrink-0 border border-white/5 group-hover/comment:border-[#ff9900]/30 transition-colors">
                                                                        <Ghost size={12} />
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3 shadow-sm group-hover/comment:bg-white/10 transition-colors">
                                                                            <p className="text-white/90 text-[13px] leading-relaxed font-medium">{comment.content}</p>
                                                                        </div>
                                                                        <p className="text-[9px] text-gray-600 font-bold uppercase mt-1.5 ml-1 tracking-tighter">
                                                                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: pt })}
                                                                        </p>
                                                                    </div>
                                                                </motion.div>
                                                            ))
                                                        )}
                                                    </div>

                                                    <div className="relative">
                                                        <input
                                                            type="text"
                                                            value={newComment}
                                                            onChange={(e) => setNewComment(e.target.value)}
                                                            onKeyPress={(e) => e.key === 'Enter' && handlePostComment(story.id)}
                                                            placeholder="Adicionar um comentário..."
                                                            className="w-full bg-black/50 border border-white/10 rounded-2xl py-3.5 px-5 pr-12 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#ff9900]/50 transition-all font-medium"
                                                        />
                                                        <button
                                                            onClick={() => handlePostComment(story.id)}
                                                            disabled={!newComment.trim()}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[#ff9900] disabled:text-gray-700 transition-colors hover:scale-110 active:scale-90"
                                                        >
                                                            <Send size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Background Texture & Effects */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            <div className="fixed inset-0 -z-10 bg-black pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#ff0800]/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] left-[-10%] w-[40%] h-[40%] bg-[#ff9900]/10 rounded-full blur-[100px]" />
            </div>

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
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[#ff9900]/10 blur-[80px] pointer-events-none" />
                            <div className="relative z-10">
                                <div className="w-20 h-20 mx-auto rounded-full bg-[#ff9900]/10 flex items-center justify-center mb-6 border border-[#ff9900]/20">
                                    <Lock size={40} className="text-[#ff9900]" />
                                </div>
                                <h3 className={`${yesevaOne.className} text-2xl text-white mb-2`}>Limite de Histórias</h3>
                                <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                                    Já partilhaste a tua história de hoje. <br />
                                    Faz upgrade para partilhares mais momentos!
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

        </div>
    )
}
