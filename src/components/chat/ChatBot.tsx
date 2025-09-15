import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export const ChatBot: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hi! I'm your AI Career Coach powered by OpenAI. I can help you with your learning journey, company policies, career development, and provide personalized recommendations. What would you like to know?",
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

  const callOpenAI = async (userMessage: string): Promise<string> => {
    try {
      // Create user context for personalization
      const userContext = user ? `
        User Profile:
        - Name: ${user.firstName} ${user.lastName}
        - Role: ${user.role}
        - Department: ${user.department}
        - Level: ${user.level}
        - Current XP: ${user.currentXp}
        - Learning Streak: ${user.streakDays} days
        - Manager: ${user.managerName}
      ` : '';

      const systemPrompt = `You are an AI Career Coach for Elevate, a corporate learning and development platform. You help employees with:

1. Learning recommendations and career development
2. Company policies and procedures
3. Professional growth advice
4. Motivation and engagement

Company Context:
- Elevate is a gamified learning platform with XP, levels, and streaks
- Employees complete modules to gain XP and advance levels
- Focus areas: leadership development, technical skills, company culture
- Available modules include: Company Values & Culture, Information Security, Communication Skills, Leadership Fundamentals

${userContext}

Keep responses:
- Professional but friendly
- Concise (2-3 sentences max)
- Actionable and specific
- Personalized when user context is available

If asked about topics outside your scope, politely redirect to relevant resources or HR.`;

      const response = await fetch('http://localhost:3001/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.response || "I'm sorry, I couldn't generate a proper response. Please try again.";
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      return "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or contact IT support if the issue persists.";
    }
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
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    try {
      const aiResponse = await callOpenAI(currentInput);
      
      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: "I apologize, but I'm experiencing technical difficulties. Please try again or contact support if the problem continues.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
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
            placeholder="Ask me anything about your career, learning, or company policies..."
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
            "What should I learn next based on my role?",
            "How can I improve my leadership skills?",
            "What's our remote work policy?",
            "Give me career development tips"
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
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