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
        <div className="fixed inset-0 w-full bg-black overflow-hidden flex flex-col" style={{ height: '100dvh' }}>
            <IOSInstallPrompt />
            <div className={`flex-1 w-full no-scrollbar relative ${isDiscoverPage ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'}`}>
                <div className="h-full w-full">
                    {children}
                </div>
                {/* Spacer to allow scrolling past the fixed NavBar */}
                {!isDiscoverPage && !hideNavBar && <div className="h-32 pointer-events-none w-full" />}
            </div>
            {!hideNavBar && <NavBar />}
        </div>
    )
}
