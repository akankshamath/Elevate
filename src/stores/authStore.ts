import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  role: string;
}

// Mock user data for demo
const mockUsers: User[] = [
  {
    id: 'admin',
    email: 'admin@acme.com',
    firstName: 'Admin',
    lastName: 'User',
    employeeId: 'E0001',
    department: 'IT',
    role: 'System Administrator',
    managerName: 'CTO',
    startDate: '2023-01-15',
    level: 12,
    currentXp: 4850,
    streakDays: 42,
    introCompleted: true,
  },
  {
    id: 'jane',
    email: 'jane@acme.com',
    firstName: 'Jane',
    lastName: 'Patel',
    employeeId: 'E0057',
    department: 'Engineering',
    role: 'Software Engineer I',
    managerName: 'A. Chen',
    startDate: '2024-11-01',
    level: 3,
    currentXp: 485,
    streakDays: 7,
    introCompleted: true,
  }
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        // Mock authentication
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const user = mockUsers.find(u => u.email === email);
        if (!user) {
          throw new Error('Invalid credentials');
        }

        set({ user, isAuthenticated: true });
        return user;
      },

      register: async (data: RegisterData) => {
        // Mock registration
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const newUser: User = {
          id: `user_${Date.now()}`,
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          employeeId: data.employeeId,
          department: 'Engineering',
          role: data.role,
          managerName: 'A. Chen',
          startDate: new Date().toISOString().split('T')[0],
          level: 1,
          currentXp: 0,
          streakDays: 0,
          introCompleted: false,
        };

        set({ user: newUser, isAuthenticated: true });
        return newUser;
      },

      logout: () => {
        set({ user: null, isAuthenticated: false });
      },

      updateUser: (updates: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...updates };
          set({ user: updatedUser });
          
          console.log('Auth Store Update:', { 
            before: currentUser.currentXp, 
            after: updatedUser.currentXp,
            updates 
          });
          
          // Force re-render by updating localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth-storage', JSON.stringify({
              state: { user: updatedUser, isAuthenticated: true },
              version: 0
            }));
            
            // Force a storage event to trigger re-renders
            window.dispatchEvent(new Event('storage'));
          }
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);