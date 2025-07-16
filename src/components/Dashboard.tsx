import React, { useEffect, useState } from 'react'
import { Users, Heart, MessageCircle, TrendingUp, Calendar, Star, Filter } from 'lucide-react'
import { supabaseAdmin } from '../lib/supabase'
import StatsCard from './StatsCard'
import ActivityChart from './ActivityChart'

type TimeRange = 'today' | '7days' | '30days' | '90days' | 'all'

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalMatches: 0,
    totalMessages: 0,
    todayMatches: 0,
    todaySignups: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [timeRange])

  const getStartDate = (range: TimeRange): string | null => {
    if (range === 'all') return null
    
    const now = new Date()
    switch (range) {
      case 'today':
        now.setHours(0, 0, 0, 0)
        return now.toISOString()
      case '7days':
        now.setDate(now.getDate() - 7)
        return now.toISOString()
      case '30days':
        now.setDate(now.getDate() - 30)
        return now.toISOString()
      case '90days':
        now.setDate(now.getDate() - 90)
        return now.toISOString()
      default:
        return null
    }
  }

  const getTimeRangeLabel = (range: TimeRange): string => {
    switch (range) {
      case 'today':
        return 'Hoje'
      case '7days':
        return '7 Dias'
      case '30days':
        return '30 Dias'
      case '90days':
        return '90 Dias'
      case 'all':
        return 'Tudo'
      default:
        return 'Tudo'
    }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      await loadStats()
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    const startDate = getStartDate(timeRange)
    const newStats = { ...stats }
    
    // Carregar dados da tabela profiles
    try {
      let usersQuery = supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      if (startDate) {
        usersQuery = usersQuery.gte('created_at', startDate)
      }
      
      const { count: totalUsers } = await usersQuery
      
      if (totalUsers !== null) newStats.totalUsers = totalUsers
      
      // Usuários ativos (últimos 7 dias)
      const { count: activeUsers } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      
      if (activeUsers !== null) newStats.activeUsers = activeUsers
      
      // Cadastros de hoje
      const today = new Date().toISOString().split('T')[0]
      const { count: todaySignups } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today)
      
      if (todaySignups !== null) newStats.todaySignups = todaySignups
    } catch (error) {
      console.log('Erro ao carregar dados da tabela profiles:', error)
    }
    
    // Carregar dados da tabela matches
    try {
      let matchesQuery = supabaseAdmin
        .from('matches')
        .select('*', { count: 'exact', head: true })
      
      if (startDate) {
        matchesQuery = matchesQuery.gte('created_at', startDate)
      }
      
      const { count: totalMatches } = await matchesQuery
      
      if (totalMatches !== null) newStats.totalMatches = totalMatches
      
      // Matches de hoje
      const today = new Date().toISOString().split('T')[0]
      const { count: todayMatches } = await supabaseAdmin
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today)
      
      if (todayMatches !== null) newStats.todayMatches = todayMatches
    } catch (error) {
      console.log('Erro ao carregar dados da tabela matches:', error)
    }
    
    // Carregar dados da tabela messages
    try {
      let messagesQuery = supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact', head: true })
      
      if (startDate) {
        messagesQuery = messagesQuery.gte('created_at', startDate)
      }
      
      const { count: totalMessages } = await messagesQuery
      
      if (totalMessages !== null) newStats.totalMessages = totalMessages
    } catch (error) {
      console.log('Erro ao carregar dados da tabela messages:', error)
    }
    
    setStats(newStats)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral do seu aplicativo de relacionamentos</p>
      </div>

      {/* Filtro de Período */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="text-gray-500" size={20} />
            <span className="text-sm font-medium text-gray-700">Período:</span>
          </div>
          <div className="flex gap-2">
            {(['today', '7days', '30days', '90days', 'all'] as TimeRange[]).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  timeRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getTimeRangeLabel(range)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title={`Usuários (${getTimeRangeLabel(timeRange)})`}
          value={stats.totalUsers.toLocaleString()}
          icon={Users}
          color="blue"
          change={timeRange === 'all' ? '+12% este mês' : `Período: ${getTimeRangeLabel(timeRange)}`}
        />
        <StatsCard
          title="Usuários Ativos"
          value={stats.activeUsers.toLocaleString()}
          icon={TrendingUp}
          color="green"
          change="Últimos 7 dias"
        />
        <StatsCard
          title={`Matches (${getTimeRangeLabel(timeRange)})`}
          value={stats.totalMatches.toLocaleString()}
          icon={Heart}
          color="pink"
          change={timeRange === 'all' ? '+8% esta semana' : `Período: ${getTimeRangeLabel(timeRange)}`}
        />
        <StatsCard
          title={`Mensagens (${getTimeRangeLabel(timeRange)})`}
          value={stats.totalMessages.toLocaleString()}
          icon={MessageCircle}
          color="purple"
          change={timeRange === 'all' ? 'Total de todas as conversas' : `Período: ${getTimeRangeLabel(timeRange)}`}
        />
        <StatsCard
          title="Matches Hoje"
          value={stats.todayMatches.toLocaleString()}
          icon={Star}
          color="yellow"
          change="Nas últimas 24h"
        />
        <StatsCard
          title="Novos Cadastros"
          value={stats.todaySignups.toLocaleString()}
          icon={Calendar}
          color="indigo"
          change="Hoje"
        />
      </div>

      {/* Gráfico de Atividade */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividade dos Últimos 7 Dias</h3>
        <ActivityChart />
      </div>
    </div>
  )
}