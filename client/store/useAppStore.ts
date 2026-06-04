import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Employee, ChatMessage } from '../types';

interface AppState {
  // User
  currentUser: User | null;
  currentEmployee: Employee | null;
  setCurrentUser: (user: User | null) => void;
  setCurrentEmployee: (employee: Employee | null) => void;

  // UI State
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Chat
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  chatMessages: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;

  // Notifications
  notifications: Notification[];
  addNotification: (n: Notification) => void;
  clearNotifications: () => void;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  timestamp: Date;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      currentEmployee: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      setCurrentEmployee: (employee) => set({ currentEmployee: employee }),

      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),

      chatOpen: false,
      setChatOpen: (open) => set({ chatOpen: open }),
      chatMessages: [],
      addChatMessage: (message) =>
        set((state) => ({
          chatMessages: [...state.chatMessages.slice(-49), message],
        })),
      clearChat: () => set({ chatMessages: [] }),

      notifications: [],
      addNotification: (n) =>
        set((state) => ({
          notifications: [n, ...state.notifications.slice(0, 9)],
        })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'hireflow-store',
      partialize: (state) => ({
        sidebarOpen: state.sidebarOpen,
        chatMessages: state.chatMessages,
      }),
    }
  )
);
