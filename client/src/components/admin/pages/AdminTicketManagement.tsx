import React, { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ticketsAPI, staffAPI } from '../../../services/apiClient.ts';

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
    assignee_id?: number | null;
    company_name?: string;
    main_assignee_name?: string | null;
    sub_assignee_name?: string | null;
}

interface Message {
    id: string;
    ticket_id: number;
    sender_user_id: number;
    sender_type: 'user' | 'support' | 'admin' | 'system';
    text: string;
    timestamp: string;
    read_by: number[];
}

interface Staff {
    id: number;
    name: string;
    real_name: string;
    email: string;
    role: string;
    approval_status: string;
}

// チケット詳細ビュー
const TicketDetailView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [clientInfo, setClientInfo] = useState<any>(null);
    const [staff, setStaff] = useState<Staff[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        if (id) {
            fetchTicketDetail();
            fetchStaff();
        }
    }, [id]);

    const fetchTicketDetail = async () => {
        try {
            setLoading(true);
            const response = await ticketsAPI.getById(parseInt(id!));
            if (response.success && response.data) {
                setTicket(response.data.ticket);
                setMessages(response.data.messages || []);
                setClientInfo(response.data.client);
            } else {
                setError(response.error || 'チケット情報の取得に失敗しました');
            }
        } catch (err) {
            console.error('Ticket detail fetch error:', err);
            setError('チケット詳細の読み込みに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const fetchStaff = async () => {
        try {
            const response = await staffAPI.getAll();
            if (response.success) {
                const approvedStaff = (response.data || []).filter((s: Staff) => s.approval_status === 'approved');
                setStaff(approvedStaff);
            }
        } catch (err) {
            console.error('Staff fetch error:', err);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !id) return;

        try {
            setSending(true);
            const response = await ticketsAPI.addMessage(parseInt(id), newMessage);
            if (response.success) {
                setNewMessage('');
                fetchTicketDetail(); // リロードしてメッセージ一覧を更新
            } else {
                alert(response.error || 'メッセージの送信に失敗しました');
            }
        } catch (err) {
            console.error('Send message error:', err);
            alert('メッセージの送信に失敗しました');
        } finally {
            setSending(false);
        }
    };

    const handleStatusChange = async (newStatus: '受付中' | '対応中' | '完了') => {
        if (!id) return;
        
        try {
            const response = await ticketsAPI.updateStatus(parseInt(id), newStatus);
            if (response.success) {
                fetchTicketDetail();
                alert('ステータスを更新しました');
            } else {
                alert(response.error || 'ステータスの更新に失敗しました');
            }
        } catch (err) {
            console.error('Status update error:', err);
            alert('ステータスの更新に失敗しました');
        }
    };

    const handleAssignStaff = async (staffId: number | null) => {
        if (!id) return;

        try {
            const response = await ticketsAPI.assignStaff(parseInt(id), staffId);
            if (response.success) {
                fetchTicketDetail();
                alert('担当者を割り当てました');
            } else {
                alert(response.error || '担当者の割り当てに失敗しました');
            }
        } catch (err) {
            console.error('Assign staff error:', err);
            alert('担当者の割り当てに失敗しました');
        }
    };

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

    const getSenderBadge = (senderType: string) => {
        switch (senderType) {
            case 'user':
                return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">クライアント</span>;
            case 'support':
                return <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">担当者</span>;
            case 'admin':
                return <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">管理者</span>;
            case 'system':
                return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-800">システム</span>;
            default:
                return null;
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

    if (error || !ticket) {
        return (
            <div className="fade-in">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                    <div className="flex">
                        <i className="fas fa-exclamation-circle text-xl mr-3"></i>
                        <div>
                            <p className="font-bold">エラー</p>
                            <p className="text-sm">{error || 'チケットが見つかりません'}</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/app/admin/tickets')}
                    className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700"
                >
                    <i className="fas fa-arrow-left mr-2"></i>
                    チケット一覧に戻る
                </button>
            </div>
        );
    }

    return (
        <div className="fade-in space-y-6">
            {/* ヘッダー */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/app/admin/tickets')}
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <i className="fas fa-arrow-left text-xl"></i>
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">チケット詳細</h1>
                        <p className="text-gray-600 mt-1">ID: {ticket.ticket_id}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <select
                        value={ticket.status}
                        onChange={(e) => handleStatusChange(e.target.value as any)}
                        className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="受付中">受付中</option>
                        <option value="対応中">対応中</option>
                        <option value="完了">完了</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* メインコンテンツ */}
                <div className="lg:col-span-2 space-y-6">
                    {/* チケット情報カード */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="mb-4">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">{ticket.subject}</h2>
                            <div className="flex gap-2">
                                {getStatusBadge(ticket.status)}
                                {getPriorityBadge(ticket.priority)}
                                <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                    {ticket.category}
                                </span>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">クライアント</p>
                                <p className="font-medium text-gray-900">{clientInfo?.company_name || ticket.company_name || '-'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">作成日時</p>
                                <p className="font-medium text-gray-900">
                                    {new Date(ticket.created_at).toLocaleString('ja-JP')}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">最終更新</p>
                                <p className="font-medium text-gray-900">
                                    {new Date(ticket.last_update).toLocaleString('ja-JP')}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-500">担当者</p>
                                <p className="font-medium text-gray-900">
                                    {clientInfo?.main_assignee_real_name || ticket.main_assignee_name || '未割り当て'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 会話履歴 */}
                    <div className="bg-white rounded-lg shadow-sm">
                        <div className="p-6 border-b">
                            <h3 className="text-lg font-bold text-gray-900">
                                <i className="fas fa-comments mr-2 text-primary"></i>
                                会話履歴
                            </h3>
                        </div>
                        <div className="p-6">
                            {messages.length === 0 ? (
                                <div className="text-center py-8 text-gray-500">
                                    <i className="fas fa-inbox text-4xl mb-4"></i>
                                    <p>まだメッセージがありません</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((msg) => (
                                        <div
                                            key={msg.id}
                                            className={`flex ${msg.sender_type === 'user' ? 'justify-start' : 'justify-end'}`}
                                        >
                                            <div className={`max-w-[75%] ${msg.sender_type === 'user' ? 'bg-gray-100' : 'bg-blue-100'} rounded-lg p-4`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    {getSenderBadge(msg.sender_type)}
                                                    <span className="text-xs text-gray-500">
                                                        {new Date(msg.timestamp).toLocaleString('ja-JP')}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-800 whitespace-pre-wrap">{msg.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 返信フォーム */}
                        <div className="p-6 border-t bg-gray-50">
                            <div className="space-y-3">
                                <textarea
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="メッセージを入力..."
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                    disabled={sending || ticket.status === '完了'}
                                />
                                <div className="flex justify-end">
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={sending || !newMessage.trim() || ticket.status === '完了'}
                                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {sending ? (
                                            <>
                                                <i className="fas fa-spinner fa-spin"></i>
                                                送信中...
                                            </>
                                        ) : (
                                            <>
                                                <i className="fas fa-paper-plane"></i>
                                                返信する
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* サイドバー */}
                <div className="space-y-6">
                    {/* 担当者割り当て */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            <i className="fas fa-user-shield mr-2 text-primary"></i>
                            担当者割り当て
                        </h3>
                        <select
                            value={ticket.assignee_id || ''}
                            onChange={(e) => handleAssignStaff(e.target.value ? parseInt(e.target.value) : null)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">未割り当て</option>
                            {staff.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.real_name} ({s.role === 'CrisisManager' ? '危機管理官' : s.role === 'Consultant' ? 'コンサルタント' : s.role})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* アクション */}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                            <i className="fas fa-tasks mr-2 text-primary"></i>
                            アクション
                        </h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => handleStatusChange('対応中')}
                                disabled={ticket.status === '対応中'}
                                className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <i className="fas fa-play mr-2"></i>
                                対応中にする
                            </button>
                            <button
                                onClick={() => handleStatusChange('完了')}
                                disabled={ticket.status === '完了'}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <i className="fas fa-check mr-2"></i>
                                完了にする
                            </button>
                        </div>
                    </div>

                    {/* クライアント情報 */}
                    {clientInfo && (
                        <div className="bg-white rounded-lg shadow-sm p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">
                                <i className="fas fa-building mr-2 text-primary"></i>
                                クライアント情報
                            </h3>
                            <dl className="space-y-3 text-sm">
                                <div>
                                    <dt className="text-gray-500">企業名</dt>
                                    <dd className="font-medium text-gray-900">{clientInfo.company_name}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">担当者</dt>
                                    <dd className="font-medium text-gray-900">{clientInfo.contact_name}</dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">主担当（危機管理官）</dt>
                                    <dd className="font-medium text-gray-900">
                                        {clientInfo.main_assignee_real_name || '未割り当て'}
                                    </dd>
                                </div>
                                <div>
                                    <dt className="text-gray-500">副担当（危機管理官）</dt>
                                    <dd className="font-medium text-gray-900">
                                        {clientInfo.sub_assignee_real_name || '未割り当て'}
                                    </dd>
                                </div>
                            </dl>
                            <Link
                                to={`/app/admin/clients/${ticket.client_id}`}
                                className="mt-4 block w-full px-4 py-2 bg-gray-100 text-gray-700 text-center rounded-lg hover:bg-gray-200"
                            >
                                クライアント詳細を見る
                                <i className="fas fa-external-link-alt ml-2"></i>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// チケット一覧ビュー
const TicketListView: React.FC = () => {
    const navigate = useNavigate();
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
                                担当者
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
                                <tr 
                                    key={ticket.id} 
                                    className="hover:bg-gray-50 cursor-pointer"
                                    onClick={() => navigate(`/app/admin/tickets/${ticket.id}`)}
                                >
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
                                        <div className="text-sm text-gray-600">
                                            {ticket.main_assignee_name ? (
                                                <div className="flex items-center">
                                                    <i className="fas fa-user-shield text-primary mr-1 text-xs"></i>
                                                    {ticket.main_assignee_name}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">未割り当て</span>
                                            )}
                                        </div>
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
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/app/admin/tickets/${ticket.id}`);
                                                }}
                                                className="text-primary hover:text-blue-700"
                                                title="詳細を見る"
                                            >
                                                <i className="fas fa-eye"></i>
                                            </button>
                                            <select
                                                value={ticket.status}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    handleStatusChange(ticket.id, e.target.value as any);
                                                }}
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
                                <td colSpan={9} className="px-6 py-12 text-center text-gray-500">
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

// メインコンポーネント
const AdminTicketManagement: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    return id ? <TicketDetailView /> : <TicketListView />;
};

export default AdminTicketManagement;
