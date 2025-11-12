import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CrisisManagerCardIntegrated from '../CrisisManagerCardIntegrated.tsx';
import { dashboardAPI } from '../../services/apiClient.ts';
import { useAuth } from '../../AuthContext.tsx';

interface CrisisManager {
  id: number;
  name: string;
  realName: string;
  position?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
  profile?: string;
}

interface DashboardData {
  client: {
    id: number;
    companyName: string;
    status: string;
    remainingTickets: number;
    planId: string;
    planName: string;
    mainAssigneeId?: number | null;
    subAssigneeId?: number | null;
  };
  plan?: {
    id: string;
    name: string;
    hasDedicatedManager: boolean;
  };
  mainAssignee?: CrisisManager | null;
  subAssignee?: CrisisManager | null;
  stats: {
    unreadTickets: number;
    monthlyTicketUsage: number;
    remainingTickets: number;
  };
  recentTickets: any[];
  recentAnnouncements: any[];
}

const DashboardIntegrated: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                setLoading(true);
                const response = await dashboardAPI.getClientDashboard();
                if (response.success) {
                    setDashboardData(response.data);
                } else {
                    setError(response.error || 'データの取得に失敗しました');
                }
            } catch (err) {
                console.error('Dashboard fetch error:', err);
                setError('ダッシュボードの読み込みに失敗しました');
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

    const { client, stats, recentAnnouncements } = dashboardData;
    const isFreePlan = client.planName === 'Free';

    if (isFreePlan) {
        return (
            <div className="fade-in">
                <div className="mb-6">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">ようこそ！</h2>
                    <p className="text-secondary">スマートポリス フリープランをご利用いただきありがとうございます。</p>
                </div>
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md mb-6 shadow-sm">
                    <div className="flex">
                        <div className="py-1"><i className="fas fa-info-circle text-yellow-500 mr-3 text-xl"></i></div>
                        <div>
                            <p className="font-bold">現在フリープランをご利用中です</p>
                            <p className="text-sm">一部機能が制限されています。全ての機能を利用するにはプランのアップグレードが必要です。</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-grow">
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                <i className="fas fa-rocket text-primary mr-2"></i>
                                はじめの一歩
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <Link to="/app/announcements" className="bg-blue-50 text-primary p-3 rounded-lg text-center hover:bg-blue-100 transition-colors focus-ring">
                                    <i className="fas fa-bullhorn text-lg mb-2"></i>
                                    <div className="text-sm font-medium">お知らせを確認</div>
                                </Link>
                                <Link to="/app/seminars" className="bg-blue-50 text-primary p-3 rounded-lg text-center hover:bg-blue-100 transition-colors focus-ring">
                                    <i className="fas fa-calendar-alt text-lg mb-2"></i>
                                    <div className="text-sm font-medium">セミナーを探す</div>
                                </Link>
                                <Link to="/app/messages/new" className="bg-blue-50 text-primary p-3 rounded-lg text-center hover:bg-blue-100 transition-colors focus-ring">
                                    <i className="fas fa-comments text-lg mb-2"></i>
                                    <div className="text-sm font-medium">運営へのお問合せ</div>
                                </Link>
                            </div>
                        </div>
                    </div>
                    <div className="lg:w-80 lg:sticky lg:top-20 h-fit">
                        <CrisisManagerCardIntegrated 
                            hasDedicatedManager={dashboardData?.plan?.hasDedicatedManager || false}
                            crisisManager={dashboardData?.mainAssignee || null}
                        />
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="fade-in">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">ホーム</h2>
                <p className="text-secondary">契約企業向けポータルへようこそ - {client.companyName}</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-grow">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* チケット残数 */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-success">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    <i className="fas fa-ticket-alt text-success mr-2"></i>
                                    チケット
                                </h3>
                                <button onClick={() => navigate('/app/plan-change')} className="text-sm text-primary hover:text-blue-700 focus-ring rounded">
                                    <i className="fas fa-plus mr-1"></i>プラン変更
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">今月の残り</span>
                                    <span className="font-bold text-success text-3xl">{stats.remainingTickets}枚</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-success h-2 rounded-full" style={{width: `${Math.min(stats.remainingTickets * 10, 100)}%`}}></div>
                                </div>
                                <div className="text-xs text-gray-500 pt-2 border-t">
                                    今月使用: {stats.monthlyTicketUsage}枚 | プラン: {client.planName}
                                </div>
                            </div>
                        </div>

                        {/* 現在の対応中 */}
                        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-warning">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                <i className="fas fa-exclamation-circle text-warning mr-2"></i>
                                現在の対応中
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">未解決の相談</span>
                                    <span className="font-bold text-warning text-xl">{stats.unreadTickets}件</span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <Link to="/app/messages" className="inline-block bg-primary text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors focus-ring">
                                    詳細を確認する
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* 最新のお知らせ */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">
                                <i className="fas fa-bullhorn text-info mr-2"></i>
                                最新のお知らせ
                            </h3>
                            <Link to="/app/announcements" className="text-sm text-primary hover:text-blue-700 focus-ring rounded">すべて見る</Link>
                        </div>
                        <div className="space-y-3">
                            {recentAnnouncements.length > 0 ? (
                                recentAnnouncements.slice(0, 3).map((announcement: any) => (
                                    <div key={announcement.id} className="border-l-2 border-info pl-3">
                                        <h4 className="font-medium text-sm text-gray-900">{announcement.title}</h4>
                                        <p className="text-xs text-gray-600">{announcement.summary || '詳細を確認してください'}</p>
                                        <span className="text-xs text-gray-500">
                                            {new Date(announcement.published_at).toLocaleDateString('ja-JP')}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500">現在お知らせはありません</p>
                            )}
                        </div>
                    </div>

                    {/* よく使う操作 */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            <i className="fas fa-star text-warning mr-2"></i>
                            よく使う操作
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <Link to="/app/messages/new" className="bg-primary text-white p-3 rounded-lg text-center hover:bg-blue-700 transition-colors focus-ring">
                                <i className="fas fa-edit text-lg mb-2"></i>
                                <div className="text-sm font-medium">相談を投稿する</div>
                            </Link>
                            <Link to="/app/services/emergency-1" className="bg-danger text-white p-3 rounded-lg text-center hover:bg-red-700 transition-colors focus-ring">
                                <i className="fas fa-shield-alt text-lg mb-2"></i>
                                <div className="text-sm font-medium">カスハラ出動依頼</div>
                            </Link>
                            <Link to="/app/materials" className="bg-secondary text-white p-3 rounded-lg text-center hover:bg-gray-600 transition-colors focus-ring">
                                <i className="fas fa-folder-open text-lg mb-2"></i>
                                <div className="text-sm font-medium">資料室を開く</div>
                            </Link>
                            <Link to="/app/ticket-history" className="bg-indigo-500 text-white p-3 rounded-lg text-center hover:bg-indigo-600 transition-colors focus-ring">
                                <i className="fas fa-history text-lg mb-2"></i>
                                <div className="text-sm font-medium">チケット履歴</div>
                            </Link>
                            <Link to="/app/billing" className="bg-teal-500 text-white p-3 rounded-lg text-center hover:bg-teal-600 transition-colors focus-ring">
                                <i className="fas fa-receipt text-lg mb-2"></i>
                                <div className="text-sm font-medium">請求確認</div>
                            </Link>
                            <Link to="/app/services/security-1" className="bg-success text-white p-3 rounded-lg text-center hover:bg-green-700 transition-colors focus-ring">
                                <i className="fas fa-certificate text-lg mb-2"></i>
                                <div className="text-sm font-medium">セキュリティシール</div>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="lg:w-80 lg:sticky lg:top-20 h-fit">
                    <CrisisManagerCardIntegrated 
                        hasDedicatedManager={dashboardData?.plan?.hasDedicatedManager || false}
                        crisisManager={dashboardData?.mainAssignee || null}
                    />
                </div>
            </div>
        </div>
    );
};

export default DashboardIntegrated;
