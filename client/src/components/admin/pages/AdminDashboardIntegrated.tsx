import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardAPI } from '../../../services/apiClient.ts';

interface AdminDashboardData {
    stats: {
        totalClients: number;
        activeTickets: number;
        newClientsThisMonth: number;
    };
    recentTickets: any[];
    recentClients: any[];
}

const AdminDashboardIntegrated: React.FC = () => {
    const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                const response = await dashboardAPI.getAdminDashboard();
                if (response.success) {
                    setDashboardData(response.data);
                } else {
                    setError(response.error || 'データの取得に失敗しました');
                }
            } catch (err) {
                console.error('Admin dashboard fetch error:', err);
                setError('管理者ダッシュボードの読み込みに失敗しました');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

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

    if (error || !dashboardData) {
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
            </div>
        );
    }

    const { stats, recentTickets, recentClients } = dashboardData;

    return (
        <div className="fade-in">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">管理者ダッシュボード</h1>
                <p className="text-gray-600 mt-2">システム全体の概要と最近のアクティビティ</p>
            </div>

            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">総クライアント数</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalClients}</p>
                        </div>
                        <div className="bg-blue-100 rounded-full p-3">
                            <i className="fas fa-building text-2xl text-blue-600"></i>
                        </div>
                    </div>
                    <Link to="/admin/clients" className="text-sm text-blue-600 hover:text-blue-800 mt-4 inline-block">
                        詳細を見る →
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">対応中チケット</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activeTickets}</p>
                        </div>
                        <div className="bg-yellow-100 rounded-full p-3">
                            <i className="fas fa-ticket-alt text-2xl text-yellow-600"></i>
                        </div>
                    </div>
                    <Link to="/admin/tickets" className="text-sm text-yellow-600 hover:text-yellow-800 mt-4 inline-block">
                        詳細を見る →
                    </Link>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">今月の新規</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.newClientsThisMonth}</p>
                        </div>
                        <div className="bg-green-100 rounded-full p-3">
                            <i className="fas fa-user-plus text-2xl text-green-600"></i>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 最近のチケット */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">最近のチケット</h2>
                            <Link to="/admin/tickets" className="text-sm text-blue-600 hover:text-blue-800">
                                すべて見る →
                            </Link>
                        </div>
                    </div>
                    <div className="divide-y">
                        {recentTickets && recentTickets.length > 0 ? (
                            recentTickets.slice(0, 5).map((ticket: any) => (
                                <div key={ticket.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-grow">
                                            <h3 className="font-medium text-gray-900">{ticket.subject}</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {ticket.company_name || 'クライアント不明'}
                                            </p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className={`text-xs px-2 py-1 rounded-full ${
                                                    ticket.status === '完了' ? 'bg-green-100 text-green-800' :
                                                    ticket.status === '対応中' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {ticket.status}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {ticket.category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                チケットがありません
                            </div>
                        )}
                    </div>
                </div>

                {/* 最近登録のクライアント */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold text-gray-900">最近登録のクライアント</h2>
                            <Link to="/admin/clients" className="text-sm text-blue-600 hover:text-blue-800">
                                すべて見る →
                            </Link>
                        </div>
                    </div>
                    <div className="divide-y">
                        {recentClients && recentClients.length > 0 ? (
                            recentClients.slice(0, 5).map((client: any) => (
                                <div key={client.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-medium text-gray-900">{client.company_name}</h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                登録: {new Date(client.registration_date).toLocaleDateString('ja-JP')}
                                            </p>
                                            <span className={`inline-block text-xs px-2 py-1 rounded-full mt-2 ${
                                                client.status === 'active' ? 'bg-green-100 text-green-800' :
                                                client.status === 'suspended' ? 'bg-red-100 text-red-800' :
                                                'bg-gray-100 text-gray-800'
                                            }`}>
                                                {client.status === 'active' ? 'アクティブ' :
                                                 client.status === 'suspended' ? '停止中' :
                                                 'トライアル'}
                                            </span>
                                        </div>
                                        <Link
                                            to={`/admin/clients/${client.id}`}
                                            className="text-blue-600 hover:text-blue-800"
                                        >
                                            <i className="fas fa-arrow-right"></i>
                                        </Link>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-8 text-center text-gray-500">
                                クライアントがありません
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardIntegrated;
