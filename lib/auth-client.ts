'use client'

import { createAuthClient } from 'better-auth/react'

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin : undefined,
  disableCookieCheck: process.env.NODE_ENV === 'development',
})

export const { signIn, signUp, signOut, useSession } = authClient
