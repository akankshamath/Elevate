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

const agentTools = [
  {
    type: "function",
    function: {
      name: "get_user_tasks",
      description: "Retrieve all tasks for the current user including pending, completed, and overdue items",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "complete_task",
      description: "Mark a task as completed and award XP to the user",
      parameters: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            description: "The unique identifier of the task to complete"
          }
        },
        required: ["taskId"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_user_profile",
      description: "Get user profile information including role, department, level, and XP",
      parameters: {
        type: "object",
        properties: {},
        required: []
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_learning_plan",
      description: "Create a personalized learning plan based on user's role and current skill gaps",
      parameters: {
        type: "object",
        properties: {
          focus_area: {
            type: "string",
            description: "The main area to focus learning on (e.g., 'technical', 'leadership', 'domain-specific')"
          },
          timeframe: {
            type: "string",
            description: "Timeline for the learning plan (e.g., '1 month', '3 months', '6 months')"
          }
        },
        required: ["focus_area"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "analyze_performance_trends",
      description: "Analyze user's performance patterns over time to identify trends, bottlenecks, and improvement opportunities",
      parameters: {
        type: "object",
        properties: {
          time_period: {
            type: "string",
            description: "Time period to analyze (e.g., '30 days', '90 days', '6 months')",
            default: "30 days"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_skill_gap_analysis",
      description: "Compare user's current skills with role requirements and industry standards",
      parameters: {
        type: "object",
        properties: {
          target_role: {
            type: "string",
            description: "Role to compare against (e.g., 'Senior Engineer', 'Product Manager')"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "create_action_plan",
      description: "Generate a specific, time-bound action plan with concrete steps and deadlines",
      parameters: {
        type: "object",
        properties: {
          goal: {
            type: "string",
            description: "The specific goal to create a plan for"
          },
          timeframe: {
            type: "string",
            description: "Deadline for achieving the goal"
          },
          priority_level: {
            type: "string",
            enum: ["high", "medium", "low"],
            description: "Priority level for this goal"
          }
        },
        required: ["goal"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_peer_benchmarks",
      description: "Compare user's performance against peers in similar roles/departments",
      parameters: {
        type: "object",
        properties: {
          comparison_type: {
            type: "string",
            enum: ["department", "role", "level", "company"],
            description: "Type of peer comparison to perform"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "predict_career_outcomes",
      description: "Use current trajectory to predict likely career outcomes and suggest optimizations",
      parameters: {
        type: "object",
        properties: {
          projection_years: {
            type: "number",
            description: "Number of years to project into the future",
            default: 2
          }
        }
      }
    }
  }
];

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
        data: {
          all_tasks: tasks,
          pending_tasks: pending,
          completed_tasks: completed,
          overdue_tasks: overdue,
          total_count: tasks.length,
          pending_count: pending.length,
          completed_count: completed.length,
          overdue_count: overdue.length,
          next_deadline: pending[0]?.due_date,
          total_xp_earned: completed.reduce((sum, t) => sum + (t.points || 0), 0)
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
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
        return { success: false, message: "Task not found or access denied" };
      }

      if (task.status === 'done') {
        return { success: false, message: "Task is already completed" };
      }

      const { error: updateError } = await supabase
        .from('tasks')
        .update({ 
          status: 'done',
          completed_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      await supabase
        .from('users')
        .update({ current_xp: supabase.raw(`current_xp + ${task.points || 10}`) })
        .eq('id', userId);

      return {
        success: true,
        task_completed: task.title,
        xp_earned: task.points || 10,
        message: `Successfully completed "${task.title}" and earned ${task.points || 10} XP!`
      };
    } catch (error) {
      return { 
        success: false, 
        message: `Failed to complete task: ${error.message}` 
      };
    }
  }

  static async getUserProfile(userId) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      return {
        success: true,
        profile: {
          name: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
          department: user.department,
          manager: user.manager_name,
          level: user.level,
          current_xp: user.current_xp,
          streak_days: user.streak_days,
          employee_id: user.employee_id
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  static async createLearningPlan(userId, focusArea, timeframe = '3 months') {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile.success) {
        return { success: false, message: "Could not retrieve user profile" };
      }

      const { role, department, level } = userProfile.profile;
      
      const learningPlans = {
        technical: {
          Engineering: [
            'Advanced System Design',
            'Cloud Architecture Patterns', 
            'Performance Optimization',
            'Security Best Practices'
          ],
          Product: [
            'Data Analysis & SQL',
            'A/B Testing Frameworks',
            'API Design Principles',
            'Technical Product Management'
          ],
          Design: [
            'Design Systems Architecture',
            'Prototyping with Code',
            'Accessibility Standards',
            'Design Ops & Tooling'
          ]
        },
        leadership: {
          Engineering: [
            'Technical Leadership',
            'Code Review Best Practices',
            'Mentoring Junior Developers',
            'Engineering Management'
          ],
          Product: [
            'Product Strategy',
            'Stakeholder Management',
            'Cross-functional Leadership',
            'OKRs & Goal Setting'
          ],
          Design: [
            'Design Leadership',
            'Design Critique Facilitation',
            'Creative Direction',
            'Design Team Management'
          ]
        }
      };

      const skills = learningPlans[focusArea]?.[department] || [
        'Communication Skills',
        'Project Management',
        'Problem Solving',
        'Team Collaboration'
      ];

      return {
        success: true,
        learning_plan: {
          focus_area: focusArea,
          timeframe: timeframe,
          target_role: role,
          department: department,
          recommended_skills: skills,
          weekly_time_commitment: '3-5 hours',
          milestones: skills.map((skill, idx) => ({
            week: (idx + 1) * 3,
            skill: skill,
            deliverable: `Complete ${skill} assessment and practice project`
          }))
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to create learning plan: ${error.message}`
      };
    }
  }
}
class EnhancedTaskService extends TaskService {
  static async analyzePerformanceTrends(userId, timePeriod = '30 days') {
    try {
      const daysBack = this.parsePeriodToDays(timePeriod);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data: recentTasks, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .order('completed_at', { ascending: true });

      if (error) throw error;

      const completed = recentTasks.filter(t => t.status === 'done');
      const overdue = recentTasks.filter(t => 
        t.status === 'todo' && new Date(t.due_date) < new Date()
      );

      // Calculate trends
      const completionRate = (completed.length / recentTasks.length) * 100;
      const avgCompletionTime = this.calculateAvgCompletionTime(completed);
      const overdueRate = (overdue.length / recentTasks.length) * 100;

      // Identify patterns
      const categoryPerformance = this.analyzeByCategory(recentTasks);
      const weeklyTrends = this.calculateWeeklyTrends(completed);

      return {
        success: true,
        analysis: {
          period: timePeriod,
          completion_rate: Math.round(completionRate),
          average_completion_time_hours: avgCompletionTime,
          overdue_rate: Math.round(overdueRate),
          total_xp_earned: completed.reduce((sum, t) => sum + (t.points || 0), 0),
          category_performance: categoryPerformance,
          weekly_trends: weeklyTrends,
          insights: this.generateInsights(completionRate, overdueRate, categoryPerformance)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getSkillGapAnalysis(userId, targetRole) {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile.success) throw new Error("Cannot get user profile");

      const currentRole = userProfile.profile.role;
      const department = userProfile.profile.department;

      // Define skill requirements by role
      const roleRequirements = {
        'Senior Engineer': {
          technical: ['System Design', 'Cloud Architecture', 'Performance Optimization', 'Security'],
          soft: ['Technical Leadership', 'Mentoring', 'Code Review', 'Architecture Decisions'],
          experience_years: 5
        },
        'Product Manager': {
          technical: ['Data Analysis', 'A/B Testing', 'API Understanding', 'Technical Writing'],
          soft: ['Stakeholder Management', 'Product Strategy', 'User Research', 'Roadmap Planning'],
          experience_years: 3
        },
        'Engineering Manager': {
          technical: ['System Architecture', 'Code Quality', 'DevOps', 'Security'],
          soft: ['People Management', 'Strategic Planning', 'Budget Management', 'Hiring'],
          experience_years: 7
        }
      };

      const requirements = roleRequirements[targetRole] || roleRequirements['Senior Engineer'];
      
      // Analyze user's completed tasks to infer current skills
      const { data: userTasks } = await supabase
        .from('tasks')
        .select('title, category, points')
        .eq('user_id', userId)
        .eq('status', 'done');

      const currentSkills = this.inferSkillsFromTasks(userTasks || []);
      const gaps = this.identifySkillGaps(currentSkills, requirements);

      return {
        success: true,
        analysis: {
          current_role: currentRole,
          target_role: targetRole,
          current_skills: currentSkills,
          required_skills: requirements,
          skill_gaps: gaps,
          readiness_score: this.calculateReadinessScore(currentSkills, requirements),
          recommendations: this.generateSkillRecommendations(gaps)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async createActionPlan(userId, goal, timeframe, priorityLevel = 'medium') {
    try {
      const userProfile = await this.getUserProfile(userId);
      const tasks = await this.getUserTasks(userId);
      
      if (!userProfile.success || !tasks.success) {
        throw new Error("Cannot retrieve user data");
      }

      // Parse timeframe to deadline
      const deadline = this.parseTimeframeToDate(timeframe);
      const weeksAvailable = this.calculateWeeksUntil(deadline);

      // Generate specific action steps based on goal
      const actionSteps = this.generateActionSteps(goal, weeksAvailable, userProfile.profile);
      
      return {
        success: true,
        action_plan: {
          goal: goal,
          deadline: deadline.toISOString(),
          priority: priorityLevel,
          estimated_effort_hours: this.estimateEffortHours(actionSteps),
          weekly_commitment: Math.ceil(this.estimateEffortHours(actionSteps) / weeksAvailable),
          action_steps: actionSteps,
          milestones: this.createMilestones(actionSteps, deadline),
          success_metrics: this.defineSuccessMetrics(goal),
          potential_blockers: this.identifyPotentialBlockers(goal, userProfile.profile)
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getPeerBenchmarks(userId, comparisonType = 'role') {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile.success) throw new Error("Cannot get user profile");

      const { role, department, level } = userProfile.profile;
      
      // Build comparison criteria
      let whereClause = {};
      switch (comparisonType) {
        case 'role':
          whereClause.role = role;
          break;
        case 'department':
          whereClause.department = department;
          break;
        case 'level':
          whereClause.level = level;
          break;
        default:
          whereClause = {}; // Company-wide
      }

      // Get peer data (excluding current user)
      const { data: peers, error } = await supabase
        .from('users')
        .select('current_xp, level, streak_days')
        .neq('id', userId)
        .match(whereClause);

      if (error) throw error;

      // Calculate benchmarks
      const userXP = userProfile.profile.current_xp;
      const userStreak = userProfile.profile.streak_days;

      const benchmarks = this.calculateBenchmarks(peers, userXP, userStreak);

      return {
        success: true,
        benchmarks: {
          comparison_type: comparisonType,
          peer_count: peers.length,
          user_xp_percentile: benchmarks.xpPercentile,
          user_streak_percentile: benchmarks.streakPercentile,
          average_peer_xp: benchmarks.avgXP,
          average_peer_streak: benchmarks.avgStreak,
          top_performer_xp: benchmarks.topXP,
          performance_rating: benchmarks.rating,
          improvement_opportunities: benchmarks.opportunities
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async predictCareerOutcomes(userId, projectionYears = 2) {
    try {
      const profile = await this.getUserProfile(userId);
      const performance = await this.analyzePerformanceTrends(userId, '90 days');
      
      if (!profile.success || !performance.success) {
        throw new Error("Cannot retrieve analysis data");
      }

      const currentRole = profile.profile.role;
      const currentLevel = profile.profile.level;
      const completionRate = performance.analysis.completion_rate;
      const xpRate = performance.analysis.total_xp_earned / 90; // XP per day

      // Career progression predictions based on performance
      const projections = this.calculateCareerProjections(
        currentRole,
        currentLevel,
        completionRate,
        xpRate,
        projectionYears
      );

      return {
        success: true,
        predictions: {
          projection_years: projectionYears,
          current_trajectory: projections.trajectory,
          likely_promotions: projections.promotions,
          expected_skill_level: projections.skillLevel,
          potential_roles: projections.potentialRoles,
          optimization_suggestions: projections.optimizations,
          confidence_score: projections.confidence
        }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  static parsePeriodToDays(period) {
    const match = period.match(/(\d+)\s*(day|week|month)/);
    if (!match) return 30;
    
    const [, num, unit] = match;
    const multipliers = { day: 1, week: 7, month: 30 };
    return parseInt(num) * (multipliers[unit] || 30);
  }

  static calculateAvgCompletionTime(completedTasks) {
    if (completedTasks.length === 0) return 0;
    
    const totalHours = completedTasks.reduce((sum, task) => {
      const created = new Date(task.created_at);
      const completed = new Date(task.completed_at);
      return sum + (completed - created) / (1000 * 60 * 60); // Convert to hours
    }, 0);
    
    return Math.round(totalHours / completedTasks.length);
  }

  static analyzeByCategory(tasks) {
    const categories = {};
    
    tasks.forEach(task => {
      const cat = task.category || 'General';
      if (!categories[cat]) {
        categories[cat] = { total: 0, completed: 0, overdue: 0 };
      }
      
      categories[cat].total++;
      if (task.status === 'done') categories[cat].completed++;
      if (task.status === 'todo' && new Date(task.due_date) < new Date()) {
        categories[cat].overdue++;
      }
    });

    // Calculate completion rates
    Object.keys(categories).forEach(cat => {
      const data = categories[cat];
      data.completion_rate = Math.round((data.completed / data.total) * 100);
    });

    return categories;
  }

  static generateInsights(completionRate, overdueRate, categoryPerformance) {
    const insights = [];
    
    if (completionRate > 80) {
      insights.push("Excellent completion rate - you're highly productive");
    } else if (completionRate < 50) {
      insights.push("Low completion rate suggests potential time management issues");
    }

    if (overdueRate > 20) {
      insights.push("High overdue rate - consider better deadline planning");
    }

    // Category-specific insights
    const weakestCategory = Object.entries(categoryPerformance)
      .sort((a, b) => a[1].completion_rate - b[1].completion_rate)[0];
    
    if (weakestCategory && weakestCategory[1].completion_rate < 60) {
      insights.push(`${weakestCategory[0]} tasks need attention - lowest completion rate`);
    }

    return insights;
  }

  // Additional helper methods would go here...
  // (truncated for brevity - would include implementations for all helper methods)
}

// Enhanced system prompt
const ENHANCED_AGENT_PROMPT = `You are an advanced AI Career Coach with deep analytical capabilities. You can:

CORE CAPABILITIES:
- Analyze performance trends and patterns
- Conduct skill gap analysis
- Create detailed action plans
- Benchmark against peers
- Predict career trajectories

ANALYTICAL APPROACH:
1. Always gather comprehensive data before making recommendations
2. Look for patterns and correlations across different data points
3. Consider both quantitative metrics and qualitative factors
4. Provide specific, actionable insights rather than generic advice
5. Anticipate potential challenges and suggest mitigation strategies

ADVANCED REASONING:
- Connect task completion patterns to skill development opportunities
- Identify hidden bottlenecks in user's workflow
- Recognize signs of burnout or disengagement early
- Suggest proactive career moves based on trend analysis
- Recommend optimal learning paths based on role trajectory

When users ask complex questions, break them down into components, gather relevant data from multiple tools, synthesize insights, and provide comprehensive strategic guidance.

Always explain your reasoning process and the data behind your recommendations.`;

const toolHandlers = {
  get_user_tasks: async (args, userId) => {
    return await TaskService.getUserTasks(userId);
  },
  
  complete_task: async (args, userId) => {
    return await TaskService.completeTask(args.taskId, userId);
  },
  
  get_user_profile: async (args, userId) => {
    return await TaskService.getUserProfile(userId);
  },
  
  create_learning_plan: async (args, userId) => {
    return await TaskService.createLearningPlan(userId, args.focus_area, args.timeframe);
  },
  analyze_performance_trends: async (args, userId) => {
    return await EnhancedTaskService.analyzePerformanceTrends(userId, args.time_period);
  },
  get_skill_gap_analysis: async (args, userId) => {
    return await EnhancedTaskService.getSkillGapAnalysis(userId, args.target_role);
  },
  create_action_plan: async (args, userId) => {
    return await EnhancedTaskService.createActionPlan(userId, args.goal, args.timeframe, args.priority_level);
  },
  get_peer_benchmarks: async (args, userId) => {
    return await EnhancedTaskService.getPeerBenchmarks(userId, args.comparison_type);
  },
  predict_career_outcomes: async (args, userId) => {
    return await EnhancedTaskService.predictCareerOutcomes(userId, args.projection_years);
  }
};


app.post("/api/chat", async (req, res) => {
  try {
    const { messages, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        response: "Please log in to continue using the career coach." 
      });
    }

    console.log(`AI Agent request from user: ${userId}`);
    console.log(`Message: ${messages[messages.length - 1]?.content}`);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: ENHANCED_AGENT_PROMPT },
        ...messages
      ],
      tools: agentTools,
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1000
    });

    const assistantMessage = completion.choices[0].message;
    
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`AI Agent making ${assistantMessage.tool_calls.length} tool calls`);
      
      let toolResults = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function.name;
        let args = {};
        
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          console.error('Error parsing tool arguments:', e);
        }
        
        console.log(`Executing tool: ${toolName}`, args);
        
        if (toolHandlers[toolName]) {
          const result = await toolHandlers[toolName](args, userId);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: toolName,
            content: JSON.stringify(result)
          });
        }
      }
      
      const finalCompletion = await openai.chat.completions.create({
        model: "gpt-4o", 
        messages: [
          { role: "system", content: ENHANCED_AGENT_PROMPT },
          ...messages,
          assistantMessage,
          ...toolResults
        ],
        temperature: 0.7,
        max_tokens: 1000
      });
      
      const finalResponse = finalCompletion.choices[0].message.content;
      console.log(`AI Agent final response: ${finalResponse.substring(0, 100)}...`);
      
      return res.json({ response: finalResponse });
    }
    
    const directResponse = assistantMessage.content;
    console.log(`AI Agent direct response: ${directResponse.substring(0, 100)}...`);
    
    return res.json({ response: directResponse });

  } catch (error) {
    console.error("AI Agent error:", error);
    return res.status(500).json({
      response: "I encountered a technical issue. Please try again in a moment."
    });
  }
});


app.get('/api/tasks/:userId', async (req, res) => {
  try {
    const result = await TaskService.getUserTasks(req.params.userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/tasks/complete', async (req, res) => {
  try {
    const { taskId, userId } = req.body;
    const result = await TaskService.completeTask(taskId, userId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


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
    status: 'True AI Career Coach Agent Running',
    timestamp: new Date().toISOString(),
    version: '3.0 - Full AI Agent',
    capabilities: [
      'Intelligent task analysis and recommendations',
      'Personalized learning plan creation', 
      'Dynamic career guidance',
      'Contextual progress tracking',
      'Proactive coaching suggestions'
    ]
  });
});

app.listen(port, () => {
  console.log(`AI Career Coach Agent running on http://localhost:${port}`);
  console.log(`Using GPT-4 with function calling for intelligent responses`);
  console.log(`Agent capabilities enabled`);
});