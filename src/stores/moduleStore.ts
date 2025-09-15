
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Module {
  id: string;
  title: string;
  category: string;
  difficulty: 1 | 2 | 3;
  estimatedMinutes: number;
  totalLessons: number;
  xpReward: number;
  description: string;
  tags: string[];
  progress: number;
  lastOpenedAt?: string;
  videoUrl: string;
  thumbnail: string;
}

const mockModules: Module[] = [
  {
    id: "1",
    title: "Company Values & Culture",
    category: "Company Values",
    difficulty: 1,
    estimatedMinutes: 45,
    totalLessons: 6,
    xpReward: 150,
    description:
      "Learn about our core values, mission, and company culture that drives our success.",
    tags: ["Culture", "Values", "Mission"],
    progress: 75,
    lastOpenedAt: "2024-12-10",
    videoUrl: "https://www.youtube.com/embed/zNbF006Y5x4",
    thumbnail:
      "https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "2",
    title: "Information Security Basics",
    category: "Compliance",
    difficulty: 2,
    estimatedMinutes: 60,
    totalLessons: 8,
    xpReward: 200,
    description: "Essential security practices to protect company data and systems.",
    tags: ["Security", "Compliance", "Data Protection"],
    progress: 0,
    videoUrl: "https://www.youtube.com/embed/inWWhr5tnEA",
    thumbnail:
      "https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "3",
    title: "Product Overview",
    category: "Product",
    difficulty: 1,
    estimatedMinutes: 30,
    totalLessons: 5,
    xpReward: 120,
    description: "Comprehensive overview of our products and services.",
    tags: ["Product", "Overview", "Features"],
    progress: 25,
    lastOpenedAt: "2024-12-08",
    videoUrl: "https://www.youtube.com/embed/9No-FiEInLA",
    thumbnail:
      "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "4",
    title: "Leadership Fundamentals",
    category: "Leadership",
    difficulty: 3,
    estimatedMinutes: 90,
    totalLessons: 12,
    xpReward: 300,
    description: "Develop essential leadership skills for career advancement.",
    tags: ["Leadership", "Management", "Career Growth"],
    progress: 0,
    videoUrl: "https://www.youtube.com/embed/VFIuJdwsUzk",
    thumbnail:
      "https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "5",
    title: "Communication Skills",
    category: "Soft Skills",
    difficulty: 2,
    estimatedMinutes: 75,
    totalLessons: 10,
    xpReward: 250,
    description: "Master effective communication in professional settings.",
    tags: ["Communication", "Presentation", "Collaboration"],
    progress: 50,
    lastOpenedAt: "2024-12-09",
    videoUrl: "https://www.youtube.com/embed/HAnw168huqA",
    thumbnail:
      "https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
  {
    id: "6",
    title: "Project Management Essentials",
    category: "Management",
    difficulty: 2,
    estimatedMinutes: 80,
    totalLessons: 9,
    xpReward: 220,
    description: "Learn project management methodologies and best practices.",
    tags: ["Project Management", "Agile", "Planning"],
    progress: 0,
    videoUrl: "https://www.youtube.com/embed/Unzc731iCUY",
    thumbnail:
      "https://images.pexels.com/photos/3277804/pexels-photo-3277804.jpeg?auto=compress&cs=tinysrgb&w=400",
  },
];

interface ModuleState {
  modules: Module[];
  updateModule: (id: string, updates: Partial<Module>) => void;
}

export const useModuleStore = create<ModuleState>()(
  persist(
    (set) => ({
      modules: mockModules,
      updateModule: (id, updates) =>
        set((state) => ({
          modules: state.modules.map((m) =>
            m.id === id ? { ...m, ...updates } : m
          ),
        })),
    }),
    { name: "module-storage" }
  )
);
