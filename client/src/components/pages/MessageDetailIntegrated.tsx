import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketsAPI } from '../../services/apiClient.ts';
import { useAuth } from '../../AuthContext.tsx';

interface Message {
    id: number;
    ticket_id: number;
    sender_type: 'CLIENT' | 'STAFF';
    sender_id: number;
    text: string;
    created_at: string;
}

interface ClientInfo {
    id: number;
    company_name: string;
    contact_name: string;
    main_assignee_id?: number | null;
    sub_assignee_id?: number | null;
    main_assignee_name?: string | null;
    main_assignee_real_name?: string | null;
    sub_assignee_name?: string | null;
    sub_assignee_real_name?: string | null;
}

interface TicketDetail {
    id: number;
    ticket_id: string;
    subject: string;
    category: string;
    priority: '高' | '中' | '低';
    status: '受付中' | '対応中' | '完了';
    created_at: string;
    last_update: string;
    messages: Message[];
    client?: ClientInfo;
}

const MessageDetailIntegrated: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [ticket, setTicket] = useState<TicketDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);

    useEffect(() => {
        const fetchTicket = async () => {
            if (!id) return;
            
            try {
                setLoading(true);
                const response = await ticketsAPI.getById(parseInt(id));
                if (response.success) {
                    setTicket(response.data);
                } else {
                    setError(response.error || 'データの取得に失敗しました');
                }
            } catch (err) {
                console.error('Ticket fetch error:', err);
                setError('チケットの読み込みに失敗しました');
            } finally {
                setLoading(false);
            }
        };

        fetchTicket();
    }, [id]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newMessage.trim() || !id) return;

        try {
            setSending(true);
            const response = await ticketsAPI.addMessage(parseInt(id), newMessage);
            
            if (response.success) {
                // メッセージ追加成功 - チケットを再取得
                const ticketResponse = await ticketsAPI.getById(parseInt(id));
                if (ticketResponse.success) {
                    setTicket(ticketResponse.data);
                }
                setNewMessage('');
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
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/app/messages')}
                    className="mt-4 text-primary hover:text-blue-700"
                >
                    ← メッセージ一覧に戻る
                </button>
            </div>
        );
    }

    const getStatusClass = (status: string) => {
        switch (status) {
            case '対応中': return 'bg-yellow-100 text-yellow-800';
            case '完了': return 'bg-green-100 text-green-800';
            case '受付中': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="fade-in max-w-4xl mx-auto">
            <button
                onClick={() => navigate('/app/messages')}
                className="text-primary hover:text-blue-700 mb-4 inline-flex items-center"
            >
                <i className="fas fa-arrow-left mr-2"></i>
                メッセージ一覧に戻る
            </button>

            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-grow">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{ticket.subject}</h2>
                        <div className="flex flex-wrap gap-2 text-sm">
                            <span className={`px-3 py-1 rounded-full font-medium ${getStatusClass(ticket.status)}`}>
                                {ticket.status}
                            </span>
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                                {ticket.category}
                            </span>
                            <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                                優先度: {ticket.priority}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="text-sm text-gray-600 border-t pt-4">
                    <p>チケットID: {ticket.ticket_id}</p>
                    <p>作成日時: {new Date(ticket.created_at).toLocaleString('ja-JP')}</p>
                    <p>最終更新: {new Date(ticket.last_update).toLocaleString('ja-JP')}</p>
                </div>

                {/* 担当者情報 */}
                {ticket.client && (
                    <div className="border-t pt-4 mt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
                            <i className="fas fa-user-shield text-primary mr-2"></i>
                            担当者情報
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            {ticket.client.main_assignee_real_name ? (
                                <div className="flex items-start">
                                    <span className="text-gray-500 mr-2">主担当:</span>
                                    <span className="text-gray-900 font-medium">
                                        {ticket.client.main_assignee_real_name}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-start">
                                    <span className="text-gray-500 mr-2">主担当:</span>
                                    <span className="text-gray-400">未割り当て</span>
                                </div>
                            )}
                            
                            {ticket.client.sub_assignee_real_name ? (
                                <div className="flex items-start">
                                    <span className="text-gray-500 mr-2">副担当:</span>
                                    <span className="text-gray-900 font-medium">
                                        {ticket.client.sub_assignee_real_name}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-start">
                                    <span className="text-gray-500 mr-2">副担当:</span>
                                    <span className="text-gray-400">未割り当て</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* メッセージスレッド */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">メッセージ履歴</h3>
                <div className="space-y-4">
                    {ticket.messages && ticket.messages.length > 0 ? (
                        ticket.messages.map((message) => {
                            const isClient = message.sender_type === 'CLIENT';
                            return (
                                <div
                                    key={message.id}
                                    className={`p-4 rounded-lg ${
                                        isClient ? 'bg-blue-50 ml-8' : 'bg-gray-50 mr-8'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <i className={`fas ${isClient ? 'fa-user' : 'fa-user-tie'} text-gray-600`}></i>
                                            <span className="font-semibold text-gray-900">
                                                {isClient ? 'あなた' : '運営スタッフ'}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {new Date(message.created_at).toLocaleString('ja-JP')}
                                        </span>
                                    </div>
                                    <p className="text-gray-800 whitespace-pre-wrap">{message.text}</p>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-gray-500 text-center py-8">まだメッセージがありません</p>
                    )}
                </div>
            </div>

            {/* 新規メッセージ入力 */}
            {ticket.status !== '完了' && (
                <form onSubmit={handleSendMessage} className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">返信する</h3>
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent mb-4"
                        rows={4}
                        placeholder="メッセージを入力してください..."
                        disabled={sending}
                    />
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                            disabled={sending || !newMessage.trim()}
                        >
                            {sending ? (
                                <>
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                    送信中...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-paper-plane mr-2"></i>
                                    送信
                                </>
                            )}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default MessageDetailIntegrated;
