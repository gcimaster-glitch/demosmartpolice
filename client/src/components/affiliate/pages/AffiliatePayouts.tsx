
import React, { useMemo } from 'react';
import { useAuth } from '../../../AuthContext.tsx';
import { useClientData } from '../../../ClientDataContext.tsx';
import type { Payout } from '../../../types.ts';

const statusLabels: Record<Payout['status'], string> = { pending: '処理中', paid: '支払い済み' };
const statusColors: Record<Payout['status'], string> = { pending: 'yellow', paid: 'green' };

const AffiliatePayouts: React.FC = () => {
    const { user } = useAuth();
    const { affiliates, payouts, referrals, requestPayout } = useClientData();

    const affiliate = useMemo(() => {
        return affiliates.find(a => a.email === user?.email);
    }, [affiliates, user]);

    const affiliatePayouts = useMemo(() => {
        if (!affiliate) return [];
        return payouts.filter(p => p.affiliateId === affiliate.id).sort((a, b) => new Date(b.payoutDate).getTime() - new Date(a.payoutDate).getTime());
    }, [payouts, affiliate]);

    const availableForPayout = useMemo(() => {
        if (!affiliate) return 0;
        const affiliateReferrals = referrals.filter(r => r.affiliateId === affiliate.id && r.status === 'approved');
        const allPaidReferralIds = payouts.flatMap(p => p.referralIds);
        const unpaidReferrals = affiliateReferrals.filter(r => !allPaidReferralIds.includes(r.id));
        
        // Simplified calculation for demo: using a fixed amount per referral
        const commissionPerReferral = 5000;
        return unpaidReferrals.length * commissionPerReferral;
    }, [affiliate, referrals, payouts]);

    if (!affiliate) {
        return <div>アフィリエイト情報が見つかりません。</div>;
    }
    
    return (
        <div className="fade-in space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">支払い</h1>
                <p className="text-gray-500">あなたの報酬支払い状況と履歴です。</p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 rounded-md" role="alert">
                <div className="flex">
                    <div className="py-1"><i className="fas fa-info-circle mr-3"></i></div>
                    <div>
                        <p className="font-bold">お支払いスケジュールについて</p>
                        <p className="text-sm">
                            報酬は毎月末日に集計され、翌月に承認作業が行われます。承認された報酬は、翌々月の末日にお支払いいたします（末日が銀行休業日の場合は翌営業日）。
                        </p>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-700">支払い可能残高</h2>
                        <p className="text-3xl font-bold text-green-600">¥{availableForPayout.toLocaleString()}</p>
                    </div>
                    <div className="mt-4 md:mt-0">
                        <button 
                            onClick={() => requestPayout(affiliate.id)} 
                            disabled={availableForPayout < 3000}
                            className="w-full md:w-auto bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            <i className="fas fa-hand-holding-usd mr-2"></i>
                            支払いをリクエスト
                        </button>
                        {availableForPayout < 3000 && <p className="text-xs text-gray-500 mt-2 text-center md:text-right">支払い可能な最低額(¥3,000)に達していません。</p>}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b"><h3 className="text-lg font-medium text-gray-900">支払い履歴</h3></div>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日付</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">金額</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {affiliatePayouts.map(payout => {
                            const statusColor = statusColors[payout.status];
                            return (
                                <tr key={payout.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(payout.payoutDate).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">¥{payout.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded-full text-xs font-semibold bg-${statusColor}-100 text-${statusColor}-800`}>{statusLabels[payout.status]}</span></td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AffiliatePayouts;
