import React from 'react'
import { 
  LayoutDashboard, 
  Users, 
  Heart, 
  MessageCircle, 
  TrendingUp, 
  Settings,
  Shield,
  BarChart3,
  Crown,
  Diamond
} from 'lucide-react'

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'users', icon: Users, label: 'Usuários' },
  { id: 'matches', icon: Heart, label: 'Matches' },
  { id: 'messages', icon: MessageCircle, label: 'Mensagens' },
  { id: 'premiumSignups', icon: Crown, label: 'Compras Premium' },
  { id: 'diamondWithdrawals', icon: Diamond, label: 'Saques de Diamantes' },
  { id: 'analytics', icon: BarChart3, label: 'Analytics' },
  { id: 'reports', icon: TrendingUp, label: 'Relatórios' },
  { id: 'moderation', icon: Shield, label: 'Moderação' },
  { id: 'settings', icon: Settings, label: 'Configurações' },
]

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  return (
    <div className="bg-gray-900 text-white w-64 min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="text-pink-500" size={28} />
          Admin Panel
        </h1>
        <p className="text-gray-400 text-sm mt-1">Dating App Dashboard</p>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          )
        })}
      </nav>
    </div>
  )
}