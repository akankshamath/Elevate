import { create } from 'zustand';
import confetti from 'canvas-confetti';

interface GameState {
  showXpGain: boolean;
  xpGained: number;
  newBadges: string[];
  showLevelUp: boolean;
  newLevel: number;
  triggerXpGain: (xp: number) => void;
  triggerBadgeUnlock: (badges: string[]) => void;
  triggerLevelUp: (level: number) => void;
  clearNotifications: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  showXpGain: false,
  xpGained: 0,
  newBadges: [],
  showLevelUp: false,
  newLevel: 0,

  triggerXpGain: (xp: number) => {
    // Trigger confetti
    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD23F', '#0A6ED1', '#00A0AF']
    });

    set({ showXpGain: true, xpGained: xp });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      set({ showXpGain: false, xpGained: 0 });
    }, 3000);
  },

  triggerBadgeUnlock: (badges: string[]) => {
    confetti({
      particleCount: 100,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#FFD23F', '#2BA84A', '#0A6ED1']
    });

    set({ newBadges: badges });
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      set({ newBadges: [] });
    }, 5000);
  },

  triggerLevelUp: (level: number) => {
    // Extra fancy confetti for level up
    confetti({
      particleCount: 150,
      spread: 120,
      origin: { y: 0.4 },
      colors: ['#FFD23F', '#0A6ED1', '#00A0AF'],
      gravity: 0.8,
      scalar: 1.2
    });

    set({ showLevelUp: true, newLevel: level });
  },

  clearNotifications: () => {
    set({ 
      showXpGain: false, 
      xpGained: 0, 
      newBadges: [], 
      showLevelUp: false, 
      newLevel: 0 
    });
  },
}));