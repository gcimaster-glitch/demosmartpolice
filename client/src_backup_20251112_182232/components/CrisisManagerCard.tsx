import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.tsx';
import { useClientData } from '../ClientDataContext.tsx';

const CrisisManagerCard: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { staff, currentClient, currentPlan } = useClientData();
    
    const hasDedicatedManager = currentPlan?.hasDedicatedManager;

    const crisisManager = (hasDedicatedManager && currentClient?.mainAssigneeId)
        ? staff.find(s => s.id === currentClient.mainAssigneeId && s.approvalStatus === 'approved')
        : null;

    if (!hasDedicatedManager) {
        return (
             <div className="w-full lg:w-80">
                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-yellow-400 border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        <i className="fas fa-gem text-yellow-500 mr-2"></i>
                        アップグレード
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">専属の危機管理官など、全ての機能を利用するにはプランのアップグレードが必要です。</p>
                    <button onClick={() => navigate('/app/plan-change')} className="w-full bg-yellow-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-yellow-600 transition-colors focus-ring">
                        <i className="fas fa-arrow-up mr-2"></i>プランを見る
                    </button>
                </div>
            </div>
        );
    }
    
    if (!crisisManager) {
        return (
            <div className="w-full lg:w-80">
                <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-gray-300 border">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        <i className="fas fa-user-tie text-gray-400 mr-2"></i>
                        担当者未設定
                    </h3>
                    <p className="text-sm text-gray-600">現在、専属の危機管理官が割り当てられていません。管理者にお問い合わせください。</p>
                </div>
            </div>
        );
    }
    
    const { name, position, phone, email, photoUrl, profile } = crisisManager;

    return (
        <div className="w-full lg:w-80">
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500 border">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        <i className="fas fa-shield-alt text-blue-500 mr-2"></i>
                        専属危機管理官
                    </h3>
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 font-medium">待機中</span>
                    </div>
                </div>
                
                <div className="flex items-center space-x-4 mb-5">
                    <div className="w-16 h-20 flex-shrink-0 relative">
                        <img src={photoUrl} 
                             alt={name}
                             className="w-16 h-20 object-cover rounded-lg border-2 border-blue-200 shadow-md"/>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    
                    <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg">{name}</h4>
                        <p className="text-sm text-blue-600 font-medium">{position}</p>
                        <p className="text-xs text-gray-500">あなた専属の担当者</p>
                    </div>
                </div>

                 <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md mb-4 border">{profile}</p>

                <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                        <i className="fas fa-phone-alt w-4 text-blue-500 mr-2"></i>
                        <span className="font-mono">{phone}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <i className="fas fa-envelope w-4 text-blue-500 mr-2"></i>
                        <span className="text-xs">{email}</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <a href={`tel:${phone}`} className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors focus-ring flex items-center justify-center">
                        <i className="fas fa-phone mr-1"></i>
                        緊急電話
                    </a>
                    <button onClick={() => navigate('/app/messages/new')} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors focus-ring flex items-center justify-center">
                        <i className="fas fa-comments mr-1"></i>
                        相談開始
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CrisisManagerCard;