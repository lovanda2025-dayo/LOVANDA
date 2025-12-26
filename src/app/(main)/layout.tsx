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
    const isDiscoverPage = pathname === '/discover' || pathname === '/'
    const hideNavBar = isChatConversation || isPlansPage

    return (
        <div className="fixed inset-0 h-[100dvh] w-full bg-black overflow-hidden flex flex-col">
            <IOSInstallPrompt />
            <div className={`h-full w-full no-scrollbar ${isDiscoverPage ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                {children}
                {/* Spacer to allow scrolling past the fixed NavBar */}
                {!isDiscoverPage && !hideNavBar && <div className="h-32 pointer-events-none" />}
            </div>
            {!hideNavBar && <NavBar />}
        </div>
    )
}
