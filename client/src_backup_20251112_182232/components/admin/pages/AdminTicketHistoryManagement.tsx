import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClientData } from '../../../ClientDataContext.tsx';
import type { TicketConsumptionLog } from '../../../types.ts';

interface TicketTransaction {
    id: string;
    date: string;
    description: string;
    change: number; // positive for grant, negative for consumption
    balance: number;
    relatedId?: string | number;
}

const AdminTicketHistoryManagement: React.FC = () => {
    const { ticketConsumptionLog, clients, plans } = useClientData();
    const navigate = useNavigate();

    const [searchTerm, setSearchTerm] = useState('');
    const [clientFilter, setClientFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = 15;

    const passbookData = useMemo(() => {
        if (!clientFilter) return [];
        
        const clientId = Number(clientFilter);
        const client = clients.find(c => c.id === clientId);
        const plan = plans.find(p => p.id === client?.planId);
        if (!client || !plan) return [];

        const transactions: { date: Date; description: string; change: number, relatedId?: string|number, id: string }[] = [];

        transactions.push({
            id: `init-${client.id}`,
            date: new Date(client.registrationDate),
            description: '初回チケット付与',
            change: plan.initialTickets,
        });

        const startDate = new Date(client.registrationDate);
        const endDate = new Date();
        let currentDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 1);
        while (currentDate <= endDate) {
            transactions.push({
                id: `grant-${client.id}-${currentDate.toISOString()}`,
                date: new Date(currentDate),
                description: '月次チケット付与',
                change: plan.monthlyTickets,
            });
            currentDate.setMonth(currentDate.getMonth() + 1);
        }

        ticketConsumptionLog
            .filter(log => log.clientId === clientId)
            .forEach(log => {
                transactions.push({
                    id: log.id,
                    date: new Date(log.date),
                    description: `${log.type}: ${log.description}`,
                    change: -log.ticketCost,
                    relatedId: log.relatedId,
                });
            });

        transactions.sort((a, b) => a.date.getTime() - b.date.getTime());

        let runningBalance = 0;
        const passbook: TicketTransaction[] = transactions.map(tx => {
            runningBalance += tx.change;
            return {
                id: tx.id,
                date: tx.date.toISOString(),
                description: tx.description,
                change: tx.change,
                balance: runningBalance,
                relatedId: tx.relatedId,
            };
        });

        return passbook.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [clientFilter, clients, plans, ticketConsumptionLog]);

    const consumptionData = useMemo(() => {
        if (clientFilter) return []; // Don't compute if passbook is active
        const logsWithClientInfo = ticketConsumptionLog.map(log => ({
            ...log,
            clientName: clients.find(c => c.id === log.clientId)?.companyName || '不明なクライアント',
        }));

        return logsWithClientInfo.filter(log =>
            (log.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
             log.description.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (typeFilter === '' || log.type === typeFilter)
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [ticketConsumptionLog, clients, searchTerm, typeFilter, clientFilter]);

    const displayData = clientFilter ? passbookData : consumptionData;
    const totalPages = Math.ceil(displayData.length / logsPerPage);
    const paginatedData = displayData.slice((currentPage - 1) * logsPerPage, currentPage * logsPerPage);

    const handleRowClick = (log: any) => {
        if (clientFilter) { // Passbook view
             if (log.description.startsWith('新規相談') || log.description.startsWith('専門家招待')) {
                navigate(`/app/tickets/${log.relatedId}`);
            }
        } else { // Consumption view
            if ((log.type === '新規相談' || log.type === '専門家招待') && log.relatedId) {
                navigate(`/app/tickets/${log.relatedId}`);
            }
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
                     <select
                        value={clientFilter}
                        onChange={(e) => { setClientFilter(e.target.value); setCurrentPage(1); }}
                        className="lg:col-span-2 w-full p-2 border rounded-md enhanced-input"
                    >
                        <option value="">全クライアントの消費履歴を表示</option>
                        {clients.map(c => <option key={c.id} value={c.id}>通帳表示: {c.companyName}</option>)}
                    </select>
                    <input
                        type="text"
                        placeholder="キーワードで検索..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full p-2 border rounded-md enhanced-input"
                        disabled={!!clientFilter}
                    />
                    <select
                        value={typeFilter}
                        onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                        className="w-full p-2 border rounded-md enhanced-input"
                        disabled={!!clientFilter}
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
                            {clientFilter ? (
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">内容</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">増減</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">残高</th>
                                </tr>
                            ) : (
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">消費日</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">クライアント</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">種別</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">詳細</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">消費</th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedData.length > 0 ? paginatedData.map((log: any) => (
                                <tr key={log.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(log)}>
                                    {clientFilter ? (
                                        <>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(log.date).toLocaleString('ja-JP')}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{log.description}</td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm text-center font-semibold ${log.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {log.change > 0 ? `+${log.change}` : log.change}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-800">{log.balance}</td>
                                        </>
                                    ) : (
                                        <>
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
                                        </>
                                    )}
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={clientFilter ? 4 : 5} className="text-center py-10 text-gray-500">
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
            {clientFilter && (
                <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
                    <h3 className="font-bold mb-2 flex items-center"><i className="fas fa-info-circle mr-2"></i>チケット増減の計算について</h3>
                    <ul className="list-disc list-inside text-sm space-y-1">
                        <li>初回チケット付与は、クライアントの登録日に基づきます。</li>
                        <li>月次チケット付与は、登録月の翌月から毎月1日に行われます。</li>
                        <li>残高は、各取引を時系列に沿って計算した結果です。</li>
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AdminTicketHistoryManagement;