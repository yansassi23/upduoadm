import React, { useState } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import UsersManagement from './components/UsersManagement'
import MatchesManagement from './components/MatchesManagement'
import PremiumSignupsManagement from './components/PremiumSignupsManagement'
import DiamondWithdrawalsManagement from './components/DiamondWithdrawalsManagement'
import AnalyticsDashboard from './components/AnalyticsDashboard'
import ModerationManagement from './components/ModerationManagement'
import DailyWinnersManagement from './components/DailyWinnersManagement'

function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'users':
        return <UsersManagement />
      case 'matches':
        return <MatchesManagement />
      case 'premiumSignups':
        return <PremiumSignupsManagement />
      case 'dailyWinners':
        return <DailyWinnersManagement />
      case 'diamondWithdrawals':
        return <DiamondWithdrawalsManagement />
      case 'messages':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Gerenciamento de Mensagens</h3>
            <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
          </div>
        )
      case 'analytics':
        return <AnalyticsDashboard />
      case 'reports':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Relatórios</h3>
            <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
          </div>
        )
      case 'moderation':
        return <ModerationManagement />
      case 'settings':
        return (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Configurações</h3>
            <p className="text-gray-600">Funcionalidade em desenvolvimento</p>
          </div>
        )
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-8">
        {renderContent()}
      </main>
    </div>
  )
}

export default App