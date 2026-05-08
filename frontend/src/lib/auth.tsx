import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { fetchBackend, getBackendErrorMessage, isBackendApiMode } from '@/lib/backendClient';
import type { AppUser, UserRole } from '@/lib/authTypes';

interface AuthResponse {
  user: AppUser;
}

interface AuthContextType {
  user: AppUser | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: 'admin' | 'student'
  ) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const dummyUsers: Map<string, AppUser & { password: string }> = new Map([
  [
    'admin@example.com',
    {
      id: 'admin-001',
      email: 'admin@example.com',
      fullName: 'Admin User',
      role: 'admin',
      password: 'admin123',
    },
  ],
  [
    'student@example.com',
    {
      id: 'student-001',
      email: 'student@example.com',
      fullName: 'Student User',
      role: 'student',
      password: 'student123',
    },
  ],
]);

function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function loadStoredUser(): AppUser | null {
  const stored = localStorage.getItem('dummyAuth');
  if (!stored) return null;

  try {
    return JSON.parse(stored) as AppUser;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(loadStoredUser);
  const [loading, setLoading] = useState<boolean>(() => isBackendApiMode());

  useEffect(() => {
    if (!isBackendApiMode()) {
      setLoading(false);
      return;
    }

    const storedUser = loadStoredUser();
    if (!storedUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function bootstrapUser() {
      try {
        const response = await fetchBackend<AuthResponse>('/auth/me', {
          method: 'GET',
          headers: {
            'X-User-Id': storedUser.id,
          },
        });

        if (cancelled) return;

        setUser(response.user);
        localStorage.setItem('dummyAuth', JSON.stringify(response.user));
      } catch (error) {
        if (cancelled) return;

        console.error('Auth bootstrap failed:', error);
        setUser(null);
        localStorage.removeItem('dummyAuth');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void bootstrapUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function signIn(email: string, password: string) {
    setLoading(true);

    try {
      if (isBackendApiMode()) {
        const response = await fetchBackend<AuthResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });

        setUser(response.user);
        localStorage.setItem('dummyAuth', JSON.stringify(response.user));
        return { error: null };
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
      const userData = dummyUsers.get(email);

      if (!userData) {
        return { error: new Error('User not found. Try: admin@example.com or student@example.com') };
      }

      if (userData.password !== password) {
        return { error: new Error('Invalid password') };
      }

      const loggedInUser: AppUser = {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role,
      };

      setUser(loggedInUser);
      localStorage.setItem('dummyAuth', JSON.stringify(loggedInUser));
      return { error: null };
    } catch (error) {
      return { error: new Error(getBackendErrorMessage(error, 'Failed to sign in')) };
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email: string, password: string, fullName: string, role: 'admin' | 'student') {
    setLoading(true);

    try {
      if (isBackendApiMode()) {
        const response = await fetchBackend<AuthResponse>('/auth/signup', {
          method: 'POST',
          body: JSON.stringify({ email, password, fullName, role }),
        });

        setUser(response.user);
        localStorage.setItem('dummyAuth', JSON.stringify(response.user));
        return { error: null };
      }

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (dummyUsers.has(email)) {
        return { error: new Error('This email is already registered. Please sign in instead.') };
      }

      if (password.length < 6) {
        return { error: new Error('Password must be at least 6 characters') };
      }

      const newUserId = generateUserId();
      const newUser: AppUser & { password: string } = {
        id: newUserId,
        email,
        fullName,
        role,
        password,
      };

      dummyUsers.set(email, newUser);

      const loggedInUser: AppUser = {
        id: newUserId,
        email,
        fullName,
        role,
      };

      setUser(loggedInUser);
      localStorage.setItem('dummyAuth', JSON.stringify(loggedInUser));
      return { error: null };
    } catch (error) {
      return { error: new Error(getBackendErrorMessage(error, 'Failed to create account')) };
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    try {
      if (isBackendApiMode()) {
        await fetchBackend<void>('/auth/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Sign out request failed:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('dummyAuth');
    }
  }

  return (
    <AuthContext.Provider value={{ user, role: user?.role ?? null, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
