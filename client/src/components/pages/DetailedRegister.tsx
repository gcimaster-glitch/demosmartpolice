import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useClientData } from '../../ClientDataContext.tsx';

const DetailedRegister: React.FC = () => {
    const { registerClient, plans } = useClientData();
    const publicPlans = plans.filter(p => p.isPublic && p.id !== 'plan_free');
    const location = useLocation();
    
    const [formData, setFormData] = useState({
        company_name: '', company_name_kana: '', company_registration_number: '',
        postal_code: '', prefecture: '', city: '', address: '', phone: '',
        family_name: '', given_name: '', family_name_kana: '', given_name_kana: '',
        department: '', position: '', email: '', password: '', password_confirm: '', user_phone: '',
        billing_name: '', billing_postal_code: '', billing_prefecture: '',
        billing_city: '', billing_address: '', billing_phone: '', payment_method: 'credit_card',
        card_number: '', card_expiry: '', card_cvc: '',
        bank_name: '', branch_name: '', account_type: '普通' as '普通' | '当座', account_number: '', account_holder_name: '',
        contract_plan: '',
        referral_code: '',
        terms_agreed: false, privacy_policy_agreed: false,
    });
    const [sameBillingAddress, setSameBillingAddress] = useState(false);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

     useEffect(() => {
        const params = new URLSearchParams(location.search);
        const refCode = params.get('ref');
        if (refCode) {
            setFormData(prev => ({ ...prev, referral_code: refCode }));
        }
    }, [location.search]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    useEffect(() => {
        if (sameBillingAddress) {
            setFormData(prev => ({
                ...prev,
                billing_name: prev.company_name,
                billing_postal_code: prev.postal_code,
                billing_prefecture: prev.prefecture,
                billing_city: prev.city,
                billing_address: prev.address,
                billing_phone: prev.phone,
            }));
        }
    }, [sameBillingAddress, formData.company_name, formData.postal_code, formData.prefecture, formData.city, formData.address, formData.phone]);

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.company_name) newErrors.company_name = '必須項目です';
        if (!formData.company_registration_number) {
            newErrors.company_registration_number = '必須項目です';
        } else if (formData.company_registration_number.length !== 13 || !/^\d+$/.test(formData.company_registration_number)) {
            newErrors.company_registration_number = '13桁の数字で入力してください';
        }
        if (!formData.postal_code) newErrors.postal_code = '必須項目です';
        if (!formData.address) newErrors.address = '必須項目です';
        if (!formData.family_name) newErrors.family_name = '必須項目です';
        if (!formData.given_name) newErrors.given_name = '必須項目です';
        if (!formData.email) {
            newErrors.email = '必須項目です';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = '有効な形式ではありません';
        }
        if (formData.password.length < 8) {
            newErrors.password = '8文字以上で入力してください';
        }
        if (formData.password !== formData.password_confirm) {
            newErrors.password_confirm = 'パスワードが一致しません';
        }
        if (!formData.contract_plan) newErrors.contract_plan = 'プランを選択してください';
        if (!formData.terms_agreed) newErrors.terms_agreed = '同意が必要です';
        if (!formData.privacy_policy_agreed) newErrors.privacy_policy_agreed = '同意が必要です';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;
        setIsLoading(true);
        const success = await registerClient(formData, 'detailed');
        setIsLoading(false);
        if (success) {
            alert('登録申請を受け付けました。ログインページに移動します。');
            navigate('/login');
        } else {
            setErrors({ form: '登録中にエラーが発生しました。' });
        }
    };
    
    const inputClass = (name: keyof typeof formData) => `w-full px-3 py-2 mt-1 border rounded-md shadow-sm enhanced-input ${errors[name] ? 'invalid-input' : ''}`;

    return (
        <div className="bg-gray-100 font-jp py-12">
            <div className="container mx-auto px-4 max-w-4xl">
                 <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">じっくり登録</h1>
                    <p className="text-gray-600">法人情報をご入力の上、最適なプランを選択してください。</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-8">
                    <form onSubmit={handleSubmit} noValidate>
                        {/* 法人基本情報 */}
                        <section className="mb-8">
                             <h2 className="text-xl font-bold text-gray-800 mb-4">法人基本情報</h2>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">法人番号<span className="text-danger">*</span></label>
                                    <input type="text" name="company_registration_number" required value={formData.company_registration_number} onChange={handleChange} className={inputClass('company_registration_number')} maxLength={13} />
                                    {errors.company_registration_number && <p className="text-xs text-danger mt-1">{errors.company_registration_number}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">企業名<span className="text-danger">*</span></label>
                                    <input type="text" name="company_name" required value={formData.company_name} onChange={handleChange} className={inputClass('company_name')} />
                                    {errors.company_name && <p className="text-xs text-danger mt-1">{errors.company_name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">郵便番号<span className="text-danger">*</span></label>
                                    <input type="text" name="postal_code" required value={formData.postal_code} onChange={handleChange} className={inputClass('postal_code')} />
                                    {errors.postal_code && <p className="text-xs text-danger mt-1">{errors.postal_code}</p>}
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700">都道府県</label><input type="text" name="prefecture" value={formData.prefecture} onChange={handleChange} className={inputClass('prefecture')} /></div>
                                <div><label className="block text-sm font-medium text-gray-700">市区町村</label><input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass('city')} /></div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">番地以降<span className="text-danger">*</span></label>
                                    <input type="text" name="address" required value={formData.address} onChange={handleChange} className={inputClass('address')} />
                                    {errors.address && <p className="text-xs text-danger mt-1">{errors.address}</p>}
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700">電話番号</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass('phone')} /></div>
                            </div>
                        </section>
                        <hr className="my-8" />
                        {/* 担当者情報 */}
                        <section className="mb-8">
                            <h2 className="text-xl font-bold text-gray-800 mb-4">担当者情報</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">姓<span className="text-danger">*</span></label>
                                    <input type="text" name="family_name" required value={formData.family_name} onChange={handleChange} className={inputClass('family_name')} />
                                    {errors.family_name && <p className="text-xs text-danger mt-1">{errors.family_name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">名<span className="text-danger">*</span></label>
                                    <input type="text" name="given_name" required value={formData.given_name} onChange={handleChange} className={inputClass('given_name')} />
                                    {errors.given_name && <p className="text-xs text-danger mt-1">{errors.given_name}</p>}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">メールアドレス<span className="text-danger">*</span></label>
                                    <input type="email" name="email" required value={formData.email} onChange={handleChange} className={inputClass('email')} />
                                    {errors.email && <p className="text-xs text-danger mt-1">{errors.email}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">パスワード<span className="text-danger">*</span></label>
                                    <input type="password" name="password" required value={formData.password} onChange={handleChange} className={inputClass('password')} />
                                    {errors.password && <p className="text-xs text-danger mt-1">{errors.password}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">パスワード（確認）<span className="text-danger">*</span></label>
                                    <input type="password" name="password_confirm" required value={formData.password_confirm} onChange={handleChange} className={inputClass('password_confirm')} />
                                    {errors.password_confirm && <p className="text-xs text-danger mt-1">{errors.password_confirm}</p>}
                                </div>
                            </div>
                        </section>
                         <hr className="my-8" />
                        {/* 請求・支払い情報 */}
                        <section className="mb-8">
                             <h2 className="text-xl font-bold text-gray-800 mb-4">請求・支払い情報</h2>
                             <label className="flex items-center mb-4"><input type="checkbox" checked={sameBillingAddress} onChange={e => setSameBillingAddress(e.target.checked)} className="mr-2"/><span className="text-gray-700">法人情報と同じ住所に請求する</span></label>
                            {!sameBillingAddress && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                    {/* Billing address fields */}
                                </div>
                            )}
                            <div><label className="block text-sm font-medium text-gray-700">支払い方法</label><select name="payment_method" value={formData.payment_method} onChange={handleChange} className={inputClass('payment_method')}><option value="credit_card">クレジットカード</option><option value="bank_transfer">銀行振込</option></select></div>
                            {/* Conditional fields for CC/Bank */}
                        </section>
                        <hr className="my-8" />
                        {/* 契約プラン選択 */}
                        <section className="mb-8">
                             <h2 className="text-xl font-bold text-gray-800 mb-4">契約プラン選択<span className="text-danger">*</span></h2>
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {publicPlans.map(plan => (
                                    <label key={plan.id} className="relative cursor-pointer">
                                        <input type="radio" name="contract_plan" value={plan.id} onChange={handleChange} className="peer sr-only" />
                                        <div className="border-2 border-gray-300 rounded-lg p-6 peer-checked:border-primary peer-checked:bg-blue-50 text-center h-full">
                                            <h3 className="font-bold text-gray-900">{plan.name}</h3>
                                            <div className="text-2xl font-bold my-2 text-gray-800">¥{plan.monthlyFee.toLocaleString()}<span className="text-sm text-gray-600">/月</span></div>
                                        </div>
                                    </label>
                                ))}
                             </div>
                              {errors.contract_plan && <p className="text-xs text-danger mt-1">{errors.contract_plan}</p>}
                        </section>
                        <hr className="my-8" />
                        {/* 紹介者コード */}
                        <section className="mb-8">
                             <h2 className="text-xl font-bold text-gray-800 mb-4">紹介者情報</h2>
                             <div><label className="block text-sm font-medium text-gray-700">紹介者コード（任意）</label><input type="text" name="referral_code" value={formData.referral_code} onChange={handleChange} className={inputClass('referral_code')} /></div>
                        </section>
                         <hr className="my-8" />
                        {/* 同意 */}
                        <section className="mb-8">
                            <label className="flex items-start mb-4">
                                <input type="checkbox" name="terms_agreed" checked={formData.terms_agreed} onChange={handleChange} className="mt-1 mr-2" />
                                <span className="text-gray-700">利用規約に同意します<span className="text-danger">*</span></span>
                            </label>
                             {errors.terms_agreed && <p className="text-xs text-danger">{errors.terms_agreed}</p>}
                            <label className="flex items-start">
                                <input type="checkbox" name="privacy_policy_agreed" checked={formData.privacy_policy_agreed} onChange={handleChange} className="mt-1 mr-2" />
                                <span className="text-gray-700">個人情報保護方針に同意します<span className="text-danger">*</span></span>
                            </label>
                            {errors.privacy_policy_agreed && <p className="text-xs text-danger">{errors.privacy_policy_agreed}</p>}
                        </section>
                        <div className="flex items-center justify-center space-x-4">
                             <Link to="/register" className="px-8 py-3 border rounded-lg text-gray-700 hover:bg-gray-100">戻る</Link>
                            <button type="submit" disabled={isLoading} className="bg-primary hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg disabled:bg-gray-400">
                                {isLoading ? '送信中...' : '登録申請を送信'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DetailedRegister;
