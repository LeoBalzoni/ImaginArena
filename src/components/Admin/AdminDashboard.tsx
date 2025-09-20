import { useState, useEffect } from 'react'
import { AdminService } from '../../services/adminService'
import type { Tournament } from '../../lib/supabase'
import { UserManagement } from './UserManagement'
import { Trash2, Play, RotateCcw, Users, Calendar, AlertTriangle } from 'lucide-react'

interface TournamentWithCount extends Tournament {
  participant_count: number
}

export const AdminDashboard = () => {
  const [tournaments, setTournaments] = useState<TournamentWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'tournaments' | 'users'>('tournaments')

  useEffect(() => {
    loadTournaments()
  }, [])

  const loadTournaments = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await AdminService.getAllTournaments()
      setTournaments(data)
    } catch (err) {
      console.error('AdminDashboard: Error loading tournaments:', err)
      setError(err instanceof Error ? err.message : 'Failed to load tournaments')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTournament = async (tournamentId: string) => {
    if (!confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
      return
    }

    try {
      setActionLoading(tournamentId)
      await AdminService.deleteTournament(tournamentId)
      await loadTournaments() // Refresh the list
    } catch (err) {
      console.error('AdminDashboard: Error deleting tournament:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete tournament')
    } finally {
      setActionLoading(null)
    }
  }

  const handleForceFinish = async (tournamentId: string) => {
    if (!confirm('Are you sure you want to force finish this tournament?')) {
      return
    }

    try {
      setActionLoading(tournamentId)
      await AdminService.forceFinishTournament(tournamentId)
      await loadTournaments() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to finish tournament')
    } finally {
      setActionLoading(null)
    }
  }

  const handleResetToLobby = async (tournamentId: string) => {
    if (!confirm('Are you sure you want to reset this tournament to lobby? This will delete all matches.')) {
      return
    }

    try {
      setActionLoading(tournamentId)
      await AdminService.resetTournamentToLobby(tournamentId)
      await loadTournaments() // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset tournament')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'lobby':
        return 'bg-blue-100 text-blue-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'finished':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournaments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage all tournaments and users</p>
          
          {/* Tab Navigation */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('tournaments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tournaments'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Tournament Management
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                User Management
              </button>
            </nav>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        {/* Content based on active tab */}
        {activeTab === 'tournaments' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Tournaments</p>
                    <p className="text-2xl font-bold text-gray-900">{tournaments.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Play className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tournaments.filter(t => t.status === 'in_progress').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">In Lobby</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tournaments.filter(t => t.status === 'lobby').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Finished</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {tournaments.filter(t => t.status === 'finished').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tournament Management Tab */}
        {activeTab === 'tournaments' && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">All Tournaments</h2>
            </div>

            {tournaments.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No tournaments found</p>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tournament ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participants
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tournaments.map((tournament) => (
                    <tr key={tournament.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {tournament.id.slice(0, 8)}...
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(tournament.status)}`}>
                          {tournament.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tournament.participant_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(tournament.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {tournament.status === 'in_progress' && (
                            <button
                              onClick={() => handleForceFinish(tournament.id)}
                              disabled={actionLoading === tournament.id}
                              className="text-yellow-600 hover:text-yellow-900 disabled:opacity-50"
                              title="Force Finish"
                            >
                              <Play className="w-4 h-4" />
                            </button>
                          )}
                          
                          {tournament.status !== 'lobby' && (
                            <button
                              onClick={() => handleResetToLobby(tournament.id)}
                              disabled={actionLoading === tournament.id}
                              className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                              title="Reset to Lobby"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteTournament(tournament.id)}
                            disabled={actionLoading === tournament.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="Delete Tournament"
                          >
                            {actionLoading === tournament.id ? (
                              <div className="w-4 h-4 animate-spin border-2 border-red-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === 'users' && (
          <UserManagement />
        )}

        {/* Refresh Button for Tournaments Tab */}
        {activeTab === 'tournaments' && (
          <div className="mt-6 flex justify-center">
            <button
              onClick={loadTournaments}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
