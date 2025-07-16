import React, { useEffect, useState } from 'react'
import { 
  Trophy, 
  Search, 
  Calendar, 
  User, 
  Plus, 
  Check, 
  X,
  Gift,
  Crown,
  Star,
  Award,
  Users,
  Instagram
} from 'lucide-react'
import { supabaseAdmin } from '../lib/supabase'

interface User {
  id: string
  name: string
  email: string
  avatar_url?: string
  city?: string
  age?: number
}

interface DailyWinner {
  id: string
  user_id: string
  draw_date: string
  prize_amount: number
  awarded_at: string
  instagram_posted: boolean
  created_at: string
  user_name?: string
  user_email?: string
  user_avatar_url?: string
}

export default function DailyWinnersManagement() {
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [drawDate, setDrawDate] = useState(new Date().toISOString().split('T')[0])
  const [prizeAmount, setPrizeAmount] = useState(30)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [winners, setWinners] = useState<DailyWinner[]>([])
  const [loadingWinners, setLoadingWinners] = useState(true)
  const [stats, setStats] = useState({
    totalWinners: 0,
    thisMonthWinners: 0,
    totalPrizeAmount: 0,
    pendingInstagramPosts: 0
  })

  useEffect(() => {
    loadWinners()
  }, [])

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchUsers()
    } else {
      setSearchResults([])
    }
  }, [searchTerm])

  const searchUsers = async () => {
    try {
      setSearching(true)
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email, avatar_url, city, age')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10)

      if (error) throw error
      setSearchResults(data || [])
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      alert('Erro ao buscar usuários')
    } finally {
      setSearching(false)
    }
  }

  const loadWinners = async () => {
    try {
      setLoadingWinners(true)
      
      // Buscar ganhadores
      const { data: winnersData, error } = await supabaseAdmin
        .from('daily_winners')
        .select('*')
        .order('draw_date', { ascending: false })

      if (error) throw error

      // Enriquecer com dados dos usuários
      const enrichedWinners = await Promise.all(
        (winnersData || []).map(async (winner) => {
          const { data: userData } = await supabaseAdmin
            .from('profiles')
            .select('name, email, avatar_url')
            .eq('id', winner.user_id)
            .single()

          return {
            ...winner,
            user_name: userData?.name,
            user_email: userData?.email,
            user_avatar_url: userData?.avatar_url
          }
        })
      )

      setWinners(enrichedWinners)

      // Calcular estatísticas
      const totalWinners = enrichedWinners.length
      const thisMonth = new Date()
      thisMonth.setDate(1)
      const thisMonthWinners = enrichedWinners.filter(w => 
        new Date(w.draw_date) >= thisMonth
      ).length
      const totalPrizeAmount = enrichedWinners.reduce((sum, w) => sum + w.prize_amount, 0)
      const pendingInstagramPosts = enrichedWinners.filter(w => !w.instagram_posted).length

      setStats({
        totalWinners,
        thisMonthWinners,
        totalPrizeAmount,
        pendingInstagramPosts
      })

    } catch (error) {
      console.error('Erro ao carregar ganhadores:', error)
    } finally {
      setLoadingWinners(false)
    }
  }

  const addWinner = async () => {
    if (!selectedUser) {
      alert('Por favor, selecione um usuário')
      return
    }

    if (!drawDate) {
      alert('Por favor, selecione a data do sorteio')
      return
    }

    try {
      setLoading(true)

      // Verificar se já existe um ganhador para esta data
      const { data: existingWinner } = await supabaseAdmin
        .from('daily_winners')
        .select('id')
        .eq('draw_date', drawDate)
        .single()

      if (existingWinner) {
        alert('Já existe um ganhador para esta data!')
        return
      }

      // Adicionar novo ganhador
      const { error } = await supabaseAdmin
        .from('daily_winners')
        .insert({
          user_id: selectedUser.id,
          draw_date: drawDate,
          prize_amount: prizeAmount,
          awarded_at: new Date().toISOString(),
          instagram_posted: false
        })

      if (error) throw error

      // Limpar formulário
      setSelectedUser(null)
      setSearchTerm('')
      setSearchResults([])
      setDrawDate(new Date().toISOString().split('T')[0])
      setPrizeAmount(30)

      // Recarregar lista
      await loadWinners()

      alert('Ganhador adicionado com sucesso!')

    } catch (error) {
      console.error('Erro ao adicionar ganhador:', error)
      alert('Erro ao adicionar ganhador')
    } finally {
      setLoading(false)
    }
  }

  const toggleInstagramPost = async (winnerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabaseAdmin
        .from('daily_winners')
        .update({ instagram_posted: !currentStatus })
        .eq('id', winnerId)

      if (error) throw error

      // Atualizar localmente
      setWinners(prev => prev.map(winner => 
        winner.id === winnerId 
          ? { ...winner, instagram_posted: !currentStatus }
          : winner
      ))

      // Recarregar estatísticas
      loadWinners()

    } catch (error) {
      console.error('Erro ao atualizar status do Instagram:', error)
      alert('Erro ao atualizar status do Instagram')
    }
  }

  if (loadingWinners) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ganhadores Diários</h1>
        <p className="text-gray-600 mt-1">Gerencie os ganhadores dos sorteios diários</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Ganhadores</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalWinners}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Trophy size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Este Mês</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.thisMonthWinners}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total em Prêmios</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.totalPrizeAmount} 💎</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Gift size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Posts Pendentes</p>
              <p className="text-3xl font-bold text-purple-600 mt-1">{stats.pendingInstagramPosts}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Instagram size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Formulário para Adicionar Ganhador */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Plus size={20} />
          Adicionar Novo Ganhador
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Busca de Usuário */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar Usuário
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Digite o nome ou email do usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Resultados da Busca */}
            {searchResults.length > 0 && (
              <div className="border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user)}
                    className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                      selectedUser?.id === user.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.city && (
                          <p className="text-xs text-gray-500">
                            {user.city}{user.age && `, ${user.age} anos`}
                          </p>
                        )}
                      </div>
                      {selectedUser?.id === user.id && (
                        <Check className="text-blue-600 ml-auto" size={20} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Usuário Selecionado */}
            {selectedUser && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Usuário Selecionado:</h4>
                <div className="flex items-center gap-3">
                  {selectedUser.avatar_url ? (
                    <img
                      src={selectedUser.avatar_url}
                      alt={selectedUser.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-blue-900">{selectedUser.name}</p>
                    <p className="text-sm text-blue-700">{selectedUser.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="ml-auto p-1 text-blue-600 hover:text-blue-800"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Configurações do Sorteio */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data do Sorteio
              </label>
              <input
                type="date"
                value={drawDate}
                onChange={(e) => setDrawDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor do Prêmio (Diamantes)
              </label>
              <input
                type="number"
                value={prizeAmount}
                onChange={(e) => setPrizeAmount(parseInt(e.target.value) || 30)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={addWinner}
              disabled={!selectedUser || loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adicionando...
                </>
              ) : (
                <>
                  <Trophy size={20} />
                  Adicionar Ganhador
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Ganhadores */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Award size={20} />
            Ganhadores Registrados ({winners.length})
          </h3>
        </div>
        
        <div className="p-6">
          {winners.length > 0 ? (
            <div className="space-y-4">
              {winners.map((winner) => (
                <div key={winner.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* Avatar do Ganhador */}
                      {winner.user_avatar_url ? (
                        <img
                          src={winner.user_avatar_url}
                          alt={winner.user_name || 'Ganhador'}
                          className="w-12 h-12 rounded-full object-cover border-2 border-yellow-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold border-2 border-yellow-200">
                          {(winner.user_name || winner.user_email || 'G').charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Informações do Ganhador */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">
                            {winner.user_name || 'Nome não informado'}
                          </h4>
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            <Crown size={10} />
                            Ganhador
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {winner.user_email || 'Email não informado'}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            Sorteio: {new Date(winner.draw_date).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <Gift size={14} />
                            {winner.prize_amount} diamantes
                          </span>
                          <span className="flex items-center gap-1">
                            <Star size={14} />
                            Premiado em: {new Date(winner.awarded_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status do Instagram */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleInstagramPost(winner.id, winner.instagram_posted)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          winner.instagram_posted
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        <Instagram size={16} />
                        {winner.instagram_posted ? 'Postado' : 'Pendente'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum ganhador registrado</h3>
              <p className="text-gray-600">
                Adicione o primeiro ganhador do sorteio diário usando o formulário acima.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}