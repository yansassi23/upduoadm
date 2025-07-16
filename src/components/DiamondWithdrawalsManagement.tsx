import React, { useEffect, useState } from 'react'
import { Diamond, Check, X, Calendar, User, Server, Gamepad2, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react'
import { supabaseAdmin } from '../lib/supabase'

interface DiamondWithdrawal {
  id: string
  user_id: string
  amount: number
  ml_user_id: string
  ml_zone_id: string
  status: 'pending' | 'approved' | 'completed' | 'rejected'
  created_at: string
  updated_at: string
  processed_at?: string
  notes?: string
  user_name?: string
  user_email?: string
  user_avatar_url?: string
}

export default function DiamondWithdrawalsManagement() {
  const [withdrawals, setWithdrawals] = useState<DiamondWithdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [stats, setStats] = useState({
    totalWithdrawals: 0,
    pendingWithdrawals: 0,
    completedWithdrawals: 0,
    totalAmount: 0,
    pendingAmount: 0
  })

  useEffect(() => {
    loadWithdrawals()
  }, [])

  const loadWithdrawals = async () => {
    try {
      setLoading(true)
      
      // Buscar todos os saques
      const { data: withdrawalsData, error } = await supabaseAdmin
        .from('diamond_withdrawals')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error

      // Enriquecer com dados dos usuários
      const enrichedWithdrawals = await Promise.all(
        (withdrawalsData || []).map(async (withdrawal) => {
          const { data: userData } = await supabaseAdmin
            .from('profiles')
            .select('name, email, avatar_url')
            .eq('id', withdrawal.user_id)
            .single()

          return {
            ...withdrawal,
            user_name: userData?.name,
            user_email: userData?.email,
            user_avatar_url: userData?.avatar_url
          }
        })
      )

      setWithdrawals(enrichedWithdrawals)

      // Calcular estatísticas
      const totalWithdrawals = enrichedWithdrawals.length
      const pendingWithdrawals = enrichedWithdrawals.filter(w => w.status === 'pending').length
      const completedWithdrawals = enrichedWithdrawals.filter(w => w.status === 'completed').length
      const totalAmount = enrichedWithdrawals.reduce((sum, w) => sum + w.amount, 0)
      const pendingAmount = enrichedWithdrawals
        .filter(w => w.status === 'pending')
        .reduce((sum, w) => sum + w.amount, 0)

      setStats({
        totalWithdrawals,
        pendingWithdrawals,
        completedWithdrawals,
        totalAmount,
        pendingAmount
      })

    } catch (error) {
      console.error('Erro ao carregar saques:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateWithdrawalStatus = async (withdrawalId: string, newStatus: DiamondWithdrawal['status'], notes?: string) => {
    if (processingIds.has(withdrawalId)) return

    try {
      setProcessingIds(prev => new Set(prev).add(withdrawalId))

      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      if (newStatus === 'completed' || newStatus === 'rejected') {
        updateData.processed_at = new Date().toISOString()
      }

      if (notes) {
        updateData.notes = notes
      }

      const { error } = await supabaseAdmin
        .from('diamond_withdrawals')
        .update(updateData)
        .eq('id', withdrawalId)

      if (error) throw error

      // Atualizar localmente
      setWithdrawals(prev => prev.map(withdrawal => 
        withdrawal.id === withdrawalId 
          ? { ...withdrawal, ...updateData }
          : withdrawal
      ))

      // Recarregar estatísticas
      loadWithdrawals()

      const statusMessages = {
        approved: 'Saque aprovado com sucesso!',
        completed: 'Saque marcado como enviado!',
        rejected: 'Saque rejeitado!'
      }

      alert(statusMessages[newStatus] || 'Status atualizado!')

    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status. Tente novamente.')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(withdrawalId)
        return newSet
      })
    }
  }

  const getStatusIcon = (status: DiamondWithdrawal['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={16} />
      case 'approved':
        return <CheckCircle className="text-blue-500" size={16} />
      case 'completed':
        return <CheckCircle className="text-green-500" size={16} />
      case 'rejected':
        return <XCircle className="text-red-500" size={16} />
      default:
        return <AlertCircle className="text-gray-500" size={16} />
    }
  }

  const getStatusColor = (status: DiamondWithdrawal['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: DiamondWithdrawal['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendente'
      case 'approved':
        return 'Aprovado'
      case 'completed':
        return 'Enviado'
      case 'rejected':
        return 'Rejeitado'
      default:
        return status
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
        <h1 className="text-3xl font-bold text-gray-900">Saques de Diamantes</h1>
        <p className="text-gray-600 mt-1">Gerencie as solicitações de saque de diamantes dos usuários</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Saques</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalWithdrawals}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Diamond size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pendingWithdrawals}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Enviados</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.completedWithdrawals}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Diamantes</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.totalAmount.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Diamond size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendente (💎)</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pendingAmount.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <AlertCircle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Saques */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Solicitações de Saque ({withdrawals.length})
          </h3>
        </div>
        
        <div className="p-6">
          {withdrawals.length > 0 ? (
            <div className="space-y-4">
              {withdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Informações do Usuário */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            {withdrawal.user_avatar_url ? (
                              <img
                                src={withdrawal.user_avatar_url}
                                alt={withdrawal.user_name || 'Avatar'}
                                className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white text-lg font-bold border-2 border-gray-200">
                                {(withdrawal.user_name || withdrawal.user_email || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-900">
                                {withdrawal.user_name || 'Nome não informado'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {withdrawal.user_email || 'Email não informado'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <Diamond className="text-blue-600" size={20} />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Valor Solicitado</p>
                              <p className="font-bold text-xl text-blue-600">
                                {withdrawal.amount.toLocaleString()} 💎
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Informações do Jogo */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-full">
                              <Server className="text-green-600" size={20} />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">ID do Servidor</p>
                              <p className="font-medium text-gray-900">{withdrawal.ml_zone_id}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-full">
                              <Gamepad2 className="text-purple-600" size={20} />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">ID do Jogador</p>
                              <p className="font-medium text-gray-900">{withdrawal.ml_user_id}</p>
                            </div>
                          </div>
                        </div>

                        {/* Informações de Data e Status */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-full">
                              <Calendar className="text-yellow-600" size={20} />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Data da Solicitação</p>
                              <p className="font-medium text-gray-900">
                                {new Date(withdrawal.created_at).toLocaleDateString('pt-BR')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(withdrawal.created_at).toLocaleTimeString('pt-BR')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {getStatusIcon(withdrawal.status)}
                            <div>
                              <p className="text-sm text-gray-600">Status</p>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(withdrawal.status)}`}>
                                {getStatusLabel(withdrawal.status)}
                              </span>
                            </div>
                          </div>

                          {withdrawal.processed_at && (
                            <div className="text-xs text-gray-500">
                              Processado em: {new Date(withdrawal.processed_at).toLocaleDateString('pt-BR')}
                            </div>
                          )}
                        </div>
                      </div>

                      {withdrawal.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">
                            <strong>Observações:</strong> {withdrawal.notes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2 ml-6">
                      {withdrawal.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateWithdrawalStatus(withdrawal.id, 'approved')}
                            disabled={processingIds.has(withdrawal.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            <Check size={16} />
                            {processingIds.has(withdrawal.id) ? 'Processando...' : 'Aprovar'}
                          </button>
                          
                          <button
                            onClick={() => updateWithdrawalStatus(withdrawal.id, 'rejected')}
                            disabled={processingIds.has(withdrawal.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            <X size={16} />
                            {processingIds.has(withdrawal.id) ? 'Processando...' : 'Rejeitar'}
                          </button>
                        </>
                      )}

                      {withdrawal.status === 'approved' && (
                        <button
                          onClick={() => updateWithdrawalStatus(withdrawal.id, 'completed')}
                          disabled={processingIds.has(withdrawal.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          <CheckCircle size={16} />
                          {processingIds.has(withdrawal.id) ? 'Processando...' : 'Marcar como Enviado'}
                        </button>
                      )}

                      {(withdrawal.status === 'completed' || withdrawal.status === 'rejected') && (
                        <div className="text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg ${getStatusColor(withdrawal.status)}`}>
                            {getStatusIcon(withdrawal.status)}
                            {getStatusLabel(withdrawal.status)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Diamond className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum saque encontrado</h3>
              <p className="text-gray-600">
                Quando os usuários solicitarem saques de diamantes, eles aparecerão aqui.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}