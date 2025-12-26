'use client'

import NavBar from '@/components/NavBar'
import IOSInstallPrompt from '@/components/IOSInstallPrompt'
import { usePathname } from 'next/navigation'

export default function MainLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const isChatConversation = pathname?.startsWith('/chat/') && pathname !== '/chat'
    const isPlansPage = pathname === '/plans'
    const hideNavBar = isChatConversation || isPlansPage

    return (
        <div className="fixed inset-0 h-[100dvh] w-full bg-black overflow-hidden flex flex-col">
            <IOSInstallPrompt />
            <div className="flex-1 w-full overflow-y-auto no-scrollbar">
                {children}
                {/* Spacer for NavBar - hidden when necessary */}
                {!hideNavBar && <div className="h-24 pointer-events-none" />}
            </div>
            {!hideNavBar && <NavBar />}
        </div>
    )
}
