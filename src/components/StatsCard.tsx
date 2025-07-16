import React from 'react'
import { DivideIcon as LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'pink' | 'purple' | 'yellow' | 'indigo'
  change?: string
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  pink: 'bg-pink-100 text-pink-600',
  purple: 'bg-purple-100 text-purple-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  indigo: 'bg-indigo-100 text-indigo-600',
}

export default function StatsCard({ title, value, icon: Icon, color, change }: StatsCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {change && (
            <p className="text-sm text-gray-500 mt-1">{change}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}