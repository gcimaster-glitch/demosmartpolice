import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClientData } from '../../ClientDataContext.tsx';

const EasyRegister: React.FC = () => {
    const [company, setCompany] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { registerClient } = useClientData();

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!company.trim()) newErrors.company = '会社名を入力してください。';
        if (!name.trim()) newErrors.name = '担当者名を入力してください。';

        if (!email.trim()) {
            newErrors.email = 'メールアドレスを入力してください。';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = '有効なメールアドレス形式ではありません。';
        }

        if (password.length < 8) {
            newErrors.password = 'パスワードは8文字以上で設定してください。';
        }
        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'パスワードが一致しません。';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            return;
        }

        setIsLoading(true);
        // 'easy' type registers a 'free' plan user
        const success = await registerClient({ company, name, email }, 'easy');
        setIsLoading(false);

        if (success) {
            alert('フリープランへの登録が完了しました。ログインページに移動します。');
            navigate('/login');
        } else {
            setErrors({ form: '登録中にエラーが発生しました。' });
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4 font-jp">
            <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
                <div className="p-8 lg:p-10">
                    <div className="text-center mb-8">
                        <div className="flex items-center justify-center mb-4">
                             <svg className="h-10 w-10 text-primary mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V13H5V6.3l7-3.11v10.8z"/>
                            </svg>
                            <h1 className="text-2xl font-bold text-gray-900">かんたん登録</h1>
                        </div>
                        <p className="text-gray-600">フリープランで今すぐ始める</p>
                    </div>
                    <form className="space-y-4" onSubmit={handleSubmit}>
                        <div>
                            <label htmlFor="company" className="block text-sm font-medium text-gray-700">会社名</label>
                            <input id="company" name="company" type="text" required value={company} onChange={(e) => setCompany(e.target.value)} className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm enhanced-input ${errors.company ? 'invalid-input' : ''}`}/>
                            {errors.company && <p className="text-xs text-danger mt-1">{errors.company}</p>}
                        </div>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">担当者名</label>
                            <input id="name" name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm enhanced-input ${errors.name ? 'invalid-input' : ''}`}/>
                            {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700">メールアドレス</label>
                            <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm enhanced-input ${errors.email ? 'invalid-input' : ''}`}/>
                            {errors.email && <p className="text-xs text-danger mt-1">{errors.email}</p>}
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">パスワード</label>
                            <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm enhanced-input ${errors.password ? 'invalid-input' : ''}`}/>
                            {errors.password && <p className="text-xs text-danger mt-1">{errors.password}</p>}
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">パスワード（確認用）</label>
                            <input id="confirmPassword" name="confirmPassword" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm enhanced-input ${errors.confirmPassword ? 'invalid-input' : ''}`}/>
                            {errors.confirmPassword && <p className="text-xs text-danger mt-1">{errors.confirmPassword}</p>}
                        </div>
                        {errors.form && <p className="text-sm text-danger text-center">{errors.form}</p>}
                        <div>
                            <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 mt-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-blue-700 disabled:bg-gray-400">
                                {isLoading ? (<><i className="fas fa-spinner fa-spin mr-2"></i>登録中...</>) : ('同意して登録する')}
                            </button>
                        </div>
                    </form>
                    <div className="mt-6 text-center text-sm">
                        <p className="text-gray-600">
                            <Link to="/login" className="font-medium text-primary hover:text-blue-700">
                                既にアカウントをお持ちの場合はログイン
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EasyRegister;