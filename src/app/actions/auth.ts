'use server'

import { supabase } from '@/lib/supabase'
import { createClient } from '@supabase/supabase-js'

// Create admin client inline for server actions
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

export async function registerUserWithPin(formData: FormData) {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const pin = formData.get('pin') as string
    const firstName = formData.get('first_name') as string
    const lastName = formData.get('last_name') as string

    // 1. Validate PIN
    if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
        return { error: 'O PIN deve ter exatamente 6 dígitos numéricos.' }
    }

    // 2. Register User (standard Supabase Auth)
    // Use the public client for Sign Up to avoid session contamination on the Admin client
    // We use a fresh client or just the admin one to create the user?
    // Using admin.auth.signUp automatically confirms email? Generally yes if config says so, or sends email.
    // Let's use public URL to simulate standard flow, but we are in a Server Action.
    // Let's use admin to ensuring we get the ID returned immediately.

    // Check if user exists first? supabase.auth.signUp handles that.

    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
            }
        }
    })

    if (authError) {
        return { error: authError.message }
    }

    if (!authData.user) {
        return { error: 'Erro ao criar utilizador.' }
    }

    const userId = authData.user.id

    // 3. Insert PIN into user_private_auth (Requires Admin)
    const { error: pinError } = await supabaseAdmin
        .from('user_private_auth')
        .insert({
            user_id: userId,
            pin: pin
        })

    if (pinError) {
        // Rollback? Deleting user might be extreme, but if PIN fails, the account is inconsistent with our "PIN required" rule.
        // For MVP, let's log and return error.
        console.error('Erro ao guardar PIN:', pinError)
        return { error: `Erro ao configurar PIN: ${pinError.message} (Detalhes: ${pinError.details || 'N/A'})` }
    }

    return { success: true }
}

// New action for Client-Side SignUp flow
export async function saveUserPin(userId: string, pin: string) {
    if (!pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
        return { error: 'O PIN deve ter exatamente 6 dígitos numéricos.' }
    }

    try {
        const { error: pinError } = await supabaseAdmin
            .from('user_private_auth')
            .insert({
                user_id: userId,
                pin: pin
            })

        if (pinError) {
            console.error('Erro ao guardar PIN:', pinError)
            return { error: `Erro ao configurar PIN: ${pinError.message}` }
        }

        return { success: true }
    } catch (err: any) {
        return { error: 'Erro interno ao salvar PIN.' }
    }
}

export async function loginWithPin(email: string, pin: string, reqIp?: string) {
    try {
        // 1. Get User ID by Email
        const { data: userData, error: userError } = await supabaseAdmin
            .rpc('get_user_id_by_email', { user_email: email })

        if (userError || !userData || userData.length === 0) {
            return { error: 'Utilizador não encontrado.' }
        }

        const userId = userData[0].id

        // 2. Check PIN
        const { data: pinData, error: pinError } = await supabaseAdmin
            .from('user_private_auth')
            .select('pin')
            .eq('user_id', userId)
            .single()

        // Log attempt
        const logAttempt = async (success: boolean) => {
            await supabaseAdmin.from('pin_login_logs').insert({
                user_id: userId,
                success,
                ip_address: reqIp
            })
        }

        if (pinError || !pinData || pinData.pin !== pin) {
            await logAttempt(false)
            return { error: 'PIN incorreto.' }
        }

        await logAttempt(true)

        // 3. Generate Session (Magic Link or similar)
        // Since we want to log the user in immediately without sending an email...
        // We can use `signInWithPassword` if we updated the user's password? NO.
        // We can use `admin.generateLink` to get a `action_link` which contains an access token?
        // OR `admin.createSession`? Supabase Admin doesn't have `createSession` for a user directly?
        // `admin.generateLink` with type `magiclink` returns `properties.action_link` which logs the user in.

        // Get the origin from the request headers if possible, or assume localhost/production URL
        // In Server Actions, we can't easily get headers() inside this function unless we change signature or use `headers()` from next/headers
        // For now, let's try to assume a standard callback URL or just the current Site URL + /discover
        // Actually, if we use `redirectTo`, it should point to a page that handles the hash token? 
        // Standard Magic Link behaviour: user clicks link -> Supabase verifies -> redirects to `redirectTo` with session.
        // If we set `redirectTo` to `http://localhost:3000/discover`, it should work.
        // We need `NEXT_PUBLIC_SITE_URL` env var preferably.

        // Use the site URL defined in env or default to root
        // Important: ensure siteUrl doesn't end with a slash to avoid double slashes
        const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '')

        const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
                redirectTo: `${siteUrl}` // Let's redirect to root or /discover? Root is safer for debugging
            }
        })

        if (linkError || !linkData.properties?.action_link) {
            return { error: 'Erro ao gerar sessão.' }
        }

        // Robust extraction of token_hash
        let tokenHash = null
        try {
            const url = new URL(linkData.properties.action_link)
            tokenHash = url.searchParams.get('token_hash') || url.searchParams.get('token')

            if (!tokenHash) {
                // Check if it's in the hash fragment just in case
                const hashParams = new URLSearchParams(url.hash.substring(1))
                tokenHash = hashParams.get('token_hash') || hashParams.get('token')
            }
        } catch (e) {
            console.error('URL Parsing Error:', e)
        }

        if (!tokenHash) {
            console.error('Action Link without token:', linkData.properties.action_link)
            return { error: 'Erro ao processar link de autenticação. Por favor, tente novamente.' }
        }

        return { success: true, tokenHash }

    } catch (err: any) {
        console.error('Login PIN Error:', err)
        return { error: 'Erro interno no servidor.' }
    }
}

export async function updatePin(userId: string, currentPin: string, newPin: string) {
    if (!newPin || newPin.length !== 6 || !/^\d+$/.test(newPin)) {
        return { error: 'O novo PIN deve ter exatamente 6 dígitos numéricos.' }
    }

    try {
        // 1. Verify Current PIN
        const { data: currentData, error: verifyError } = await supabaseAdmin
            .from('user_private_auth')
            .select('pin')
            .eq('user_id', userId)
            .single()

        if (verifyError || !currentData) {
            // If checking PIN fails, maybe user doesn't have a PIN yet?
            // "Confirmar PIN atual" implies they have one.
            // If we want to allow setting PIN for the first time, we should handle that.
            // But prompt says "Alterar PIN: Confirmar PIN atual".
            // Let's assume they might not have one? For MVP, let's stick to "Confirmar PIN atual".
            return { error: 'Erro ao verificar PIN atual ou PIN não definido.' }
        }

        if (currentData.pin !== currentPin) {
            return { error: 'PIN atual incorreto.' }
        }

        // 2. Update PIN
        const { error: updateError } = await supabaseAdmin
            .from('user_private_auth')
            .update({ pin: newPin, updated_at: new Date().toISOString() })
            .eq('user_id', userId)

        if (updateError) {
            return { error: 'Erro ao atualizar PIN.' }
        }

        return { success: true }
    } catch (err: any) {
        console.error('Update PIN Error:', err)
        return { error: 'Erro interno no servidor.' }
    }
}
