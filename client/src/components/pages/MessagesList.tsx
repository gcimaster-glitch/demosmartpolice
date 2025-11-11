import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useClientData } from '../../ClientDataContext.tsx';
import type { MessageTicket } from '../../types.ts';

type ViewMode = 'list' | 'card';

const formatRelativeTime = (dateString: string): string => {
    // Assuming dateString is 'YYYY/MM/DD HH:mm'
    const date = new Date(dateString.replace(/\//g, '-'));
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    }
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
        return 'Yesterday';
    }
    if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    return date.toLocaleDateString('en-CA');
};

const MessagesList: React.FC = () => {
    const { tickets, staff, clients, currentClient } = useClientData();
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('list');

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
            const clientName = clients.find(c => c.id === ticket.clientId)?.companyName || '';
            const searchLower = searchTerm.toLowerCase();
            return (
                ticket.subject.toLowerCase().includes(searchLower) ||
                ticket.excerpt.toLowerCase().includes(searchLower) ||
                ticket.ticketId.toLowerCase().includes(searchLower) ||
                clientName.toLowerCase().includes(searchLower)
            ) && (currentClient && ticket.clientId === currentClient.id);
        });
    }, [tickets, searchTerm, clients, currentClient]);


    const ListItem: React.FC<{ ticket: MessageTicket }> = ({ ticket }) => (
        <NavLink
            to={`/app/messages/${ticket.id}`}
            className={({ isActive }) => `block p-4 border-l-4 hover:bg-gray-50 border-b transition-colors ${isActive ? 'bg-blue-50 ' + getPriorityClass(ticket.priority) : 'border-transparent'}`}
        >
            <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-bold text-gray-800 truncate pr-2">{ticket.subject}</div>
                {ticket.unreadCount > 0 && (
                    <span className="flex-shrink-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {ticket.unreadCount}
                    </span>
                )}
            </div>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">{ticket.excerpt}</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
                <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-medium ${getStatusClass(ticket.status)}`}>
                        {ticket.status}
                    </span>
                    <span className="flex items-center" title="カテゴリ">
                        <i className="fas fa-folder w-4 text-center mr-1"></i>
                        <span className="truncate">{ticket.category}</span>
                    </span>
                    {ticket.attachmentCount > 0 && (
                        <span className="flex items-center" title="添付ファイル数">
                            <i className="fas fa-paperclip w-4 text-center mr-1"></i>
                            <span>{ticket.attachmentCount}</span>
                        </span>
                    )}
                </div>
                <span>{formatRelativeTime(ticket.lastUpdate)}</span>
            </div>
        </NavLink>
    );

    const CardItem: React.FC<{ ticket: MessageTicket }> = ({ ticket }) => {
        const assignee = staff.find(s => s.id === ticket.assigneeId);
        return (
            <NavLink
                to={`/app/messages/${ticket.id}`}
                className={({ isActive }) => `block p-4 border rounded-lg hover:bg-gray-50 border-l-4 transition-colors ${isActive ? 'bg-blue-50 ' + getPriorityClass(ticket.priority) : getPriorityClass(ticket.priority)}`}
            >
                <div className="flex justify-between items-start">
                    <h4 className="text-sm font-bold text-gray-800 flex-1 truncate pr-2">{ticket.subject}</h4>
                     <span className={`flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded-full font-medium text-xs ${getStatusClass(ticket.status)}`}>
                        {ticket.status}
                    </span>
                </div>
                <div className="flex items-center text-xs text-gray-500 mt-1 mb-2 space-x-3">
                    <span>{ticket.ticketId}</span>
                    <span className="flex items-center" title="カテゴリ">
                        <i className="fas fa-folder mr-1"></i>
                        <span>{ticket.category}</span>
                    </span>
                    {ticket.attachmentCount > 0 && (
                        <span className="flex items-center" title="添付ファイル数">
                            <i className="fas fa-paperclip mr-1"></i>
                            <span>{ticket.attachmentCount}</span>
                        </span>
                    )}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{ticket.excerpt}</p>
                <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-2">
                    <div className="flex items-center">
                        <i className="fas fa-user-tie mr-1.5"></i> {assignee ? assignee.name : '未割当'}
                    </div>
                    <span>{formatRelativeTime(ticket.lastUpdate)}</span>
                </div>
            </NavLink>
        );
    };

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b bg-gray-50">
                 <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-semibold text-gray-800">相談一覧 ({filteredTickets.length})</h3>
                    <div className="bg-gray-200 p-1 rounded-lg">
                        <button onClick={() => setViewMode('list')} className={`px-2 py-0.5 rounded-md text-xs ${viewMode === 'list' ? 'bg-white shadow' : ''}`}><i className="fas fa-list"></i></button>
                        <button onClick={() => setViewMode('card')} className={`px-2 py-0.5 rounded-md text-xs ${viewMode === 'card' ? 'bg-white shadow' : ''}`}><i className="fas fa-th-large"></i></button>
                    </div>
                </div>
                <input 
                    type="text" 
                    placeholder="キーワードで絞り込み..." 
                    className="w-full enhanced-input p-2 text-sm border rounded-md" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="overflow-y-auto">
                 {viewMode === 'list' ? (
                    <div>
                        {filteredTickets.map(ticket => <ListItem key={ticket.id} ticket={ticket} />)}
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        {filteredTickets.map(ticket => <CardItem key={ticket.id} ticket={ticket} />)}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesList;