import React, { useEffect, useState } from 'react'
import { 
  Users, 
  TrendingUp, 
  Heart, 
  MessageCircle, 
  Crown, 
  Diamond, 
  MapPin,
  Calendar,
  Target,
  DollarSign,
  Activity,
  Zap,
  Filter
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import { supabaseAdmin } from '../lib/supabase'
import StatsCard from './StatsCard'

interface AnalyticsData {
  totalUsers: number
  premiumUsers: number
  totalMatches: number
  totalMessages: number
  totalDiamonds: number
  premiumConversionRate: number
  avgMatchesPerUser: number
  avgMessagesPerMatch: number
  userGrowthData: Array<{ date: string; users: number; premium: number }>
  cityDistribution: Array<{ city: string; count: number }>
  rankDistribution: Array<{ rank: string; count: number }>
  dailyActivity: Array<{ date: string; matches: number; messages: number; signups: number }>
}

const COLORS = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444']

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState<'today' | '7days' | '30days' | '90days' | 'all'>('all')
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    premiumUsers: 0,
    totalMatches: 0,
    totalMessages: 0,
    totalDiamonds: 0,
    premiumConversionRate: 0,
    avgMatchesPerUser: 0,
    avgMessagesPerMatch: 0,
    userGrowthData: [],
    cityDistribution: [],
    rankDistribution: [],
    dailyActivity: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const getStartDate = (range: typeof timeRange): string | null => {
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

  const getTimeRangeLabel = (range: typeof timeRange): string => {
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

  const loadAnalyticsData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadUserMetrics(),
        loadEngagementMetrics(),
        loadMonetizationMetrics(),
        loadGrowthData(),
        loadDistributionData(),
        loadActivityData()
      ])
    } catch (error) {
      console.error('Erro ao carregar analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserMetrics = async () => {
    try {
      const startDate = getStartDate(timeRange)
      
      // Total de usuários
      let usersQuery = supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      if (startDate) {
        usersQuery = usersQuery.gte('created_at', startDate)
      }
      
      const { count: totalUsers } = await usersQuery

      // Usuários premium
      let premiumQuery = supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_premium', true)
      
      if (startDate) {
        premiumQuery = premiumQuery.gte('created_at', startDate)
      }
      
      const { count: premiumUsers } = await premiumQuery

      setAnalytics(prev => ({
        ...prev,
        totalUsers: totalUsers || 0,
        premiumUsers: premiumUsers || 0,
        premiumConversionRate: totalUsers ? ((premiumUsers || 0) / totalUsers) * 100 : 0
      }))
    } catch (error) {
      console.error('Erro ao carregar métricas de usuários:', error)
    }
  }

  const loadEngagementMetrics = async () => {
    try {
      const startDate = getStartDate(timeRange)
      
      // Total de matches
      let matchesQuery = supabaseAdmin
        .from('matches')
        .select('*', { count: 'exact', head: true })
      
      if (startDate) {
        matchesQuery = matchesQuery.gte('created_at', startDate)
      }
      
      const { count: totalMatches } = await matchesQuery

      // Total de mensagens
      let messagesQuery = supabaseAdmin
        .from('messages')
        .select('*', { count: 'exact', head: true })
      
      if (startDate) {
        messagesQuery = messagesQuery.gte('created_at', startDate)
      }
      
      const { count: totalMessages } = await messagesQuery

      setAnalytics(prev => ({
        ...prev,
        totalMatches: totalMatches || 0,
        totalMessages: totalMessages || 0,
        avgMatchesPerUser: prev.totalUsers ? (totalMatches || 0) / prev.totalUsers : 0,
        avgMessagesPerMatch: totalMatches ? (totalMessages || 0) / totalMatches : 0
      }))
    } catch (error) {
      console.error('Erro ao carregar métricas de engajamento:', error)
    }
  }

  const loadMonetizationMetrics = async () => {
    try {
      const startDate = getStartDate(timeRange)
      
      // Total de diamantes em circulação
      let diamondQuery = supabaseAdmin
        .from('profiles')
        .select('diamond_count')
      
      if (startDate) {
        diamondQuery = diamondQuery.gte('created_at', startDate)
      }
      
      const { data: diamondData } = await diamondQuery

      const totalDiamonds = diamondData?.reduce((sum, user) => sum + (user.diamond_count || 0), 0) || 0

      setAnalytics(prev => ({
        ...prev,
        totalDiamonds
      }))
    } catch (error) {
      console.error('Erro ao carregar métricas de monetização:', error)
    }
  }

  const loadGrowthData = async () => {
    try {
      // Crescimento de usuários baseado no filtro selecionado
      const startDate = getStartDate(timeRange)
      const filterDate = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

      const { data: userData } = await supabaseAdmin
        .from('profiles')
        .select('created_at, is_premium')
        .gte('created_at', filterDate.toISOString())
        .order('created_at')

      // Agrupar por dia
      const growthMap = new Map()
      userData?.forEach(user => {
        const date = new Date(user.created_at).toISOString().split('T')[0]
        if (!growthMap.has(date)) {
          growthMap.set(date, { users: 0, premium: 0 })
        }
        growthMap.get(date).users += 1
        if (user.is_premium) {
          growthMap.get(date).premium += 1
        }
      })

      const userGrowthData = Array.from(growthMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setAnalytics(prev => ({ ...prev, userGrowthData }))
    } catch (error) {
      console.error('Erro ao carregar dados de crescimento:', error)
    }
  }

  const loadDistributionData = async () => {
    try {
      const startDate = getStartDate(timeRange)
      
      // Distribuição por cidade
      let cityQuery = supabaseAdmin
        .from('profiles')
        .select('city')
      
      if (startDate) {
        cityQuery = cityQuery.gte('created_at', startDate)
      }
      
      const { data: cityData } = await cityQuery

      const cityMap = new Map()
      cityData?.forEach(user => {
        const city = user.city || 'Não informado'
        cityMap.set(city, (cityMap.get(city) || 0) + 1)
      })

      const cityDistribution = Array.from(cityMap.entries())
        .map(([city, count]) => ({ city, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Distribuição por rank
      let rankQuery = supabaseAdmin
        .from('profiles')
        .select('current_rank')
      
      if (startDate) {
        rankQuery = rankQuery.gte('created_at', startDate)
      }
      
      const { data: rankData } = await rankQuery

      const rankMap = new Map()
      rankData?.forEach(user => {
        const rank = user.current_rank || 'Não informado'
        rankMap.set(rank, (rankMap.get(rank) || 0) + 1)
      })

      const rankDistribution = Array.from(rankMap.entries())
        .map(([rank, count]) => ({ rank, count }))
        .sort((a, b) => b.count - a.count)

      setAnalytics(prev => ({ ...prev, cityDistribution, rankDistribution }))
    } catch (error) {
      console.error('Erro ao carregar dados de distribuição:', error)
    }
  }

  const loadActivityData = async () => {
    try {
      // Atividade baseada no filtro selecionado
      const startDate = getStartDate(timeRange)
      let daysToShow = 7
      
      switch (timeRange) {
        case 'today':
          daysToShow = 1
          break
        case '7days':
          daysToShow = 7
          break
        case '30days':
          daysToShow = 30
          break
        case '90days':
          daysToShow = 90
          break
        case 'all':
          daysToShow = 30 // Limitar a 30 dias para performance
          break
      }
      
      const filterDate = startDate ? new Date(startDate) : new Date(Date.now() - daysToShow * 24 * 60 * 60 * 1000)

      const [matchesData, messagesData, signupsData] = await Promise.all([
        supabaseAdmin
          .from('matches')
          .select('created_at')
          .gte('created_at', filterDate.toISOString()),
        supabaseAdmin
          .from('messages')
          .select('created_at')
          .gte('created_at', filterDate.toISOString()),
        supabaseAdmin
          .from('profiles')
          .select('created_at')
          .gte('created_at', filterDate.toISOString())
      ])

      // Agrupar por dia
      const activityMap = new Map()
      
      // Inicializar dias baseado no filtro
      for (let i = daysToShow - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        activityMap.set(dateStr, { matches: 0, messages: 0, signups: 0 })
      }

      matchesData.data?.forEach(match => {
        const date = new Date(match.created_at).toISOString().split('T')[0]
        if (activityMap.has(date)) {
          activityMap.get(date).matches += 1
        }
      })

      messagesData.data?.forEach(message => {
        const date = new Date(message.created_at).toISOString().split('T')[0]
        if (activityMap.has(date)) {
          activityMap.get(date).messages += 1
        }
      })

      signupsData.data?.forEach(signup => {
        const date = new Date(signup.created_at).toISOString().split('T')[0]
        if (activityMap.has(date)) {
          activityMap.get(date).signups += 1
        }
      })

      const dailyActivity = Array.from(activityMap.entries())
        .map(([date, data]) => {
          const dateObj = new Date(date)
          let dateLabel = ''
          
          if (timeRange === 'today') {
            dateLabel = dateObj.toLocaleDateString('pt-BR', { hour: '2-digit' })
          } else if (timeRange === '7days') {
            dateLabel = dateObj.toLocaleDateString('pt-BR', { weekday: 'short' })
          } else {
            dateLabel = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
          }
          
          return { date: dateLabel, ...data }
        })

      setAnalytics(prev => ({ ...prev, dailyActivity }))
    } catch (error) {
      console.error('Erro ao carregar dados de atividade:', error)
    }
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
        <h1 className="text-3xl font-bold text-gray-900">Analytics Avançado</h1>
        <p className="text-gray-600 mt-1">Métricas detalhadas para investidores e publicidade</p>
      </div>

      {/* Filtro de Período */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="text-gray-500" size={20} />
            <span className="text-sm font-medium text-gray-700">Período:</span>
          </div>
          <div className="flex gap-2">
            {(['today', '7days', '30days', '90days', 'all'] as const).map((range) => (
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

      {/* KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={`Total de Usuários (${getTimeRangeLabel(timeRange)})`}
          value={analytics.totalUsers.toLocaleString()}
          icon={Users}
          color="blue"
          change={timeRange === 'all' ? 'Base de usuários ativa' : `Período: ${getTimeRangeLabel(timeRange)}`}
        />
        <StatsCard
          title={`Taxa de Conversão Premium (${getTimeRangeLabel(timeRange)})`}
          value={`${analytics.premiumConversionRate.toFixed(1)}%`}
          icon={Crown}
          color="yellow"
          change={`${analytics.premiumUsers} usuários premium`}
        />
        <StatsCard
          title={`Total de Matches (${getTimeRangeLabel(timeRange)})`}
          value={analytics.totalMatches.toLocaleString()}
          icon={Heart}
          color="pink"
          change={`${analytics.avgMatchesPerUser.toFixed(1)} matches/usuário`}
        />
        <StatsCard
          title={`Engajamento (${getTimeRangeLabel(timeRange)})`}
          value={analytics.totalMessages.toLocaleString()}
          icon={MessageCircle}
          color="green"
          change={`${analytics.avgMessagesPerMatch.toFixed(1)} msgs/match`}
        />
      </div>

      {/* Métricas de Monetização */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title={`Diamantes em Circulação (${getTimeRangeLabel(timeRange)})`}
          value={analytics.totalDiamonds.toLocaleString()}
          icon={Diamond}
          color="blue"
          change={timeRange === 'all' ? 'Economia virtual ativa' : `Período: ${getTimeRangeLabel(timeRange)}`}
        />
        <StatsCard
          title={`Usuários Premium (${getTimeRangeLabel(timeRange)})`}
          value={analytics.premiumUsers.toLocaleString()}
          icon={Crown}
          color="yellow"
          change={timeRange === 'all' ? 'Receita recorrente' : `Período: ${getTimeRangeLabel(timeRange)}`}
        />
        <StatsCard
          title={`Potencial de Receita (${getTimeRangeLabel(timeRange)})`}
          value={`R$ ${(analytics.premiumUsers * 29.90).toLocaleString()}`}
          icon={DollarSign}
          color="green"
          change={timeRange === 'all' ? 'Estimativa mensal' : `Baseado em ${getTimeRangeLabel(timeRange)}`}
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crescimento de Usuários */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} />
            Crescimento de Usuários ({getTimeRangeLabel(timeRange)})
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Novos Usuários"
                />
                <Line 
                  type="monotone" 
                  dataKey="premium" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  name="Premium"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Atividade Diária */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity size={20} />
            Atividade - {getTimeRangeLabel(timeRange)}
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.dailyActivity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="matches" fill="#EC4899" name="Matches" />
                <Bar dataKey="messages" fill="#10B981" name="Mensagens" />
                <Bar dataKey="signups" fill="#3B82F6" name="Cadastros" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Distribuições */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Cidades */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin size={20} />
            Top 10 Cidades ({getTimeRangeLabel(timeRange)})
          </h3>
          <div className="space-y-3">
            {analytics.cityDistribution.map((city, index) => (
              <div key={city.city} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-500 w-6">
                    {index + 1}º
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {city.city}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div 
                    className="h-2 bg-blue-500 rounded"
                    style={{ 
                      width: `${(city.count / analytics.cityDistribution[0]?.count) * 100}px`,
                      minWidth: '20px'
                    }}
                  />
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {city.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribuição por Rank */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target size={20} />
            Distribuição por Rank ({getTimeRangeLabel(timeRange)})
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.rankDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ rank, percent }) => `${rank} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.rankDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights para Investidores */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="text-blue-600" size={20} />
          Insights para Investidores
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Crescimento</h4>
            <p className="text-gray-600">
              Base de {analytics.totalUsers.toLocaleString()} usuários com potencial de expansão 
              em mercados regionais específicos.
              {timeRange !== 'all' && ` (Dados de ${getTimeRangeLabel(timeRange)})`}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Monetização</h4>
            <p className="text-gray-600">
              Taxa de conversão premium de {analytics.premiumConversionRate.toFixed(1)}% 
              indica forte potencial de receita recorrente.
              {timeRange !== 'all' && ` (Período: ${getTimeRangeLabel(timeRange)})`}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Engajamento</h4>
            <p className="text-gray-600">
              {analytics.avgMessagesPerMatch.toFixed(1)} mensagens por match demonstra 
              alto nível de interação entre usuários.
              {timeRange !== 'all' && ` (Dados de ${getTimeRangeLabel(timeRange)})`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}