'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function SplashPage() {
    const router = useRouter()

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()

            if (session) {
                // Se já estiver logado, vai direto para o discover
                router.push('/discover')
            } else {
                // Se não, aguarda 3 segundos e vai para a landing page
                const timer = setTimeout(() => {
                    router.push('/landing')
                }, 3000)
                return () => clearTimeout(timer)
            }
        }

        checkSession()
    }, [router])

    return (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-[1000] overflow-hidden">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
                className="relative w-48 h-48 md:w-64 md:h-64"
            >
                {/* Logo Image */}
                <Image
                    src="/splash-logo.jpg"
                    alt="Lovanda Logo"
                    fill
                    className="object-contain"
                    priority
                />
            </motion.div>
        </div>
    )
}
