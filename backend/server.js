const express = require('express');
const OpenAI = require('openai');
const cors = require('cors');
const supabase = require('./supabase');
require('dotenv').config();

const app = express();
const port = 3001;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json());

// ---------------------- TASK SERVICE ----------------------
class TaskService {
  static async getUserTasks(userId) {
    try {
      const { data: tasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .order('due_date', { ascending: true });

      if (error) throw error;

      const now = new Date();
      const pending = tasks.filter(t => t.status === 'todo');
      const completed = tasks.filter(t => t.status === 'done');
      const overdue = pending.filter(t => new Date(t.due_date) < now);

      return {
        success: true,
        tasks: {
          all: tasks,
          pending,
          completed,
          overdue,
          total: tasks.length,
          nextDeadline: pending[0]?.due_date
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        tasks: { all: [], pending: [], completed: [], overdue: [], total: 0 }
      };
    }
  }

  static async completeTask(taskId, userId) {
    try {
      const { data: task, error: fetchError } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .eq('user_id', userId)
        .single();

      if (fetchError || !task) {
        return { success: false, message: "Task not found" };
      }

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          status: 'done',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      // Update user XP
      await supabase
        .from('users')
        .update({ current_xp: supabase.raw(`current_xp + ${task.points || 10}`) })
        .eq('id', userId);

      return {
        success: true,
        message: `Task "${task.title}" completed! +${task.points || 10} XP earned!`,
        pointsEarned: task.points || 10
      };
    } catch (error) {
      return { success: false, message: "Failed to complete task" };
    }
  }

  static formatTasksForDisplay(taskData) {
    if (!taskData.success) {
      return `Sorry, I couldn't load your tasks right now: ${taskData.error}`;
    }

    const { tasks } = taskData;
    let response = "📋 **Your Learning Dashboard**\n\n";

    // Overview
    response += `📊 **Overview:**\n`;
    response += `• Total tasks: ${tasks.total}\n`;
    response += `• Pending: ${tasks.pending.length}\n`;
    response += `• Completed: ${tasks.completed.length}\n`;
    
    const totalXP = tasks.completed.reduce((sum, t) => sum + (t.points || 0), 0);
    response += `• XP earned: ${totalXP} points\n\n`;

    // Overdue tasks
    if (tasks.overdue.length > 0) {
      response += `⚠️ **Overdue (${tasks.overdue.length}):**\n`;
      tasks.overdue.forEach(task => {
        response += `• ${task.title} (Due: ${new Date(task.due_date).toLocaleDateString()})\n`;
      });
      response += "\n";
    }

    // Pending tasks
    if (tasks.pending.length > 0) {
      response += `📝 **Pending Tasks:**\n`;
      tasks.pending.slice(0, 5).forEach(task => {
        const dueDate = new Date(task.due_date).toLocaleDateString();
        const urgent = task.is_mandatory ? "🔴 " : "";
        response += `• ${urgent}${task.title} (Due: ${dueDate}) - ${task.points}pts\n`;
      });
      
      if (tasks.pending.length > 5) {
        response += `...and ${tasks.pending.length - 5} more\n`;
      }
      response += "\n";
    }

    // Next deadline
    if (tasks.nextDeadline) {
      response += `⏰ **Next deadline:** ${new Date(tasks.nextDeadline).toLocaleDateString()}\n`;
    }

    // Motivational message
    if (tasks.pending.length === 0) {
      response += "\n🎉 All caught up! Great work!";
    } else if (tasks.overdue.length > 0) {
      response += "\n💪 Let's tackle those overdue items today!";
    } else {
      response += "\n✨ Keep up the momentum!";
    }

    return response;
  }
}

// ---------------------- AI RESPONSE HANDLER ----------------------
class AIResponseHandler {
  static detectIntent(message) {
    const text = message.toLowerCase();
    
    // Checklist queries
    if (this.matchesAny(text, [
      'checklist', 'tasks', 'todo', 'pending', 'assignments',
      'what should i do', 'show my tasks', 'my progress',
      'dashboard', 'due', 'overdue'
    ])) {
      return 'checklist';
    }

    // Task completion
    if (this.matchesAny(text, [
      'completed', 'finished', 'done with', 'mark complete',
      'i finished', 'i completed'
    ])) {
      return 'complete_task';
    }

    // Learning guidance
    if (this.matchesAny(text, [
      'what should i learn', 'recommend', 'skills', 'career',
      'development', 'training', 'courses'
    ])) {
      return 'learning_guidance';
    }

    return 'general_chat';
  }

  static matchesAny(text, keywords) {
    return keywords.some(keyword => text.includes(keyword));
  }

  static async handleChecklistQuery(userId) {
    const taskData = await TaskService.getUserTasks(userId);
    return TaskService.formatTasksForDisplay(taskData);
  }

  static async handleTaskCompletion(message, userId) {
    // Try to extract task ID from message (you might want to improve this)
    const taskIdMatch = message.match(/task[:\s]+([a-zA-Z0-9-]+)/i);
    if (taskIdMatch) {
      const result = await TaskService.completeTask(taskIdMatch[1], userId);
      return result.message;
    }
    
    return "To complete a task, please provide the task ID like: 'I completed task: abc-123'";
  }

  static async handleLearningGuidance(message, userId) {
    // Get user info for personalized recommendations
    try {
      const { data: user } = await supabase
        .from('users')
        .select('role, department, level')
        .eq('id', userId)
        .single();

      const role = user?.role || 'team member';
      const dept = user?.department || 'general';
      
      const recommendations = {
        'Engineering': [
          'Advanced JavaScript/TypeScript',
          'System Design Fundamentals',
          'Cloud Architecture (AWS/GCP)',
          'Database Optimization'
        ],
        'Product': [
          'Product Strategy & Roadmapping',
          'User Research Methods',
          'Data-Driven Decision Making',
          'Agile Product Management'
        ],
        'Design': [
          'Design Systems',
          'User Experience Research',
          'Prototyping Tools (Figma/Sketch)',
          'Accessibility in Design'
        ]
      };

      const skills = recommendations[dept] || [
        'Leadership & Communication',
        'Project Management',
        'Critical Thinking',
        'Team Collaboration'
      ];

      let response = `🎯 **Learning Recommendations for ${role} in ${dept}:**\n\n`;
      skills.forEach((skill, index) => {
        response += `${index + 1}. ${skill}\n`;
      });
      
      response += `\n💡 **Tips:**\n`;
      response += `• Start with 15-30 minutes daily\n`;
      response += `• Focus on hands-on practice\n`;
      response += `• Join relevant communities\n`;
      response += `• Apply learnings to current projects`;

      return response;
    } catch (error) {
      return "I'd be happy to help with learning recommendations! What specific skills or areas are you interested in developing?";
    }
  }

  static async handleGeneralChat(message) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful AI Career Coach. Provide brief, encouraging responses. If users ask about tasks or checklists, tell them you can help with that - just ask again."
          },
          {
            role: "user", 
            content: message
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      return "I'm here to help with your career and learning questions. Try asking about your tasks, learning recommendations, or any work-related topics!";
    }
  }
}

// ---------------------- MAIN CHAT ENDPOINT ----------------------
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        response: "Please log in to continue using the career coach." 
      });
    }

    const lastMessage = messages[messages.length - 1];
    if (!lastMessage?.content) {
      return res.status(400).json({
        response: "I didn't receive your message. Please try again."
      });
    }

    console.log(`User ${userId}: ${lastMessage.content}`);

    const intent = AIResponseHandler.detectIntent(lastMessage.content);
    console.log(`Detected intent: ${intent}`);

    let response;

    switch (intent) {
      case 'checklist':
        response = await AIResponseHandler.handleChecklistQuery(userId);
        break;
      
      case 'complete_task':
        response = await AIResponseHandler.handleTaskCompletion(lastMessage.content, userId);
        break;
      
      case 'learning_guidance':
        response = await AIResponseHandler.handleLearningGuidance(lastMessage.content, userId);
        break;
      
      default:
        response = await AIResponseHandler.handleGeneralChat(lastMessage.content);
    }

    console.log(`Response: ${response.substring(0, 100)}...`);
    return res.json({ response });

  } catch (error) {
    console.error("Chat error:", error);
    return res.status(500).json({
      response: "I'm experiencing technical difficulties. Please try again in a moment."
    });
  }
});

// ---------------------- REST API ENDPOINTS ----------------------

// Get tasks
app.get('/api/tasks/:userId', async (req, res) => {
  try {
    const taskData = await TaskService.getUserTasks(req.params.userId);
    res.json(taskData);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Complete task
app.post('/api/tasks/complete', async (req, res) => {
  try {
    const { taskId, userId } = req.body;
    const result = await TaskService.completeTask(taskId, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---------------------- USER MANAGEMENT ----------------------

app.post('/api/register', async (req, res) => {
  try {
    const { email, firstName, lastName, employeeId, role } = req.body;

    const employeeData = {
      'E0058': { department: 'Engineering', manager: 'A. Chen' },
      'E0059': { department: 'Product', manager: 'S. Kim' },
      'E0060': { department: 'Design', manager: 'M. Rodriguez' },
    };

    const info = employeeData[employeeId] || {
      department: 'General',
      manager: 'TBD'
    };

    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        email,
        first_name: firstName,
        last_name: lastName,
        employee_id: employeeId,
        role,
        department: info.department,
        manager_name: info.manager,
        current_xp: 0,
        level: 1,
        streak_days: 0,
        intro_completed: false
      }])
      .select()
      .single();

    if (error) {
      return res.status(400).json({ error: 'Registration failed', details: error.message });
    }

    // Create initial tasks
    await supabase.from('tasks').insert([
      {
        user_id: user.id,
        title: 'Complete Security Training',
        category: 'IT',
        due_date: new Date(Date.now() + 7 * 86400000).toISOString(),
        points: 25,
        is_mandatory: true,
        status: 'todo'
      },
      {
        user_id: user.id,
        title: 'Review Company Handbook',
        category: 'HR',
        due_date: new Date(Date.now() + 3 * 86400000).toISOString(),
        points: 15,
        is_mandatory: true,
        status: 'todo'
      },
      {
        user_id: user.id,
        title: 'Set Up Development Environment',
        category: 'Technical',
        due_date: new Date(Date.now() + 5 * 86400000).toISOString(),
        points: 20,
        is_mandatory: false,
        status: 'todo'
      }
    ]);

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email } = req.body;
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'AI Career Coach Server Running',
    timestamp: new Date().toISOString(),
    version: '2.0',
    endpoints: [
      'POST /api/chat - Main AI chat interface',
      'GET /api/tasks/:userId - Get user tasks',
      'POST /api/tasks/complete - Complete a task',
      'POST /api/register - User registration',
      'POST /api/login - User login'
    ]
  });
});

app.listen(port, () => {
  console.log(`🚀 AI Career Coach Server running on http://localhost:${port}`);
  console.log(`📋 Chat endpoint: POST /api/chat`);
  console.log(`🔍 Health check: GET /health`);
});