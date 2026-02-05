import { auth } from './auth'

export function canMutate(role: string): boolean {
  return role === 'admin' || role === 'manager'
}

export async function requireAuth() {
  const session = await auth()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session
}
