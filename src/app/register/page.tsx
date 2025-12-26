'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { saveUserPin } from '@/app/actions/auth'
import { Yeseva_One } from 'next/font/google'

const yesevaOne = Yeseva_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
})

export default function RegisterPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [pin, setPin] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) router.push('/discover')
        }
        checkSession()
    }, [router])

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        // Validação básica
        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.')
            setLoading(false)
            return
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.')
            setLoading(false)
            return
        }

        if (pin.length !== 6 || !/^\d+$/.test(pin)) {
            setError('O PIN deve ter exatamente 6 dígitos numéricos.')
            setLoading(false)
            return
        }

        try {
            // 1. Client-side Register (Creates Session)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            })

            if (authError) throw authError

            // 2. Save PIN (Server Action)
            if (authData.user) {
                const pinResult = await saveUserPin(authData.user.id, pin)

                if (pinResult.error) {
                    // Start rollback or just warn?
                    // For MVP, warn but allow proceed (account exists)
                    // Or stop?
                    // Let's treat as error for now.
                    throw new Error(pinResult.error)
                }

                // Success!
                setSuccess('Conta criada com sucesso!')
                router.push('/onboarding')
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao realizar cadastro.')
        } finally {
            setLoading(false)
        }
    }

    const EyeIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    )

    const EyeOffIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
        </svg>
    )

    return (
        <div className="min-h-[100dvh] w-full bg-black flex flex-col items-center justify-center p-6 overflow-y-auto no-scrollbar">
            <div className="w-full max-w-sm z-10 space-y-8">
                {/* Header */}
                <div className="text-center space-y-2">
                    <h1 className={`${yesevaOne.className} text-4xl leading-tight text-white`}>
                        Aqui começa a <br /> tua história...
                    </h1>
                </div>

                {/* Form */}
                <form className="space-y-5" onSubmit={handleRegister}>
                    <div className="space-y-4">
                        {/* Email Input */}
                        <div className="relative group">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="block w-full px-4 py-4 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ff9900] focus:ring-1 focus:ring-[#ff9900] transition-all duration-300"
                                placeholder="Endereço de Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        {/* Password Input */}
                        <div className="relative group">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                required
                                className="block w-full px-4 py-4 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ff9900] focus:ring-1 focus:ring-[#ff9900] transition-all duration-300 pr-12"
                                placeholder="Senha (mínimo 6 caracteres)"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer transition-opacity hover:opacity-80"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>

                        {/* Confirm Password Input */}
                        <div className="relative group">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                autoComplete="new-password"
                                required
                                className="block w-full px-4 py-4 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ff9900] focus:ring-1 focus:ring-[#ff9900] transition-all duration-300 pr-12"
                                placeholder="Confirmar Senha"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer transition-opacity hover:opacity-80"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                                {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                        </div>

                        {/* PIN Input */}
                        <div className="relative group">
                            <input
                                id="pin"
                                name="pin"
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                required
                                className="block w-full px-4 py-4 bg-[#1A1A1A] border border-[#333333] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#ff9900] focus:ring-1 focus:ring-[#ff9900] transition-all duration-300 font-mono tracking-widest text-center"
                                placeholder="PIN (6 dígitos)"
                                value={pin}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                                    setPin(val)
                                }}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-900/20 py-2 px-4 rounded-lg border border-red-900/50">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="text-green-400 text-sm text-center bg-green-900/20 py-2 px-4 rounded-lg border border-green-900/50">
                            {success}
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 px-6 rounded-full bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-bold text-lg shadow-lg transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Processando...' : 'Registrar'}
                    </button>
                </form>

                {/* Footer */}
                <div className="flex flex-col items-center space-y-6 mt-8">
                    <div className="text-center">
                        <p className="text-gray-500 text-sm">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="text-[#ff9900] hover:text-[#ff0800] transition-colors font-medium">
                                Faça login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
