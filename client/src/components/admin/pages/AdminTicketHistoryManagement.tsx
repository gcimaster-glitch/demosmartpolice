import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientData } from '../../../ClientDataContext.tsx';
import type { TicketConsumptionLog } from '../../../types.ts';

const AdminTicketHistoryManagement: React.FC = () => {
    const { ticketConsumptionLog, clients } = useClientData();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [clientFilter, setClientFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = 15;

    const logsWithClientInfo = useMemo(() => {
        return ticketConsumptionLog.map(log => ({
            ...log,
            clientName: clients.find(c => c.id === log.clientId)?.companyName || '不明なクライアント',
        }));
    }, [ticketConsumptionLog, clients]);

    const filteredAndSortedLogs = useMemo(() => {
        const filtered = logsWithClientInfo.filter(log =>
            (log.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             log.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (clientFilter === '' || String(log.clientId) === clientFilter) &&
            (typeFilter === '' || log.type === typeFilter)
        );

        return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [logsWithClientInfo, searchTerm, clientFilter, typeFilter]);

    const totalPages = Math.ceil(filteredAndSortedLogs.length / logsPerPage);
    const paginatedLogs = filteredAndSortedLogs.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

    const handleRowClick = (log: TicketConsumptionLog) => {
        if ((log.type === '新規相談' || log.type === '専門家招待') && log.relatedId) {
            navigate(`/app/tickets/${log.relatedId}`);
        }
    };

    return (
        <div className="fade-in space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">チケット管理</h1>
                <p className="text-gray-500">全クライアントのチケット消費履歴を閲覧します。</p>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input
                        type="text"
                        placeholder="キーワードで検索..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="lg:col-span-2 w-full p-2 border rounded-md enhanced-input"
                    />
                    <select
                        value={clientFilter}
                        onChange={(e) => { setClientFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full p-2 border rounded-md enhanced-input"
                    >
                        <option value="">全てのクライアント</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                    </select>
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full p-2 border rounded-md enhanced-input"
                    >
                        <option value="">全ての種別</option>
                        <option value="新規相談">新規相談</option>
                        <option value="専門家招待">専門家招待</option>
                        <option value="オンラインイベント参加">オンラインイベント参加</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">消費日</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">クライアント</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">種別</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">詳細</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">消費</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedLogs.length > 0 ? paginatedLogs.map(log => (
                                <tr key={log.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(log)}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.date).toLocaleString('ja-JP')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{log.clientName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            log.type === '新規相談' ? 'bg-blue-100 text-blue-800' :
                                            log.type === '専門家招待' ? 'bg-purple-100 text-purple-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>{log.type}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{log.description}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">{log.ticketCost}</td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-500">
                                        該当する履歴はありません。
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                     <div className="p-4 flex items-center justify-between border-t">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 border rounded-md text-sm disabled:opacity-50">前へ</button>
                        <span className="text-sm text-gray-600">ページ {currentPage} / {totalPages}</span>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 border rounded-md text-sm disabled:opacity-50">次へ</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminTicketHistoryManagement;