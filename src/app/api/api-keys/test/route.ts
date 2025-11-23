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

    const { api_key_id } = await request.json()

    if (!api_key_id) {
      return NextResponse.json({ success: false, error: 'Missing api_key_id' }, { status: 400 })
    }

    // Fetch the API key from database
    const { data: keyData, error: keyError } = await supabase
      .from('api_keys')
      .select('*')
      .eq('id', api_key_id)
      .eq('user_id', user.id)
      .single()

    if (keyError || !keyData) {
      return NextResponse.json({ success: false, error: 'API key not found or access denied' }, { status: 404 })
    }

    const provider = keyData.provider
    const api_key = AES.decrypt(keyData.api_key, secretKey).toString(CryptoJS.enc.Utf8)

    if (!api_key) {
      return NextResponse.json({ success: false, error: 'Invalid API key' }, { status: 400 })
    }

    let url: string
    let method: string
    let headers: Record<string, string>
    let body: string | undefined

    switch (provider.toLowerCase()) {
      case 'openai':
        url = 'https://api.openai.com/v1/models'
        method = 'GET'
        headers = { 'Authorization': `Bearer ${api_key}` }
        break
      case 'anthropic':
        url = 'https://api.anthropic.com/v1/messages'
        method = 'POST'
        headers = {
          'x-api-key': api_key,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
        body = JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }]
        })
        break
      case 'google':
        url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${api_key}`
        method = 'POST'
        headers = { 'Content-Type': 'application/json' }
        body = JSON.stringify({
          contents: [{ parts: [{ text: 'Hi' }] }]
        })
        break
      default:
        return NextResponse.json({ success: false, error: 'Unsupported provider' }, { status: 400 })
    }

    const response = await fetch(url, { method, headers, body })

    if (response.ok) {
      return NextResponse.json({ success: true })
    } else {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json({ success: false, error: errorData.error?.message || 'Invalid API key' })
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}