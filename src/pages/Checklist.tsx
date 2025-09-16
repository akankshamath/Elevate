
import React, { useEffect, useState } from "react";
import { CheckSquare, Clock, Calendar, Star, Search } from "lucide-react";
import { useGameStore } from "../stores/gameStore";
import { useAuthStore } from "../stores/authStore";
import { useTaskStore } from "../stores/taskStore";

export const Checklist: React.FC = () => {
  const {
    tasks,
    completeTask,
    snoozeTask,
    addTask,
    editTask,
    deleteTask,
    fetchTasks, 
  } = useTaskStore();

  const [filter, setFilter] = useState<"all" | "todo" | "done" | "snoozed">("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const triggerXpGain = useGameStore((state) => state.triggerXpGain);
  const { user, updateUser } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      fetchTasks(user.id);
    }
  }, [user?.id, fetchTasks]);

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
        status: "overdue",
        text: "Overdue",
        className: "bg-rose-50 text-rose-700 border-rose-200",
      };
    if (diffDays <= 3)
      return {
        status: "due_soon",
        text: `Due in ${diffDays} day${diffDays > 1 ? "s" : ""}`,
        className: "bg-rose-50 text-rose-700",
      };
    return {
      status: "normal",
      text: `Due ${due.toLocaleDateString()}`,
      className: "bg-gray-50 text-gray-700",
    };
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      HR: "bg-blue-50 text-blue-700",
      IT: "bg-green-50 text-green-700",
      Compliance: "bg-red-50 text-red-700",
      General: "bg-gray-50 text-gray-700",
    };
    return colors[category as keyof typeof colors] || colors.General;
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = filter === "all" || task.status === filter;
    const matchesCategory =
      categoryFilter === "all" || task.category === categoryFilter;
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesCategory && matchesSearch;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === "done").length,
    pending: tasks.filter((t) => t.status === "todo").length,
    overdue: tasks.filter((t) => {
      const due = new Date(t.dueDate);
      const now = new Date();
      return t.status === "todo" && due < now;
    }).length,
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0B2447] mb-2">Your Checklist</h1>
        <p className="text-[#4A5568]">
          Track your onboarding progress and complete required tasks
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="text-2xl font-bold text-[#0B2447]">{stats.total}</div>
          <div className="text-sm text-[#4A5568]">Total Tasks</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="text-2xl font-bold text-[#2BA84A]">
            {stats.completed}
          </div>
          <div className="text-sm text-[#4A5568]">Completed</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="text-2xl font-bold text-[#0A6ED1]">{stats.pending}</div>
          <div className="text-sm text-[#4A5568]">Pending</div>
        </div>
        <div className="bg-white rounded-2xl shadow p-6">
          <div className="text-2xl font-bold text-[#E11D48]">{stats.overdue}</div>
          <div className="text-sm text-[#4A5568]">Overdue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-[#4A5568] absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#0A6ED1]"
              />
            </div>
          </div>

          {/* Status */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#0A6ED1]"
          >
            <option value="all">All Status</option>
            <option value="todo">To Do</option>
            <option value="done">Completed</option>
            <option value="snoozed">Snoozed</option>
          </select>

          {/* Category */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border rounded-xl focus:ring-2 focus:ring-[#0A6ED1]"
          >
            <option value="all">All Categories</option>
            <option value="HR">HR</option>
            <option value="IT">IT</option>
            <option value="Compliance">Compliance</option>
            <option value="General">General</option>
          </select>
        </div>
      </div>

      {/* Tasks */}
      <div className="space-y-4">
        {filteredTasks.map((task) => {
          const dueDateInfo = getDueDateStatus(task.dueDate);

          return (
            <div
              key={task.id}
              className="bg-white rounded-2xl shadow p-6 flex items-start gap-4"
            >
              {/* Checkbox */}
              <button
                onClick={() => handleCompleteTask(task.id, task.points)}
                disabled={task.status === "done"}
                className={`w-6 h-6 border-2 rounded-lg flex items-center justify-center transition-colors ${
                  task.status === "done"
                    ? "bg-[#2BA84A] border-[#2BA84A] text-white"
                    : "border-[#D6D9E0] hover:border-[#0A6ED1]"
                }`}
              >
                {task.status === "done" && (
                  <CheckSquare className="w-4 h-4" />
                )}
              </button>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3
                      className={`font-semibold ${
                        task.status === "done"
                          ? "text-[#4A5568] line-through"
                          : "text-[#0B2447]"
                      }`}
                    >
                      {task.title}
                      {task.isMandatory && (
                        <span className="text-[#E11D48] ml-1">*</span>
                      )}
                    </h3>
                    <p className="text-[#4A5568] text-sm mt-1">
                      {task.description}
                    </p>
                  </div>

                  {task.status === "todo" && (
                    <button
                      onClick={() => snoozeTask(task.id)}
                      className="text-[#4A5568] hover:text-[#0A6ED1] text-sm"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                      task.category
                    )}`}
                  >
                    {task.category}
                  </span>

                  {task.status !== "done" && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${dueDateInfo.className}`}
                    >
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {dueDateInfo.text}
                    </span>
                  )}

                  <span className="text-xs text-[#4A5568] flex items-center gap-1">
                    <Star className="w-3 h-3" />+{task.points} XP
                  </span>

                  {task.status === "done" && task.completedAt && (
                    <span className="text-xs text-[#2BA84A]">
                      Completed {new Date(task.completedAt).toLocaleDateString()}
                    </span>
                  )}

                  {task.status === "snoozed" && (
                    <span className="text-xs text-[#F59E0B]">Snoozed</span>
                  )}

                  {/* Edit/Delete */}
                  <button
                    onClick={() =>
                      editTask(task.id, { title: task.title + " (Edited)" })
                    }
                    className="text-xs text-blue-600 hover:underline ml-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() =>
          user &&
          addTask({
            user_id: user.id,
            title: "New Task",
            description: "Created from Checklist",
            category: "General",
            dueDate: new Date().toISOString(),
            points: 10,
            isMandatory: false,
            status: "todo",
          })
        }
        className="mt-6 text-xs text-[#0A6ED1] hover:underline"
      >
        + Add Task
      </button>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <CheckSquare className="w-16 h-16 text-[#D6D9E0] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#4A5568] mb-2">
            No tasks found
          </h3>
          <p className="text-[#4A5568]">
            Try adjusting your filters or search terms
          </p>
        </div>
      )}
    </div>
  );
};
