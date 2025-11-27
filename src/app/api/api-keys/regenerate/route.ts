import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import AES from 'crypto-js/aes'
import CryptoJS from 'crypto-js'

const secretKey = process.env.ENCRYPTION_SECRET!

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, newKey } = await request.json()

    if (!id || !newKey) {
      return NextResponse.json({ error: 'Missing id or newKey' }, { status: 400 })
    }

    const encrypted = AES.encrypt(newKey, secretKey).toString()

    const { data, error } = await supabase
      .from('api_keys')
      .update({ api_key: encrypted })
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