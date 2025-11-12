import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStaffTickets } from '../../services/staffApi';

interface Ticket {
  id: number;
  title: string;
  status: string;
  priority: string;
  category: string;
  company_name: string;
  contact_name: string;
  assignment_type: string;
  unread_count: number;
  message_count: number;
  created_at: string;
}

const StaffTicketList: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tickets, statusFilter, searchQuery]);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const response = await getStaffTickets();
      
      if (response.success) {
        setTickets(response.data.tickets);
      } else {
        setError(response.error || '相談一覧の読み込みに失敗しました');
      }
    } catch (err: any) {
      console.error('Load tickets error:', err);
      setError(err.response?.data?.error || '相談一覧の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...tickets];

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.company_name.toLowerCase().includes(query) ||
          t.contact_name.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query)
      );
    }

    setFilteredTickets(filtered);
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

  const getStatusCount = (status: string) => {
    if (status === 'all') return tickets.length;
    return tickets.filter((t) => t.status === status).length;
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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">担当相談一覧</h1>
              <p className="text-sm text-gray-600 mt-1">自分が担当するクライアントの相談</p>
            </div>
            <button
              onClick={() => navigate('/staff/dashboard')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <i className="fas fa-home mr-2"></i>
              ダッシュボード
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <i className="fas fa-exclamation-circle mr-2"></i>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                すべて ({getStatusCount('all')})
              </button>
              <button
                onClick={() => setStatusFilter('open')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'open'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                新規 ({getStatusCount('open')})
              </button>
              <button
                onClick={() => setStatusFilter('in_progress')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'in_progress'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                対応中 ({getStatusCount('in_progress')})
              </button>
              <button
                onClick={() => setStatusFilter('resolved')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  statusFilter === 'resolved'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                解決済 ({getStatusCount('resolved')})
              </button>
            </div>

            {/* Search */}
            <div className="relative flex-1 md:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="fas fa-search text-gray-400"></i>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="検索..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {filteredTickets.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <i className="fas fa-inbox text-4xl mb-4"></i>
              <p>
                {searchQuery || statusFilter !== 'all'
                  ? '該当する相談が見つかりません'
                  : '相談はまだありません'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
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
                        {ticket.assignment_type === 'main' && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <i className="fas fa-star mr-1"></i>主担当
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 space-x-4 flex-wrap">
                        <span>
                          <i className="fas fa-building mr-1"></i>
                          {ticket.company_name}
                        </span>
                        <span>
                          <i className="fas fa-user mr-1"></i>
                          {ticket.contact_name}
                        </span>
                        <span>
                          <i className="fas fa-tag mr-1"></i>
                          {ticket.category}
                        </span>
                        <span>
                          <i className="fas fa-comments mr-1"></i>
                          {ticket.message_count}件のメッセージ
                        </span>
                        <span>
                          <i className="fas fa-clock mr-1"></i>
                          {new Date(ticket.created_at).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StaffTicketList;
