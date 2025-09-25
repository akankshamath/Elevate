import React, { useState } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight, Star, Brain, Search } from 'lucide-react';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category: string;
  difficulty: 1 | 2 | 3;
  tags: string[];
}

interface FlashcardSet {
  id: string;
  title: string;
  description: string;
  category: string;
  cards: Flashcard[];
  xpReward: number;
}

// --- Flashcard Sets with extra questions ---
const mockFlashcardSets: FlashcardSet[] = [
  {
    id: '1',
    title: 'Company Policies & Procedures',
    description: 'Essential company policies every employee should know',
    category: 'HR',
    xpReward: 50,
    cards: [
      {
        id: '1-1',
        question: "What is our company's policy on remote work?",
        answer: 'Employees can work remotely up to 3 days per week with manager approval. Full remote work requires special arrangement.',
        category: 'HR',
        difficulty: 1,
        tags: ['remote work', 'policy']
      },
      {
        id: '1-2',
        question: 'How many vacation days do new employees get?',
        answer: 'New employees receive 15 vacation days per year, increasing to 20 days after 3 years of service.',
        category: 'HR',
        difficulty: 1,
        tags: ['vacation', 'benefits']
      },
      {
        id: '1-3',
        question: 'What is the process for requesting time off?',
        answer: 'Submit requests through the HR portal at least 2 weeks in advance. Manager approval is required for all time off.',
        category: 'HR',
        difficulty: 1,
        tags: ['time off', 'process']
      },
      {
        id: '1-4',
        question: 'What is the company’s dress code policy?',
        answer: 'Business casual attire Monday–Thursday. Fridays are casual with jeans permitted.',
        category: 'HR',
        difficulty: 1,
        tags: ['dress code']
      },
      {
        id: '1-5',
        question: 'How are performance reviews conducted?',
        answer: 'Reviews are held annually and include self-assessment, manager feedback, and a career growth plan.',
        category: 'HR',
        difficulty: 2,
        tags: ['performance review']
      }
    ]
  },
  {
    id: '2',
    title: 'Security Best Practices',
    description: 'Critical security knowledge for protecting company data',
    category: 'Security',
    xpReward: 75,
    cards: [
      {
        id: '2-1',
        question: 'What makes a strong password?',
        answer: 'At least 12 characters with a mix of uppercase, lowercase, numbers, and symbols. Use unique passwords for each account.',
        category: 'Security',
        difficulty: 2,
        tags: ['password', 'security']
      },
      {
        id: '2-2',
        question: 'How should you handle suspicious emails?',
        answer: 'Never click links or download attachments. Report to IT security immediately.',
        category: 'Security',
        difficulty: 2,
        tags: ['phishing', 'email']
      },
      {
        id: '2-3',
        question: 'What is two-factor authentication (2FA)?',
        answer: 'An extra security layer requiring two forms of verification: something you know (password) and something you have (phone/token).',
        category: 'Security',
        difficulty: 2,
        tags: ['2FA']
      },
      {
        id: '2-4',
        question: 'What should you do if you lose your company laptop?',
        answer: 'Report immediately to IT security and your manager. The device will be remotely locked and tracked.',
        category: 'Security',
        difficulty: 2,
        tags: ['device', 'incident']
      },
      {
        id: '2-5',
        question: 'What is phishing and how do you recognize it?',
        answer: 'Phishing tries to steal data via fake messages. Signs include misspellings, urgent tone, and suspicious links.',
        category: 'Security',
        difficulty: 2,
        tags: ['phishing']
      }
    ]
  },
  {
    id: '3',
    title: 'Product Knowledge',
    description: 'Key facts about our products and services',
    category: 'Product',
    xpReward: 60,
    cards: [
      {
        id: '3-1',
        question: 'What is our main product offering?',
        answer: 'We provide cloud-based enterprise software solutions that help businesses streamline operations.',
        category: 'Product',
        difficulty: 1,
        tags: ['product']
      },
      {
        id: '3-2',
        question: 'Who are our primary target customers?',
        answer: 'Mid to large-size enterprises in manufacturing, healthcare, and financial services.',
        category: 'Product',
        difficulty: 2,
        tags: ['customers']
      },
      {
        id: '3-3',
        question: 'What sets us apart from competitors?',
        answer: 'Our AI analytics, 99.9% uptime guarantee, and customer success team.',
        category: 'Product',
        difficulty: 2,
        tags: ['advantage']
      },
      {
        id: '3-4',
        question: 'How does our product pricing model work?',
        answer: 'Subscription-based, billed monthly or annually, with enterprise discounts.',
        category: 'Product',
        difficulty: 2,
        tags: ['pricing']
      },
      {
        id: '3-5',
        question: 'What is our uptime SLA?',
        answer: 'We guarantee 99.9% uptime with 24/7 monitoring and automatic failover systems.',
        category: 'Product',
        difficulty: 2,
        tags: ['SLA']
      }
    ]
  },
  {
    id: '4',
    title: 'Leadership Fundamentals',
    description: 'Essential leadership skills for career growth',
    category: 'Leadership',
    xpReward: 80,
    cards: [
      {
        id: '4-1',
        question: 'What are key qualities of an effective leader?',
        answer: 'Integrity, empathy, communication, decision-making, and ability to inspire others.',
        category: 'Leadership',
        difficulty: 2,
        tags: ['qualities']
      },
      {
        id: '4-2',
        question: 'How do you handle conflict in a team?',
        answer: 'Address conflicts early, listen to all parties, focus on issues not personalities, and find common ground.',
        category: 'Leadership',
        difficulty: 2,
        tags: ['conflict']
      },
      {
        id: '4-3',
        question: 'What is the difference between management and leadership?',
        answer: 'Management focuses on processes and systems. Leadership focuses on vision, inspiration, and people.',
        category: 'Leadership',
        difficulty: 2,
        tags: ['difference']
      },
      {
        id: '4-4',
        question: 'How do you motivate team members?',
        answer: 'Understand individual motivations, provide clear goals, offer recognition, and create growth opportunities.',
        category: 'Leadership',
        difficulty: 2,
        tags: ['motivation']
      },
      {
        id: '4-5',
        question: 'How do leaders build trust?',
        answer: 'By being transparent, consistent, and showing empathy.',
        category: 'Leadership',
        difficulty: 2,
        tags: ['trust']
      }
    ]
  },
  {
    id: '5',
    title: 'Communication Excellence',
    description: 'Master professional communication skills',
    category: 'Communication',
    xpReward: 65,
    cards: [
      {
        id: '5-1',
        question: 'What are key elements of effective communication?',
        answer: 'Clear message, active listening, empathy, feedback, and adapting style to the audience.',
        category: 'Communication',
        difficulty: 1,
        tags: ['elements']
      },
      {
        id: '5-2',
        question: 'How do you give constructive feedback?',
        answer: 'Be specific, focus on behavior not personality, use examples, and create a safe environment.',
        category: 'Communication',
        difficulty: 2,
        tags: ['feedback']
      },
      {
        id: '5-3',
        question: 'What is active listening?',
        answer: 'Fully concentrating on the speaker, understanding, responding thoughtfully, and remembering key points.',
        category: 'Communication',
        difficulty: 1,
        tags: ['listening']
      },
      {
        id: '5-4',
        question: 'How do you handle difficult conversations?',
        answer: 'Prepare, stay calm, listen actively, acknowledge emotions, and focus on solutions.',
        category: 'Communication',
        difficulty: 3,
        tags: ['conflict']
      },
      {
        id: '5-5',
        question: 'What role does body language play?',
        answer: 'It reinforces or contradicts spoken words through posture, eye contact, and gestures.',
        category: 'Communication',
        difficulty: 2,
        tags: ['body language']
      }
    ]
  },
  {
    id: '6',
    title: 'Time Management & Productivity',
    description: 'Optimize time and boost productivity',
    category: 'Productivity',
    xpReward: 55,
    cards: [
      {
        id: '6-1',
        question: 'What is the Eisenhower Matrix?',
        answer: 'A tool categorizing tasks into Do, Schedule, Delegate, and Eliminate.',
        category: 'Productivity',
        difficulty: 2,
        tags: ['matrix']
      },
      {
        id: '6-2',
        question: 'How do you avoid procrastination?',
        answer: 'Break tasks down, set deadlines, eliminate distractions, use time-blocking.',
        category: 'Productivity',
        difficulty: 2,
        tags: ['procrastination']
      },
      {
        id: '6-3',
        question: 'What is the Pomodoro Technique?',
        answer: '25-minute focused work sessions followed by 5-minute breaks.',
        category: 'Productivity',
        difficulty: 1,
        tags: ['pomodoro']
      },
      {
        id: '6-4',
        question: 'How do you manage multiple priorities?',
        answer: 'List tasks, assess urgency, delegate, and adjust regularly.',
        category: 'Productivity',
        difficulty: 2,
        tags: ['priorities']
      },
      {
        id: '6-5',
        question: 'What is time-blocking?',
        answer: 'Scheduling specific blocks of time for focused work on tasks.',
        category: 'Productivity',
        difficulty: 2,
        tags: ['time-blocking']
      }
    ]
  }
];

export const Flashcards: React.FC = () => {
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correctCards, setCorrectCards] = useState<Set<string>>(new Set());
  const [wrongCards, setWrongCards] = useState<Set<string>>(new Set());
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecap, setShowRecap] = useState(false);

  const triggerXpGain = useGameStore(state => state.triggerXpGain);
  const { user, updateUser } = useAuthStore();

  const markCardCorrect = () => {
    if (selectedSet) {
      const cardId = selectedSet.cards[currentCardIndex].id;
      setCorrectCards(prev => new Set([...prev, cardId]));
      setWrongCards(prev => {
        const updated = new Set(prev);
        updated.delete(cardId);
        return updated;
      });
    }
  };

  const markCardWrong = () => {
    if (selectedSet) {
      const cardId = selectedSet.cards[currentCardIndex].id;
      setWrongCards(prev => new Set([...prev, cardId]));
      setCorrectCards(prev => {
        const updated = new Set(prev);
        updated.delete(cardId);
        return updated;
      });
    }
  };

  const nextCard = () => {
    if (selectedSet && currentCardIndex < selectedSet.cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    } else if (selectedSet) {
      handleSetComplete();
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleSetComplete = () => {
    if (selectedSet && user) {
      const newXp = user.currentXp + selectedSet.xpReward;
      const newLevel = Math.floor(newXp / 150) + 1;
      updateUser({ currentXp: newXp, level: Math.max(newLevel, user.level) });
      setTimeout(() => {
        triggerXpGain(selectedSet.xpReward);
      }, 100);
    }
    setShowRecap(true);
  };

  const filteredSets = mockFlashcardSets.filter(set => {
    const matchesCategory = categoryFilter === 'all' || set.category === categoryFilter;
    const matchesSearch = set.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         set.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [...new Set(mockFlashcardSets.map(s => s.category))];

  if (showRecap && selectedSet) {
    const correct = selectedSet.cards.filter(card => correctCards.has(card.id));
    const wrong = selectedSet.cards.filter(card => wrongCards.has(card.id));

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Recap for {selectedSet.title}</h1>

        <div className="mb-6">
          <h2 className="text-lg font-semibold text-green-600 mb-2">✅ Things you got right</h2>
          {correct.length > 0 ? (
            <ul className="list-disc ml-6 space-y-2">
              {correct.map(card => (
                <li key={card.id}>
                  <span className="font-medium">{card.question}</span> — {card.answer}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No correct answers this time.</p>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-red-600 mb-2">❌ Things to review</h2>
          {wrong.length > 0 ? (
            <ul className="list-disc ml-6 space-y-2">
              {wrong.map(card => (
                <li key={card.id}>
                  <span className="font-medium">{card.question}</span> — {card.answer}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Great job — nothing to review!</p>
          )}
        </div>

        <button
          onClick={() => {
            setSelectedSet(null);
            setShowRecap(false);
            setCorrectCards(new Set());
            setWrongCards(new Set());
            setCurrentCardIndex(0);
          }}
          className="mt-8 bg-[#0A6ED1] text-white px-6 py-3 rounded-xl hover:bg-[#0859ab]"
        >
          Back to Flashcard Sets
        </button>
      </div>
    );
  }

  if (selectedSet) {
    const currentCard = selectedSet.cards[currentCardIndex];
    const progress = ((currentCardIndex + 1) / selectedSet.cards.length) * 100;

    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => setSelectedSet(null)}
            className="text-[#0A6ED1] hover:underline"
          >
            ← Back
          </button>
          <div className="text-sm text-[#4A5568]">
            Progress: {currentCardIndex + 1}/{selectedSet.cards.length}
          </div>
        </div>

        <div
          className="bg-white rounded-2xl shadow p-8 min-h-[250px] flex items-center justify-center cursor-pointer mb-6"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {!isFlipped ? (
            <div className="text-center">
              <Brain className="w-10 h-10 text-[#0A6ED1] mx-auto mb-4" />
              <h2 className="text-lg font-bold mb-2">Question</h2>
              <p>{currentCard.question}</p>
            </div>
          ) : (
            <div className="text-center">
              <Star className="w-10 h-10 text-[#FFD23F] mx-auto mb-4" />
              <h2 className="text-lg font-bold mb-2">Answer</h2>
              <p>{currentCard.answer}</p>
            </div>
          )}
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={prevCard}
            disabled={currentCardIndex === 0}
            className="px-4 py-2 border rounded-xl disabled:opacity-50"
          >
            <ChevronLeft className="w-4 h-4 inline" /> Prev
          </button>

          {isFlipped && (
            <div className="flex gap-2">
              <button
                onClick={markCardCorrect}
                className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700"
              >
                Got it 👍
              </button>
              <button
                onClick={markCardWrong}
                className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
              >
                Review Again 👀
              </button>
            </div>
          )}

          <button
            onClick={nextCard}
            className="px-4 py-2 bg-[#0A6ED1] text-white rounded-xl hover:bg-[#0859ab]"
          >
            {currentCardIndex === selectedSet.cards.length - 1 ? 'Complete Set' : 'Next'} <ChevronRight className="w-4 h-4 inline" />
          </button>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2 mt-6">
          <div
            className="bg-[#0A6ED1] h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Flashcards</h1>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search sets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-xl"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border rounded-xl"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSets.map(set => (
          <div key={set.id} className="bg-white shadow rounded-2xl p-6 hover:shadow-lg">
            <h3 className="font-semibold text-lg mb-2">{set.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{set.description}</p>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">+{set.xpReward} XP</span>
              <button
                onClick={() => {
                  setSelectedSet(set);
                  setCurrentCardIndex(0);
                  setCorrectCards(new Set());
                  setWrongCards(new Set());
                }}
                className="px-4 py-2 bg-[#0A6ED1] text-white rounded-xl hover:bg-[#0859ab]"
              >
                Start Set
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
