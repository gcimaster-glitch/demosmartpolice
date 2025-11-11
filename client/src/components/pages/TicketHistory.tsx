import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useClientData } from '../../ClientDataContext.tsx';
import type { TicketConsumptionLog } from '../../types.ts';

const TicketHistory: React.FC = () => {
    const { ticketConsumptionLog, currentClient } = useClientData();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ticketsPerPage = 10;

    const clientLog = useMemo(() => {
        if (!currentClient) return [];
        return ticketConsumptionLog.filter(log => log.clientId === currentClient.id);
    }, [ticketConsumptionLog, currentClient]);

    const filteredAndSortedLogs = useMemo(() => {
        const filtered = clientLog.filter(log =>
            log.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.description.toLowerCase().includes(searchTerm.toLowerCase())
        );

        return filtered.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return dateB - dateA;
        });
    }, [clientLog, searchTerm]);

    const totalPages = Math.ceil(filteredAndSortedLogs.length / ticketsPerPage);
    const paginatedLogs = filteredAndSortedLogs.slice((currentPage - 1) * ticketsPerPage, currentPage * ticketsPerPage);

    const handleRowClick = (log: TicketConsumptionLog) => {
        if ((log.type === '新規相談' || log.type === '専門家招待') && log.relatedId) {
            navigate(`/app/messages/${log.relatedId}`);
        }
        // Could add navigation for events/seminars too if needed
    };
    
    const getTypeClass = (type: TicketConsumptionLog['type']) => {
        switch(type) {
            case '新規相談': return 'bg-blue-100 text-blue-800';
            case '専門家招待': return 'bg-purple-100 text-purple-800';
            case 'オンラインイベント参加': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
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
                <p className="text-secondary">チケットの消費履歴です。</p>
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
                    <span className="text-sm text-gray-600">ページ {currentPage} / {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md text-sm disabled:opacity-50">次へ</button>
                </div>
            </div>
        </div>
    );
};

export default TicketHistory;