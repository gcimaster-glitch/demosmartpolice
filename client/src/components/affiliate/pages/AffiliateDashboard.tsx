import React, { useMemo, useState } from 'react';
import { useAuth } from '../../../AuthContext.tsx';
import { useClientData } from '../../../ClientDataContext.tsx';
import type { Referral } from '../../../types.ts';

const referralStatusLabels: Record<Referral['status'], string> = { pending: '承認待ち', approved: '承認済み', rejected: '却下済み' };
const referralStatusColors: Record<Referral['status'], string> = { pending: 'yellow', approved: 'green', rejected: 'red' };

const AffiliateDashboard: React.FC = () => {
    const { user } = useAuth();
    const { affiliates, referrals } = useClientData();
    const [copied, setCopied] = useState(false);

    const affiliate = useMemo(() => {
        return affiliates.find(a => a.email === user?.email);
    }, [affiliates, user]);

    const affiliateReferrals = useMemo(() => {
        if (!affiliate) return [];
        return referrals.filter(r => r.affiliateId === affiliate.id);
    }, [referrals, affiliate]);

    if (!affiliate) {
        return <div>アフィリエイト情報が見つかりません。</div>;
    }

    const stats = {
        total: affiliateReferrals.length,
        approved: affiliateReferrals.filter(r => r.status === 'approved').length,
        pending: affiliateReferrals.filter(r => r.status === 'pending').length,
        // This is a simplified calculation for demo purposes
        earnings: affiliateReferrals.filter(r => r.status === 'approved').length * 5000, 
    };

    const referralLink = `${window.location.origin}${window.location.pathname}#/register/detailed?ref=${affiliate.referralCode}`;

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };
    
    return (
        <div className="fade-in space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">ダッシュボード</h1>
                <p className="text-gray-500">ようこそ、{affiliate.name}様。こちらはあなたのアフィリエイトダッシュボードです。</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-lg font-semibold text-gray-700 mb-2">あなたの紹介リンク</h2>
                <div className="flex items-center space-x-2">
                    <input type="text" value={referralLink} readOnly className="flex-grow p-2 border rounded-md bg-gray-100 font-mono text-sm text-gray-800" />
                    <button onClick={handleCopy} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
                        <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-2`}></i>{copied ? 'コピーしました' : 'コピー'}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard icon="fa-users" title="総紹介数" value={stats.total} color="blue" />
                <StatCard icon="fa-user-check" title="承認済み" value={stats.approved} color="green" />
                <StatCard icon="fa-user-clock" title="承認待ち" value={stats.pending} color="yellow" />
                <StatCard icon="fa-yen-sign" title="発生報酬額（概算）" value={`¥${stats.earnings.toLocaleString()}`} color="purple" />
            </div>

            <div className="bg-white rounded-lg shadow-md">
                 <div className="p-6 border-b"><h3 className="text-lg font-medium text-gray-900">紹介履歴</h3></div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['登録日', 'クライアント', 'ステータス'].map(header => (
                                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {affiliateReferrals.map(r => {
                                    const statusColor = referralStatusColors[r.status];
                                    return (
                                    <tr key={r.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700">{new Date(r.registrationDate).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{r.clientName}</td>
                                        <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-${statusColor}-100 text-${statusColor}-800`}>{referralStatusLabels[r.status]}</span></td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                    </div>
            </div>
        </div>
    );
};

const StatCard: React.FC<{icon: string, title: string, value: string | number, color: string}> = ({icon, title, value, color}) => (
    <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 border-${color}-500`}>
        <div className="flex items-center">
            <div className={`text-2xl text-${color}-500 mr-4`}><i className={`fas ${icon}`}></i></div>
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    </div>
);

export default AffiliateDashboard;