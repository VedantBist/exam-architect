import { createContext, useContext, useState, ReactNode } from 'react';

type UserRole = 'admin' | 'student' | null;

interface DummyUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

interface AuthContextType {
  user: DummyUser | null;
  role: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string, role: 'admin' | 'student') => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// In-memory storage for dummy users (resets on page refresh)
const dummyUsers: Map<string, DummyUser & { password: string }> = new Map([
  // Pre-loaded demo accounts
  ['admin@example.com', {
    id: 'admin-001',
    email: 'admin@example.com',
    fullName: 'Admin User',
    role: 'admin',
    password: 'admin123'
  }],
  ['student@example.com', {
    id: 'student-001',
    email: 'student@example.com',
    fullName: 'Student User',
    role: 'student',
    password: 'student123'
  }]
]);

function generateUserId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DummyUser | null>(() => {
    // Check localStorage for persisted user
    const stored = localStorage.getItem('dummyAuth');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(false);

  async function signIn(email: string, password: string) {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

      const userData = dummyUsers.get(email);
      
      if (!userData) {
        return { error: new Error('User not found. Try: admin@example.com or student@example.com') };
      }

      if (userData.password !== password) {
        return { error: new Error('Invalid password') };
      }

      const loggedInUser: DummyUser = {
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName,
        role: userData.role
      };

      setUser(loggedInUser);
      localStorage.setItem('dummyAuth', JSON.stringify(loggedInUser));
      return { error: null };
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email: string, password: string, fullName: string, role: 'admin' | 'student') {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

      if (dummyUsers.has(email)) {
        return { error: new Error('This email is already registered. Please sign in instead.') };
      }

      if (password.length < 6) {
        return { error: new Error('Password must be at least 6 characters') };
      }

      const newUserId = generateUserId();
      const newUser: DummyUser & { password: string } = {
        id: newUserId,
        email,
        fullName,
        role,
        password
      };

      // Store the new user
      dummyUsers.set(email, newUser);

      // Auto-login after signup
      const loggedInUser: DummyUser = {
        id: newUserId,
        email,
        fullName,
        role
      };

      setUser(loggedInUser);
      localStorage.setItem('dummyAuth', JSON.stringify(loggedInUser));
      return { error: null };
    } finally {
      setLoading(false);
    }
  }

  async function signOut() {
    setUser(null);
    localStorage.removeItem('dummyAuth');
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
