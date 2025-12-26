'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Ghost, Heart, MessageCircle, User } from 'lucide-react'

export default function NavBar() {
    const pathname = usePathname()

    const isActive = (path: string) => pathname === path

    return (
        <nav className="fixed bottom-0 left-0 right-0 px-6 pt-4 pb-[calc(env(safe-area-inset-bottom,20px)+1rem)] bg-black/20 backdrop-blur-[32px] border-t border-white/10 z-50">
            <div className="max-w-md mx-auto">
                <div className="flex items-center justify-between px-2">

                    {/* 1. Histórias (Stories) */}
                    <Link href="/stories" className="flex flex-col items-center gap-1 group">
                        <div className={`p-3 rounded-full transition-all duration-300 ${isActive('/stories') ? 'text-[#ff9900]' : 'text-gray-400 group-hover:text-gray-200'}`}>
                            <Ghost size={26} strokeWidth={isActive('/stories') ? 2 : 1.5} />
                        </div>
                    </Link>

                    {/* 2. Interações (Interactions) */}
                    <Link href="/interactions" className="flex flex-col items-center gap-1 group">
                        <div className={`p-3 rounded-full transition-all duration-300 ${isActive('/interactions') ? 'text-[#ff9900]' : 'text-gray-400 group-hover:text-gray-200'}`}>
                            <Heart size={26} strokeWidth={isActive('/interactions') ? 2 : 1.5} />
                        </div>
                    </Link>

                    {/* 3. Página Principal (Home/Discover) - Center Button */}
                    <Link href="/discover" className="group -mt-8">
                        <div className={`relative w-16 h-16 rounded-full overflow-hidden flex items-center justify-center shadow-lg shadow-orange-900/40 transition-transform duration-300 hover:scale-105 active:scale-95 ${isActive('/discover') ? 'ring-2 ring-[#ff9900]' : 'opacity-90'}`}>
                            <Image
                                src="/lovanda-logo.png"
                                alt="Lovanda"
                                fill
                                className="object-cover"
                            />
                        </div>
                    </Link>

                    {/* 4. Chat (Messages) */}
                    <Link href="/chat" className="flex flex-col items-center gap-1 group">
                        <div className={`p-3 rounded-full transition-all duration-300 ${isActive('/chat') ? 'text-[#ff9900]' : 'text-gray-400 group-hover:text-gray-200'}`}>
                            <MessageCircle size={26} strokeWidth={isActive('/chat') ? 2 : 1.5} />
                        </div>
                    </Link>

                    {/* 5. Perfil (Profile) */}
                    <Link href="/profile" className="flex flex-col items-center gap-1 group">
                        <div className={`p-3 rounded-full transition-all duration-300 ${isActive('/profile') ? 'text-[#ff9900]' : 'text-gray-400 group-hover:text-gray-200'}`}>
                            <User size={26} strokeWidth={isActive('/profile') ? 2 : 1.5} />
                        </div>
                    </Link>

                </div>
            </div>
        </nav>
    )
}
