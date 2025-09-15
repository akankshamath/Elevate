
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Task {
  id: string;
  title: string;
  description: string;
  category: "HR" | "IT" | "Compliance" | "General";
  dueDate: string;
  points: number;
  isMandatory: boolean;
  status: "todo" | "done" | "snoozed";
  completedAt?: string;
}

// mock tasks (initial checklist)
const mockTasks: Task[] = [
  {
    id: "1",
    title: "Complete security training",
    description: "Learn about company security policies and best practices",
    category: "Compliance",
    dueDate: "2024-12-15",
    points: 20,
    isMandatory: true,
    status: "todo",
  },
  {
    id: "2",
    title: "Set up development environment",
    description: "Install required software and configure your workspace",
    category: "IT",
    dueDate: "2024-12-16",
    points: 15,
    isMandatory: true,
    status: "todo",
  },
  {
    id: "3",
    title: "Meet your mentor",
    description: "Schedule and attend your first mentoring session",
    category: "HR",
    dueDate: "2024-12-18",
    points: 25,
    isMandatory: true,
    status: "todo",
  },
  {
    id: "4",
    title: "Complete employee handbook review",
    description: "Read through the employee handbook and acknowledge receipt",
    category: "HR",
    dueDate: "2024-12-20",
    points: 10,
    isMandatory: true,
    status: "done",
    completedAt: "2024-12-10",
  },
  {
    id: "5",
    title: "Join team Slack channels",
    description: "Get added to relevant team communication channels",
    category: "General",
    dueDate: "2024-12-14",
    points: 5,
    isMandatory: false,
    status: "done",
    completedAt: "2024-12-11",
  },
  {
    id: "6",
    title: "Complete benefits enrollment",
    description: "Review and select your health insurance and other benefits",
    category: "HR",
    dueDate: "2024-12-22",
    points: 15,
    isMandatory: true,
    status: "todo",
  },
  {
    id: "7",
    title: "Attend new hire orientation",
    description: "Join the company-wide new hire orientation session",
    category: "HR",
    dueDate: "2024-12-19",
    points: 30,
    isMandatory: true,
    status: "snoozed",
  },
];

interface TaskState {
  tasks: Task[];
  completeTask: (id: string) => void;
  snoozeTask: (id: string) => void;
  addTask: (task: Task) => void;
  editTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  resetTasks: () => void;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set) => ({
      tasks: mockTasks,

      completeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id && t.status !== "done"
              ? { ...t, status: "done", completedAt: new Date().toISOString() }
              : t
          ),
        })),

      snoozeTask: (id) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status: "snoozed" } : t
          ),
        })),

      addTask: (task) =>
        set((state) => ({
          tasks: [...state.tasks, task],
        })),

      editTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
        })),

      resetTasks: () => set({ tasks: mockTasks }),
    }),
    { name: "task-storage" }
  )
);
