import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useClientData } from '../../../ClientDataContext.tsx';
import { useNavigate } from 'react-router-dom';

const AdminDashboard: React.FC = () => {
    const { clients, tickets, serviceApplications, invoices } = useClientData();
    const navigate = useNavigate();

    const recentClients = [...clients].sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()).slice(0, 3);
    const recentTickets = [...tickets].sort((a, b) => b.id - a.id).slice(0, 3);
    const recentApplications = [...serviceApplications].sort((a, b) => new Date(b.applicationDate).getTime() - new Date(a.applicationDate).getTime()).slice(0, 3);
    
    const getClientName = (clientId: number) => clients.find(c => c.id === clientId)?.companyName || '不明';

    // --- New Dashboard Data ---
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    
    const monthlyInvoices = invoices.filter(inv => new Date(inv.issueDate).getMonth() === thisMonth && new Date(inv.issueDate).getFullYear() === thisYear);
    const yearlyInvoices = invoices.filter(inv => new Date(inv.issueDate).getFullYear() === thisYear);

    const calcFinancials = (invList: typeof invoices) => ({
        total: invList.reduce((sum, inv) => sum + inv.amount, 0),
        paid: invList.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
        unpaid: invList.filter(inv => inv.status !== 'paid').reduce((sum, inv) => sum + inv.amount, 0),
    });

    const monthlyFinancials = calcFinancials(monthlyInvoices);
    const yearlyFinancials = calcFinancials(yearlyInvoices);

    const systemHealthData = {
        serverLoad: Math.random() * 60 + 20, // 20-80%
        dbConnections: Math.floor(Math.random() * 50 + 10),
    };
    
    const accessData = [
        { name: '7日前', visits: 120 }, { name: '6日前', visits: 150 }, { name: '5日前', visits: 130 },
        { name: '4日前', visits: 180 }, { name: '3日前', visits: 210 }, { name: '昨日', visits: 250 },
        { name: '今日', visits: 230 },
    ];

    const sourceData = [ { name: '自然検索', value: 400 }, { name: '紹介', value: 300 }, { name: '広告', value: 300 }, { name: 'SNS', value: 200 } ];
    const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];


    return (
        <div className="fade-in space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">管理者ダッシュボード</h1>
                <p className="text-gray-500">ようこそ、管理者様。現在のシステム状況の概要です。</p>
            </div>
            
            {/* Financial & System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 {/* Financial Summary */}
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><i className="fas fa-yen-sign text-green-500 mr-2"></i>財務サマリー</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-medium text-sm text-gray-500 mb-2 border-b pb-1">今月 ({thisMonth + 1}月)</h3>
                            <p className="text-xs text-gray-500">請求総額: <span className="font-bold text-gray-800">¥{monthlyFinancials.total.toLocaleString()}</span></p>
                            <p className="text-xs text-gray-500">入金額: <span className="font-bold text-green-600">¥{monthlyFinancials.paid.toLocaleString()}</span></p>
                            <p className="text-xs text-gray-500">未入金額: <span className="font-bold text-red-600">¥{monthlyFinancials.unpaid.toLocaleString()}</span></p>
                        </div>
                         <div>
                            <h3 className="font-medium text-sm text-gray-500 mb-2 border-b pb-1">今年 ({thisYear}年)</h3>
                            <p className="text-xs text-gray-500">請求総額: <span className="font-bold text-gray-800">¥{yearlyFinancials.total.toLocaleString()}</span></p>
                            <p className="text-xs text-gray-500">入金額: <span className="font-bold text-green-600">¥{yearlyFinancials.paid.toLocaleString()}</span></p>
                            <p className="text-xs text-gray-500">未入金額: <span className="font-bold text-red-600">¥{yearlyFinancials.unpaid.toLocaleString()}</span></p>
                        </div>
                    </div>
                </div>
                 {/* System Health */}
                 <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><i className="fas fa-server text-blue-500 mr-2"></i>システムヘルス</h2>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-medium text-sm text-gray-500 mb-2">サーバー負荷</h3>
                            <div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-blue-600 h-4 rounded-full" style={{ width: `${systemHealthData.serverLoad}%` }}></div></div>
                            <p className="text-center font-bold text-lg mt-1">{systemHealthData.serverLoad.toFixed(1)}%</p>
                        </div>
                        <div>
                             <h3 className="font-medium text-sm text-gray-500 mb-1">DB接続数</h3>
                             <p className="text-3xl font-bold text-gray-800">{systemHealthData.dbConnections} <span className="text-sm">/ 100</span></p>
                             <p className="text-xs text-gray-500">データベース接続数</p>
                        </div>
                     </div>
                </div>
            </div>

            {/* Access Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">訪問者数（過去7日間）</h2>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <LineChart data={accessData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Line type="monotone" dataKey="visits" stroke="#3B82F6" strokeWidth={2} /></LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">流入経路</h2>
                     <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <PieChart><Pie data={sourceData} innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">{sourceData.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip /><Legend /></PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Affiliate Summary */}
                 <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><i className="fas fa-handshake text-purple-500 mr-2"></i>アフィリエイト概要</h2>
                    <div className="space-y-3">
                        <p className="text-sm text-gray-600">アクティブな紹介者: <span className="font-bold text-lg text-gray-800 float-right">5名</span></p>
                        <p className="text-sm text-gray-600">承認待ちの紹介: <span className="font-bold text-lg text-yellow-600 float-right">2件</span></p>
                        <p className="text-sm text-gray-600">今月の発生報酬額: <span className="font-bold text-lg text-green-600 float-right">¥125,000</span></p>
                    </div>
                     <button onClick={() => navigate('/app/affiliates')} className="mt-4 w-full text-sm bg-purple-100 text-purple-700 py-2 rounded-lg hover:bg-purple-200">詳細管理</button>
                </div>
                {/* Recent Activities */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4"><i className="fas fa-history text-blue-500 mr-2"></i>最新のアクティビティ</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <h3 className="font-medium text-sm text-gray-600 mb-2 border-b pb-1">新規クライアント</h3>
                            <div className="space-y-2">
                                {recentClients.map(c => (
                                    <div key={c.id} className="text-xs cursor-pointer hover:bg-gray-50 p-1 rounded" onClick={() => navigate(`/app/clients/${c.id}`)}>
                                        <p className="font-semibold text-gray-800 truncate">{c.companyName}</p>
                                        <p className="text-gray-400">{c.registrationDate}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                         <div>
                            <h3 className="font-medium text-sm text-gray-600 mb-2 border-b pb-1">新規相談チケット</h3>
                            <div className="space-y-2">
                                {recentTickets.map(t => (
                                    <div key={t.id} className="text-xs cursor-pointer hover:bg-gray-50 p-1 rounded" onClick={() => navigate(`/app/tickets/${t.id}`)}>
                                        <p className="font-semibold text-gray-800 truncate">{t.subject}</p>
                                        <p className="text-gray-400">{getClientName(t.clientId)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-medium text-sm text-gray-600 mb-2 border-b pb-1">新規サービス申込</h3>
                            <div className="space-y-2">
                                {recentApplications.map(app => (
                                     <div key={app.id} className="text-xs cursor-pointer hover:bg-gray-50 p-1 rounded" onClick={() => navigate(`/app/applications/${app.id}`)}>
                                        <p className="font-semibold text-gray-800 truncate">{app.serviceName}</p>
                                        <p className="text-gray-400">{app.clientName}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
