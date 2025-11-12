import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext.tsx';
import { clientsAPI, handleAPIError } from '../../services/apiClient.ts';

interface TicketConsumptionLog {
    id: number;
    clientId: number;
    date: string;
    type: '新規相談' | '専門家招待' | 'オンラインイベント参加' | 'セミナー参加';
    description: string;
    ticketCost: number;
    relatedId?: number;
}

const TicketHistoryIntegrated: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [ticketConsumptionLog, setTicketConsumptionLog] = useState<TicketConsumptionLog[]>([]);
    const [currentClient, setCurrentClient] = useState<any>(null);
    const [currentPlan, setCurrentPlan] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const ticketsPerPage = 10;

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.clientId) {
                setError('ユーザー情報が見つかりません');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                
                // クライアント情報とプランを取得
                const clientResponse = await clientsAPI.getById(user.clientId);
                if (clientResponse.success) {
                    setCurrentClient(clientResponse.data.client);
                    setCurrentPlan(clientResponse.data.plan);
                }

                // チケット消費履歴を取得
                const consumptionResponse = await clientsAPI.getConsumption(user.clientId);
                if (consumptionResponse.success) {
                    // DBのsnake_caseをcamelCaseに変換
                    const logs = consumptionResponse.data.map((log: any) => ({
                        id: log.id,
                        clientId: log.client_id,
                        date: log.date,
                        type: log.type,
                        description: log.description,
                        ticketCost: log.ticket_cost,
                        relatedId: log.related_id,
                    }));
                    setTicketConsumptionLog(logs);
                }
            } catch (err) {
                setError(handleAPIError(err));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const consumedThisMonth = useMemo(() => {
        if (!currentClient) return 0;
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        return ticketConsumptionLog
            .filter(log => new Date(log.date) >= firstDayOfMonth)
            .reduce((sum, log) => sum + log.ticketCost, 0);
    }, [ticketConsumptionLog, currentClient]);

    const filteredAndSortedLogs = useMemo(() => {
        const filtered = ticketConsumptionLog.filter(log =>
            log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
        });
    }, [ticketConsumptionLog, searchTerm]);

    const totalPages = Math.ceil(filteredAndSortedLogs.length / ticketsPerPage);
    const paginatedLogs = filteredAndSortedLogs.slice((currentPage - 1) * ticketsPerPage, currentPage * ticketsPerPage);

    const handleRowClick = (log: TicketConsumptionLog) => {
        if ((log.type === '新規相談' || log.type === '専門家招待') && log.relatedId) {
            navigate(`/app/messages/${log.relatedId}`);
        }
    };
    
    const getTypeClass = (type: TicketConsumptionLog['type']) => {
        switch(type) {
            case '新規相談': return 'bg-blue-100 text-blue-800';
            case '専門家招待': return 'bg-purple-100 text-purple-800';
            case 'オンラインイベント参加': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }

    if (loading) {
        return (
            <div className="fade-in flex justify-center items-center py-20">
                <div className="text-center">
                    <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                    <p className="text-gray-600">読み込み中...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fade-in text-center py-20">
                <div className="bg-white p-12 rounded-lg shadow-md inline-block">
                    <i className="fas fa-exclamation-triangle text-5xl text-red-400 mb-4"></i>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">エラー</h2>
                    <p className="text-gray-500">{error}</p>
                </div>
            </div>
        );
    }

    const CardItem: React.FC<{log: TicketConsumptionLog}> = ({ log }) => (
         <div className="bg-white rounded-lg shadow-sm p-4 border cursor-pointer hover:bg-gray-50" onClick={() => handleRowClick(log)}>
             <div className="flex justify-between items-start mb-2">
                 <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeClass(log.type)}`}>{log.type}</span>
                <span className="text-xs text-gray-500">{new Date(log.date).toLocaleString('ja-JP')}</span>
            </div>
            <p className="text-sm text-gray-800 mb-2">{log.description}</p>
            <p className="text-right text-sm font-semibold text-gray-700">{log.ticketCost}枚消費</p>
        </div>
    );

    return (
        <div className="fade-in">
            <nav className="hidden md:flex items-center text-sm text-secondary mb-4" aria-label="パンくずナビ">
                <Link to="/app" className="hover:text-primary">ホーム</Link>
                <span className="mx-2">＞</span>
                <span className="text-gray-900">チケット管理</span>
            </nav>
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">チケット管理</h2>
                <p className="text-secondary">チケットの残数と消費履歴をご確認いただけます。</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center border-l-4 border-primary">
                <div>
                    <p className="text-sm text-gray-500">今月の付与チケット</p>
                    <p className="text-2xl font-bold text-gray-800">{currentPlan?.monthly_tickets || 0}枚</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">今月の消費チケット</p>
                    <p className="text-2xl font-bold text-red-500">{consumedThisMonth}枚</p>
                </div>
                <div>
                    <p className="text-sm text-gray-500">現在の残りチケット</p>
                    <p className="text-3xl font-bold text-green-600">{currentClient?.remaining_tickets || 0}枚</p>
                </div>
            </div>

             <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 border-b">
                     <input
                        type="text"
                        placeholder="種別, 詳細などで検索..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full enhanced-input p-2 border rounded-md"
                    />
                </div>
                 {/* Mobile/Card View */}
                 <div className="md:hidden p-4 space-y-4 bg-gray-50">
                     {paginatedLogs.map(log => <CardItem key={log.id} log={log} />)}
                 </div>

                {/* Desktop/Table View */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">消費日</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">種別</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">詳細</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">消費枚数</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedLogs.length > 0 ? paginatedLogs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(log)}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.date).toLocaleString('ja-JP')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeClass(log.type)}`}>{log.type}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{log.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{log.ticketCost}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-10 text-gray-500">
                                        消費履歴はありません。
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                 <div className="p-4 flex items-center justify-between border-t">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-md text-sm disabled:opacity-50">前へ</button>
                    <span className="text-sm text-gray-600">ページ {currentPage} / {totalPages || 1}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages || 1, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="px-3 py-1 border rounded-md text-sm disabled:opacity-50">次へ</button>
                </div>
            </div>

            <div className="mt-8 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
                <h3 className="font-bold mb-2 flex items-center"><i className="fas fa-info-circle mr-2"></i>チケット消費について</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                    <li>新規相談: 1チケット消費</li>
                    <li>専門家招聘 (弁護士、公認会計士など): 1チケット消費</li>
                    <li>オンラインで開催されるセミナー・イベントへの参加: 1チケット消費</li>
                </ul>
            </div>
        </div>
    );
};

export default TicketHistoryIntegrated;
