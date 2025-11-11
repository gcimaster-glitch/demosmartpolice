import React from 'react';
import { Link } from 'react-router-dom';

const Register: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4 font-jp">
            <div className="w-full max-w-5xl mx-auto text-center">
                <div className="mb-10">
                    <div className="inline-block">
                        <div className="flex items-center justify-center mb-4">
                             <svg className="h-10 w-10 text-primary mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V13H5V6.3l7-3.11v10.8z"/>
                            </svg>
                            <h1 className="text-3xl font-bold text-gray-900">新規登録</h1>
                        </div>
                    </div>
                    <p className="text-gray-600">登録方法を選択してください。</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* 簡単登録 */}
                    <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 hover:border-primary transition-all duration-300 transform hover:-translate-y-1">
                        <div className="text-center">
                             <div className="mb-4">
                                <i className="fas fa-rocket text-5xl text-primary"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">簡単登録</h2>
                            <p className="text-secondary mb-6">まずは無料のフリープランから。基本的な機能をお試しいただけます。</p>
                            <ul className="text-sm text-gray-600 text-left space-y-2 mb-8">
                                <li><i className="fas fa-check text-green-500 mr-2"></i>お知らせの閲覧</li>
                                <li><i className="fas fa-check text-green-500 mr-2"></i>セミナーへの申込</li>
                                <li><i className="fas fa-check text-green-500 mr-2"></i>運営へのお問合せ</li>
                            </ul>
                             <Link to="/register/easy" className="w-full inline-block py-3 px-6 bg-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                                フリープランで始める
                            </Link>
                        </div>
                    </div>

                    {/* じっくり登録 */}
                    <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200 hover:border-primary transition-all duration-300 transform hover:-translate-y-1">
                        <div className="text-center">
                            <div className="mb-4">
                                <i className="fas fa-file-signature text-5xl text-primary"></i>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">じっくり登録</h2>
                            <p className="text-secondary mb-6">法人情報を入力し、最適な有料プランを選択して全ての機能をご利用いただけます。</p>
                            <ul className="text-sm text-gray-600 text-left space-y-2 mb-8">
                                <li><i className="fas fa-check text-green-500 mr-2"></i>専属の危機管理官</li>
                                <li><i className="fas fa-check text-green-500 mr-2"></i>オンライン相談</li>
                                <li><i className="fas fa-check text-green-500 mr-2"></i>緊急出動サービスなど</li>
                            </ul>
                            <Link to="/register/detailed" className="w-full inline-block py-3 px-6 bg-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                                有料プランで始める
                            </Link>
                        </div>
                    </div>
                </div>
                 <div className="mt-8 text-center text-sm">
                    <p className="text-gray-600">
                        すでにアカウントをお持ちですか?{' '}
                        <Link to="/login" className="font-medium text-primary hover:text-blue-700">
                            ログイン
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;