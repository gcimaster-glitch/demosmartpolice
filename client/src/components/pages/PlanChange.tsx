import React from 'react';
import { useClientData } from '../../ClientDataContext.tsx';

const PlanChange: React.FC = () => {
    const { plans, currentClient, currentPlan, requestPlanChange } = useClientData();

    if (!currentClient || !currentPlan) {
        return <div>プラン情報を読み込めません。</div>;
    }

    const publicPlans = plans.filter(p => p.isPublic && p.id !== 'plan_free');
    
    const handlePlanChange = (newPlanId: string) => {
        const newPlan = plans.find(p => p.id === newPlanId);
        if (!newPlan) return;

        const confirmation = window.confirm(
            `現在のプラン「${currentPlan.name}」から「${newPlan.name}」への変更を申請します。よろしいですか？\n\n` +
            `新しい月額料金: ¥${newPlan.monthlyFee.toLocaleString()}\n` +
            `管理者の承認後、翌月1日から新プランが適用されます。`
        );

        if (confirmation) {
            requestPlanChange(currentClient.id, newPlanId);
            alert('プラン変更を申請しました。管理者の承認をお待ちください。');
        }
    };
    
    return (
        <div className="fade-in">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">プラン変更</h2>
                <p className="text-secondary">貴社のニーズに合わせて最適なプランをお選びいただけます。</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8 border-l-4 border-primary">
                <h3 className="text-lg font-semibold text-gray-800">現在のプラン: <span className="text-primary">{currentPlan.name}</span></h3>
                <p className="text-gray-600">現在の月額料金: ¥{currentPlan.monthlyFee.toLocaleString()}</p>
                {currentClient.pendingPlanChange && (
                    <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md">
                        <p className="font-semibold text-yellow-800">
                            <i className="fas fa-info-circle mr-2"></i>プラン変更を申請中です
                        </p>
                        <p className="text-sm text-yellow-700">
                            新プラン「{plans.find(p => p.id === currentClient.pendingPlanChange?.planId)?.name}」は{new Date(currentClient.pendingPlanChange.effectiveDate).toLocaleDateString()}から有効になります。
                        </p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {publicPlans.map(plan => (
                    <div key={plan.id} className={`border rounded-lg p-6 bg-white shadow-lg flex flex-col ${currentPlan.id === plan.id ? 'border-2 border-primary' : ''}`}>
                        <h4 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                        <p className="text-secondary mb-6">{plan.catchphrase}</p>
                        <p className="text-4xl font-bold text-gray-900 mb-6">¥{plan.monthlyFee.toLocaleString()}<span className="text-lg font-normal text-gray-600">/月</span></p>
                        <ul className="space-y-3 text-gray-600 flex-grow mb-6">
                            {plan.features.map((feature, index) => (
                                 <li key={index} className="flex items-start"><i className="fas fa-check-circle text-green-500 mr-2 mt-1"></i><span>{feature}</span></li>
                            ))}
                        </ul>
                        {currentPlan.id === plan.id ? (
                             <button disabled className="mt-auto block w-full text-center py-3 px-6 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
                                現在のプラン
                            </button>
                        ) : (
                             <button 
                                onClick={() => handlePlanChange(plan.id)} 
                                disabled={!!currentClient.pendingPlanChange}
                                className="mt-auto block w-full text-center py-3 px-6 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                             >
                                {currentClient.pendingPlanChange ? '変更申請中' : 'このプランに変更申請'}
                            </button>
                        )}
                    </div>
                ))}
            </div>
             <div className="mt-8 bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-lg">
                <h3 className="font-bold mb-2 flex items-center"><i className="fas fa-info-circle mr-2"></i>プラン変更とチケットに関するご注意</h3>
                <ul className="list-disc list-inside text-sm space-y-1">
                    <li>プラン変更は管理者の承認後、翌月1日から適用されます。</li>
                    <li>毎月1日の午前2時から4時のメンテナンス時間中に、新しい相談チケットが付与されます。</li>
                </ul>
            </div>
        </div>
    );
};

export default PlanChange;