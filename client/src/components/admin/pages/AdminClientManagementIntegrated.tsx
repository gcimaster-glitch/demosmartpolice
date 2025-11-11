import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { clientsAPI } from '../../../services/apiClient.ts';

interface Client {
    id: number;
    company_name: string;
    contact_name: string;
    email: string;
    phone: string;
    status: 'active' | 'suspended' | 'trial';
    plan_id: string;
    registration_date: string;
    remaining_tickets: number;
}

const AdminClientManagementIntegrated: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            setLoading(true);
            const response = await clientsAPI.getAll();
            if (response.success) {
                setClients(response.data || []);
            } else {
                setError(response.error || 'データの取得に失敗しました');
            }
        } catch (err) {
            console.error('Clients fetch error:', err);
            setError('クライアント一覧の読み込みに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (clientId: number, newStatus: 'active' | 'suspended') => {
        try {
            const response = await clientsAPI.updateStatus(clientId, newStatus);
            if (response.success) {
                // 成功したらリストを更新
                fetchClients();
                alert('ステータスを更新しました');
            } else {
                alert(response.error || 'ステータスの更新に失敗しました');
            }
        } catch (err) {
            console.error('Status update error:', err);
            alert('ステータスの更新に失敗しました');
        }
    };

    const filteredClients = clients.filter(client => {
        const matchesSearch = 
            client.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            client.email.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">アクティブ</span>;
            case 'suspended':
                return <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">停止中</span>;
            case 'trial':
                return <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">トライアル</span>;
            default:
                return <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">{status}</span>;
        }
    };

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

    if (error) {
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

    return (
        <div className="fade-in">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">クライアント管理</h1>
                <p className="text-gray-600 mt-2">契約企業の管理と状態確認</p>
            </div>

            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">総クライアント数</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{clients.length}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">アクティブ</p>
                    <p className="text-2xl font-bold text-green-600 mt-1">
                        {clients.filter(c => c.status === 'active').length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">トライアル</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">
                        {clients.filter(c => c.status === 'trial').length}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow p-4">
                    <p className="text-sm text-gray-600">停止中</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">
                        {clients.filter(c => c.status === 'suspended').length}
                    </p>
                </div>
            </div>

            {/* フィルター・検索 */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-grow">
                        <input
                            type="text"
                            placeholder="企業名、担当者名、メールアドレスで検索..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                        <option value="all">すべてのステータス</option>
                        <option value="active">アクティブ</option>
                        <option value="trial">トライアル</option>
                        <option value="suspended">停止中</option>
                    </select>
                </div>
            </div>

            {/* クライアント一覧テーブル */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                企業名
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                担当者
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                連絡先
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ステータス
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                チケット残
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                登録日
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                操作
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredClients.length > 0 ? (
                            filteredClients.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{client.company_name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{client.contact_name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600">{client.email}</div>
                                        <div className="text-xs text-gray-500">{client.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(client.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{client.remaining_tickets}枚</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600">
                                            {new Date(client.registration_date).toLocaleDateString('ja-JP')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <Link
                                                to={`/admin/clients/${client.id}`}
                                                className="text-primary hover:text-blue-700"
                                                title="詳細を見る"
                                            >
                                                <i className="fas fa-eye"></i>
                                            </Link>
                                            {client.status === 'active' ? (
                                                <button
                                                    onClick={() => handleStatusChange(client.id, 'suspended')}
                                                    className="text-red-600 hover:text-red-800"
                                                    title="停止する"
                                                >
                                                    <i className="fas fa-ban"></i>
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleStatusChange(client.id, 'active')}
                                                    className="text-green-600 hover:text-green-800"
                                                    title="有効化する"
                                                >
                                                    <i className="fas fa-check-circle"></i>
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                    {searchTerm || statusFilter !== 'all' 
                                        ? '検索条件に一致するクライアントが見つかりません'
                                        : 'クライアントがまだ登録されていません'
                                    }
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminClientManagementIntegrated;
