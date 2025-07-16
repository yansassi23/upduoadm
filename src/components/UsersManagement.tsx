import React, { useEffect, useState } from 'react'
import { Search, Filter, MoreVertical, Shield, Ban, Eye, Crown, Diamond } from 'lucide-react'
import { supabaseAdmin } from '../lib/supabase'
import UserProfileModal from './UserProfileModal'

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
  [key: string]: any
}

export default function UsersManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [userTable, setUserTable] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (error) throw error
      setUsers(data || [])
      setUserTable('profiles')
    } catch (error) {
      console.error('Erro ao carregar usuários:', error)
      setUserTable(null)
    } finally {
      setLoading(false)
    }
  }

  const handleViewProfile = (user: User) => {
    setSelectedUser(user)
    setIsProfileModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsProfileModalOpen(false)
    setSelectedUser(null)
  }

  const handleUserUpdate = (updatedUser: User) => {
    setUsers(users.map(user => 
      user.id === updatedUser.id ? updatedUser : user
    ))
    setSelectedUser(updatedUser)
  }

  const filteredUsers = users.filter(user => {
    const searchFields = [user.email, user.name, user.id].filter(Boolean)
    return searchFields.some(field => 
      field?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!userTable) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Tabela de Usuários Não Encontrada</h3>
        <p className="text-gray-600">
          Não foi possível encontrar uma tabela de usuários no banco de dados.
          Verifique se existe uma tabela chamada 'users', 'profiles', 'user_profiles' ou 'accounts'.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="text-gray-600 mt-1">Gerencie e modere os usuários do seu aplicativo</p>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por email, nome ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={20} />
            Filtros
          </button>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Usuários ({filteredUsers.length})
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuário
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Premium
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Diamantes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data de Cadastro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt={user.name || 'Avatar'}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                          {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name || 'Nome não informado'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.city || 'Cidade não informada'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email || 'Email não informado'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_premium
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      <Crown size={12} />
                      {user.is_premium ? 'Premium' : 'Gratuito'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 text-sm text-gray-900">
                      <Diamond className="text-blue-500" size={14} />
                      {user.diamond_count || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_active !== false
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active !== false ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleViewProfile(user)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                        title="Ver perfil completo"
                      >
                        <Eye size={16} />
                      </button>
                      <button className="text-yellow-600 hover:text-yellow-900 p-1 rounded hover:bg-yellow-50 transition-colors">
                        <Shield size={16} />
                      </button>
                      <button className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors">
                        <Ban size={16} />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900 p-1 rounded hover:bg-gray-50 transition-colors">
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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