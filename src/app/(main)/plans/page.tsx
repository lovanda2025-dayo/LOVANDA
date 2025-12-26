'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Yeseva_One } from 'next/font/google'
import { Check, Crown, Zap, Flame, Star, ArrowLeft, Heart, MessageCircle, Eye, History, Filter, Archive, Send, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const yesevaOne = Yeseva_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
})

const plans = [
    {
        name: 'SANZALA',
        subtitle: 'Este é o teu ponto de partida!',
        price: 'Grátis',
        icon: <Flame className="text-orange-500" size={24} />,
        features: [
            { text: 'Chat: 10 batidas/dia', icon: <MessageCircle size={14} /> },
            { text: 'História anónima: 1/dia', icon: <History size={14} /> },
            { text: 'Filtros: Apenas idade', icon: <Filter size={14} /> },
            { text: 'Arquivar Perfis: Máx. 5', icon: <Archive size={14} /> },
            { text: 'Revelar Perfil: Bloqueado', icon: <Eye size={14} />, blocked: true },
            { text: 'Likes/Dislikes: Ilimitados', icon: <Heart size={14} /> },
            { text: 'Mensagens pré-match: Bloqueado', icon: <Send size={14} />, blocked: true },
        ],
        buttonText: 'Continuar com Free',
        popular: false
    },
    {
        name: 'VIP',
        subtitle: 'Dá um passo à frente no jogo do amor',
        price: '500 Kz/sem OU 1500 Kz/mês',
        icon: <Star className="text-yellow-500" size={24} />,
        features: [
            { text: 'Chat: 50 batidas/dia', icon: <MessageCircle size={14} /> },
            { text: 'História anónima: 3/dia', icon: <History size={14} /> },
            { text: 'Filtros: Todos', icon: <Filter size={14} /> },
            { text: 'Arquivar Perfis: Máx. 10', icon: <Archive size={14} /> },
            { text: 'Revelar Perfil: Bloqueado', icon: <Eye size={14} />, blocked: true },
            { text: 'Likes/Dislikes: Ilimitados', icon: <Heart size={14} /> },
            { text: 'Mensagens pré-match: Bloqueado', icon: <Send size={14} />, blocked: true },
        ],
        buttonText: 'Adquirir VIP',
        popular: false
    },
    {
        name: 'PREMIUM',
        subtitle: 'Para quem quer o máximo da experiência',
        price: '1000 Kz/sem OU 3000 Kz/mês',
        icon: <Crown className="text-amber-500" size={24} />,
        features: [
            { text: 'Chat: 100 batidas/dia', icon: <MessageCircle size={14} /> },
            { text: 'História anónima: Ilimitadas', icon: <History size={14} /> },
            { text: 'Filtros: Completos', icon: <Filter size={14} /> },
            { text: 'Arquivar Perfis: Ilimitados', icon: <Archive size={14} /> },
            { text: 'Revelar Perfil: Liberado', icon: <Eye size={14} /> },
            { text: 'Likes/Dislikes: Ilimitados', icon: <Heart size={14} /> },
            { text: 'Mensagens pré-match: Ilimitadas', icon: <Send size={14} /> },
        ],
        buttonText: 'Ser PREMIUM',
        popular: true
    }
]

export default function PlansPage() {
    const router = useRouter()
    const [userProfile, setUserProfile] = useState<{ first_name: string } | null>(null)

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('first_name')
                    .eq('id', user.id)
                    .single()
                if (profile) setUserProfile(profile)
            }
        }
        fetchUser()
    }, [])

    const handlePurchase = (type: string) => {
        const name = userProfile?.first_name || 'Utilizador'
        const message = encodeURIComponent(`Olá! Sou o ${name}, gostaria de adquirir o ${type}.`)
        const whatsappUrl = `https://wa.me/244938495958?text=${message}`
        window.open(whatsappUrl, '_blank')
    }

    return (
        <div className="min-h-screen bg-black text-white pb-24">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 h-20 px-4 flex items-center justify-between z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 text-white/70 hover:text-white transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className={`${yesevaOne.className} text-[36px]`}>Planos</h1>
                <div className="w-10" /> {/* Spacer */}
            </header>

            <main className="pt-28 px-4 max-w-lg mx-auto">
                <div className="text-center mb-10">
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-gray-400 text-sm"
                    >
                        Mais recursos, mais encontros, mais diversão!
                    </motion.p>
                </div>

                <div className="space-y-6">
                    {plans.map((plan, idx) => (
                        <motion.div
                            key={plan.name}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`
                                relative p-6 rounded-[32px] border transition-all active:scale-[0.98]
                                ${plan.popular
                                    ? 'bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border-[#ff9900]/30 shadow-[0_20px_50px_rgba(255,153,0,0.1)]'
                                    : 'bg-[#121212]/60 backdrop-blur-sm border-white/5 hover:border-white/10'}
                            `}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#ff9900] text-black text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                    Mais Popular
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {plan.icon}
                                        <h3 className={`${yesevaOne.className} text-2xl`}>{plan.name}</h3>
                                    </div>
                                    <p className="text-gray-400 text-xs">{plan.subtitle}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xl font-bold">{plan.price}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-y-3 mb-8">
                                {plan.features.map((feature, fIdx) => (
                                    <div key={fIdx} className={`flex items-center gap-3 ${feature.blocked ? 'opacity-30' : 'opacity-100'}`}>
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${feature.blocked ? 'bg-white/5 text-gray-500' : 'bg-gradient-to-br from-[#ff0800] to-[#ff9900] text-white'}`}>
                                            {feature.blocked ? <X size={10} /> : <Check size={12} />}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-500">{feature.icon}</span>
                                            <span className="text-sm font-medium">{feature.text}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => handlePurchase(`plano ${plan.name}`)}
                                className={`
                                    w-full py-4 rounded-2xl font-bold text-sm transition-all shadow-xl
                                    ${plan.popular
                                        ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-[#ff0800]/20'
                                        : 'bg-white text-black hover:bg-gray-100'}
                                `}
                            >
                                {plan.buttonText}
                            </button>
                        </motion.div>
                    ))}

                    {/* Extras Section */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="p-8 rounded-[32px] bg-gradient-to-br from-[#ff0800]/5 to-[#ff9900]/5 border border-[#ff9900]/10"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#ff9900]/20 flex items-center justify-center text-[#ff9900]">
                                <Zap size={24} />
                            </div>
                            <div>
                                <h3 className={`${yesevaOne.className} text-2xl`}>Extras</h3>
                                <p className="text-gray-400 text-xs">Compra Avulsa</p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-300 mb-6 leading-relaxed">
                            Se precisares de mais interação, compra batidas extra e continua a ligar corações!
                        </p>

                        <div className="bg-black/40 rounded-2xl p-4 border border-white/5 space-y-3 mb-8">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Preço por Batida</span>
                                <span className="text-[#ff9900] font-bold">30 Kz</span>
                            </div>
                            <div className="h-px bg-white/5" />
                            <div className="flex justify-between items-center text-xs text-gray-400">
                                <span>Mensagem de Texto</span>
                                <span>1 Batida</span>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-400">
                                <span>Mensagem de Foto</span>
                                <span>2 Batidas</span>
                            </div>
                        </div>

                        <button
                            onClick={() => handlePurchase('Batidas Extra')}
                            className="w-full py-4 rounded-2xl bg-[#ff9900]/10 border border-[#ff9900]/20 text-[#ff9900] font-bold text-sm hover:bg-[#ff9900]/20 transition-all active:scale-[0.98]"
                        >
                            Comprar Batidas
                        </button>
                    </motion.div>
                </div>

                <div className="mt-12 text-center pb-12">
                    <p className="text-[10px] text-gray-600 uppercase tracking-widest font-black">
                        Lovanda • Angola Cloud Services
                    </p>
                </div>
            </main>

            {/* Noise Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0" />
        </div>
    )
}
