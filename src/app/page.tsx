'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'

export default function SplashPage() {
    const router = useRouter()

    useEffect(() => {
        // Redireciona para a landing page após 3 segundos
        const timer = setTimeout(() => {
            router.push('/landing')
        }, 3000)

        return () => clearTimeout(timer)
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
