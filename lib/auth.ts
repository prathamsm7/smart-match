import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/superbase/server';
import { prisma } from '@/lib/prisma';
import type { User as SupabaseUser } from '@supabase/supabase-js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
}

export interface AuthError {
  error: string;
  status: number;
}

/**
 * Authenticates the current request and returns the database user
 * @returns Object with either user data or error response
 */
export async function authenticateRequest(): Promise<
  | { user: AuthenticatedUser; error: null }
  | { user: null; error: NextResponse }
> {
  try {
    // 1. Get Supabase user
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ),
      };
    }

    // 2. Get database user
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!dbUser) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'User not found in database' },
          { status: 404 }
        ),
      };
    }

    return {
      user: dbUser,
      error: null,
    };
  } catch (error: any) {
    console.error('Authentication error:', error);
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Authenticates the current request and checks if user has required role
 * @param requiredRole - The role required to access the resource
 * @returns Object with either user data or error response
 */
export async function authenticateWithRole(
  requiredRole: string
): Promise<
  | { user: AuthenticatedUser; error: null }
  | { user: null; error: NextResponse }
> {
  const { user, error } = await authenticateRequest();

  if (error) {
    return { user: null, error };
  }

  if (user!.role !== requiredRole) {
    return {
      user: null,
      error: NextResponse.json(
        { error: `Access denied. ${requiredRole} role required.` },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}

/**
 * Optional authentication - returns user if authenticated, null if not
 * Useful for endpoints that work with or without authentication
 */
export async function optionalAuth(): Promise<AuthenticatedUser | null> {
  try {
    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return null;
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
    });

    return dbUser;
  } catch (error) {
    console.error('Optional auth error:', error);
    return null;
  }
}
