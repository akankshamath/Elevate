import React, { useState } from 'react';
import { Play, Clock, Star, BookOpen, Filter, Search, ChevronRight, Award } from 'lucide-react';
import { ProgressRing } from '../components/ui/ProgressRing';
import { useGameStore } from '../stores/gameStore';
import { useAuthStore } from '../stores/authStore';

interface Module {
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
    id: '1',
    title: 'Company Values & Culture',
    category: 'Company Values',
    difficulty: 1,
    estimatedMinutes: 45,
    totalLessons: 6,
    xpReward: 150,
    description: 'Learn about our core values, mission, and company culture that drives our success.',
    tags: ['Culture', 'Values', 'Mission'],
    progress: 75,
    lastOpenedAt: '2024-12-10',
    videoUrl: 'https://www.youtube.com/embed/zNbF006Y5x4',
    thumbnail: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '2',
    title: 'Information Security Basics',
    category: 'Compliance',
    difficulty: 2,
    estimatedMinutes: 60,
    totalLessons: 8,
    xpReward: 200,
    description: 'Essential security practices to protect company data and systems.',
    tags: ['Security', 'Compliance', 'Data Protection'],
    progress: 0,
    videoUrl: 'https://www.youtube.com/embed/inWWhr5tnEA',
    thumbnail: 'https://images.pexels.com/photos/60504/security-protection-anti-virus-software-60504.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '3',
    title: 'Product Overview',
    category: 'Product',
    difficulty: 1,
    estimatedMinutes: 30,
    totalLessons: 5,
    xpReward: 120,
    description: 'Comprehensive overview of our products and services.',
    tags: ['Product', 'Overview', 'Features'],
    progress: 25,
    lastOpenedAt: '2024-12-08',
    videoUrl: 'https://www.youtube.com/embed/9No-FiEInLA',
    thumbnail: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '4',
    title: 'Leadership Fundamentals',
    category: 'Leadership',
    difficulty: 3,
    estimatedMinutes: 90,
    totalLessons: 12,
    xpReward: 300,
    description: 'Develop essential leadership skills for career advancement.',
    tags: ['Leadership', 'Management', 'Career Growth'],
    progress: 0,
    videoUrl: 'https://www.youtube.com/embed/VFIuJdwsUzk',
    thumbnail: 'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '5',
    title: 'Communication Skills',
    category: 'Soft Skills',
    difficulty: 2,
    estimatedMinutes: 75,
    totalLessons: 10,
    xpReward: 250,
    description: 'Master effective communication in professional settings.',
    tags: ['Communication', 'Presentation', 'Collaboration'],
    progress: 50,
    lastOpenedAt: '2024-12-09',
    videoUrl: 'https://www.youtube.com/embed/HAnw168huqA',
    thumbnail: 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=400'
  },
  {
    id: '6',
    title: 'Project Management Essentials',
    category: 'Management',
    difficulty: 2,
    estimatedMinutes: 80,
    totalLessons: 9,
    xpReward: 220,
    description: 'Learn project management methodologies and best practices.',
    tags: ['Project Management', 'Agile', 'Planning'],
    progress: 0,
    videoUrl: 'https://www.youtube.com/embed/Unzc731iCUY',
    thumbnail: 'https://images.pexels.com/photos/3277804/pexels-photo-3277804.jpeg?auto=compress&cs=tinysrgb&w=400'
  }
];

export const Modules: React.FC = () => {
  const [modules, setModules] = useState(mockModules);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const triggerXpGain = useGameStore(state => state.triggerXpGain);
  const { user, updateUser } = useAuthStore();

  const handleStartModule = (module: Module) => {
    setSelectedModule(module);
    // Update progress and last opened
    setModules(prev => prev.map(m => 
      m.id === module.id 
        ? { ...m, lastOpenedAt: new Date().toISOString().split('T')[0] }
        : m
    ));
  };

  const handleCompleteModule = (moduleId: string) => {
    const module = modules.find(m => m.id === moduleId);
    if (module) {
      // Update user XP and level
      if (user) {
        const newXp = user.currentXp + module.xpReward;
        const newLevel = Math.floor(newXp / 150) + 1;
        updateUser({ 
          currentXp: newXp,
          level: Math.max(newLevel, user.level)
        });
        
        // Trigger XP gain animation after state update
        setTimeout(() => {
          triggerXpGain(module.xpReward);
        }, 100);
      }
      
      // Mark module as completed
      setModules(prev => prev.map(m => 
        m.id === moduleId ? { ...m, progress: 100 } : m
      ));
      setSelectedModule(null);
    }
  };

  const getDifficultyColor = (difficulty: number) => {
    const colors = {
      1: 'bg-green-50 text-green-700',
      2: 'bg-yellow-50 text-yellow-700',
      3: 'bg-red-50 text-red-700'
    };
    return colors[difficulty as keyof typeof colors];
  };

  const getDifficultyText = (difficulty: number) => {
    const texts = { 1: 'Beginner', 2: 'Intermediate', 3: 'Advanced' };
    return texts[difficulty as keyof typeof texts];
  };

  const filteredModules = modules.filter(module => {
    const matchesCategory = categoryFilter === 'all' || module.category === categoryFilter;
    const matchesDifficulty = difficultyFilter === 'all' || module.difficulty.toString() === difficultyFilter;
    const matchesSearch = module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         module.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesDifficulty && matchesSearch;
  });

  const categories = [...new Set(modules.map(m => m.category))];

  if (selectedModule) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setSelectedModule(null)}
            className="text-[#0A6ED1] hover:underline mb-4"
          >
            ← Back to Modules
          </button>
          <h1 className="text-3xl font-bold text-[#0B2447] mb-2">{selectedModule.title}</h1>
          <p className="text-[#4A5568]">{selectedModule.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-6">
              <div className="aspect-video mb-4">
                <iframe
                  src={selectedModule.videoUrl}
                  title={selectedModule.title}
                  className="w-full h-full rounded-xl"
                  allowFullScreen
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(selectedModule.difficulty)}`}>
                    {getDifficultyText(selectedModule.difficulty)}
                  </span>
                  <span className="text-sm text-[#4A5568] flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedModule.estimatedMinutes} min
                  </span>
                </div>
                <button
                  onClick={() => handleCompleteModule(selectedModule.id)}
                  className="bg-[#0A6ED1] hover:bg-[#0859ab] text-white font-semibold rounded-2xl px-6 py-2 flex items-center gap-2 transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  <Award className="w-4 h-4" />
                  Complete (+{selectedModule.xpReward} XP)
                </button>
              </div>
            </div>
          </div>

          {/* Module Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-6">
              <h3 className="font-semibold text-[#0B2447] mb-4">Module Progress</h3>
              <div className="text-center mb-4">
                <ProgressRing progress={selectedModule.progress} size={80}>
                  <div className="text-center">
                    <div className="text-lg font-bold text-[#0A6ED1]">{selectedModule.progress}%</div>
                  </div>
                </ProgressRing>
              </div>
              <div className="space-y-2 text-sm text-[#4A5568]">
                <div className="flex justify-between">
                  <span>Lessons:</span>
                  <span>{Math.floor(selectedModule.progress / 100 * selectedModule.totalLessons)}/{selectedModule.totalLessons}</span>
                </div>
                <div className="flex justify-between">
                  <span>XP Reward:</span>
                  <span>{selectedModule.xpReward} XP</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-6">
              <h3 className="font-semibold text-[#0B2447] mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {selectedModule.tags.map((tag, index) => (
                  <span key={index} className="px-2 py-1 bg-[#E8EAF6] text-[#0A6ED1] rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0B2447] mb-2">Learning Modules</h1>
        <p className="text-[#4A5568]">Expand your skills with our comprehensive learning modules</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-6">
          <div className="text-2xl font-bold text-[#0B2447]">{modules.length}</div>
          <div className="text-sm text-[#4A5568]">Total Modules</div>
        </div>
        <div className="bg-white rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-6">
          <div className="text-2xl font-bold text-[#2BA84A]">{modules.filter(m => m.progress === 100).length}</div>
          <div className="text-sm text-[#4A5568]">Completed</div>
        </div>
        <div className="bg-white rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-6">
          <div className="text-2xl font-bold text-[#0A6ED1]">{modules.filter(m => m.progress > 0 && m.progress < 100).length}</div>
          <div className="text-sm text-[#4A5568]">In Progress</div>
        </div>
        <div className="bg-white rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-6">
          <div className="text-2xl font-bold text-[#FFD23F]">{modules.reduce((sum, m) => sum + m.xpReward, 0)}</div>
          <div className="text-sm text-[#4A5568]">Total XP Available</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.08)] p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 text-[#4A5568] absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search modules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#D6D9E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A6ED1] focus:border-transparent"
              />
            </div>
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-[#D6D9E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A6ED1] focus:border-transparent"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="px-4 py-2 border border-[#D6D9E0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0A6ED1] focus:border-transparent"
          >
            <option value="all">All Levels</option>
            <option value="1">Beginner</option>
            <option value="2">Intermediate</option>
            <option value="3">Advanced</option>
          </select>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => (
          <div key={module.id} className="bg-white rounded-2xl shadow-[0_6px_24px_rgba(0,0,0,0.08)] overflow-hidden hover:shadow-lg transition-shadow">
            <div className="aspect-video bg-gray-200">
              <img 
                src={module.thumbnail} 
                alt={module.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty)}`}>
                  {getDifficultyText(module.difficulty)}
                </span>
                <span className="text-xs text-[#4A5568] flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {module.estimatedMinutes}m
                </span>
                <span className="text-xs text-[#4A5568] flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {module.xpReward} XP
                </span>
              </div>
              
              <h3 className="font-semibold text-[#0B2447] mb-2">{module.title}</h3>
              <p className="text-sm text-[#4A5568] mb-4 line-clamp-2">{module.description}</p>
              
              {module.progress > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-[#4A5568]">Progress</span>
                    <span className="text-[#0A6ED1]">{module.progress}%</span>
                  </div>
                  <div className="w-full bg-[#E8EAF6] rounded-full h-2">
                    <div 
                      className="bg-[#0A6ED1] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${module.progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              <button
                onClick={() => handleStartModule(module)}
                className="w-full bg-[#0A6ED1] hover:bg-[#0859ab] text-white font-medium py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4" />
                {module.progress > 0 ? 'Continue' : 'Start Module'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-[#D6D9E0] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#4A5568] mb-2">No modules found</h3>
          <p className="text-[#4A5568]">Try adjusting your filters or search terms</p>
        </div>
      )}
    </div>
  );
};