import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import AES from 'crypto-js/aes'
import CryptoJS from 'crypto-js'

const secretKey = process.env.ENCRYPTION_SECRET!

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: keys, error: keysError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)

    if (keysError) {
      return NextResponse.json({ error: keysError.message }, { status: 500 })
    }

    // Get aggregated data for each key
    const keysWithStats = await Promise.all(
      keys.map(async (key) => {
        const { count: total_requests, error: countError } = await supabase
          .from('api_requests')
          .select('*', { count: 'exact', head: true })
          .eq('api_key_id', key.id)

        const { data: costData, error: costError } = await supabase
          .from('api_requests')
          .select('cost')
          .eq('api_key_id', key.id)

        const total_cost = costData?.reduce((sum, req) => sum + parseFloat(req.cost || 0), 0) || 0

        return {
          ...key,
          total_requests: total_requests || 0,
          total_cost
        }
      })
    )

    const masked = keysWithStats.map(key => {
      const decryptedKey = AES.decrypt(key.api_key, secretKey).toString(CryptoJS.enc.Utf8)
      return {
        ...key,
        api_key: decryptedKey.length > 8 ? decryptedKey.substring(0, 4) + '****' + decryptedKey.substring(decryptedKey.length - 4) : '****'
      }
    })

    return NextResponse.json(masked)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { provider, api_key, nickname } = await request.json()

    if (!provider || !api_key) {
      return NextResponse.json({ error: 'Missing provider or api_key' }, { status: 400 })
    }

    const encrypted = AES.encrypt(api_key, secretKey).toString()

    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user.id,
        provider,
        api_key: encrypted,
        nickname: nickname || null
      })
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, nickname, status } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const updateData: Record<string, string | null> = {}
    if (nickname !== undefined) updateData.nickname = nickname
    if (status !== undefined) updateData.status = status

    const { data, error } = await supabase
      .from('api_keys')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}