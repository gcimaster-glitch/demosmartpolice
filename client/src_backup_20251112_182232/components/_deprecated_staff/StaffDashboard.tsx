import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStaffDashboardStats, getStaffTickets } from '../../services/staffApi';

interface DashboardStats {
  totalClients: number;
  newTickets: number;
  inProgressTickets: number;
  resolvedThisMonth: number;
}

interface Ticket {
  id: number;
  title: string;
  status: string;
  priority: string;
  company_name: string;
  contact_name: string;
  assignment_type: string;
  unread_count: number;
  created_at: string;
}

const StaffDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Load stats
      const statsResponse = await getStaffDashboardStats();
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }

      // Load recent tickets
      const ticketsResponse = await getStaffTickets();
      if (ticketsResponse.success) {
        // Get only the 5 most recent tickets
        setRecentTickets(ticketsResponse.data.tickets.slice(0, 5));
      }
    } catch (err: any) {
      console.error('Load dashboard error:', err);
      setError('ダッシュボードデータの読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/staff/login');
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      open: { label: '新規', className: 'bg-blue-100 text-blue-800' },
      in_progress: { label: '対応中', className: 'bg-yellow-100 text-yellow-800' },
      resolved: { label: '解決済', className: 'bg-green-100 text-green-800' },
      closed: { label: '完了', className: 'bg-gray-100 text-gray-800' },
    };
    const config = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityIcon = (priority: string) => {
    const priorityMap: Record<string, { icon: string; className: string }> = {
      high: { icon: 'fa-exclamation-circle', className: 'text-red-500' },
      medium: { icon: 'fa-minus-circle', className: 'text-yellow-500' },
      low: { icon: 'fa-info-circle', className: 'text-green-500' },
    };
    const config = priorityMap[priority] || { icon: 'fa-circle', className: 'text-gray-500' };
    return <i className={`fas ${config.icon} ${config.className}`}></i>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {user.photoUrl ? (
                  <img
                    src={user.photoUrl}
                    alt={user.name}
                    className="h-12 w-12 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=3B82F6&color=fff&size=128`;
                    }}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {user.name?.charAt(0) || 'S'}
                    </span>
                  </div>
                )}
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">{user.name}さん</h1>
                <p className="text-sm text-gray-600">
                  {user.position || user.staffRole || '担当者'} - Smart Police Portal
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              ログアウト
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-lg p-3">
                <i className="fas fa-building text-blue-600 text-2xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">担当クライアント</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalClients || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-100 rounded-lg p-3">
                <i className="fas fa-inbox text-yellow-600 text-2xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">新規相談</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.newTickets || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-orange-100 rounded-lg p-3">
                <i className="fas fa-clock text-orange-600 text-2xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">対応中</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.inProgressTickets || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-100 rounded-lg p-3">
                <i className="fas fa-check-circle text-green-600 text-2xl"></i>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">今月の解決数</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.resolvedThisMonth || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Tickets */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              <i className="fas fa-list-ul mr-2 text-blue-600"></i>
              最近の相談
            </h2>
            <button
              onClick={() => navigate('/staff/tickets')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              すべて表示 <i className="fas fa-arrow-right ml-1"></i>
            </button>
          </div>
          <div className="divide-y divide-gray-200">
            {recentTickets.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                <i className="fas fa-inbox text-4xl mb-4"></i>
                <p>相談はまだありません</p>
              </div>
            ) : (
              recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/staff/tickets/${ticket.id}`)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center mb-2">
                        {getPriorityIcon(ticket.priority)}
                        <h3 className="ml-2 text-sm font-semibold text-gray-900 truncate">
                          {ticket.title}
                        </h3>
                        {ticket.unread_count > 0 && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {ticket.unread_count}件未読
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 space-x-4">
                        <span>
                          <i className="fas fa-building mr-1"></i>
                          {ticket.company_name}
                        </span>
                        <span>
                          <i className="fas fa-user mr-1"></i>
                          {ticket.contact_name}
                        </span>
                        <span>
                          <i className="fas fa-clock mr-1"></i>
                          {new Date(ticket.created_at).toLocaleDateString('ja-JP')}
                        </span>
                        {ticket.assignment_type === 'main' && (
                          <span className="text-blue-600">
                            <i className="fas fa-star mr-1"></i>主担当
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;
