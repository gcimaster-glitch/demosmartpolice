import React, { useState, useMemo } from 'react';
import { useClientData } from '../../../ClientDataContext.tsx';
import type { AuditLog } from '../../../types.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const StatCard: React.FC<{ title: string; value: string | number; icon: string }> = ({ title, value, icon }) => (
    <div className="bg-white p-4 rounded-lg shadow-md border">
        <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-primary mr-4">
                <i className={`fas ${icon} text-xl`}></i>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    </div>
);


const AdminAuditLog: React.FC = () => {
    const { auditLogs } = useClientData();
    const [searchTerm, setSearchTerm] = useState('');
    const [actionFilter, setActionFilter] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    
    const uniqueActions = useMemo(() => {
        const actions = new Set(auditLogs.map(log => log.action));
        return Array.from(actions);
    }, [auditLogs]);

    const filteredLogs = useMemo(() => {
        return auditLogs.filter(log => {
            const searchLower = searchTerm.toLowerCase();
            const logDate = new Date(log.timestamp);
            const startDate = dateRange.start ? new Date(dateRange.start) : null;
            const endDate = dateRange.end ? new Date(dateRange.end) : null;

            if (startDate) {
                startDate.setHours(0, 0, 0, 0);
                if (logDate < startDate) return false;
            }
            if (endDate) {
                endDate.setHours(23, 59, 59, 999);
                if (logDate > endDate) return false;
            }
            if(actionFilter && log.action !== actionFilter) return false;

            return (
                log.userName.toLowerCase().includes(searchLower) ||
                log.userId.toLowerCase().includes(searchLower) ||
                log.action.toLowerCase().includes(searchLower) ||
                log.details.toLowerCase().includes(searchLower)
            );
        });
    }, [auditLogs, searchTerm, dateRange, actionFilter]);

    const analyticsData = useMemo(() => {
        if (filteredLogs.length === 0) {
            return { total: 0, uniqueUsers: 0, topAction: 'N/A' };
        }
        const users = new Set(filteredLogs.map(log => log.userId));
        const actionCounts = filteredLogs.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        
        const topAction = Object.entries(actionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

        return {
            total: filteredLogs.length,
            uniqueUsers: users.size,
            topAction: topAction,
        };
    }, [filteredLogs]);

    const chartData = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const data = last7Days.map(dateStr => {
            const dayLogs = auditLogs.filter(log => log.timestamp.startsWith(dateStr));
            return {
                date: new Date(dateStr).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' }),
                count: dayLogs.length,
            };
        });
        return data;
    }, [auditLogs]);

    const formatTimestamp = (isoString: string) => {
        return new Date(isoString).toLocaleString('ja-JP', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    };

    const handleExport = () => {
        if (filteredLogs.length === 0) {
            alert('エクスポートするログがありません。');
            return;
        }

        const headers = ['ID', '日時', 'ユーザー名', 'ユーザーID', 'アクション', '詳細'];
        const csvRows = [
            headers.join(','),
            ...filteredLogs.map(log => [
                log.id,
                formatTimestamp(log.timestamp),
                `"${log.userName}"`,
                `"${log.userId}"`,
                log.action,
                `"${log.details.replace(/"/g, '""')}"`
            ].join(','))
        ];

        const csvString = csvRows.join('\n');
        const blob = new Blob([`\uFEFF${csvString}`], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'smartpolice_audit_log.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="fade-in space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">行動ログ</h1>
                <p className="text-gray-500">システム内のユーザー操作履歴を閲覧・分析します。</p>
            </div>
            
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="合計ログ数 (期間内)" value={analyticsData.total.toLocaleString()} icon="fa-clipboard-list" />
                <StatCard title="ユニークユーザー数" value={analyticsData.uniqueUsers.toLocaleString()} icon="fa-users" />
                <StatCard title="最多アクション" value={analyticsData.topAction} icon="fa-bolt" />
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">ログアクティビティ (過去7日間)</h3>
                <div style={{ width: '100%', height: 200 }}>
                    <ResponsiveContainer>
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="date" tickLine={false} axisLine={false} />
                            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Bar dataKey="count" name="ログ数" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
                     <input
                        type="text"
                        placeholder="キーワードで検索..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="lg:col-span-2 w-full p-2 border border-gray-300 rounded-md enhanced-input"
                    />
                     <select value={actionFilter} onChange={e => setActionFilter(e.target.value)} className="w-full p-2 border rounded-md enhanced-input">
                        <option value="">すべてのアクション</option>
                        {uniqueActions.map(action => <option key={action} value={action}>{action}</option>)}
                    </select>
                    <div className="lg:col-span-2 flex items-center space-x-2">
                        <input type="date" value={dateRange.start} onChange={e => setDateRange({...dateRange, start: e.target.value})} className="w-full p-2 border rounded-md enhanced-input"/>
                        <span className="text-gray-500">-</span>
                        <input type="date" value={dateRange.end} onChange={e => setDateRange({...dateRange, end: e.target.value})} className="w-full p-2 border rounded-md enhanced-input"/>
                         <button onClick={handleExport} title="CSVエクスポート" className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 shadow-sm flex items-center justify-center">
                            <i className="fas fa-file-csv text-lg"></i>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日時</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ユーザー</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アクション</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">詳細</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredLogs.map(log => (
                                <tr key={log.id}>
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
        </div>
    );
};

export default AdminAuditLog;
