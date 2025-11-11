import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { MessageTicket } from '../../../types.ts';
import { useClientData } from '../../../ClientDataContext.tsx';

const priorityColors: Record<MessageTicket['priority'], string> = { '高': 'bg-red-100 text-red-800', '中': 'bg-yellow-100 text-yellow-800', '低': 'bg-blue-100 text-blue-800' };
const statusColors: Record<MessageTicket['status'], string> = { '受付中': 'bg-blue-100 text-blue-800', '対応中': 'bg-yellow-100 text-yellow-800', '完了': 'bg-green-100 text-green-800' };

const TicketDetailView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { tickets, clients, staff } = useClientData();

    const ticket = tickets.find(t => t.id === Number(id));

    if (!ticket) {
        return <div className="text-center p-8 bg-white rounded-lg shadow-md">チケットが見つかりません。</div>;
    }
    
    const assigneeName = staff.find(s => s.id === ticket.assigneeId)?.name || '未割当';

    return (
        <div className="fade-in space-y-6">
            <button onClick={() => navigate('/app/tickets')} className="text-sm text-primary mb-2 flex items-center">
                <i className="fas fa-chevron-left mr-2"></i>チケット一覧に戻る
            </button>
            <div className="bg-white rounded-lg shadow-md h-full">
                <div className="p-6 border-b">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{ticket.subject}</h3>
                            <p className="text-sm text-gray-600">クライアント: {clients.find(c=>c.id === ticket.clientId)?.companyName} (ID: {ticket.ticketId})</p>
                        </div>
                    </div>
                    <div className="mt-4 flex space-x-4">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${priorityColors[ticket.priority]}`}>{ticket.priority}</span>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[ticket.status]}`}>{ticket.status}</span>
                    </div>
                </div>
                <div className="p-6 text-sm">
                     <p><strong className="font-semibold text-gray-600">担当者:</strong> {assigneeName}</p>
                     <p><strong className="font-semibold text-gray-600">最終更新日時:</strong> {ticket.lastUpdate}</p>
                     <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-700 mb-2">会話履歴（プレビュー）</h4>
                        <p className="text-gray-600 italic">ここに実際の会話内容が表示されます...</p>
                     </div>
                </div>
                 <div className="px-6 py-4 bg-gray-50 border-t flex justify-end">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        チャットを開く
                    </button>
                </div>
            </div>
        </div>
    );
};


const TicketListView: React.FC = () => {
    const { tickets, clients, staff } = useClientData();
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({ status: '', priority: '', assigneeId: '' });
    const navigate = useNavigate();

    const ticketsWithClientInfo = useMemo(() => {
        return tickets.map(ticket => ({
            ...ticket,
            clientName: clients.find(c => c.id === ticket.clientId)?.companyName || '不明なクライアント',
            assigneeName: staff.find(s => s.id === ticket.assigneeId)?.name || '未割当',
        }));
    }, [tickets, clients, staff]);

    const filteredTickets = useMemo(() => {
        return ticketsWithClientInfo.filter(ticket => {
            const searchLower = searchTerm.toLowerCase();
            return (
                (ticket.clientName.toLowerCase().includes(searchLower) || ticket.subject.toLowerCase().includes(searchLower)) &&
                (filters.status === '' || ticket.status === filters.status) &&
                (filters.priority === '' || ticket.priority === filters.priority) &&
                (filters.assigneeId === '' || String(ticket.assigneeId) === filters.assigneeId || (filters.assigneeId === 'null' && ticket.assigneeId === null))
            );
        });
    }, [ticketsWithClientInfo, searchTerm, filters]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    return (
        <div className="fade-in space-y-6">
            <div><h1 className="text-3xl font-bold text-gray-800">相談チケット管理</h1><p className="text-gray-500">クライアントからの全ての相談チケットを管理します。</p></div>
            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input type="text" placeholder="クライアント名、件名で検索..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="lg:col-span-2 w-full p-2 border rounded-md enhanced-input"/>
                    <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full p-2 border rounded-md enhanced-input">
                        <option value="">全てのステータス</option><option value="受付中">受付中</option><option value="対応中">対応中</option><option value="完了">完了</option>
                    </select>
                    <select name="assigneeId" value={filters.assigneeId} onChange={handleFilterChange} className="w-full p-2 border rounded-md enhanced-input">
                        <option value="">全ての担当者</option><option value="null">未割当</option>
                        {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">クライアント / 件名</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">担当者</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th></tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTickets.map(ticket => (<tr key={ticket.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/app/tickets/${ticket.id}`)}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.ticketId}</td>
                            <td className="px-6 py-4 whitespace-nowrap"><div className="text-sm font-medium text-gray-900">{ticket.clientName}</div><div className="text-sm text-gray-500">{ticket.subject}</div></td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">{ticket.assigneeName}</td>
                            <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[ticket.status]}`}>{ticket.status}</span></td>
                        </tr>))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdminTicketManagement: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    return id ? <TicketDetailView /> : <TicketListView />;
};

export default AdminTicketManagement;