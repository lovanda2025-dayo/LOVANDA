'use client'

import { motion } from 'framer-motion'
import { Yeseva_One } from 'next/font/google'
import { useRouter } from 'next/navigation'
import {
    Settings,
    Edit2,
    ChevronRight,
    Flame,
    Crown,
    Star,
    Zap,
    ArrowLeft,
    CheckCircle2,
    MessageCircle,
    Headphones
} from 'lucide-react'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const yesevaOne = Yeseva_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
})

interface Profile {
    first_name: string
    age: number
    bio: string
    avatar_url: string
}

export default function ProfilePage() {
    const router = useRouter()
    const [profile, setProfile] = useState<Profile | null>(null)
    const [loading, setLoading] = useState(true)
    const [dailyBatidas, setDailyBatidas] = useState(0)
    const [extraBatidas, setExtraBatidas] = useState(0)
    const [plan, setPlan] = useState('SANZALA')

    const handleSupport = () => {
        const name = profile?.first_name || 'Utilizador'
        const message = encodeURIComponent(`Olá! Sou o ${name}, preciso de ajuda com o meu perfil no Lovanda.`)
        const whatsappUrl = `https://wa.me/244938495958?text=${message}`
        window.open(whatsappUrl, '_blank')
    }

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }

                const { data: profileData, error } = await supabase
                    .from('profiles')
                    .select('first_name, age, bio, avatar_url, daily_batidas, extra_batidas, plan_type')
                    .eq('id', user.id)
                    .single()

                if (error) throw error

                setProfile(profileData)

                // Set real batidas separately
                setDailyBatidas(profileData.daily_batidas || 0)
                setExtraBatidas(profileData.extra_batidas || 0)

                // Set real plan
                setPlan(profileData.plan_type || 'SANZALA')
            } catch (err) {
                console.error('Erro ao buscar perfil:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [router])

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-[#ff9900]/20 border-t-[#ff9900] animate-spin" />
            </div>
        )
    }

    if (!profile) return null

    return (
        <div className="min-h-screen bg-black text-white pb-24 overflow-y-auto no-scrollbar">
            {/* Header */}
            <header className="w-full h-20 px-4 flex items-center justify-center bg-black border-b border-white/5">
                <h1 className={`${yesevaOne.className} text-[36px]`}>Perfil</h1>
            </header>

            <main className="pt-8 px-4 max-w-lg mx-auto space-y-6">

                {/* Card 1: Informações do Usuário */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative bg-[#1A1A1A]/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-8 overflow-hidden group shadow-2xl"
                >
                    {/* Background Glow */}
                    <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#ff0800]/20 rounded-full blur-[60px] group-hover:bg-[#ff0800]/30 transition-all" />

                    <div className="relative flex flex-col items-center text-center">
                        <div className="relative mb-6">
                            <div className="w-28 h-28 rounded-full p-1 bg-gradient-to-tr from-[#ff0800] to-[#ff9900]">
                                <img
                                    src={profile.avatar_url || '/default-avatar.png'}
                                    alt={profile.first_name}
                                    className="w-full h-full object-cover rounded-full border-4 border-black"
                                />
                            </div>
                            <button
                                onClick={() => router.push('/profile/edit')}
                                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                            >
                                <Edit2 size={14} />
                            </button>
                        </div>

                        <h2 className={`${yesevaOne.className} text-2xl mb-1`}>
                            {profile.first_name}, {profile.age} <CheckCircle2 size={18} className="inline text-blue-400 ml-1" />
                        </h2>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6 px-2">
                            {profile.bio || 'Sem biografia definida.'}
                        </p>

                        <button
                            onClick={() => router.push('/profile/edit')}
                            className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all flex items-center justify-center gap-2 group/btn"
                        >
                            <Edit2 size={16} className="text-[#ff9900]" />
                            <span>Editar Perfil</span>
                        </button>
                    </div>
                </motion.div>

                {/* Card 2: Plano Atual */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-[#1A1A1A]/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 shadow-xl"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`${yesevaOne.className} text-xl text-gray-400`}>Plano Atual</h3>
                        {plan === 'VIP' ? <Star className="text-yellow-500" size={20} /> :
                            plan === 'PREMIUM' ? <Crown className="text-amber-500" size={20} /> :
                                <Flame className="text-[#ff9900]" size={20} />}
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-[#ff0800]/10 to-[#ff9900]/10 border border-[#ff9900]/20 mb-6">
                        <div>
                            <p className="text-xs text-[#ff9900] font-black uppercase tracking-wider mb-1">Status</p>
                            <h4 className={`${yesevaOne.className} text-2xl`}>{plan}</h4>
                        </div>
                        <button
                            onClick={() => router.push('/plans')}
                            className="flex items-center gap-1 text-xs font-bold text-white hover:text-[#ff9900] transition-colors"
                        >
                            Ver Planos <ChevronRight size={14} />
                        </button>
                    </div>

                    <button
                        onClick={() => router.push('/plans')}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-bold text-sm shadow-xl shadow-[#ff0800]/20 active:scale-95 transition-all"
                    >
                        Melhorar Experiência
                    </button>
                </motion.div>

                {/* Card 3: Batidas */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#1A1A1A]/60 backdrop-blur-xl border border-white/5 rounded-[32px] p-6 shadow-xl"
                >
                    <div className="flex items-center justify-between mb-6">
                        <h3 className={`${yesevaOne.className} text-xl text-gray-400`}>Batidas Disponíveis</h3>
                        <div className="w-10 h-10 rounded-xl bg-[#ff9900]/20 flex items-center justify-center text-[#ff9900]">
                            <Zap size={20} />
                        </div>
                    </div>

                    <div className="flex items-end gap-2 mb-4">
                        <span className="text-6xl font-black text-white leading-none">{dailyBatidas + extraBatidas}</span>
                        <span className="text-gray-500 font-bold uppercase tracking-widest text-xs mb-1">Total</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-8">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-[#ff9900]/10 to-[#ff0800]/5 border border-[#ff9900]/20">
                            <p className="text-[10px] text-[#ff9900] font-black uppercase tracking-widest mb-1">Diárias</p>
                            <p className="text-2xl font-black text-white">{dailyBatidas}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1">Extras</p>
                            <p className="text-2xl font-black text-white">{extraBatidas}</p>
                        </div>
                    </div>

                    <button
                        className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 hover:border-[#ff9900]/30 transition-all active:scale-95"
                    >
                        Comprar Batidas
                    </button>
                </motion.div>

                {/* Botão Final: Definições */}
                <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onClick={() => router.push('/settings')}
                    className="w-full py-5 rounded-[24px] bg-[#1A1A1A] border border-white/5 text-gray-400 font-bold text-sm flex items-center justify-center gap-3 hover:text-white hover:border-white/10 active:scale-[0.98] transition-all"
                >
                    <Settings size={18} />
                    <span>Definições da Conta</span>
                </motion.button>

                {/* Botão Final: Suporte */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="w-full mt-4"
                >
                    <button
                        onClick={handleSupport}
                        className="w-full py-5 rounded-[24px] bg-[#ff9900]/10 border border-[#ff9900]/20 text-[#ff9900] font-bold text-sm flex items-center justify-center gap-3 hover:bg-[#ff9900]/20 active:scale-[0.98] transition-all shadow-lg shadow-[#ff9900]/5"
                    >
                        <Headphones size={18} />
                        <span>Falar com Suporte</span>
                    </button>
                </motion.div>

                <div className="text-center py-8">
                    <p className="text-[10px] text-gray-700 uppercase tracking-[0.3em] font-black">
                        Lovanda • Versão 1.0.4
                    </p>
                </div>
            </main>

            {/* Noise Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0" />
        </div>
    )
}
