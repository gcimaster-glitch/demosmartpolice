import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ticketsAPI } from '../../../services/apiClient.ts';

interface Ticket {
    id: number;
    ticket_id: string;
    client_id: number;
    subject: string;
    category: string;
    priority: '高' | '中' | '低';
    status: '受付中' | '対応中' | '完了';
    created_at: string;
    last_update: string;
    company_name?: string;
}

const AdminTicketManagementIntegrated: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        try {
            setLoading(true);
            const response = await ticketsAPI.getAll();
            if (response.success) {
                setTickets(response.data || []);
            } else {
                setError(response.error || 'データの取得に失敗しました');
            }
        } catch (err) {
            console.error('Tickets fetch error:', err);
            setError('チケット一覧の読み込みに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (ticketId: number, newStatus: '受付中' | '対応中' | '完了') => {
        try {
            const response = await ticketsAPI.updateStatus(ticketId, newStatus);
            if (response.success) {
                fetchTickets();
                alert('ステータスを更新しました');
            } else {
                alert(response.error || 'ステータスの更新に失敗しました');
            }
        } catch (err) {
            console.error('Status update error:', err);
            alert('ステータスの更新に失敗しました');
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        const matchesSearch = 
            ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
            ticket.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (ticket.company_name && ticket.company_name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case '受付中':
                return <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">受付中</span>;
            case '対応中':
                return <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">対応中</span>;
            case '完了':
                return <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">完了</span>;
            default:
                return <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case '高':
                return <span className="px-2 py-1 text-xs font-medium rounded bg-red-100 text-red-800">高</span>;
            case '中':
                return <span className="px-2 py-1 text-xs font-medium rounded bg-yellow-100 text-yellow-800">中</span>;
            case '低':
                return <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">低</span>;
            default:
                return <span className="px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">{priority}</span>;
        }
    };

    if (loading) {
        return (
            <div className="fade-in flex items-center justify-center h-64">
                <div className="text-center">
                    <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                    <p className="text-gray-600">読み込み中...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fade-in">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                    <div className="flex">
                        <i className="fas fa-exclamation-circle text-xl mr-3"></i>
                        <div>
                            <p className="font-bold">エラー</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">チケット管理</h1>
                <p className="text-gray-600 mt-2">全クライアントのチケット・相談の管理</p>
            </div>

            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">総チケット数</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{tickets.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">受付中</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">
                        {tickets.filter(t => t.status === '受付中').length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">対応中</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                        {tickets.filter(t => t.status === '対応中').length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">完了</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                        {tickets.filter(t => t.status === '完了').length}
                    </p>
                </div>
            </div>

            {/* フィルター・検索 */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-grow">
                        <input
                            type="text"
                            placeholder="件名、チケットID、企業名で検索..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="all">すべてのステータス</option>
                        <option value="受付中">受付中</option>
                        <option value="対応中">対応中</option>
                        <option value="完了">完了</option>
                    </select>
                </div>
            </div>

            {/* チケット一覧テーブル */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                チケットID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                件名
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                企業名
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                カテゴリ
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                優先度
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ステータス
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                最終更新
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                操作
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTickets.length > 0 ? (
                            filteredTickets.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{ticket.ticket_id}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900">{ticket.subject}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600">{ticket.company_name || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600">{ticket.category}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getPriorityBadge(ticket.priority)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(ticket.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600">
                                            {new Date(ticket.last_update).toLocaleDateString('ja-JP')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                to={`/admin/tickets/${ticket.id}`}
                                                className="text-primary hover:text-blue-700"
                                                title="詳細を見る"
                                            >
                                                <i className="fas fa-eye"></i>
                                            </Link>
                                            <select
                                                value={ticket.status}
                                                onChange={(e) => handleStatusChange(ticket.id, e.target.value as any)}
                                                className="text-xs border border-gray-300 rounded px-2 py-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <option value="受付中">受付中</option>
                                                <option value="対応中">対応中</option>
                                                <option value="完了">完了</option>
                                            </select>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                    {searchTerm || statusFilter !== 'all' 
                                        ? '検索条件に一致するチケットが見つかりません'
                                        : 'チケットがまだありません'
                                    }
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminTicketManagementIntegrated;
