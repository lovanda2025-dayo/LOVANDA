'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { searchUsers, addBatidasToUser, updateUserPlan, createNotification, getTotalUsers, getUserPhotos } from '@/app/actions/admin'
import { Search, LogOut, User, Plus, X, Edit, Bell } from 'lucide-react'

export default function AdminDashboardPage() {
    const router = useRouter()
    const [searchTerm, setSearchTerm] = useState('')
    const [users, setUsers] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [admin, setAdmin] = useState<any>(null)
    const [error, setError] = useState('')
    const [activeTab, setActiveTab] = useState<'users' | 'notifications'>('users')
    const [totalUsers, setTotalUsers] = useState(0)

    // Notifications state
    const [notifTitle, setNotifTitle] = useState('')
    const [notifMessage, setNotifMessage] = useState('')
    const [notifTargetType, setNotifTargetType] = useState<'all' | 'gender' | 'province'>('all')
    const [notifTargetValue, setNotifTargetValue] = useState('')
    const [notifScheduledDate, setNotifScheduledDate] = useState('')
    const [notifScheduledTime, setNotifScheduledTime] = useState('')
    const [sendingNotif, setSendingNotif] = useState(false)

    const ANGOLA_PROVINCES = [
        'Bengo', 'Benguela', 'Bié', 'Cabinda', 'Cuando Cubango',
        'Cuanza Norte', 'Cuanza Sul', 'Cunene', 'Huambo', 'Huíla',
        'Luanda', 'Lunda Norte', 'Lunda Sul', 'Malanje', 'Moxico',
        'Namibe', 'Uíge', 'Zaire'
    ]

    // Batidas modal state
    const [showBatidasModal, setShowBatidasModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [batidasAmount, setBatidasAmount] = useState(10)
    const [addingBatidas, setAddingBatidas] = useState(false)

    // Plan modal state
    const [showPlanModal, setShowPlanModal] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState('sanzala')
    const [updatingPlan, setUpdatingPlan] = useState(false)
    const [planStartDate, setPlanStartDate] = useState('')
    const [planEndDate, setPlanEndDate] = useState('')

    // Photo gallery modal state
    const [showPhotoModal, setShowPhotoModal] = useState(false)
    const [selectedUserPhotos, setSelectedUserPhotos] = useState<string[]>([])
    const [selectedUserPin, setSelectedUserPin] = useState<string | null>(null)
    const [loadingPhotos, setLoadingPhotos] = useState(false)

    useEffect(() => {
        // Check admin session
        const session = localStorage.getItem('admin_session')
        if (!session) {
            router.push('/admin/login')
            return
        }
        setAdmin(JSON.parse(session))
        loadTotalUsers()
    }, [])

    const loadTotalUsers = async () => {
        const result = await getTotalUsers()
        if (result.success) {
            setTotalUsers(result.total)
        }
    }

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setError('Digite um nome para pesquisar')
            return
        }

        setLoading(true)
        setError('')
        const result = await searchUsers(searchTerm)

        console.log('Dashboard received:', result)

        if (result.error) {
            setError(result.error)
            setUsers(result.users || [])
        } else if (result.success && result.users) {
            setUsers(result.users)
        }
        setLoading(false)
    }

    const handleLogout = () => {
        localStorage.removeItem('admin_session')
        router.push('/admin/login')
    }

    const handleViewPhotos = async (userId: string) => {
        setLoadingPhotos(true)
        setShowPhotoModal(true)

        const result = await getUserPhotos(userId)

        if (result.success) {
            setSelectedUserPhotos(result.photos || [])
            setSelectedUserPin(result.pin)
        } else {
            alert(result.error)
            setShowPhotoModal(false)
        }

        setLoadingPhotos(false)
    }

    const openBatidasModal = (user: any) => {
        setSelectedUser(user)
        setBatidasAmount(10)
        setShowBatidasModal(true)
    }

    const handleAddBatidas = async () => {
        if (!selectedUser || batidasAmount <= 0) return

        setAddingBatidas(true)
        const result = await addBatidasToUser(selectedUser.id, batidasAmount)

        if (result.error) {
            alert(result.error)
        } else if (result.success) {
            alert(`${batidasAmount} batidas adicionadas com sucesso!`)
            setShowBatidasModal(false)
            // Refresh user list
            handleSearch()
        }

        setAddingBatidas(false)
    }

    const openPlanModal = (user: any) => {
        setSelectedUser(user)
        setSelectedPlan(user.plan_type || 'sanzala')

        // Set current dates if they exist
        const today = new Date().toISOString().split('T')[0]
        setPlanStartDate(user.plan_start_date || today)

        // Default end date to 30 days from start
        const defaultEnd = new Date()
        defaultEnd.setDate(defaultEnd.getDate() + 30)
        setPlanEndDate(user.plan_end_date || defaultEnd.toISOString().split('T')[0])

        setShowPlanModal(true)
    }

    const handleUpdatePlan = async () => {
        if (!selectedUser) return

        // Validate dates for premium/vip plans
        if (selectedPlan !== 'sanzala') {
            if (!planStartDate || !planEndDate) {
                alert('Por favor, selecione as datas de início e fim do plano.')
                return
            }
            if (new Date(planStartDate) >= new Date(planEndDate)) {
                alert('A data de início deve ser anterior à data de fim.')
                return
            }
        }

        setUpdatingPlan(true)
        const result = await updateUserPlan(
            selectedUser.id,
            selectedPlan,
            selectedPlan !== 'sanzala' ? planStartDate : undefined,
            selectedPlan !== 'sanzala' ? planEndDate : undefined
        )

        if (result.error) {
            alert(result.error)
        } else if (result.success) {
            alert('Plano atualizado com sucesso!')
            setShowPlanModal(false)
            // Refresh user list
            handleSearch()
        }

        setUpdatingPlan(false)
    }

    const handleSendNotification = async () => {
        if (!admin) return
        if (!notifTitle.trim() || !notifMessage.trim()) {
            alert('Título e mensagem são obrigatórios.')
            return
        }

        if (notifTargetType === 'province' && !notifTargetValue) {
            alert('Selecione uma província.')
            return
        }
        if (notifTargetType === 'gender' && !notifTargetValue) {
            alert('Selecione um gênero.')
            return
        }

        // Combine date and time for scheduling (if provided)
        let scheduledTime = null
        if (notifScheduledDate && notifScheduledTime) {
            scheduledTime = `${notifScheduledDate}T${notifScheduledTime}:00`
        }

        setSendingNotif(true)
        const result = await createNotification(
            notifTitle,
            notifMessage,
            notifTargetType,
            notifTargetValue,
            scheduledTime,
            admin.id
        )

        if (result.error) {
            alert(result.error)
        } else {
            alert(scheduledTime ? 'Notificação programada com sucesso!' : 'Notificação enviada com sucesso!')
            setNotifTitle('')
            setNotifMessage('')
            setNotifTargetType('all')
            setNotifTargetValue('')
            setNotifScheduledDate('')
            setNotifScheduledTime('')
        }
        setSendingNotif(false)
    }

    return (
        <div className="min-h-screen bg-black p-4 md:p-8">
            <div className="max-w-[1600px] mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                            Admin Dashboard
                        </h1>
                        <p className="text-gray-500 text-sm mt-2 font-medium">
                            Bem-vindo, <span className="text-[#ff9900] font-bold">{admin?.username}</span>
                        </p>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-red-500/10 text-red-500 rounded-2xl font-bold text-sm hover:bg-red-500/20 transition-all border border-red-500/20 active:scale-95"
                    >
                        <LogOut size={18} />
                        Sair do Painel
                    </button>
                </div>

                {/* Tab Navigation */}
                <div className="flex gap-3">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all ${activeTab === 'users'
                            ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg shadow-orange-950/40'
                            : 'bg-white/5 text-gray-500 hover:bg-white/10 border border-white/10'
                            }`}
                    >
                        <User className="inline mr-1 md:mr-2" size={14} />
                        <span className="hidden sm:inline">Usuários</span>
                        <span className="sm:hidden">Users</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('notifications')}
                        className={`px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black text-xs md:text-sm uppercase tracking-widest transition-all ${activeTab === 'notifications'
                            ? 'bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white shadow-lg shadow-orange-950/40'
                            : 'bg-white/5 text-gray-500 hover:bg-white/10 border border-white/10'
                            }`}
                    >
                        <Bell className="inline mr-1 md:mr-2" size={14} />
                        <span className="hidden sm:inline">Notificações</span>
                        <span className="sm:hidden">Notif</span>
                    </button>
                </div>

                {/* Users Tab */}
                {activeTab === 'users' && (
                    <>
                        {/* Total Users Card */}
                        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] p-6 rounded-3xl border border-white/10 shadow-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gradient-to-r from-[#ff0800] to-[#ff9900] rounded-2xl shadow-lg shadow-orange-950/40">
                                        <User className="text-white" size={24} />
                                    </div>
                                    <div>
                                        <p className="text-gray-500 text-xs md:text-sm font-bold uppercase tracking-wider">Total de Usuários</p>
                                        <p className="text-white text-2xl md:text-3xl font-black">{totalUsers.toLocaleString('pt-PT')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] p-6 rounded-3xl border border-white/10 shadow-2xl">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={20} />
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-medium focus:outline-none focus:border-[#ff9900] transition-colors placeholder:text-gray-600"
                                        placeholder="Buscar por nome do usuário..."
                                    />
                                </div>
                                <button
                                    onClick={handleSearch}
                                    disabled={loading}
                                    className="px-8 py-4 bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 shadow-lg shadow-orange-950/40 whitespace-nowrap"
                                >
                                    {loading ? 'Buscando...' : 'Buscar'}
                                </button>
                            </div>

                            {error && (
                                <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                                    <p className="text-red-500 text-sm font-bold">{error}</p>
                                </div>
                            )}
                        </div>

                        {/* Users Table */}
                        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/5 border-b border-white/10">
                                        <tr>
                                            <th className="text-left p-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.15em] w-32">ID</th>
                                            <th className="text-left p-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.15em] min-w-[200px]">Usuário</th>
                                            <th className="text-left p-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.15em]">Gênero</th>
                                            <th className="text-left p-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.15em]">Província</th>
                                            <th className="text-left p-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.15em]">Role</th>
                                            <th className="text-left p-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.15em]">Plano</th>
                                            <th className="text-left p-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.15em]">Batidas</th>
                                            <th className="text-left p-4 text-[10px] font-black text-gray-600 uppercase tracking-[0.15em]">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={8} className="p-12 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <div className="w-8 h-8 border-4 border-[#ff9900] border-t-transparent rounded-full animate-spin" />
                                                        <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">A carregar usuários...</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : users.length === 0 ? (
                                            <tr>
                                                <td colSpan={8} className="p-12 text-center">
                                                    <div className="flex flex-col items-center gap-3">
                                                        <User className="text-gray-700" size={48} />
                                                        <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Nenhum usuário encontrado</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            users.map((user) => (
                                                <tr key={user.id} className="hover:bg-white/5 transition-all group cursor-pointer">
                                                    <td className="p-4">
                                                        <span className="text-gray-600 font-mono text-[11px] bg-white/5 px-2 py-1 rounded">
                                                            {user.id.slice(0, 8)}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <button
                                                                onClick={() => handleViewPhotos(user.id)}
                                                                className="relative group"
                                                            >
                                                                {user.avatar_url ? (
                                                                    <img
                                                                        src={user.avatar_url}
                                                                        alt={user.first_name}
                                                                        className="w-12 h-12 rounded-full object-cover border-2 border-white/10 shadow-lg group-hover:border-[#ff9900] transition-all cursor-pointer"
                                                                    />
                                                                ) : (
                                                                    <div className="w-12 h-12 bg-gradient-to-br from-[#ff0800] to-[#ff9900] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform cursor-pointer">
                                                                        <User className="text-white" size={24} />
                                                                    </div>
                                                                )}
                                                                <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <span className="text-white text-[10px] font-bold">VER</span>
                                                                </div>
                                                            </button>
                                                            <div>
                                                                <p className="text-white font-bold text-base group-hover:text-[#ff9900] transition-colors">
                                                                    {user.first_name} {user.last_name}
                                                                </p>
                                                                <p className="text-gray-600 text-xs font-mono">
                                                                    ID: {user.id.slice(0, 8)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${user.gender === 'male' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                                            user.gender === 'female' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' :
                                                                'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                                            }`}>
                                                            {user.gender === 'male' ? '♂ Masculino' :
                                                                user.gender === 'female' ? '♀ Feminino' :
                                                                    user.gender || 'N/A'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className="text-gray-300 text-sm font-bold">
                                                            {user.province || 'Não informado'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider ${user.role === 'admin'
                                                            ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                                            : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                                            }`}>
                                                            {user.role === 'admin' ? '⭐ Admin' : 'User'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4">
                                                        <button
                                                            onClick={() => openPlanModal(user)}
                                                            className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 ${user.plan_type === 'vip' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30' :
                                                                user.plan_type === 'premium' ? 'bg-[#ff9900]/20 text-[#ff9900] border border-[#ff9900]/30 hover:bg-[#ff9900]/30' :
                                                                    'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'
                                                                }`}
                                                        >
                                                            {user.plan_type === 'vip' ? '👑 VIP' :
                                                                user.plan_type === 'premium' ? '⚡ Premium' :
                                                                    '🏠 Sanzala'}
                                                            <Edit className="inline ml-1" size={12} />
                                                        </button>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-white font-mono font-black text-lg">
                                                                {user.extra_batidas || 0}
                                                            </span>
                                                            <span className="text-gray-600 text-xs font-bold uppercase">
                                                                BT
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <button
                                                            onClick={() => openBatidasModal(user)}
                                                            className="flex items-center gap-2 px-4 py-2 bg-[#ff9900]/10 text-[#ff9900] rounded-xl font-bold text-xs hover:bg-[#ff9900]/20 transition-all border border-[#ff9900]/30 active:scale-95"
                                                        >
                                                            <Plus size={16} />
                                                            Adicionar
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Stats Footer */}
                        {users.length > 0 && (
                            <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] p-6 rounded-3xl border border-white/10 shadow-2xl">
                                <div className="flex items-center justify-center gap-2">
                                    <User className="text-[#ff9900]" size={20} />
                                    <p className="text-gray-400 text-sm font-bold">
                                        Total de usuários encontrados: <span className="text-[#ff9900] text-lg font-black">{users.length}</span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Batidas Modal */}
                        {showBatidasModal && selectedUser && (
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] rounded-3xl border border-white/10 shadow-2xl max-w-md w-full p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                            Adicionar Batidas
                                        </h2>
                                        <button
                                            onClick={() => setShowBatidasModal(false)}
                                            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                        >
                                            <X className="text-gray-500" size={24} />
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-gray-500 text-sm font-bold mb-2">Usuário</p>
                                            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                                                {selectedUser.avatar_url ? (
                                                    <img
                                                        src={selectedUser.avatar_url}
                                                        alt={selectedUser.first_name}
                                                        className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gradient-to-br from-[#ff0800] to-[#ff9900] rounded-full flex items-center justify-center">
                                                        <User className="text-white" size={24} />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-white font-bold">
                                                        {selectedUser.first_name} {selectedUser.last_name}
                                                    </p>
                                                    <p className="text-gray-600 text-xs font-mono">
                                                        Batidas atuais: {selectedUser.extra_batidas || 0}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-gray-500 text-sm font-bold mb-2">
                                                Quantidade de Batidas
                                            </label>
                                            <input
                                                type="number"
                                                value={batidasAmount}
                                                onChange={(e) => setBatidasAmount(Math.max(1, parseInt(e.target.value) || 1))}
                                                min="1"
                                                className="w-full bg-black/50 border border-white/10 rounded-2xl py-4 px-4 text-white font-bold text-center text-2xl focus:outline-none focus:border-[#ff9900] transition-colors"
                                            />
                                        </div>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setShowBatidasModal(false)}
                                                className="flex-1 px-6 py-4 bg-white/5 text-gray-400 rounded-2xl font-bold uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleAddBatidas}
                                                disabled={addingBatidas}
                                                className="flex-1 px-6 py-4 bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 shadow-lg shadow-orange-950/40"
                                            >
                                                {addingBatidas ? 'Adicionando...' : 'Adicionar'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Plan Modal */}
                        {showPlanModal && selectedUser && (
                            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                                <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] rounded-3xl border border-white/10 shadow-2xl max-w-md w-full p-8">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                            Alterar Plano
                                        </h2>
                                        <button
                                            onClick={() => setShowPlanModal(false)}
                                            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                        >
                                            <X className="text-gray-500" size={24} />
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-gray-500 text-sm font-bold mb-2">Usuário</p>
                                            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                                                {selectedUser.avatar_url ? (
                                                    <img
                                                        src={selectedUser.avatar_url}
                                                        alt={selectedUser.first_name}
                                                        className="w-12 h-12 rounded-full object-cover border-2 border-white/10"
                                                    />
                                                ) : (
                                                    <div className="w-12 h-12 bg-gradient-to-br from-[#ff0800] to-[#ff9900] rounded-full flex items-center justify-center">
                                                        <User className="text-white" size={24} />
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="text-white font-bold">
                                                        {selectedUser.first_name} {selectedUser.last_name}
                                                    </p>
                                                    <p className="text-gray-600 text-xs font-mono">
                                                        Plano atual: {selectedUser.plan_type || 'sanzala'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-gray-500 text-sm font-bold mb-3">
                                                Selecionar Plano
                                            </label>
                                            <div className="space-y-3">
                                                {[
                                                    { value: 'sanzala', label: '🏠 Sanzala', color: 'gray' },
                                                    { value: 'premium', label: '⚡ Premium', color: 'orange' },
                                                    { value: 'vip', label: '👑 VIP', color: 'purple' }
                                                ].map((plan) => (
                                                    <button
                                                        key={plan.value}
                                                        onClick={() => setSelectedPlan(plan.value)}
                                                        className={`w-full p-4 rounded-2xl font-black uppercase tracking-wider text-sm transition-all border-2 ${selectedPlan === plan.value
                                                            ? plan.color === 'purple' ? 'bg-purple-500/20 text-purple-400 border-purple-500' :
                                                                plan.color === 'orange' ? 'bg-[#ff9900]/20 text-[#ff9900] border-[#ff9900]' :
                                                                    'bg-gray-500/20 text-gray-300 border-gray-500'
                                                            : 'bg-white/5 text-gray-600 border-white/10 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {plan.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Date inputs for Premium/VIP */}
                                        {selectedPlan !== 'sanzala' && (
                                            <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                                <div>
                                                    <label className="block text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">
                                                        Data de Início
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={planStartDate}
                                                        onChange={(e) => setPlanStartDate(e.target.value)}
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-[#ff9900] transition-colors"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-gray-500 text-xs font-bold mb-2 uppercase tracking-wider">
                                                        Data de Fim
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={planEndDate}
                                                        onChange={(e) => setPlanEndDate(e.target.value)}
                                                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white font-bold focus:outline-none focus:border-[#ff9900] transition-colors"
                                                    />
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    <span className="font-mono">
                                                        Duração: {Math.max(0, Math.ceil((new Date(planEndDate).getTime() - new Date(planStartDate).getTime()) / (1000 * 60 * 60 * 24)))} dias
                                                    </span>
                                                </div>
                                            </div>
                                        )}

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => setShowPlanModal(false)}
                                                className="flex-1 px-6 py-4 bg-white/5 text-gray-400 rounded-2xl font-bold uppercase tracking-widest hover:bg-white/10 transition-all border border-white/10"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                onClick={handleUpdatePlan}
                                                disabled={updatingPlan}
                                                className="flex-1 px-6 py-4 bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 shadow-lg shadow-orange-950/40"
                                            >
                                                {updatingPlan ? 'Atualizando...' : 'Atualizar'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] p-4 md:p-6 rounded-3xl border border-white/10 shadow-2xl max-w-2xl mx-auto">
                        <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mb-6 flex items-center gap-2">
                            <Bell size={20} className="text-[#ff9900]" />
                            Enviar Notificação
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-gray-400 text-xs md:text-sm font-bold mb-2 uppercase tracking-wider">
                                    Título
                                </label>
                                <input
                                    type="text"
                                    value={notifTitle}
                                    onChange={(e) => setNotifTitle(e.target.value)}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 md:py-4 px-4 text-white font-medium focus:outline-none focus:border-[#ff9900] transition-colors"
                                    placeholder="Título da notificação"
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs md:text-sm font-bold mb-2 uppercase tracking-wider">
                                    Mensagem
                                </label>
                                <textarea
                                    value={notifMessage}
                                    onChange={(e) => setNotifMessage(e.target.value)}
                                    rows={4}
                                    className="w-full bg-black/50 border border-white/10 rounded-xl py-3 md:py-4 px-4 text-white font-medium focus:outline-none focus:border-[#ff9900] transition-colors resize-none"
                                    placeholder="Escreva a mensagem aqui..."
                                />
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs md:text-sm font-bold mb-3 uppercase tracking-wider">
                                    Público-Alvo
                                </label>
                                <div className="grid grid-cols-3 gap-2 mb-3">
                                    {[
                                        { id: 'all', label: 'Todos' },
                                        { id: 'gender', label: 'Gênero' },
                                        { id: 'province', label: 'Província' }
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => {
                                                setNotifTargetType(type.id as any)
                                                setNotifTargetValue('')
                                            }}
                                            className={`py-3 md:py-4 rounded-xl text-xs md:text-sm font-bold uppercase transition-all ${notifTargetType === type.id
                                                ? 'bg-white/20 text-white border border-white/30'
                                                : 'bg-black/30 text-gray-600 border border-white/5 hover:bg-white/5'
                                                }`}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>

                                {notifTargetType === 'gender' && (
                                    <div className="grid grid-cols-2 gap-2 animate-fade-in">
                                        <button
                                            onClick={() => setNotifTargetValue('male')}
                                            className={`py-3 md:py-4 rounded-xl text-xs md:text-sm font-bold uppercase transition-all ${notifTargetValue === 'male'
                                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                                                : 'bg-black/30 text-gray-600 border border-white/5'
                                                }`}
                                        >
                                            Homens
                                        </button>
                                        <button
                                            onClick={() => setNotifTargetValue('female')}
                                            className={`py-3 md:py-4 rounded-xl text-xs md:text-sm font-bold uppercase transition-all ${notifTargetValue === 'female'
                                                ? 'bg-pink-500/20 text-pink-400 border border-pink-500/50'
                                                : 'bg-black/30 text-gray-600 border border-white/5'
                                                }`}
                                        >
                                            Mulheres
                                        </button>
                                    </div>
                                )}

                                {notifTargetType === 'province' && (
                                    <select
                                        value={notifTargetValue}
                                        onChange={(e) => setNotifTargetValue(e.target.value)}
                                        className="w-full bg-black/50 border border-white/10 rounded-xl py-3 md:py-4 px-4 text-white font-medium focus:outline-none focus:border-[#ff9900] transition-colors animate-fade-in"
                                    >
                                        <option value="">Selecione uma província</option>
                                        {ANGOLA_PROVINCES.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div>
                                <label className="block text-gray-400 text-xs md:text-sm font-bold mb-3 uppercase tracking-wider">
                                    Programar Envio (Opcional)
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-gray-500 text-xs font-bold mb-2">Data</label>
                                        <input
                                            type="date"
                                            value={notifScheduledDate}
                                            onChange={(e) => setNotifScheduledDate(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white font-medium focus:outline-none focus:border-[#ff9900] transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-gray-500 text-xs font-bold mb-2">Hora</label>
                                        <input
                                            type="time"
                                            value={notifScheduledTime}
                                            onChange={(e) => setNotifScheduledTime(e.target.value)}
                                            className="w-full bg-black/50 border border-white/10 rounded-xl py-3 px-4 text-white font-medium focus:outline-none focus:border-[#ff9900] transition-colors"
                                        />
                                    </div>
                                </div>
                                {notifScheduledDate && notifScheduledTime && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        📅 Programado para: {new Date(`${notifScheduledDate}T${notifScheduledTime}`).toLocaleString('pt-PT')}
                                    </p>
                                )}
                            </div>

                            <button
                                onClick={handleSendNotification}
                                disabled={sendingNotif || !notifTitle || !notifMessage}
                                className="w-full py-4 md:py-5 bg-gradient-to-r from-[#ff0800] to-[#ff9900] text-white font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 shadow-lg shadow-orange-950/40 text-sm md:text-base"
                            >
                                {sendingNotif ? 'Enviando...' : notifScheduledDate && notifScheduledTime ? 'Programar Notificação' : 'Enviar Notificação'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Photo Gallery Modal */}
                {showPhotoModal && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-end md:items-center justify-center z-50">
                        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] rounded-t-3xl md:rounded-3xl border border-white/10 shadow-2xl w-full md:max-w-4xl md:max-h-[90vh] overflow-hidden animate-slide-up">
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                    Galeria de Fotos
                                </h2>
                                <button
                                    onClick={() => setShowPhotoModal(false)}
                                    className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                                >
                                    <X className="text-gray-500" size={24} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto max-h-[70vh]">
                                {loadingPhotos ? (
                                    <div className="flex flex-col items-center gap-3 py-12">
                                        <div className="w-12 h-12 border-4 border-[#ff9900] border-t-transparent rounded-full animate-spin" />
                                        <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">A carregar fotos...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* PIN Display */}
                                        {selectedUserPin && (
                                            <div className="bg-gradient-to-r from-[#ff0800]/10 to-[#ff9900]/10 border border-[#ff9900]/30 rounded-2xl p-6">
                                                <p className="text-gray-400 text-sm font-bold mb-2 uppercase tracking-wider">PIN do Usuário</p>
                                                <p className="text-[#ff9900] text-4xl font-black font-mono tracking-widest">
                                                    {selectedUserPin}
                                                </p>
                                            </div>
                                        )}

                                        {/* Photos Grid */}
                                        {selectedUserPhotos.length > 0 ? (
                                            <div>
                                                <p className="text-gray-400 text-sm font-bold mb-4 uppercase tracking-wider">
                                                    Fotos ({selectedUserPhotos.length})
                                                </p>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    {selectedUserPhotos.map((photo, index) => (
                                                        <div key={index} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-white/10 hover:border-[#ff9900] transition-all group">
                                                            <img
                                                                src={photo}
                                                                alt={`Foto ${index + 1}`}
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                            />
                                                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
                                                                <span className="text-white text-xs font-bold">#{index + 1}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-3 py-12">
                                                <User className="text-gray-700" size={64} />
                                                <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Nenhuma foto disponível</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
