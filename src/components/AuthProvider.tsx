'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

type AuthContextType = {
    user: User | null
    session: Session | null
    loading: boolean
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    loading: true
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const [user, setUser] = useState<User | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // 1. Verificar sessão inicial ao carregar (PWA Re-open)
        const initSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()
                setSession(session)
                setUser(session?.user ?? null)
            } catch (error) {
                console.error('Erro ao verificar sessão:', error)
            } finally {
                setLoading(false)
            }
        }

        initSession()

        // 2. Escutar mudanças de estado (Login, Logout, Token Refresh)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth State Change:', event)

            setSession(session)
            setUser(session?.user ?? null)
            setLoading(false)

            if (event === 'SIGNED_OUT') {
                // Limpar dados locais sensíveis se necessário
                // Redirecionar para landing
                router.push('/landing')
                router.refresh()
            } else if (event === 'SIGNED_IN') {
                router.refresh()
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router])

    return (
        <AuthContext.Provider value={{ user, session, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
