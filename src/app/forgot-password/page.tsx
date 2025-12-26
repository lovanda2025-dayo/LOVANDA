'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Yeseva_One } from 'next/font/google'
import { MessageCircle, ArrowLeft, ShieldCheck, Headphones } from 'lucide-react'
import { motion } from 'framer-motion'

const yesevaOne = Yeseva_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
})

export default function ForgotPasswordPage() {
    return (
        <div className="fixed inset-0 h-[100dvh] w-full bg-black flex flex-col items-center justify-center p-6 overflow-hidden touch-none">
            {/* Background Glows */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] aspect-square bg-[#ff0800]/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square bg-[#ff9900]/10 blur-[120px] rounded-full" />

            <div className="w-full max-w-sm z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="space-y-8"
                >
                    {/* Header */}
                    <div className="text-center space-y-4">
                        <div className="mx-auto w-20 h-20 rounded-[28px] bg-white/5 backdrop-blur-3xl border border-white/10 flex items-center justify-center shadow-2xl mb-6">
                            <Headphones className="text-[#ff9900]" size={36} />
                        </div>

                        <h1 className={`${yesevaOne.className} text-4xl leading-tight text-white`}>
                            Esqueceu a senha? <br /> Relaxa!
                        </h1>
                        <p className="mt-2 text-sm text-gray-500 max-w-[280px] mx-auto leading-relaxed">
                            A segurança da sua conta é nossa prioridade. Para recuperar o seu acesso, fale com um de nossos administradores.
                        </p>
                    </div>

                    {/* Support Card */}
                    <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[32px] p-6 space-y-6 shadow-2xl">
                        <div className="flex items-center gap-4 text-left">
                            <div className="w-12 h-12 rounded-2xl bg-[#ff9900]/10 flex items-center justify-center shrink-0">
                                <ShieldCheck className="text-[#ff9900]" size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">Recuperação Segura</h3>
                                <p className="text-gray-500 text-[11px]">Verificação manual para proteger seus dados.</p>
                            </div>
                        </div>

                        <div className="h-px w-full bg-white/5" />

                        <a
                            href={`https://wa.me/244938495958?text=${encodeURIComponent('Olá! Esqueci minha senha e preciso de ajuda para recuperar o acesso à minha conta Lovanda.')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-bold text-base shadow-[0_10px_30px_rgba(255,8,0,0.3)] flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
                        >
                            <MessageCircle size={20} fill="currentColor" className="text-white/20" />
                            Falar com Suporte
                        </a>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-center pt-4">
                        <Link
                            href="/login"
                            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-sm font-medium group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Voltar para o Login
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
