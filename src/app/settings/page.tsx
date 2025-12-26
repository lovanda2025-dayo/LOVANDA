'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Yeseva_One } from 'next/font/google'
import { motion, AnimatePresence } from 'framer-motion'
import {
    ArrowLeft,
    Lock,
    Bell,
    LogOut,
    Trash2,
    ChevronRight,
    CheckCircle2,
    AlertTriangle,
    Eye,
    EyeOff,
    KeyRound // Added KeyRound
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { updatePin } from '@/app/actions/auth' // Import action

const yesevaOne = Yeseva_One({
    weight: '400',
    subsets: ['latin'],
    display: 'swap',
})

export default function SettingsPage() {
    const router = useRouter()

    // Auth State
    const [userId, setUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)

    // Password State
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPasswords, setShowPasswords] = useState(false)
    const [passLoading, setPassLoading] = useState(false)
    const [passMessage, setPassMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // PIN State
    const [currentPin, setCurrentPin] = useState('')
    const [newPin, setNewPin] = useState('')
    const [pinLoading, setPinLoading] = useState(false)
    const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Notifications State
    const [pushEnabled, setPushEnabled] = useState(true)
    const [notifLoading, setNotifLoading] = useState(false)

    // Logout Modal
    const [showLogoutModal, setShowLogoutModal] = useState(false)

    // Delete Modal
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [deleteLoading, setDeleteLoading] = useState(false)

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }
            setUserId(user.id)
            setLoading(false)

            // Simular carregamento de preferências de notificação
            const savedNotifs = localStorage.getItem('push_notifications')
            if (savedNotifs !== null) {
                setPushEnabled(savedNotifs === 'true')
            }
        }
        checkUser()
    }, [router])

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setPassMessage(null)

        if (newPassword !== confirmPassword) {
            setPassMessage({ type: 'error', text: 'As novas senhas não coincidem.' })
            return
        }

        if (newPassword.length < 6) {
            setPassMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres.' })
            return
        }

        setPassLoading(true)
        try {
            const { error } = await supabase.auth.updateUser({ password: newPassword })
            if (error) throw error

            setPassMessage({ type: 'success', text: 'Senha alterada com sucesso!' })
            setNewPassword('')
            setConfirmPassword('')
        } catch (err: any) {
            setPassMessage({ type: 'error', text: err.message || 'Erro ao atualizar senha.' })
        } finally {
            setPassLoading(false)
        }
    }

    const toggleNotifications = (val: boolean) => {
        setPushEnabled(val)
        localStorage.setItem('push_notifications', String(val))
    }

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/landing')
    }

    const handleDeleteAccount = async () => {
        if (!userId) return
        setDeleteLoading(true)
        try {
            // Chamamos a função SQL que criámos (delete_user_account)
            // Esta função limpa todos os dados de todas as tabelas e remove o user do Auth
            const { error: deleteError } = await supabase.rpc('delete_user_account')

            if (deleteError) throw deleteError

            // Após a função SQL, garantimos que o cliente sabe que a sessão acabou
            await supabase.auth.signOut()
            router.push('/landing')
        } catch (err: any) {
            alert('Erro ao eliminar conta: ' + err.message)
            setDeleteLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-12 h-12 rounded-full border-4 border-[#ff9900]/20 border-t-[#ff9900] animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white pb-12 overflow-y-auto no-scrollbar relative">

            {/* Header */}
            <header className="sticky top-0 z-40 w-full h-20 px-6 flex items-center bg-black/80 backdrop-blur-xl border-b border-white/5">
                <button
                    onClick={() => router.back()}
                    className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 text-center pr-8">
                    <h1 className={`${yesevaOne.className} text-2xl`}>Definições</h1>
                </div>
            </header>

            <main className="p-6 space-y-8 max-w-lg mx-auto">

                {/* CARD 1: Alterar Senha */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-2 text-gray-400">
                        <Lock size={18} />
                        <h2 className="text-sm font-black uppercase tracking-widest">Segurança</h2>
                    </div>

                    <div className="bg-[#1A1A1A]/60 backdrop-blur-md border border-white/5 rounded-[32px] p-8 shadow-xl">
                        <form onSubmit={handleUpdatePassword} className="space-y-4">

                            <div className="relative">
                                <label className="text-xs text-gray-500 font-bold ml-2 mb-1 block">Nova Senha</label>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    placeholder="Mínimo 6 caracteres"
                                    value={newPassword}
                                    onChange={e => setNewPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff9900]/50 transition-all font-mono"
                                />
                            </div>

                            <div className="relative">
                                <label className="text-xs text-gray-500 font-bold ml-2 mb-1 block">Confirmar Nova Senha</label>
                                <input
                                    type={showPasswords ? "text" : "password"}
                                    placeholder="Repita a nova senha"
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff9900]/50 transition-all font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPasswords(!showPasswords)}
                                    className="absolute right-4 bottom-4 text-gray-500 hover:text-white"
                                >
                                    {showPasswords ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            {passMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-xl text-sm font-medium ${passMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                                >
                                    {passMessage.text}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={passLoading || !newPassword || !confirmPassword}
                                className="w-full py-4 rounded-2xl bg-white text-black font-black uppercase text-xs tracking-widest hover:bg-gray-200 transition-all active:scale-[0.98] disabled:opacity-30"
                            >
                                {passLoading ? 'A processar...' : 'Alterar Senha'}
                            </button>
                        </form>
                    </div>
                </section>

                {/* CARD 1.5: Alterar PIN */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-2 text-gray-400">
                        <KeyRound size={18} />
                        <h2 className="text-sm font-black uppercase tracking-widest">PIN de Acesso</h2>
                    </div>

                    <div className="bg-[#1A1A1A]/60 backdrop-blur-md border border-white/5 rounded-[32px] p-8 shadow-xl">
                        <form onSubmit={async (e) => {
                            e.preventDefault()
                            setPinMessage(null)
                            if (!userId) return

                            if (newPin.length !== 6) {
                                setPinMessage({ type: 'error', text: 'O novo PIN deve ter 6 dígitos.' })
                                return
                            }

                            setPinLoading(true)
                            try {
                                const result = await updatePin(userId, currentPin, newPin)
                                if (result.error) throw new Error(result.error)

                                setPinMessage({ type: 'success', text: 'PIN atualizado com sucesso!' })
                                setCurrentPin('')
                                setNewPin('')
                            } catch (err: any) {
                                setPinMessage({ type: 'error', text: err.message })
                            } finally {
                                setPinLoading(false)
                            }
                        }} className="space-y-4">

                            <div className="relative">
                                <label className="text-xs text-gray-500 font-bold ml-2 mb-1 block">PIN Atual</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="••••••"
                                    value={currentPin}
                                    onChange={e => setCurrentPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff9900]/50 transition-all font-mono tracking-widest"
                                />
                            </div>

                            <div className="relative">
                                <label className="text-xs text-gray-500 font-bold ml-2 mb-1 block">Novo PIN</label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    placeholder="Confirmar PIN Atual"
                                    value={newPin}
                                    onChange={e => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ff9900]/50 transition-all font-mono tracking-widest"
                                />
                                <p className="text-[10px] text-gray-500 mt-1 ml-2">Deve ter 6 dígitos</p>
                            </div>

                            {pinMessage && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 rounded-xl text-sm font-medium ${pinMessage.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}
                                >
                                    {pinMessage.text}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={pinLoading || !currentPin || !newPin}
                                className="w-full py-4 rounded-2xl bg-[#ff9900]/10 border border-[#ff9900]/20 text-[#ff9900] font-black uppercase text-xs tracking-widest hover:bg-[#ff9900]/20 transition-all active:scale-[0.98] disabled:opacity-30"
                            >
                                {pinLoading ? 'A atualizar...' : 'Atualizar PIN'}
                            </button>
                        </form>
                    </div>
                </section>

                {/* CARD 2: Notificações */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 px-2 text-gray-400">
                        <Bell size={18} />
                        <h2 className="text-sm font-black uppercase tracking-widest">Notificações</h2>
                    </div>

                    <div className="bg-[#1A1A1A]/60 backdrop-blur-md border border-white/5 rounded-[32px] p-8 shadow-xl">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="font-bold">Notificações Push</h3>
                                <p className="text-xs text-gray-500 pr-4">Recebe alertas de novas mensagens, likes e novidades.</p>
                            </div>

                            <button
                                onClick={() => toggleNotifications(!pushEnabled)}
                                className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${pushEnabled ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900]' : 'bg-[#333333]'}`}
                            >
                                <motion.div
                                    animate={{ x: pushEnabled ? 24 : 4 }}
                                    className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
                                />
                            </button>
                        </div>
                    </div>
                </section>

                {/* CARD 3: Terminar Sessão */}
                <section className="pt-4">
                    <button
                        onClick={() => setShowLogoutModal(true)}
                        className="w-full bg-[#1A1A1A]/60 backdrop-blur-md border border-white/5 rounded-[24px] p-6 flex items-center justify-between group hover:bg-white/5 transition-all active:scale-[0.98]"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                                <LogOut size={20} />
                            </div>
                            <span className="font-bold">Terminar Sessão</span>
                        </div>
                        <ChevronRight size={20} className="text-gray-600" />
                    </button>
                </section>

                {/* CARD 4: Eliminar Conta */}
                <section className="pt-8">
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="w-full bg-red-500/10 border border-red-500/20 rounded-[24px] p-6 flex items-center gap-4 text-red-500 hover:bg-red-500/20 transition-all active:scale-[0.98]"
                    >
                        <Trash2 size={20} />
                        <span className="font-black uppercase text-xs tracking-widest">Eliminar conta permanentemente</span>
                    </button>
                </section>

                <div className="text-center pt-8 opacity-20">
                    <p className={`${yesevaOne.className} text-xl`}>Lovanda</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-1">Made with Love in Angola</p>
                </div>

            </main>

            {/* MODAIS */}
            <AnimatePresence>
                {/* Logout Modal */}
                {showLogoutModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowLogoutModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-sm bg-[#1A1A1A] border border-white/10 rounded-[40px] p-8 text-center space-y-6 overflow-hidden"
                        >
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto text-gray-400">
                                <LogOut size={32} />
                            </div>
                            <div className="space-y-2">
                                <h3 className={`${yesevaOne.className} text-2xl`}>Terminar Sessão?</h3>
                                <p className="text-gray-400 text-sm">Terás de inserir os teus dados novamente para aceder.</p>
                            </div>
                            <div className="space-y-3">
                                <button
                                    onClick={handleLogout}
                                    className="w-full py-4 rounded-2xl bg-white text-black font-bold"
                                >
                                    Sair agora
                                </button>
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="w-full py-4 text-gray-500 font-bold hover:text-white transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {/* Delete Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDeleteModal(false)}
                            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-sm bg-[#1A1A1A] border border-red-500/20 rounded-[40px] p-8 text-center space-y-6 overflow-hidden"
                        >
                            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
                                <AlertTriangle size={32} />
                            </div>
                            <div className="space-y-2">
                                <h3 className={`${yesevaOne.className} text-2xl text-red-500`}>Atenção!</h3>
                                <p className="text-gray-400 text-sm">
                                    Esta ação é <span className="text-white font-bold">irreversível</span>. Todos os teus dados, matches e mensagens serão eliminados para sempre.
                                </p>
                            </div>
                            <div className="space-y-3 pt-2">
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteLoading}
                                    className="w-full py-4 rounded-2xl bg-red-500 text-white font-black uppercase text-xs tracking-widest disabled:opacity-50"
                                >
                                    {deleteLoading ? 'A eliminar...' : 'Eliminar permanentemente'}
                                </button>
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="w-full py-4 text-gray-500 font-bold hover:text-white transition-colors"
                                >
                                    Manter conta
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Noise Texture Overlay */}
            <div className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')] z-0" />
        </div>
    )
}
