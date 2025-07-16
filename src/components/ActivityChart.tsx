import React from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Seg', matches: 45, usuarios: 120, mensagens: 890 },
  { name: 'Ter', matches: 52, usuarios: 98, mensagens: 1200 },
  { name: 'Qua', matches: 67, usuarios: 156, mensagens: 980 },
  { name: 'Qui', matches: 43, usuarios: 87, mensagens: 1100 },
  { name: 'Sex', matches: 89, usuarios: 201, mensagens: 1450 },
  { name: 'Sab', matches: 112, usuarios: 234, mensagens: 1890 },
  { name: 'Dom', matches: 95, usuarios: 189, mensagens: 1560 },
]

export default function ActivityChart() {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="matches" fill="#EC4899" name="Matches" />
          <Bar dataKey="usuarios" fill="#3B82F6" name="Novos Usuários" />
          <Bar dataKey="mensagens" fill="#10B981" name="Mensagens" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}