import React, { useEffect, useState } from 'react'
import { Crown, Check, X, Calendar, Mail, Phone, User, AlertCircle } from 'lucide-react'
import { supabaseAdmin } from '../lib/supabase'

interface PremiumSignup {
  id: string
  user_id: string
  name: string
  email: string
  phone: string
  created_at: string
}

interface PremiumUser {
  id: string
  name?: string
  email?: string
  avatar_url?: string
  city?: string
  age?: number
  diamond_count?: number
  created_at: string
  updated_at?: string
  premium_activated_at?: string
}

export default function PremiumSignupsManagement() {
  const [signups, setSignups] = useState<PremiumSignup[]>([])
  const [premiumUsers, setPremiumUsers] = useState<PremiumUser[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [processingUserIds, setProcessingUserIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadPremiumSignups()
    loadPremiumUsers()
  }, [])

  const loadPremiumSignups = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabaseAdmin
        .from('premium_signups')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setSignups(data || [])
    } catch (error) {
      console.error('Erro ao carregar cadastros premium:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadPremiumUsers = async () => {
    try {
      setLoadingUsers(true)
      console.log('Carregando usuários premium...')
      
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email, avatar_url, city, age, diamond_count, created_at, updated_at, premium_activated_at')
        .eq('is_premium', true)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Erro ao carregar usuários premium:', error)
        throw error
      }
      
      console.log('Usuários premium carregados:', data?.length || 0)
      setPremiumUsers(data || [])
    } catch (error) {
      console.error('Erro ao carregar usuários premium:', error)
      alert('Erro ao carregar usuários premium. Recarregue a página.')
    } finally {
      setLoadingUsers(false)
    }
  }

  const handleApprove = async (signupId: string, userId: string) => {
    if (processingIds.has(signupId)) return

    try {
      setProcessingIds(prev => new Set(prev).add(signupId))

      console.log('Aprovando usuário premium:', userId)

      // Atualizar o usuário para premium
      const premiumActivatedAt = new Date().toISOString()
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({ 
          is_premium: true,
          premium_activated_at: premiumActivatedAt
        })
        .eq('id', userId)

      if (updateError) {
        console.error('Erro ao atualizar usuário para premium:', updateError)
        throw updateError
      }

      console.log('Usuário atualizado para premium com sucesso')

      // Remover o cadastro da lista de pendentes
      const { error: deleteError } = await supabaseAdmin
        .from('premium_signups')
        .delete()
        .eq('id', signupId)

      if (deleteError) {
        console.error('Erro ao remover cadastro pendente:', deleteError)
        throw deleteError
      }

      console.log('Cadastro pendente removido com sucesso')

      // Atualizar a lista local
      setSignups(prev => prev.filter(signup => signup.id !== signupId))
      
      // Recarregar lista de usuários premium
      await loadPremiumUsers()
      
      alert('Usuário aprovado como premium com sucesso!')
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error)
      alert(`Erro ao aprovar usuário: ${error.message || 'Erro desconhecido'}. Tente novamente.`)
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(signupId)
        return newSet
      })
    }
  }

  const handleDeny = async (signupId: string) => {
    if (processingIds.has(signupId)) return

    if (!confirm('Tem certeza que deseja recusar este cadastro premium?')) {
      return
    }

    try {
      setProcessingIds(prev => new Set(prev).add(signupId))

      const { error } = await supabaseAdmin
        .from('premium_signups')
        .delete()
        .eq('id', signupId)

      if (error) throw error

      // Atualizar a lista local
      setSignups(prev => prev.filter(signup => signup.id !== signupId))
      
      alert('Cadastro premium recusado.')
    } catch (error) {
      console.error('Erro ao recusar cadastro:', error)
      alert('Erro ao recusar cadastro. Tente novamente.')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(signupId)
        return newSet
      })
    }
  }

  const handleDisablePremium = async (userId: string, userName: string) => {
    if (processingUserIds.has(userId)) return

    if (!confirm(`Tem certeza que deseja desativar o premium de ${userName}?`)) {
      return
    }

    try {
      setProcessingUserIds(prev => new Set(prev).add(userId))

      console.log('Desativando premium para usuário:', userId)

      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          is_premium: false,
          premium_activated_at: null
        })
        .eq('id', userId)

      if (error) {
        console.error('Erro na atualização do Supabase:', error)
        throw error
      }

      console.log('Premium desativado com sucesso no banco de dados')

      // Recarregar lista de usuários premium
      await loadPremiumUsers()
      
      console.log('Lista de usuários premium recarregada')
      
      alert(`Premium de ${userName} foi desativado com sucesso!`)
    } catch (error) {
      console.error('Erro ao desativar premium:', error)
      alert(`Erro ao desativar premium: ${error.message || 'Erro desconhecido'}. Tente novamente.`)
    } finally {
      setProcessingUserIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(userId)
        return newSet
      })
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
        <h1 className="text-3xl font-bold text-gray-900">Compras Premium</h1>
        <p className="text-gray-600 mt-1">Gerencie as solicitações de upgrade para premium</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Usuários Premium Ativos</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{premiumUsers.length}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Crown size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cadastros Pendentes</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{signups.length}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Crown size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hoje</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {signups.filter(signup => {
                  const today = new Date().toDateString()
                  return new Date(signup.created_at).toDateString() === today
                }).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Calendar size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Esta Semana</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {signups.filter(signup => {
                  const weekAgo = new Date()
                  weekAgo.setDate(weekAgo.getDate() - 7)
                  return new Date(signup.created_at) >= weekAgo
                }).length}
              </p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Usuários Premium Ativos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Crown className="text-yellow-500" size={20} />
            Usuários Premium Ativos ({premiumUsers.length})
          </h3>
        </div>
        
        <div className="p-6">
          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : premiumUsers.length > 0 ? (
            <div className="space-y-0">
              {premiumUsers.map((user) => (
                <div key={user.id} className="border-b border-gray-200 py-4 px-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    {/* Avatar */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.name || 'Avatar'}
                            className="w-12 h-12 rounded-full object-cover border-2 border-yellow-200"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-yellow-500 flex items-center justify-center text-white text-lg font-bold border-2 border-yellow-200">
                            {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Informações do usuário */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-lg font-semibold text-gray-900 truncate">
                            {user.name || 'Nome não informado'}
                          </h4>
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            <Crown size={10} />
                            Premium
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate mb-2">
                          {user.email || 'Email não informado'}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {user.city && (
                            <span className="flex items-center gap-1">
                              <span>📍</span>
                              {user.city}
                              {user.age && <span>, {user.age} anos</span>}
                            </span>
                          )}
                          
                          {user.diamond_count !== undefined && (
                            <span className="flex items-center gap-1">
                              <span>💎</span>
                              {user.diamond_count} diamantes
                            </span>
                          )}
                          
                          <span className="flex items-center gap-1">
                            <span>📅</span>
                            Premium desde {user.premium_activated_at 
                              ? new Date(user.premium_activated_at).toLocaleDateString('pt-BR')
                              : new Date(user.created_at).toLocaleDateString('pt-BR')
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botão para desativar premium */}
                    <div className="flex-shrink-0 ml-4">
                      <button
                        onClick={() => handleDisablePremium(user.id, user.name || user.email || 'Usuário')}
                        disabled={processingUserIds.has(user.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X size={16} />
                        {processingUserIds.has(user.id) ? 'Desativando...' : 'Desativar Premium'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Crown className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário premium ativo</h3>
              <p className="text-gray-600">
                Quando os usuários se tornarem premium, eles aparecerão aqui.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Cadastros Premium */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Solicitações de Premium Pendentes
          </h3>
        </div>
        
        <div className="p-6">
          {signups.length > 0 ? (
            <div className="space-y-4">
              {signups.map((signup) => (
                <div key={signup.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <User className="text-blue-600" size={20} />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Nome</p>
                            <p className="font-medium text-gray-900">{signup.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-full">
                            <Mail className="text-green-600" size={20} />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Email</p>
                            <p className="font-medium text-gray-900">{signup.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-full">
                            <Phone className="text-purple-600" size={20} />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Telefone</p>
                            <p className="font-medium text-gray-900">{signup.phone}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-yellow-100 rounded-full">
                            <Calendar className="text-yellow-600" size={20} />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Data do Cadastro</p>
                            <p className="font-medium text-gray-900">
                              {new Date(signup.created_at).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">
                          <strong>ID do Usuário:</strong> {signup.user_id}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-6">
                      <button
                        onClick={() => handleApprove(signup.id, signup.user_id)}
                        disabled={processingIds.has(signup.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check size={16} />
                        {processingIds.has(signup.id) ? 'Processando...' : 'Aprovar'}
                      </button>
                      
                      <button
                        onClick={() => handleDeny(signup.id)}
                        disabled={processingIds.has(signup.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <X size={16} />
                        {processingIds.has(signup.id) ? 'Processando...' : 'Recusar'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Crown className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cadastro premium pendente</h3>
              <p className="text-gray-600">
                Quando os usuários solicitarem upgrade para premium, eles aparecerão aqui para aprovação.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}