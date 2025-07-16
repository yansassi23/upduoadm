import React, { useEffect, useState } from 'react'
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  Check, 
  X, 
  Clock, 
  User, 
  Calendar, 
  MessageSquare,
  Ban,
  CheckCircle,
  XCircle,
  Filter,
  Search
} from 'lucide-react'
import { supabaseAdmin } from '../lib/supabase'
import UserProfileModal from './UserProfileModal'

interface Report {
  id: string
  reporter_id: string
  reported_id: string
  match_id: string
  reason: string
  comment?: string
  status: 'pending' | 'reviewed' | 'resolved'
  created_at: string
  reporter_name?: string
  reporter_email?: string
  reporter_avatar_url?: string
  reported_name?: string
  reported_email?: string
  reported_avatar_url?: string
}

interface User {
  id: string
  email?: string
  name?: string
  age?: number
  city?: string
  bio?: string
  avatar_url?: string
  current_rank?: string
  favorite_heroes?: string[]
  favorite_lines?: string[]
  is_premium?: boolean
  diamond_count?: number
  created_at: string
  updated_at?: string
  is_active?: boolean
  min_age_filter?: number
  max_age_filter?: number
  selected_ranks_filter?: string[]
  selected_states_filter?: string[]
  selected_cities_filter?: string[]
  selected_lanes_filter?: string[]
  selected_heroes_filter?: string[]
  compatibility_mode_filter?: boolean
  ml_user_id?: string
  ml_zone_id?: string
  premium_activated_at?: string
}

const REPORT_REASONS = {
  'inappropriate_content': 'Conteúdo Inapropriado',
  'harassment': 'Assédio',
  'fake_profile': 'Perfil Falso',
  'spam': 'Spam',
  'underage': 'Menor de Idade',
  'violence': 'Violência',
  'hate_speech': 'Discurso de Ódio',
  'nudity': 'Nudez',
  'other': 'Outros'
}

export default function ModerationManagement() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'reviewed' | 'resolved'>('all')
  const [reasonFilter, setReasonFilter] = useState<string>('all')
  const [stats, setStats] = useState({
    totalReports: 0,
    pendingReports: 0,
    reviewedReports: 0,
    resolvedReports: 0,
    todayReports: 0
  })

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    try {
      setLoading(true)
      
      // Buscar todos os reports
      const { data: reportsData, error } = await supabaseAdmin
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error

      // Enriquecer com dados dos usuários
      const enrichedReports = await Promise.all(
        (reportsData || []).map(async (report) => {
          const enrichedReport = { ...report }
          
          // Buscar dados do denunciante
          if (report.reporter_id) {
            const { data: reporterData } = await supabaseAdmin
              .from('profiles')
              .select('name, email, avatar_url')
              .eq('id', report.reporter_id)
              .single()
            
            if (reporterData) {
              enrichedReport.reporter_name = reporterData.name
              enrichedReport.reporter_email = reporterData.email
              enrichedReport.reporter_avatar_url = reporterData.avatar_url
            }
          }
          
          // Buscar dados do denunciado
          if (report.reported_id) {
            const { data: reportedData } = await supabaseAdmin
              .from('profiles')
              .select('name, email, avatar_url')
              .eq('id', report.reported_id)
              .single()
            
            if (reportedData) {
              enrichedReport.reported_name = reportedData.name
              enrichedReport.reported_email = reportedData.email
              enrichedReport.reported_avatar_url = reportedData.avatar_url
            }
          }
          
          return enrichedReport
        })
      )

      setReports(enrichedReports)

      // Calcular estatísticas
      const totalReports = enrichedReports.length
      const pendingReports = enrichedReports.filter(r => r.status === 'pending').length
      const reviewedReports = enrichedReports.filter(r => r.status === 'reviewed').length
      const resolvedReports = enrichedReports.filter(r => r.status === 'resolved').length
      
      const today = new Date().toISOString().split('T')[0]
      const todayReports = enrichedReports.filter(r => 
        r.created_at.startsWith(today)
      ).length

      setStats({
        totalReports,
        pendingReports,
        reviewedReports,
        resolvedReports,
        todayReports
      })

    } catch (error) {
      console.error('Erro ao carregar denúncias:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateReportStatus = async (reportId: string, newStatus: Report['status']) => {
    if (processingIds.has(reportId)) return

    try {
      setProcessingIds(prev => new Set(prev).add(reportId))

      const { error } = await supabaseAdmin
        .from('reports')
        .update({ status: newStatus })
        .eq('id', reportId)

      if (error) throw error

      // Atualizar localmente
      setReports(prev => prev.map(report => 
        report.id === reportId 
          ? { ...report, status: newStatus }
          : report
      ))

      // Recarregar estatísticas
      loadReports()

      const statusMessages = {
        reviewed: 'Denúncia marcada como revisada!',
        resolved: 'Denúncia marcada como resolvida!',
        pending: 'Denúncia marcada como pendente!'
      }

      alert(statusMessages[newStatus] || 'Status atualizado!')

    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      alert('Erro ao atualizar status. Tente novamente.')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(reportId)
        return newSet
      })
    }
  }

  const handleViewReportedUser = async (userId: string) => {
    try {
      const { data: userData, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (userData) {
        setSelectedUser(userData)
        setIsProfileModalOpen(true)
      }
    } catch (error) {
      console.error('Erro ao carregar perfil do usuário:', error)
      alert('Erro ao carregar perfil do usuário')
    }
  }

  const handleCloseModal = () => {
    setIsProfileModalOpen(false)
    setSelectedUser(null)
  }

  const handleUserUpdate = (updatedUser: User) => {
    setSelectedUser(updatedUser)
  }

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={16} />
      case 'reviewed':
        return <Eye className="text-blue-500" size={16} />
      case 'resolved':
        return <CheckCircle className="text-green-500" size={16} />
      default:
        return <AlertTriangle className="text-gray-500" size={16} />
    }
  }

  const getStatusColor = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'reviewed':
        return 'bg-blue-100 text-blue-800'
      case 'resolved':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: Report['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendente'
      case 'reviewed':
        return 'Revisada'
      case 'resolved':
        return 'Resolvida'
      default:
        return status
    }
  }

  const getPriorityColor = (reason: string) => {
    const highPriority = ['harassment', 'violence', 'hate_speech', 'underage']
    const mediumPriority = ['inappropriate_content', 'fake_profile', 'nudity']
    
    if (highPriority.includes(reason)) {
      return 'border-l-4 border-red-500 bg-red-50'
    } else if (mediumPriority.includes(reason)) {
      return 'border-l-4 border-yellow-500 bg-yellow-50'
    } else {
      return 'border-l-4 border-blue-500 bg-blue-50'
    }
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' || 
      report.reporter_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reported_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reporter_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reported_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.comment?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    const matchesReason = reasonFilter === 'all' || report.reason === reasonFilter

    return matchesSearch && matchesStatus && matchesReason
  })

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
        <h1 className="text-3xl font-bold text-gray-900">Moderação de Conteúdo</h1>
        <p className="text-gray-600 mt-1">Gerencie denúncias e modere o conteúdo da plataforma</p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Denúncias</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalReports}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Shield size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pendingReports}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <Clock size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Revisadas</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{stats.reviewedReports}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Eye size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolvidas</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{stats.resolvedReports}</p>
            </div>
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <CheckCircle size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hoje</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{stats.todayReports}</p>
            </div>
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <AlertTriangle size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar denúncias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Status</option>
            <option value="pending">Pendentes</option>
            <option value="reviewed">Revisadas</option>
            <option value="resolved">Resolvidas</option>
          </select>

          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Motivos</option>
            {Object.entries(REPORT_REASONS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            <Filter size={16} className="mr-2" />
            {filteredReports.length} de {reports.length} denúncias
          </div>
        </div>
      </div>

      {/* Lista de Denúncias */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Denúncias ({filteredReports.length})
          </h3>
        </div>
        
        <div className="p-6">
          {filteredReports.length > 0 ? (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <div key={report.id} className={`rounded-lg p-6 hover:shadow-md transition-shadow ${getPriorityColor(report.reason)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Informações da Denúncia */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 rounded-full">
                              <AlertTriangle className="text-red-600" size={20} />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Motivo</p>
                              <p className="font-semibold text-gray-900">
                                {REPORT_REASONS[report.reason] || report.reason}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <Calendar className="text-blue-600" size={20} />
                            </div>
                            <div>
                              <p className="text-sm text-gray-600">Data da Denúncia</p>
                              <p className="font-medium text-gray-900">
                                {new Date(report.created_at).toLocaleDateString('pt-BR')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(report.created_at).toLocaleTimeString('pt-BR')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {getStatusIcon(report.status)}
                            <div>
                              <p className="text-sm text-gray-600">Status</p>
                              <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                                {getStatusLabel(report.status)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Denunciante */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <User size={16} />
                            Denunciante
                          </h4>
                          
                          <div className="flex items-center gap-3">
                            {report.reporter_avatar_url ? (
                              <img
                                src={report.reporter_avatar_url}
                                alt={report.reporter_name || 'Denunciante'}
                                className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold border-2 border-gray-200">
                                {(report.reporter_name || report.reporter_email || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {report.reporter_name || 'Nome não informado'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {report.reporter_email || 'Email não informado'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Denunciado */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Ban size={16} />
                            Denunciado
                          </h4>
                          
                          <div className="flex items-center gap-3">
                            {report.reported_avatar_url ? (
                              <img
                                src={report.reported_avatar_url}
                                alt={report.reported_name || 'Denunciado'}
                                className="w-10 h-10 rounded-full object-cover border-2 border-red-200"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white font-bold border-2 border-red-200">
                                {(report.reported_name || report.reported_email || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">
                                {report.reported_name || 'Nome não informado'}
                              </p>
                              <p className="text-sm text-gray-600">
                                {report.reported_email || 'Email não informado'}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleViewReportedUser(report.reported_id)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Eye size={16} />
                            Ver Perfil Completo
                          </button>
                        </div>
                      </div>

                      {/* Comentário da Denúncia */}
                      {report.comment && (
                        <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="text-gray-500" size={16} />
                            <span className="text-sm font-medium text-gray-700">Comentário da Denúncia:</span>
                          </div>
                          <p className="text-sm text-gray-700 italic">"{report.comment}"</p>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex flex-col gap-2 ml-6">
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateReportStatus(report.id, 'reviewed')}
                            disabled={processingIds.has(report.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            <Eye size={16} />
                            {processingIds.has(report.id) ? 'Processando...' : 'Marcar como Revisada'}
                          </button>
                          
                          <button
                            onClick={() => updateReportStatus(report.id, 'resolved')}
                            disabled={processingIds.has(report.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                          >
                            <Check size={16} />
                            {processingIds.has(report.id) ? 'Processando...' : 'Resolver'}
                          </button>
                        </>
                      )}

                      {report.status === 'reviewed' && (
                        <button
                          onClick={() => updateReportStatus(report.id, 'resolved')}
                          disabled={processingIds.has(report.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        >
                          <Check size={16} />
                          {processingIds.has(report.id) ? 'Processando...' : 'Resolver'}
                        </button>
                      )}

                      {report.status === 'resolved' && (
                        <div className="text-center">
                          <span className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold rounded-lg bg-green-100 text-green-800">
                            <CheckCircle size={16} />
                            Resolvida
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
              <Shield className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || statusFilter !== 'all' || reasonFilter !== 'all' 
                  ? 'Nenhuma denúncia encontrada com os filtros aplicados'
                  : 'Nenhuma denúncia encontrada'
                }
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== 'all' || reasonFilter !== 'all'
                  ? 'Tente ajustar os filtros para ver mais resultados.'
                  : 'Quando os usuários fizerem denúncias, elas aparecerão aqui para moderação.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Perfil do Usuário */}
      <UserProfileModal
        user={selectedUser}
        isOpen={isProfileModalOpen}
        onClose={handleCloseModal}
        onUserUpdate={handleUserUpdate}
      />
    </div>
  )
}