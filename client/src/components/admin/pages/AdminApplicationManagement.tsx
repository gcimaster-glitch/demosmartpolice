import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ServiceApplication } from '../../../types';
import { useClientData } from '../../../ClientDataContext.tsx';

const AppDetailView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { serviceApplications, processApplication, hasPermission } = useClientData();
    const app = serviceApplications.find(a => a.id === id);
    const canProcess = hasPermission('PROCESS_APPLICATIONS');

    if (!app) {
        return <div className="text-center p-8 bg-white rounded-lg shadow-md">申込が見つかりません。</div>;
    }
    
    const handleProcess = (status: 'approved' | 'rejected') => {
        if (app) {
            processApplication(app.id, status);
            navigate('/app/applications');
        }
    };
    
    const getStatusClass = (status: ServiceApplication['status']) => {
        if (status === 'approved') return 'bg-green-100 text-green-800';
        if (status === 'rejected') return 'bg-red-100 text-red-800';
        return 'bg-yellow-100 text-yellow-800';
    };

    return (
         <div className="fade-in space-y-6">
            <button onClick={() => navigate('/app/applications')} className="text-sm text-primary mb-2 flex items-center">
                <i className="fas fa-chevron-left mr-2"></i>申込一覧に戻る
            </button>
            <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
                <div className="p-6 border-b"><h3 className="text-lg font-semibold text-gray-900">申込詳細 (ID: {app.id})</h3></div>
                <div className="p-6 space-y-3 text-sm flex-grow">
                    <p><strong>クライアント:</strong> {app.clientName}</p>
                    <p><strong>サービス名:</strong> {app.serviceName}</p>
                    <p><strong>申込日:</strong> {new Date(app.applicationDate).toLocaleString()}</p>
                    <p><strong>申込者:</strong> {app.userName}</p>
                    <p><strong>ステータス:</strong> <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusClass(app.status)}`}>{app.status}</span></p>
                    {app.notes && <p><strong>備考:</strong><br/><span className="text-gray-600 bg-gray-50 p-2 block rounded mt-1 whitespace-pre-wrap">{app.notes}</span></p>}
                </div>
                {app.status === 'pending' && canProcess && (
                    <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 mt-auto">
                        <button onClick={() => handleProcess('rejected')} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">却下</button>
                        <button onClick={() => handleProcess('approved')} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">承認</button>
                    </div>
                )}
            </div>
        </div>
    );
};

const AppListView: React.FC = () => {
    const { serviceApplications } = useClientData();
    const [statusFilter, setStatusFilter] = useState('');
    const navigate = useNavigate();

    const filteredApplications = useMemo(() => {
        return serviceApplications.filter(app => statusFilter === '' || app.status === statusFilter);
    }, [serviceApplications, statusFilter]);

    const getStatusClass = (status: ServiceApplication['status']) => {
        if (status === 'approved') return 'bg-green-100 text-green-800';
        if (status === 'rejected') return 'bg-red-100 text-red-800';
        return 'bg-yellow-100 text-yellow-800';
    };
    
    return (
         <div className="fade-in space-y-6">
            <div><h1 className="text-3xl font-bold text-gray-800">サービス申込管理</h1><p className="text-gray-500">クライアントからのサービス申込を確認・処理します。</p></div>
            <div className="bg-white p-4 rounded-lg shadow-md">
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full md:w-1/3 p-2 border rounded-md enhanced-input">
                    <option value="">すべてのステータス</option><option value="pending">承認待ち</option><option value="approved">承認済み</option><option value="rejected">却下済み</option>
                </select>
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申込ID</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">サービス名</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">クライアント</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th></tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredApplications.map(app => (<tr key={app.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/app/applications/${app.id}`)}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.id}</td>
                            <td className="px-6 py-4 font-medium text-gray-900">{app.serviceName}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">{app.clientName}</td>
                            <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(app.status)}`}>{app.status}</span></td>
                        </tr>))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const AdminApplicationManagement: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    return id ? <AppDetailView /> : <AppListView />;
};

export default AdminApplicationManagement;
