import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CrisisManagerCard from '../CrisisManagerCard.tsx';
import { useClientData } from '../../ClientDataContext.tsx';

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { currentClient, hasClientPermission, calculateClientProfileCompletion } = useClientData();
    const remainingTickets = currentClient?.remainingTickets ?? 0;
    const canViewBilling = hasClientPermission('VIEW_BILLING');
    const isFreePlan = !canViewBilling;

    const completionPercentage = currentClient ? calculateClientProfileCompletion(currentClient) : 100;
    const canEditCompanyInfo = hasClientPermission('EDIT_COMPANY_INFO');
    const isProfileIncomplete = canEditCompanyInfo && completionPercentage < 100;

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
                        <CrisisManagerCard />
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="fade-in">
             <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">ホーム</h2>
                <p className="text-secondary">契約企業向けポータルへようこそ</p>
            </div>

            {isProfileIncomplete && (
                <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 rounded-md mb-6 shadow-sm">
                    <div className="flex">
                        <div className="py-1"><i className="fas fa-exclamation-triangle text-xl text-yellow-500 mr-3"></i></div>
                        <div>
                            <h3 className="font-bold">ご登録情報の入力にご協力ください</h3>
                            <p className="text-sm mt-1">
                                貴社の危機管理を円滑に行うため、詳細な企業情報のご登録をお願いしております。現在、入力率は <strong>{Math.round(completionPercentage)}%</strong> です。
                            </p>
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                                <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${completionPercentage}%` }}></div>
                            </div>
                            <div className="mt-3">
                                <button
                                    onClick={() => navigate('/app/company')}
                                    className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors focus-ring"
                                >
                                    <i className="fas fa-edit mr-2"></i>
                                    自社情報を入力・更新する
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
                                    <i className="fas fa-plus mr-1"></i>チケットを追加・プラン変更
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">今月の残り</span>
                                    <span className="font-bold text-success text-3xl">{remainingTickets}枚</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-success h-2 rounded-full" style={{width: `${remainingTickets * 10}%`}}></div>
                                </div>
                                <div className="text-xs text-gray-500 pt-2 border-t">
                                    月間契約: 10枚 | 次回更新: 2024年9月1日
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
                                    <span className="font-bold text-warning text-xl">2件</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">処理中の申請</span>
                                    <span className="font-bold text-info text-xl">1件</span>
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
                            <div className="border-l-2 border-danger pl-3">
                                <h4 className="font-medium text-sm text-gray-900">緊急メンテナンスのお知らせ</h4>
                                <p className="text-xs text-gray-600">2024/08/30 2:00-6:00にシステムメンテナンス...</p>
                            </div>
                            <div className="border-l-2 border-info pl-3">
                                <h4 className="font-medium text-sm text-gray-900">新機能リリースのご案内</h4>
                                <p className="text-xs text-gray-600">資料室に検索機能が追加されました...</p>
                            </div>
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
                            {canViewBilling && (
                                <Link to="/app/billing" className="bg-teal-500 text-white p-3 rounded-lg text-center hover:bg-teal-600 transition-colors focus-ring">
                                    <i className="fas fa-receipt text-lg mb-2"></i>
                                    <div className="text-sm font-medium">請求確認</div>
                                </Link>
                            )}
                             <Link to="/app/services/security-1" className="bg-success text-white p-3 rounded-lg text-center hover:bg-green-700 transition-colors focus-ring">
                                <i className="fas fa-certificate text-lg mb-2"></i>
                                <div className="text-sm font-medium">セキュリティシール</div>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="lg:w-80 lg:sticky lg:top-20 h-fit">
                  <CrisisManagerCard />
                </div>
            </div>
        </div>
    );
};

export default Dashboard;