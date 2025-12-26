'use server'

import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

export async function loginAdmin(username: string, password: string, pin: string) {
    try {
        if (!username) {
            return { error: 'Username é obrigatório.' }
        }

        if (!password && !pin) {
            return { error: 'Senha ou PIN é obrigatório.' }
        }

        // Get admin user by username
        const { data: adminUser, error: fetchError } = await supabaseAdmin
            .from('admin_users')
            .select('*')
            .eq('username', username)
            .single()

        if (fetchError || !adminUser) {
            return { error: 'Credenciais inválidas.' }
        }

        // Check password OR PIN
        let isValid = false

        // If password is provided, check it
        if (password && adminUser.password === password) {
            isValid = true
        }

        // If PIN is provided, check it (must be exactly 6 digits)
        if (pin) {
            if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
                return { error: 'PIN deve ter 6 dígitos.' }
            }
            if (adminUser.pin === pin) {
                isValid = true
            }
        }

        if (!isValid) {
            return { error: 'Credenciais inválidas.' }
        }

        // Return success with admin data
        return {
            success: true,
            admin: {
                id: adminUser.id,
                username: adminUser.username,
                role: adminUser.role
            }
        }
    } catch (err) {
        console.error('Admin login error:', err)
        return { error: 'Erro ao fazer login.' }
    }
}

export async function searchUsers(searchTerm: string) {
    try {
        console.log('Searching users with term:', searchTerm)

        let query = supabaseAdmin
            .from('profiles')
            .select('id, first_name, last_name, avatar_url, gender, province, plan_type, extra_batidas, role')

        if (searchTerm && searchTerm.trim()) {
            const term = searchTerm.trim()
            query = query.or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%`)
        }

        const { data, error } = await query.limit(50)

        console.log('Search result:', { data, error })

        if (error) {
            console.error('Supabase error:', error)
            return { error: `Erro ao buscar usuários: ${error.message}`, users: [] }
        }

        return { success: true, users: data || [] }
    } catch (err: any) {
        console.error('Search users error:', err)
        return { error: `Erro ao buscar usuários: ${err.message}`, users: [] }
    }
}

export async function addBatidasToUser(userId: string, amount: number) {
    try {
        if (amount <= 0) {
            return { error: 'A quantidade deve ser maior que zero.' }
        }

        // Get current batidas
        const { data: user, error: fetchError } = await supabaseAdmin
            .from('profiles')
            .select('extra_batidas')
            .eq('id', userId)
            .single()

        if (fetchError || !user) {
            return { error: 'Usuário não encontrado.' }
        }

        const currentBatidas = user.extra_batidas || 0
        const newTotal = currentBatidas + amount

        // Update batidas
        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update({ extra_batidas: newTotal })
            .eq('id', userId)

        if (updateError) {
            console.error('Update error:', updateError)
            return { error: 'Erro ao adicionar batidas.' }
        }

        return { success: true, newTotal }
    } catch (err: any) {
        console.error('Add batidas error:', err)
        return { error: 'Erro ao adicionar batidas.' }
    }
}

export async function updateUserPlan(userId: string, planType: string, startDate?: string, endDate?: string) {
    try {
        if (!['sanzala', 'premium', 'vip'].includes(planType)) {
            return { error: 'Tipo de plano inválido.' }
        }

        const updateData: any = { plan_type: planType }

        // Add dates if provided (for premium/vip plans)
        if (startDate && endDate) {
            updateData.plan_start_date = startDate
            updateData.plan_end_date = endDate
        } else if (planType === 'sanzala') {
            // Clear dates for sanzala plan
            updateData.plan_start_date = null
            updateData.plan_end_date = null
        }

        const { error: updateError } = await supabaseAdmin
            .from('profiles')
            .update(updateData)
            .eq('id', userId)

        if (updateError) {
            console.error('Update plan error:', updateError)
            return { error: 'Erro ao atualizar plano.' }
        }

        return { success: true }
    } catch (err: any) {
        console.error('Update plan error:', err)
        return { error: 'Erro ao atualizar plano.' }
    }
}

export async function getUserPhotos(userId: string) {
    try {
        // Get photos from profile
        const { data: profileData, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('photos')
            .eq('id', userId)
            .single()

        if (profileError) {
            console.error('Get user photos error (profile):', profileError)
            return { error: 'Erro ao buscar fotos do usuário.', photos: [], pin: null }
        }

        // Get PIN from user_private_auth
        const { data: authData, error: authError } = await supabaseAdmin
            .from('user_private_auth')
            .select('pin')
            .eq('user_id', userId)
            .single()

        return {
            success: true,
            photos: profileData?.photos || [],
            pin: authData?.pin || null
        }
    } catch (err: any) {
        console.error('Get user photos error:', err)
        return { error: 'Erro ao buscar fotos do usuário.', photos: [], pin: null }
    }
}

export async function getTotalUsers() {
    try {
        const { count, error } = await supabaseAdmin
            .from('profiles')
            .select('*', { count: 'exact', head: true })

        if (error) {
            console.error('Get total users error:', error)
            return { error: 'Erro ao contar usuários.', total: 0 }
        }

        return { success: true, total: count || 0 }
    } catch (err: any) {
        console.error('Get total users error:', err)
        return { error: 'Erro ao contar usuários.', total: 0 }
    }
}

export async function createNotification(
    title: string,
    message: string,
    targetType: 'all' | 'gender' | 'province',
    targetValue: string | null,
    scheduledTime: string | null,
    adminId: string
) {
    try {
        if (!title || !message) {
            return { error: 'Título e mensagem são obrigatórios.' }
        }

        if (targetType === 'gender' && !['male', 'female'].includes(targetValue || '')) {
            return { error: 'Gênero inválido.' }
        }

        if (targetType === 'province' && !targetValue) {
            return { error: 'Província é obrigatória.' }
        }

        const { error } = await supabaseAdmin
            .from('admin_notifications')
            .insert({
                title,
                message,
                target_type: targetType,
                target_value: targetValue,
                scheduled_time: scheduledTime,
                admin_id: adminId
            })

        if (error) {
            console.error('Create notification error:', error)
            return { error: 'Erro ao criar notificação.' }
        }

        return { success: true }
    } catch (err: any) {
        console.error('Create notification error:', err)
        return { error: 'Erro ao criar notificação.' }
    }
}
