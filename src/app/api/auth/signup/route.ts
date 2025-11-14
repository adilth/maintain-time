import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const user = await createUser(email, password, name);

    const cookieStore = await cookies();
    cookieStore.set('userId', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Signup error:', error);

    if (error instanceof Error) {
      if (error.message === 'User already exists') {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: error.message || 'Failed to create account' },
        { status: 500 }
      );
    }

    // Fallback if error is not an Error instance
    return NextResponse.json(
      { error: 'Unknown error occurred' },
      { status: 500 }
    );
  }
}
