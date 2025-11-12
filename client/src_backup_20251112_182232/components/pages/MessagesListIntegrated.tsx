import React, { useState, useMemo, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { ticketsAPI } from '../../services/apiClient.ts';

type ViewMode = 'list' | 'card';

interface Ticket {
    id: number;
    ticket_id: string;
    subject: string;
    category: string;
    priority: '高' | '中' | '低';
    status: '受付中' | '対応中' | '完了';
    last_update: string;
    created_at: string;
}

const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'たった今';
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}分前`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}時間前`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
        return '昨日';
    }
    if (diffInDays < 7) {
        return `${diffInDays}日前`;
    }
    return date.toLocaleDateString('ja-JP');
};

const MessagesListIntegrated: React.FC = () => {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('list');

    useEffect(() => {
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

        fetchTickets();
    }, []);

    const getPriorityClass = (priority: '高' | '中' | '低') => {
        switch (priority) {
            case '高': return 'border-red-500';
            case '中': return 'border-yellow-500';
            case '低': return 'border-gray-300';
            default: return 'border-gray-300';
        }
    };
    
    const getStatusClass = (status: '対応中' | '完了' | '受付中') => {
        switch (status) {
            case '対応中': return 'bg-yellow-100 text-yellow-800';
            case '完了': return 'bg-green-100 text-green-800';
            case '受付中': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredTickets = useMemo(() => {
        return tickets.filter(ticket => {
            const searchLower = searchTerm.toLowerCase();
            return (
                ticket.subject.toLowerCase().includes(searchLower) ||
                ticket.ticket_id.toLowerCase().includes(searchLower) ||
                ticket.category.toLowerCase().includes(searchLower)
            );
        });
    }, [tickets, searchTerm]);

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

    const ListItem: React.FC<{ ticket: Ticket }> = ({ ticket }) => (
        <NavLink
            to={`/app/messages/${ticket.id}`}
            className={({ isActive }) => `block p-4 border-l-4 hover:bg-gray-50 border-b transition-colors ${isActive ? 'bg-blue-50 ' + getPriorityClass(ticket.priority) : 'border-transparent'}`}
        >
            <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-bold text-gray-800 truncate pr-2">{ticket.subject}</div>
            </div>
            <p className="text-sm text-gray-600 mb-2">チケットID: {ticket.ticket_id}</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
                <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${getStatusClass(ticket.status)}`}>
                        {ticket.status}
                    </span>
                    <span className="flex items-center" title="カテゴリ">
                        <i className="fas fa-folder w-4 text-center mr-1"></i>
                        <span className="truncate">{ticket.category}</span>
                    </span>
                    <span className="flex items-center" title="優先度">
                        <i className="fas fa-flag w-4 text-center mr-1"></i>
                        <span>{ticket.priority}</span>
                    </span>
                </div>
                <span className="text-right whitespace-nowrap ml-2">{formatRelativeTime(ticket.last_update)}</span>
            </div>
        </NavLink>
    );

    const CardItem: React.FC<{ ticket: Ticket }> = ({ ticket }) => (
        <NavLink
            to={`/app/messages/${ticket.id}`}
            className="block bg-white rounded-lg border hover:shadow-md transition-shadow p-4"
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900 line-clamp-2 flex-grow pr-2">{ticket.subject}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">ID: {ticket.ticket_id}</p>
            <div className="flex flex-wrap gap-2 items-center text-xs">
                <span className={`inline-flex items-center px-2 py-1 rounded-full font-medium ${getStatusClass(ticket.status)}`}>
                    {ticket.status}
                </span>
                <span className="text-gray-500">{ticket.category}</span>
                <span className="text-gray-500">優先度: {ticket.priority}</span>
                <span className="text-gray-400 ml-auto">{formatRelativeTime(ticket.last_update)}</span>
            </div>
        </NavLink>
    );

    return (
        <div className="fade-in">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">メッセージ・相談</h2>
                    <p className="text-sm text-gray-600 mt-1">運営とのやり取りを管理</p>
                </div>
                <NavLink
                    to="/app/messages/new"
                    className="inline-flex items-center justify-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors focus-ring"
                >
                    <i className="fas fa-plus mr-2"></i>
                    新しい相談を投稿
                </NavLink>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-grow">
                        <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="件名、カテゴリ、チケットIDで検索..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            <i className="fas fa-list"></i>
                        </button>
                        <button
                            onClick={() => setViewMode('card')}
                            className={`px-4 py-2 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            <i className="fas fa-th-large"></i>
                        </button>
                    </div>
                </div>
            </div>

            {filteredTickets.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                    <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">
                        {searchTerm ? '検索結果がありません' : 'まだメッセージがありません'}
                    </h3>
                    <p className="text-gray-500 mb-6">
                        {searchTerm ? '別のキーワードで検索してみてください' : '新しい相談を投稿して、運営とやり取りを始めましょう'}
                    </p>
                    {!searchTerm && (
                        <NavLink
                            to="/app/messages/new"
                            className="inline-flex items-center bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            新しい相談を投稿
                        </NavLink>
                    )}
                </div>
            ) : (
                <>
                    {viewMode === 'list' ? (
                        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                            {filteredTickets.map(ticket => (
                                <ListItem key={ticket.id} ticket={ticket} />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredTickets.map(ticket => (
                                <CardItem key={ticket.id} ticket={ticket} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MessagesListIntegrated;
