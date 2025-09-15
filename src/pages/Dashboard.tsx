
import React from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckSquare,
  BookOpen,
  TrendingUp,
  Flame,
  Play,
  ChevronRight,
  Trophy,
  Users,
} from "lucide-react";
import { ProgressRing } from "../components/ui/ProgressRing";
import { XpBadge } from "../components/ui/XpBadge";
import { useAuthStore } from "../stores/authStore";
import { useGameStore } from "../stores/gameStore";
import { useTaskStore } from "../stores/taskStore";
import { useModuleStore } from "../stores/moduleStore";

const mockAnnouncements = [
  {
    id: "1",
    type: "kudos",
    from: "Sarah Chen",
    message: "Great work on the security training!",
    timestamp: "2h ago",
  },
  {
    id: "2",
    type: "announcement",
    title: "New Learning Module Available",
    message: "Leadership Fundamentals is now live",
    timestamp: "1d ago",
  },
];

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const triggerXpGain = useGameStore((state) => state.triggerXpGain);

  // Zustand stores
  const { tasks, completeTask } = useTaskStore();
  const { modules } = useModuleStore();

  if (!user) return null;

  // Calculate XP progress
  const nextLevelXp = (user.level + 1) * 150;
  const progressToNextLevel = (user.currentXp / nextLevelXp) * 100;

  const handleCompleteTask = (taskId: string, points: number) => {
    completeTask(taskId);

    if (user) {
      const newXp = user.currentXp + points;
      const newLevel = Math.floor(newXp / 150) + 1;
      updateUser({
        currentXp: newXp,
        level: Math.max(newLevel, user.level),
      });

      setTimeout(() => {
        triggerXpGain(points);
      }, 100);
    }
  };

  const getDueDateStatus = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffTime = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0)
      return {
        text: "Overdue",
        className: "bg-rose-50 text-rose-700 border-rose-200",
      };
    if (diffDays <= 3)
      return {
        text: `Due in ${diffDays} day${diffDays > 1 ? "s" : ""}`,
        className: "bg-rose-50 text-rose-700",
      };
    return {
      text: `Due ${due.toLocaleDateString()}`,
      className: "bg-gray-50 text-gray-700",
    };
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0B2447] mb-2">
          Welcome back, {user.firstName}! 👋
        </h1>
        <p className="text-[#4A5568]">
          Ready to continue your learning journey?
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[#0B2447]">
                Your Progress
              </h2>
              <XpBadge xp={user.currentXp} level={user.level} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* XP */}
              <div className="text-center">
                <ProgressRing
                  progress={progressToNextLevel}
                  size={100}
                  className="mb-4"
                >
                  <div className="text-center">
                    <div className="text-lg font-bold text-[#0A6ED1]">
                      {user.level}
                    </div>
                    <div className="text-xs text-[#4A5568]">Level</div>
                  </div>
                </ProgressRing>
                <p className="text-sm text-[#4A5568]">
                  {user.currentXp.toLocaleString()} /{" "}
                  {nextLevelXp.toLocaleString()} XP
                </p>
              </div>

              {/* Streak */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#FFD23F] to-[#F59E0B] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flame className="w-8 h-8 text-white" />
                </div>
                <div className="text-2xl font-bold text-[#0B2447]">
                  {user.streakDays}
                </div>
                <p className="text-sm text-[#4A5568]">Day streak</p>
              </div>

              {/* Reward */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[#0A6ED1] to-[#00A0AF] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div className="text-sm font-medium text-[#0B2447]">
                  Next Badge
                </div>
                <p className="text-xs text-[#4A5568]">Weekly Warrior</p>
                <p className="text-xs text-[#4A5568]">3 more days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Challenge */}
        <div className="bg-gradient-to-br from-[#0A6ED1] to-[#00A0AF] rounded-2xl shadow p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-semibold">Daily Challenge</h3>
          </div>
          <p className="text-sm opacity-90 mb-6">
            Test your knowledge with today's 3-question quiz and earn bonus XP!
          </p>
          <button
            onClick={() => navigate("/daily-challenge")}
            className="w-full bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" />
            Start Challenge (+25 XP)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Checklist */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#0B2447] flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-[#0A6ED1]" />
              Your Checklist
            </h2>
            <button
              onClick={() => navigate("/checklist")}
              className="text-[#0A6ED1] hover:underline text-sm font-medium"
            >
              View all
            </button>
          </div>

          <div className="space-y-4">
            {tasks.slice(0, 3).map((task) => {
              const dueDateInfo = getDueDateStatus(task.dueDate);
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-4 p-4 bg-[#F5F7FA] rounded-xl"
                >
                  <button
                    onClick={() => handleCompleteTask(task.id, task.points)}
                    className="w-5 h-5 border-2 border-[#D6D9E0] rounded hover:border-[#0A6ED1] transition-colors"
                  />
                  <div className="flex-1">
                    <h4
                      className={`font-medium ${
                        task.status === "done"
                          ? "text-[#4A5568] line-through"
                          : "text-[#0B2447]"
                      }`}
                    >
                      {task.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${dueDateInfo.className}`}
                      >
                        {dueDateInfo.text}
                      </span>
                      <span className="text-xs text-[#4A5568]">
                        +{task.points} XP
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Learning Modules */}
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-[#0B2447] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#0A6ED1]" />
              Continue Learning
            </h2>
            <button
              onClick={() => navigate("/modules")}
              className="text-[#0A6ED1] hover:underline text-sm font-medium"
            >
              View all
            </button>
          </div>

          <div className="space-y-4">
            {modules.map((module) => (
              <div
                key={module.id}
                className="p-4 border border-[#D6D9E0] rounded-xl hover:border-[#0A6ED1] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-[#0B2447]">{module.title}</h4>
                  <ChevronRight className="w-4 h-4 text-[#4A5568]" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="w-full bg-[#E8EAF6] rounded-full h-2">
                      <div
                        className="bg-[#0A6ED1] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${module.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-[#4A5568]">
                    {Math.floor((module.progress / 100) * module.totalLessons)}/
                    {module.totalLessons}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-2xl shadow p-6 mt-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-[#0A6ED1]" />
          <h2 className="text-xl font-semibold text-[#0B2447]">
            Recent Activity
          </h2>
        </div>

        <div className="space-y-4">
          {mockAnnouncements.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-4 p-4 bg-[#F5F7FA] rounded-xl"
            >
              <div className="w-8 h-8 bg-[#0A6ED1] rounded-full flex items-center justify-center">
                {item.type === "kudos" ? "👏" : "📢"}
              </div>
              <div className="flex-1">
                {item.type === "kudos" ? (
                  <p className="text-[#0B2447]">
                    <span className="font-medium">{item.from}</span> gave you
                    kudos: "{item.message}"
                  </p>
                ) : (
                  <>
                    <h4 className="font-medium text-[#0B2447] mb-1">
                      {item.title}
                    </h4>
                    <p className="text-[#4A5568]">{item.message}</p>
                  </>
                )}
                <p className="text-xs text-[#4A5568] mt-2">{item.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
