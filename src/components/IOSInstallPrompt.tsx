'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Share } from 'lucide-react'
import { Yeseva_One } from 'next/font/google'

const yesevaOne = Yeseva_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
})

export default function IOSInstallPrompt() {
    const [showPrompt, setShowPrompt] = useState(false)

    useEffect(() => {
        // Check if iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream

        // Check if already installed (standalone mode)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true

        // Check if user has dismissed before
        const hasDismissed = localStorage.getItem('ios-install-dismissed') === 'true'

        // Show prompt if iOS, not installed, and not dismissed
        if (isIOS && !isStandalone && !hasDismissed) {
            // Delay showing to avoid overwhelming the user
            const timer = setTimeout(() => {
                setShowPrompt(true)
            }, 3000)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleDismiss = () => {
        setShowPrompt(false)
        localStorage.setItem('ios-install-dismissed', 'true')
    }

    return (
        <AnimatePresence>
            {showPrompt && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleDismiss}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9998]"
                    />

                    {/* Prompt */}
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed bottom-6 left-6 right-6 z-[9999] bg-[#1A1A1A] rounded-[32px] border border-white/10 p-6 shadow-2xl"
                    >
                        {/* Close button */}
                        <button
                            onClick={handleDismiss}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={16} />
                        </button>

                        {/* Content */}
                        <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 border border-white/10">
                                <img src="/icon-192.png" alt="Lovanda" className="w-full h-full object-cover" />
                            </div>

                            {/* Text */}
                            <div className="flex-1">
                                <h3 className={`${yesevaOne.className} text-white text-xl mb-2`}>
                                    Instalar Lovanda
                                </h3>
                                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                                    Para instalar este app, toque em{' '}
                                    <Share size={14} className="inline text-[#ff9900]" />{' '}
                                    e selecione <span className="text-white font-semibold">"Adicionar à Tela de Início"</span>
                                </p>
                                <button
                                    onClick={handleDismiss}
                                    className="text-[#ff9900] text-sm font-semibold"
                                >
                                    Entendi
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
