import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getUserById } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    
    if (!userId) {
      return NextResponse.json({ user: null })
    }
    
    const user = await getUserById(userId)
    
    if (!user) {
      cookieStore.delete('userId')
      return NextResponse.json({ user: null })
    }
    
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        telegramLinked: !!user.telegramId,
        profile: user.profile,
        stats: user.stats,
      }
    })
    
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    )
  }
}
