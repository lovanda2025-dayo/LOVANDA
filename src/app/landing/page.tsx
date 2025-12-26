'use client'

import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Yeseva_One } from 'next/font/google'
import { motion } from 'framer-motion'
import { Heart, Ghost } from 'lucide-react'

const yesevaOne = Yeseva_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
})

export default function LandingPage() {
    const router = useRouter()

    return (
        <div className="min-h-[100dvh] w-full bg-black text-white flex flex-col items-center justify-between p-6 py-12 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[40%] bg-[#ff0800]/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[70%] h-[40%] bg-[#ff9900]/10 rounded-full blur-[120px] pointer-events-none" />

            {/* Top Logo / Name */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center z-10"
            >
                <h1 className={`${yesevaOne.className} text-5xl tracking-tighter`}>
                    <span className="bg-gradient-to-r from-[#ff0800] to-[#ff9900] bg-clip-text text-transparent">
                        Lovanda
                    </span>
                </h1>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.3em] mt-2">
                    Liga corações, cria histórias
                </p>
            </motion.div>

            {/* Central Image Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="relative w-full max-w-[320px] aspect-[4/5] z-10"
            >
                <div className="absolute inset-0 rounded-[40px] border border-white/10 shadow-2xl overflow-hidden">
                    <Image
                        src="/landing-couple.jpg"
                        alt="Join the community"
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Dark gradient overlay at bottom of image */}
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
                </div>

                {/* Floating ornaments */}
                <div className="absolute -top-4 -right-4 w-12 h-12 rounded-2xl bg-gradient-to-br from-[#ff0800] to-[#ff9900] flex items-center justify-center shadow-xl animate-bounce duration-[3000ms]">
                    <Heart className="text-white" size={24} fill="currentColor" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-xl">
                    <Ghost className="text-[#ff9900]" size={24} />
                </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="w-full max-w-sm flex flex-col gap-4 z-10"
            >
                <button
                    onClick={() => router.push('/register')}
                    className="w-full py-5 rounded-full bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-black uppercase text-sm tracking-widest shadow-xl shadow-orange-950/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                    Criar conta agora
                </button>

                <button
                    onClick={() => router.push('/login')}
                    className="w-full py-5 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white font-black uppercase text-sm tracking-widest hover:bg-white/10 active:scale-[0.98] transition-all"
                >
                    Já tenho conta • Entrar
                </button>

                <p className="text-[10px] text-gray-500 text-center px-8 leading-relaxed">
                    Adiciona à tela inicial e usa o site com mais conforto
                </p>
            </motion.div>

            {/* Background texture */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        </div>
    )
}
