import React, { useState, useMemo } from 'react';
import { useClientData } from '../../../ClientDataContext.tsx';
import type { AuditLog } from '../../../types.ts';

const AdminAuditLog: React.FC = () => {
    const { auditLogs } = useClientData();
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'card'>('list');

    const filteredLogs = useMemo(() => {
        return auditLogs.filter(log => {
            const searchLower = searchTerm.toLowerCase();
            return (
                log.userName.toLowerCase().includes(searchLower) ||
                log.userId.toLowerCase().includes(searchLower) ||
                log.action.toLowerCase().includes(searchLower) ||
                log.details.toLowerCase().includes(searchLower)
            );
        });
    }, [auditLogs, searchTerm]);

    const formatTimestamp = (isoString: string) => {
        return new Date(isoString).toLocaleString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const LogCard: React.FC<{log: AuditLog}> = ({ log }) => (
        <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex justify-between items-start mb-2">
                <span className="px-2 py-0.5 font-semibold leading-tight text-blue-700 bg-blue-100 rounded-full text-xs">{log.action}</span>
                <span className="text-xs text-gray-500 font-mono">{formatTimestamp(log.timestamp)}</span>
            </div>
            <div className="mb-2">
                <p className="font-semibold text-gray-800">{log.userName}</p>
                <p className="text-xs text-gray-500">{log.userId}</p>
            </div>
            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">{log.details}</p>
        </div>
    );

    return (
        <div className="fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">行動ログ</h1>
                    <p className="text-gray-500">システム内のユーザー操作履歴を閲覧します。</p>
                </div>
                <div className="bg-gray-200 p-1 rounded-lg">
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'list' ? 'bg-white shadow' : ''}`}><i className="fas fa-list"></i></button>
                    <button onClick={() => setViewMode('card')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'card' ? 'bg-white shadow' : ''}`}><i className="fas fa-th-large"></i></button>
                </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-md">
                <input
                    type="text"
                    placeholder="ユーザー名、アクション、詳細で検索..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md enhanced-input"
                />
            </div>

            {viewMode === 'list' ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Log ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日時</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">詳細</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredLogs.map(log => (
                                    <tr key={log.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{formatTimestamp(log.timestamp)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div>{log.userName}</div>
                                            <div className="text-xs text-gray-500">{log.userId}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className="px-2 py-1 font-semibold leading-tight text-blue-700 bg-blue-100 rounded-full">{log.action}</span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{log.details}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredLogs.map(log => <LogCard key={log.id} log={log} />)}
                </div>
            )}
        </div>
    );
};

export default AdminAuditLog;