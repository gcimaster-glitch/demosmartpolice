import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.tsx';
import { useNavigate, Link } from 'react-router-dom';

// Demo accounts for easy login
const easyLoginUsers = {
    'superadmin@smartpolis.jp': { password: 'admin123', role: 'システム管理者' },
    'yamada@abc-shoji.co.jp': { password: 'client123', role: 'クライアント管理者' },
    'takahashi@smartpolis.jp': { password: 'staff123', role: '担当者' },
};

// Fix: Changed component to be a named export to resolve module loading error.
export const Login: React.FC = () => {
    const [email, setEmail] = useState('superadmin@smartpolis.jp');
    const [password, setPassword] = useState('admin123');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const auth = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!auth.isLoading && auth.isAuthenticated) {
            navigate('/app');
        }
    }, [auth.isLoading, auth.isAuthenticated, navigate]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        
        const success = await auth.login(email, password);
        
        setIsLoading(false);
        if (success) {
            navigate('/app');
        } else {
            setError(auth.error || 'メールアドレスまたはパスワードが正しくありません。');
        }
    };
    
    const handleEasyLogin = (userEmail: string) => {
        const user = easyLoginUsers[userEmail as keyof typeof easyLoginUsers];
        if (user) {
            setEmail(userEmail);
            setPassword(user.password);
        }
    };
    
    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');
        // Demo: Use default admin account
        const success = await auth.login('superadmin@smartpolis.jp', 'admin123');
        setIsLoading(false);
        if (success) {
            navigate('/app');
        } else {
            setError('Googleログインに失敗しました。');
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-5xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden md:flex">
                {/* Left Side: Login Form */}
                <div className="w-full md:w-1/2 p-8 lg:p-12 flex flex-col justify-center">
                    <div className="w-full max-w-md mx-auto">
                        <div className="text-center md:text-left mb-8">
                            <Link to="/" className="flex items-center justify-center md:justify-start space-x-2 mb-4">
                                <svg className="h-10 w-10 text-primary" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V13H5V6.3l7-3.11v10.8z"/>
                                </svg>
                                <h1 className="text-2xl font-bold text-gray-900">契約企業様ログイン</h1>
                            </Link>
                        </div>
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative" role="alert"><strong className="font-bold">エラー:</strong><span className="block sm:inline ml-2">{error}</span></div>}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><i className="fas fa-envelope text-gray-400"></i></div>
                                    <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 pl-10 border rounded-md enhanced-input"/>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><i className="fas fa-lock text-gray-400"></i></div>
                                    <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 pl-10 border rounded-md enhanced-input"/>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <input id="remember-me" name="remember-me" type="checkbox" className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"/>
                                    <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">ログイン状態を維持する</label>
                                </div>
                                <div className="text-sm"><a href="#" className="font-medium text-primary hover:text-blue-700">パスワードをお忘れですか?</a></div>
                            </div>
                            <div>
                                <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 disabled:bg-gray-400">
                                    {isLoading ? (<><i className="fas fa-spinner fa-spin mr-2"></i>処理中...</>) : ('ログイン')}
                                </button>
                            </div>
                        </form>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-2 bg-white text-gray-500">または</span>
                            </div>
                        </div>

                        <div>
                            <button
                                type="button"
                                onClick={handleGoogleLogin}
                                className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus-ring"
                            >
                                <i className="fab fa-google text-lg mr-3"></i>
                                Googleでログイン
                            </button>
                        </div>
                        
                        {/* Easy Login Section */}
                        <div className="mt-6">
                            <p className="text-center text-sm font-medium text-gray-500">かんたんログイン (デモ用)</p>
                            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {Object.entries(easyLoginUsers).map(([email, { role }]) => (
                                    <button
                                        key={email}
                                        type="button"
                                        onClick={() => handleEasyLogin(email)}
                                        className="w-full inline-flex justify-center py-2 px-2 border border-gray-300 rounded-md shadow-sm bg-white text-xs font-medium text-gray-500 hover:bg-gray-50 focus-ring"
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 text-center text-sm">
                            <p className="text-gray-600">
                                アカウントをお持ちでないですか?{' '}
                                <Link to="/register" className="font-medium text-primary hover:text-blue-700">
                                    新規登録はこちら
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Image/Branding */}
                <div className="hidden md:block md:w-1/2 relative">
                    <img src="https://images.unsplash.com/photo-1558021211-6514f3b140f5?q=80&w=1974&auto=format&fit=crop" 
                         alt="Security professional at work" 
                         className="absolute w-full h-full object-cover"/>
                    <div className="relative h-full inset-0 bg-primary bg-opacity-70 flex flex-col justify-center items-center text-white p-12 text-center">
                        <i className="fas fa-shield-alt text-6xl mb-4"></i>
                        <h2 className="text-3xl font-bold mb-2">スマートポリス</h2>
                        <p className="text-lg">デジタル時代の用心棒として、<br/>貴社のビジネスを守り抜きます。</p>
                    </div>
                </div>
            </div>
        </div>
    );
};