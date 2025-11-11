import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext.tsx';
import { plansAPI, clientsAPI, handleAPIError } from '../../services/apiClient.ts';

interface Plan {
    id: string;
    name: string;
    catchphrase: string;
    monthlyFee: number;
    monthlyTickets: number;
    features: string[];
    isPublic: boolean;
}

const PlanChangeIntegrated: React.FC = () => {
    const { user } = useAuth();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [currentClient, setCurrentClient] = useState<any>(null);
    const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [changing, setChanging] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!user?.clientId) {
                setError('ユーザー情報が見つかりません');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                
                // クライアント情報とプランを取得
                const clientResponse = await clientsAPI.getById(user.clientId);
                if (clientResponse.success) {
                    setCurrentClient(clientResponse.data.client);
                    
                    // 現在のプラン情報を取得
                    const currentPlanId = clientResponse.data.client.plan_id;
                    const planResponse = await plansAPI.getById(currentPlanId);
                    if (planResponse.success) {
                        setCurrentPlan(planResponse.data);
                    }
                }

                // 全プランを取得
                const plansResponse = await plansAPI.getAll();
                if (plansResponse.success) {
                    // フリープランを除外
                    const publicPlans = plansResponse.data.filter((p: Plan) => p.id !== 'plan_free');
                    setPlans(publicPlans);
                }
            } catch (err) {
                setError(handleAPIError(err));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="fade-in flex justify-center items-center py-20">
                <div className="text-center">
                    <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                    <p className="text-gray-600">読み込み中...</p>
                </div>
            </div>
        );
    }

    if (error || !currentClient || !currentPlan) {
        return (
            <div className="fade-in text-center py-20">
                <div className="bg-white p-12 rounded-lg shadow-md inline-block">
                    <i className="fas fa-exclamation-triangle text-5xl text-red-400 mb-4"></i>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">エラー</h2>
                    <p className="text-gray-500">{error || 'プラン情報を読み込めません。'}</p>
                </div>
            </div>
        );
    }
    
    const handlePlanChange = async (newPlanId: string) => {
        const newPlan = plans.find(p => p.id === newPlanId);
        if (!newPlan || !currentClient) return;

        const confirmation = window.confirm(
            `現在のプラン「${currentPlan.name}」から「${newPlan.name}」に変更します。よろしいですか？\n\n` +
            `新しい月額料金: ¥${newPlan.monthlyFee.toLocaleString()}\n` +
            `変更は次回の請求から適用されます。`
        );

        if (confirmation) {
            setChanging(true);
            try {
                const response = await plansAPI.changePlan(currentClient.id, newPlanId);
                if (response.success) {
                    alert('プランが変更されました。');
                    setCurrentPlan(newPlan);
                    // クライアント情報を更新
                    setCurrentClient({ ...currentClient, plan_id: newPlanId });
                } else {
                    alert('プラン変更に失敗しました: ' + (response.error || '不明なエラー'));
                }
            } catch (err) {
                alert('プラン変更に失敗しました: ' + handleAPIError(err));
            } finally {
                setChanging(false);
            }
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {plans.map(plan => (
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
                                className="mt-auto block w-full text-center py-3 px-6 bg-primary text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                disabled={changing}
                             >
                                {changing ? '変更中...' : 'このプランに変更'}
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlanChangeIntegrated;
