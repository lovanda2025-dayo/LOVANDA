'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { loginAdmin } from '@/app/actions/admin'
import { Lock, User, KeyRound, Eye, EyeOff } from 'lucide-react'

export default function AdminLoginPage() {
    const router = useRouter()
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [pin, setPin] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showPin, setShowPin] = useState(false)

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!password && !pin) {
            setError('Preencha a senha ou o PIN')
            return
        }

        setLoading(true)
        const result = await loginAdmin(username, password, pin)

        if (result.error) {
            setError(result.error)
            setLoading(false)
        } else if (result.success && result.admin) {
            // Store admin session in localStorage
            localStorage.setItem('admin_session', JSON.stringify(result.admin))
            router.push('/admin/dashboard')
        }
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] p-8 rounded-3xl border border-white/10 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-[#ff0800] to-[#ff9900] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Lock className="text-white" size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tight">Admin Panel</h1>
                        <p className="text-gray-500 text-sm mt-2">Lovanda Admin Access</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                Username
                            </label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:outline-none focus:border-[#ff9900] transition-colors"
                                    placeholder="lovandaAdmin"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                Password (opcional)
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white font-medium focus:outline-none focus:border-[#ff9900] transition-colors"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#ff9900] transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">
                                PIN (opcional)
                            </label>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                                <input
                                    type={showPin ? "text" : "password"}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-12 text-white font-medium focus:outline-none focus:border-[#ff9900] transition-colors tracking-widest"
                                    placeholder="123456"
                                    maxLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPin(!showPin)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-[#ff9900] transition-colors"
                                >
                                    {showPin ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                <p className="text-red-500 text-sm font-bold text-center">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-black uppercase tracking-widest py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-orange-950/40"
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
