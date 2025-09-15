// src/components/chat/ChatBot.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const botResponses = {
  greeting: [
    "Hi there! I'm your AI Career Coach. How can I help you today?",
    "Hello! I'm here to support your learning journey. What would you like to know?",
    "Welcome! I'm your personal AI assistant. How can I assist you?"
  ],
  progress: [
    "You're making great progress! You've completed several modules and are building a solid foundation.",
    "Your learning streak is impressive! Keep up the consistent effort.",
    "Based on your current level, I recommend focusing on the Leadership Fundamentals module next."
  ],
  modules: [
    "I recommend starting with 'Company Values & Culture' - it's perfect for new employees and will give you 150 XP!",
    "The 'Information Security Basics' module is mandatory and worth 200 XP. It's a great next step!",
    "For skill development, try 'Communication Skills' - it's highly rated and will boost your professional growth."
  ],
  policies: [
    "Our remote work policy allows up to 3 days per week with manager approval. Would you like more details?",
    "New employees get 15 vacation days per year, increasing to 20 after 3 years of service.",
    "For time off requests, submit through the HR portal at least 2 weeks in advance."
  ],
  benefits: [
    "We offer comprehensive health insurance, dental, vision, and a 401k with company matching.",
    "Don't forget about our learning stipend - $1000 per year for professional development!",
    "We have flexible work arrangements, wellness programs, and employee assistance programs."
  ],
  tips: [
    "Try to maintain a daily learning streak - even 10 minutes a day makes a big difference!",
    "Join study groups with your colleagues to make learning more engaging and social.",
    "Set small, achievable goals each week to stay motivated and track your progress."
  ],
  default: [
    "That's a great question! Let me help you with that.",
    "I'm here to help! Could you be more specific about what you'd like to know?",
    "I'd be happy to assist you. Can you tell me more about what you're looking for?"
  ]
};

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hi! I'm your AI Career Coach. I can help you with your learning journey, company policies, benefits, and provide personalized recommendations. What would you like to know?",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useAuthStore(state => state.user);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getRandomResponse = (category: keyof typeof botResponses) => {
    const responses = botResponses[category];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const generateBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase();
    
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return getRandomResponse('greeting');
    }
    if (message.includes('progress') || message.includes('level') || message.includes('xp')) {
      return getRandomResponse('progress');
    }
    if (message.includes('module') || message.includes('course') || message.includes('learn') || message.includes('recommend')) {
      return getRandomResponse('modules');
    }
    if (message.includes('policy') || message.includes('remote') || message.includes('vacation') || message.includes('time off')) {
      return getRandomResponse('policies');
    }
    if (message.includes('benefit') || message.includes('insurance') || message.includes('401k') || message.includes('health')) {
      return getRandomResponse('benefits');
    }
    if (message.includes('tip') || message.includes('advice') || message.includes('help') || message.includes('how')) {
      return getRandomResponse('tips');
    }

    if (user) {
      if (message.includes('my progress')) {
        return `Hi ${user.firstName}! You're currently at Level ${user.level} with ${user.currentXp.toLocaleString()} XP. You have a ${user.streakDays}-day learning streak - that's fantastic! Keep up the great work!`;
      }
      if (message.includes('next step') || message.includes('what should i do')) {
        if (user.level < 5) {
          return `${user.firstName}, I recommend completing the 'Company Values & Culture' module next. It's perfect for your current level and will help you understand our company better!`;
        } else {
          return `${user.firstName}, you're ready for more advanced content! Try the 'Leadership Fundamentals' module to develop your leadership skills.`;
        }
      }
    }
    return getRandomResponse('default');
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: generateBotResponse(inputValue),
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-200px)]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex items-start gap-3 ${
              message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.type === 'user' 
                ? 'bg-[#0A6ED1]' 
                : 'bg-[#E8EAF6]'
            }`}>
              {message.type === 'user' ? (
                <User className="w-4 h-4 text-white" />
              ) : (
                <Bot className="w-4 h-4 text-[#0A6ED1]" />
              )}
            </div>
            <div
              className={`max-w-[80%] p-3 rounded-2xl ${
                message.type === 'user'
                  ? 'bg-[#0A6ED1] text-white'
                  : 'bg-[#F5F7FA] text-[#0B2447]'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-blue-100' : 'text-[#4A5568]'
              }`}>
                {message.timestamp.toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-[#E8EAF6] rounded-full flex items-center justify-center">
              <Bot className="w-4 h-4 text-[#0A6ED1]" />
            </div>
            <div className="bg-[#F5F7FA] p-3 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-[#4A5568] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#4A5568] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-[#4A5568] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#D6D9E0]">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything about your learning journey..."
            className="flex-1 px-3 py-2 border border-[#D6D9E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A6ED1] focus:border-transparent resize-none"
            rows={1}
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isTyping}
            className="bg-[#0A6ED1] hover:bg-[#0859ab] text-white p-2 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        
        {/* Quick suggestions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            "What's my progress?",
            "Recommend a module",
            "Company policies",
            "Learning tips"
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => setInputValue(suggestion)}
              className="px-3 py-1 bg-[#E8EAF6] text-[#0A6ED1] rounded-full text-xs hover:bg-[#0A6ED1] hover:text-white transition-colors"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
