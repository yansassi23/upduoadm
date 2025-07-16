import React, { useEffect, useState } from 'react'
import { Heart, TrendingUp, Calendar, Users, User, Search, Filter, X } from 'lucide-react'
import { supabaseAdmin } from '../lib/supabase'
import StatsCard from './StatsCard'

interface Match {
  id: string
  created_at: string
  user1_id?: string
  user2_id?: string
  user1_name?: string
  user2_name?: string
  user1_avatar_url?: string
  user2_avatar_url?: string
  [key: string]: any
}

export default function MatchesManagement() {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [matchTable, setMatchTable] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalMatches: 0,
    todayMatches: 0,
    weekMatches: 0,
    avgMatchesPerDay: 0
  })

  useEffect(() => {
    loadMatches()
  }, [searchTerm])

  const loadMatches = async () => {
    try {
      setLoading(true)
      
      let matchesData = []
      
      if (searchTerm.trim()) {
        // Buscar usuários que correspondem ao termo de pesquisa
        const { data: usersData, error: usersError } = await supabaseAdmin
          .from('profiles')
          .select('id, name')
          .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        
        if (usersError) throw usersError
        
        if (usersData && usersData.length > 0) {
          const userIds = usersData.map(user => user.id)
          
          // Buscar matches que envolvem esses usuários
          const { data: filteredMatches, error: matchesError } = await supabaseAdmin
            .from('matches')
            .select('*')
            .or(`user1_id.in.(${userIds.join(',')}),user2_id.in.(${userIds.join(',')})`)
            .order('created_at', { ascending: false })
            .limit(100)
          
          if (matchesError) throw matchesError
          matchesData = filteredMatches || []
        }
      } else {
        // Carregar todos os matches recentes se não houver termo de pesquisa
        const { data: allMatches, error } = await supabaseAdmin
          .from('matches')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100)
        
        if (error) throw error
        matchesData = allMatches || []
      }
      
      // Enriquecer matches com dados dos usuários
      const enrichedMatches = await Promise.all(
        matchesData.map(async (match) => {
          const enrichedMatch = { ...match }
          
          // Buscar dados do user1
          if (match.user1_id) {
            const { data: user1Data } = await supabaseAdmin
              .from('profiles')
              .select('name, avatar_url')
              .eq('id', match.user1_id)
              .single()
            
            if (user1Data) {
              enrichedMatch.user1_name = user1Data.name
              enrichedMatch.user1_avatar_url = user1Data.avatar_url
            }
          }
          
          // Buscar dados do user2
          if (match.user2_id) {
            const { data: user2Data } = await supabaseAdmin
              .from('profiles')
              .select('name, avatar_url')
              .eq('id', match.user2_id)
              .single()
            
            if (user2Data) {
              enrichedMatch.user2_name = user2Data.name
              enrichedMatch.user2_avatar_url = user2Data.avatar_url
            }
          }
          
          return enrichedMatch
        })
      )
      
      const matchesArray = enrichedMatches
      setMatches(matchesArray)
      setMatchTable('matches')
      
      // Calcular estatísticas
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const todayMatches = matchesArray.filter(match => 
        new Date(match.created_at) >= today
      ).length
      
      const weekMatches = matchesArray.filter(match => 
        new Date(match.created_at) >= weekAgo
      ).length
      
      setStats({
        totalMatches: matchesArray.length,
        todayMatches,
        weekMatches,
        avgMatchesPerDay: Math.round(weekMatches / 7)
      })
      
    } catch (error) {
      console.error('Erro ao carregar matches:', error)
      setMatchTable(null)
    } finally {
      setLoading(false)
    }
  }

  const clearSearch = () => {
    setSearchTerm('')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!matchTable) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Tabela de Matches Não Encontrada</h3>
        <p className="text-gray-600">
          Não foi possível encontrar uma tabela de matches no banco de dados.
          Verifique se existe uma tabela chamada 'matches', 'likes', 'swipes' ou 'connections'.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Matches</h1>
        <p className="text-gray-600 mt-1">Monitore e analise os matches do seu aplicativo</p>
      </div>

      {/* Barra de Busca */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar matches por nome do usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={20} />
            Filtros
          </button>
        </div>
        {searchTerm && (
          <div className="mt-3 text-sm text-gray-600">
            {matches.length > 0 
              ? `Encontrados ${matches.length} matches para "${searchTerm}"`
              : `Nenhum match encontrado para "${searchTerm}"`
            }
          </div>
        )}
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title={searchTerm ? "Matches Filtrados" : "Total de Matches"}
          value={stats.totalMatches.toLocaleString()}
          icon={Heart}
          color="pink"
          change={searchTerm ? `Resultados para "${searchTerm}"` : "Histórico completo"}
        />
        <StatsCard
          title="Matches Hoje"
          value={stats.todayMatches.toLocaleString()}
          icon={Calendar}
          color="blue"
          change="Últimas 24 horas"
        />
        <StatsCard
          title="Esta Semana"
          value={stats.weekMatches.toLocaleString()}
          icon={TrendingUp}
          color="green"
          change="Últimos 7 dias"
        />
        <StatsCard
          title="Média Diária"
          value={stats.avgMatchesPerDay.toLocaleString()}
          icon={Users}
          color="purple"
          change="Matches por dia"
        />
      </div>

      {/* Lista de Matches Recentes */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {searchTerm ? `Matches para "${searchTerm}"` : "Matches Recentes"}
          </h3>
        </div>
        
        <div className="p-6">
          {matches.length > 0 ? (
            <div className="space-y-4">
              {matches.slice(0, 20).map((match) => (
                <div key={match.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-pink-100 rounded-full">
                      <Heart className="text-pink-600" size={20} />
                    </div>
                    
                    {/* Fotos dos usuários do match */}
                    <div className="flex items-center gap-2">
                      {/* User 1 */}
                      <div className="flex flex-col items-center">
                        {match.user1_avatar_url ? (
                          <img
                            src={match.user1_avatar_url}
                            alt={match.user1_name || 'Usuário 1'}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold border-2 border-white shadow-sm">
                            {match.user1_name ? match.user1_name.charAt(0).toUpperCase() : <User size={16} />}
                          </div>
                        )}
                        <span className="text-xs text-gray-600 mt-1 max-w-[60px] truncate">
                          {match.user1_name || 'Usuário 1'}
                        </span>
                      </div>
                      
                      {/* Ícone de coração entre os usuários */}
                      <div className="mx-2">
                        <Heart className="text-pink-500 fill-current" size={16} />
                      </div>
                      
                      {/* User 2 */}
                      <div className="flex flex-col items-center">
                        {match.user2_avatar_url ? (
                          <img
                            src={match.user2_avatar_url}
                            alt={match.user2_name || 'Usuário 2'}
                            className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white font-semibold border-2 border-white shadow-sm">
                            {match.user2_name ? match.user2_name.charAt(0).toUpperCase() : <User size={16} />}
                          </div>
                        )}
                        <span className="text-xs text-gray-600 mt-1 max-w-[60px] truncate">
                          {match.user2_name || 'Usuário 2'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-900">Match #{match.id.slice(0, 8)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(match.created_at).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      {match.user1_id && match.user2_id ? 'Match confirmado' : 'Match pendente'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(match.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Heart className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? `Nenhum match encontrado para "${searchTerm}"` : "Nenhum match encontrado"}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? "Tente buscar por outro nome ou limpe o filtro para ver todos os matches"
                  : "Os matches aparecerão aqui quando os usuários começarem a interagir"
                }
              </p>
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ver todos os matches
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}