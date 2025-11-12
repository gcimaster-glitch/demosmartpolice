import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getStaffTicketDetail, replyToTicket, updateTicketStatus } from '../../services/staffApi';

interface Message {
  id: number;
  message: string;
  is_from_client: boolean;
  sender_name?: string;
  staff_name?: string;
  created_at: string;
}

interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  company_name: string;
  contact_name: string;
  main_assignee_id: number;
  sub_assignee_id: number;
  created_at: string;
}

const StaffTicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (id) {
      loadTicketDetail();
    }
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadTicketDetail = async () => {
    try {
      setIsLoading(true);
      const response = await getStaffTicketDetail(Number(id));
      
      if (response.success) {
        setTicket(response.data.ticket);
        setMessages(response.data.messages || []);
      } else {
        setError(response.error || '相談の読み込みに失敗しました');
      }
    } catch (err: any) {
      console.error('Load ticket error:', err);
      setError(err.response?.data?.error || '相談の読み込みに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;

    try {
      setIsSending(true);
      const response = await replyToTicket(Number(id), newMessage);
      
      if (response.success) {
        setNewMessage('');
        await loadTicketDetail(); // Reload to get the new message
      } else {
        setError(response.error || '送信に失敗しました');
      }
    } catch (err: any) {
      console.error('Send message error:', err);
      setError(err.response?.data?.error || '送信に失敗しました');
    } finally {
      setIsSending(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return;

    try {
      const response = await updateTicketStatus(ticket.id, newStatus);
      
      if (response.success) {
        setTicket({ ...ticket, status: newStatus });
      } else {
        setError(response.error || 'ステータス更新に失敗しました');
      }
    } catch (err: any) {
      console.error('Update status error:', err);
      setError(err.response?.data?.error || 'ステータス更新に失敗しました');
    }
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

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { label: string; className: string }> = {
      high: { label: '高', className: 'bg-red-100 text-red-800' },
      medium: { label: '中', className: 'bg-yellow-100 text-yellow-800' },
      low: { label: '低', className: 'bg-green-100 text-green-800' },
    };
    const config = priorityMap[priority] || { label: priority, className: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.className}`}>
        {config.label}
      </span>
    );
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

  if (!ticket) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-red-600 mb-4"></i>
          <p className="text-gray-600">相談が見つかりません</p>
          <button
            onClick={() => navigate('/staff/tickets')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            相談一覧に戻る
          </button>
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
            <button
              onClick={() => navigate('/staff/tickets')}
              className="text-gray-600 hover:text-gray-900"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              相談一覧に戻る
            </button>
            <div className="flex items-center space-x-2">
              {getStatusBadge(ticket.status)}
              {getPriorityBadge(ticket.priority)}
            </div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">{ticket.title}</h1>
              <div className="prose max-w-none text-gray-700 mb-6">
                {ticket.description}
              </div>
              <div className="flex items-center text-sm text-gray-500 space-x-4">
                <span>
                  <i className="fas fa-calendar mr-1"></i>
                  {new Date(ticket.created_at).toLocaleString('ja-JP')}
                </span>
                <span>
                  <i className="fas fa-tag mr-1"></i>
                  {ticket.category}
                </span>
              </div>
            </div>

            {/* Messages */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  <i className="fas fa-comments mr-2 text-blue-600"></i>
                  メッセージ履歴
                </h2>
              </div>
              <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">まだメッセージがありません</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_from_client ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg p-4 ${
                          msg.is_from_client
                            ? 'bg-gray-100 text-gray-900'
                            : 'bg-blue-600 text-white'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          <span className="text-xs font-semibold">
                            {msg.is_from_client ? msg.sender_name : msg.staff_name || user.name}
                          </span>
                          <span className="text-xs opacity-75 ml-2">
                            {new Date(msg.created_at).toLocaleString('ja-JP')}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Reply Form */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="返信メッセージを入力..."
                    rows={3}
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    disabled={isSending}
                  />
                  <button
                    type="submit"
                    disabled={isSending || !newMessage.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane mr-2"></i>
                        送信
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Client Info */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <i className="fas fa-building mr-2 text-blue-600"></i>
                クライアント情報
              </h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">企業名:</span>
                  <p className="font-medium text-gray-900">{ticket.company_name}</p>
                </div>
                <div>
                  <span className="text-gray-600">担当者:</span>
                  <p className="font-medium text-gray-900">{ticket.contact_name}</p>
                </div>
              </div>
            </div>

            {/* Status Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <i className="fas fa-tasks mr-2 text-blue-600"></i>
                ステータス変更
              </h3>
              <div className="space-y-2">
                {ticket.status !== 'in_progress' && (
                  <button
                    onClick={() => handleStatusChange('in_progress')}
                    className="w-full px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 text-sm font-medium"
                  >
                    <i className="fas fa-clock mr-2"></i>
                    対応中にする
                  </button>
                )}
                {ticket.status !== 'resolved' && (
                  <button
                    onClick={() => handleStatusChange('resolved')}
                    className="w-full px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 text-sm font-medium"
                  >
                    <i className="fas fa-check-circle mr-2"></i>
                    解決済みにする
                  </button>
                )}
                {ticket.status !== 'closed' && (
                  <button
                    onClick={() => handleStatusChange('closed')}
                    className="w-full px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  >
                    <i className="fas fa-times-circle mr-2"></i>
                    完了にする
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffTicketDetail;
