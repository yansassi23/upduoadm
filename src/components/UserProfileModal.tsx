import React, { useState } from 'react'
import { X, User, Mail, MapPin, Calendar, Crown, Diamond, Star, Gamepad2, Target } from 'lucide-react'
import { supabaseAdmin } from '../lib/supabase'

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

interface UserProfileModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onUserUpdate: (updatedUser: User) => void
}

export default function UserProfileModal({ user, isOpen, onClose, onUserUpdate }: UserProfileModalProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [diamondsToAdd, setDiamondsToAdd] = useState('')

  if (!isOpen || !user) return null

  const handleTogglePremium = async () => {
    try {
      setIsUpdating(true)
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ 
          is_premium: !user.is_premium,
          premium_activated_at: !user.is_premium ? new Date().toISOString() : null
        })
        .eq('id', user.id)
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        onUserUpdate({ 
          ...user, 
          is_premium: !user.is_premium,
          premium_activated_at: !user.is_premium ? new Date().toISOString() : null
        })
      } else {
        alert('Usuário não encontrado ou não foi possível atualizar')
      }
    } catch (error) {
      console.error('Erro ao atualizar status premium:', error)
      alert('Erro ao atualizar status premium')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleAddDiamonds = async () => {
    const amount = parseInt(diamondsToAdd)
    if (!amount || amount <= 0) {
      alert('Por favor, insira um número válido de diamantes')
      return
    }

    try {
      setIsUpdating(true)
      const newDiamondCount = (user.diamond_count || 0) + amount
      
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .update({ diamond_count: newDiamondCount })
        .eq('id', user.id)
        .select()

      if (error) throw error

      if (data && data.length > 0) {
        onUserUpdate({ ...user, diamond_count: newDiamondCount })
        setDiamondsToAdd('')
      } else {
        alert('Usuário não encontrado ou não foi possível atualizar')
      }
    } catch (error) {
      console.error('Erro ao adicionar diamantes:', error)
      alert('Erro ao adicionar diamantes')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Perfil do Usuário</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Foto e Info Principal */}
            <div className="lg:col-span-1">
              <div className="text-center">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name || 'Avatar'}
                    className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-gray-200"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full mx-auto bg-blue-500 flex items-center justify-center text-white text-4xl font-bold border-4 border-gray-200">
                    {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
                <h3 className="text-xl font-semibold text-gray-900 mt-4">
                  {user.name || 'Nome não informado'}
                </h3>
                <p className="text-gray-600">{user.age ? `${user.age} anos` : 'Idade não informada'}</p>
              </div>

              {/* Status Premium e Diamantes */}
              <div className="mt-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Crown className={user.is_premium ? 'text-yellow-500' : 'text-gray-400'} size={20} />
                      <span className="font-medium">Status Premium</span>
                    </div>
                    <button
                      onClick={handleTogglePremium}
                      disabled={isUpdating}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        user.is_premium
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {user.is_premium ? 'Premium' : 'Gratuito'}
                    </button>
                  </div>
                  
                  {user.is_premium && user.premium_activated_at && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-gray-600">Premium desde:</span>
                      <span className="font-medium">
                        {new Date(user.premium_activated_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2 mb-3">
                    <Diamond className="text-blue-500" size={20} />
                    <span className="font-medium">Diamantes: {user.diamond_count || 0}</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={diamondsToAdd}
                      onChange={(e) => setDiamondsToAdd(e.target.value)}
                      placeholder="Quantidade"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      min="1"
                    />
                    <button
                      onClick={handleAddDiamonds}
                      disabled={isUpdating || !diamondsToAdd}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações Detalhadas */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informações Pessoais */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User size={20} />
                  Informações Pessoais
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <p className="font-medium">{user.email || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Cidade:</span>
                    <p className="font-medium">{user.city || 'Não informada'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Rank Atual:</span>
                    <p className="font-medium">{user.current_rank || 'Não informado'}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">ID ML:</span>
                    <p className="font-medium">{user.ml_user_id || 'Não vinculado'}</p>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {user.bio && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Bio</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{user.bio}</p>
                </div>
              )}

              {/* Preferências de Jogo */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Gamepad2 size={20} />
                  Preferências de Jogo
                </h4>
                <div className="space-y-3 text-sm">
                  {user.favorite_heroes && user.favorite_heroes.length > 0 && (
                    <div>
                      <span className="text-gray-600">Heróis Favoritos:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.favorite_heroes.map((hero, index) => (
                          <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {hero}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {user.favorite_lines && user.favorite_lines.length > 0 && (
                    <div>
                      <span className="text-gray-600">Lanes Favoritas:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.favorite_lines.map((line, index) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                            {line}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Filtros de Busca */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target size={20} />
                  Filtros de Busca
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Faixa de Idade:</span>
                    <p className="font-medium">
                      {user.min_age_filter || 18} - {user.max_age_filter || 35} anos
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Modo Compatibilidade:</span>
                    <p className="font-medium">
                      {user.compatibility_mode_filter ? 'Ativado' : 'Desativado'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Datas */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Calendar size={20} />
                  Informações da Conta
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Cadastro:</span>
                    <p className="font-medium">
                      {new Date(user.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Última Atualização:</span>
                    <p className="font-medium">
                      {user.updated_at 
                        ? new Date(user.updated_at).toLocaleDateString('pt-BR')
                        : 'Não disponível'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  )
}