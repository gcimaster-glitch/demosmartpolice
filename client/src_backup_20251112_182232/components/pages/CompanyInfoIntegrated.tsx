import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext.tsx';
import { Link } from 'react-router-dom';
import { clientsAPI, handleAPIError } from '../../services/apiClient.ts';
import type { Address } from '../../types.ts';

const statusLabels = {
    active: '有効',
    suspended: '停止中',
};

const paymentMethodLabels = {
    credit_card: 'クレジットカード',
    bank_transfer: '銀行振込',
};

const addressToString = (addr?: Address) => {
    if (!addr) return '';
    return `${addr.prefecture || ''}${addr.city || ''}${addr.address1 || ''} ${addr.address2 || ''}`.trim();
};


const InfoRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-1 py-3 border-b border-gray-100">
        <dt className="text-sm font-medium text-gray-500 flex items-center">{label}</dt>
        <dd className="md:col-span-2 text-sm text-gray-900">{value}</dd>
    </div>
);

const Section: React.FC<{ title: string; icon: string; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-800 border-b-2 border-primary pb-2 mb-4">
            <i className={`fas ${icon} text-primary mr-3`}></i>{title}
        </h3>
        <dl>
            {children}
        </dl>
    </div>
);


const CompanyInfoIntegrated: React.FC = () => {
    const { user } = useAuth();
    const [companyProfile, setCompanyProfile] = useState<any>(null);
    const [currentPlan, setCurrentPlan] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState<any>(null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchData = async () => {
            if (!user?.clientId) {
                setError('ユーザー情報が見つかりません');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await clientsAPI.getById(user.clientId);
                
                if (response.success) {
                    setCompanyProfile(response.data.client);
                    setCurrentPlan(response.data.plan);
                    setEditedProfile(response.data.client);
                } else {
                    setError(response.error || 'データの取得に失敗しました');
                }
            } catch (err) {
                setError(handleAPIError(err));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    useEffect(() => {
        setEditedProfile(companyProfile);
    }, [companyProfile, isEditing]);

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

    if (error || !companyProfile || !user) {
         return (
            <div className="fade-in text-center py-20">
                 <div className="bg-white p-12 rounded-lg shadow-md inline-block">
                    <i className="fas fa-exclamation-triangle text-5xl text-red-400 mb-4"></i>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">情報が見つかりません</h2>
                    <p className="text-gray-500">{error || '企業のプロファイル情報を読み込めませんでした。'}</p>
                </div>
            </div>
        );
    }
    
    if (user.email !== companyProfile.email) {
         return (
            <div className="fade-in text-center py-20">
                 <div className="bg-white p-12 rounded-lg shadow-md inline-block">
                    <i className="fas fa-exclamation-triangle text-5xl text-red-400 mb-4"></i>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">アクセス権がありません</h2>
                    <p className="text-gray-500">この企業の情報を表示する権限がありません。</p>
                </div>
            </div>
        );
    }

    const validate = () => {
        if (!editedProfile) return false;
        const newErrors: { [key: string]: string } = {};
        if (!editedProfile.company_name?.trim()) newErrors.company_name = '会社名を入力してください。';
        if (!editedProfile.contact_person?.trim()) newErrors.contact_person = '担当者名を入力してください。';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedProfile.email)) newErrors.email = '有効なメールアドレス形式ではありません。';
        if (editedProfile.website && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(editedProfile.website)) newErrors.website = '有効なURL形式ではありません。';
        if (editedProfile.phone && !/^\d{10,11}$/.test(editedProfile.phone.replace(/-/g, ''))) newErrors.phone = '有効な電話番号形式ではありません（ハイフンなし）。';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleCancel = () => {
        setEditedProfile(companyProfile);
        setIsEditing(false);
        setErrors({});
    };

    const handleSave = async () => {
        if (!editedProfile || !validate()) return;
        
        try {
            const response = await clientsAPI.update(companyProfile.id, {
                companyName: editedProfile.company_name,
                companyNameKana: editedProfile.company_name_kana,
                contactPerson: editedProfile.contact_person,
                phone: editedProfile.phone,
                postalCode: editedProfile.postal_code,
                prefecture: editedProfile.prefecture,
                city: editedProfile.city,
                address1: editedProfile.address1,
                address2: editedProfile.address2,
                website: editedProfile.website,
                establishmentDate: editedProfile.establishment_date,
                capital: editedProfile.capital,
                businessDescription: editedProfile.business_description,
                employeeCount: editedProfile.employee_count,
            });

            if (response.success) {
                setCompanyProfile(response.data);
                setIsEditing(false);
                setErrors({});
                alert('企業情報を更新しました。');
            } else {
                alert('更新に失敗しました: ' + (response.error || '不明なエラー'));
            }
        } catch (err) {
            alert('更新に失敗しました: ' + handleAPIError(err));
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedProfile((prev: any) => {
            if (!prev) return null;
            return { ...prev, [name]: value };
        });
    };


    const inputClass = (name: string) => `w-full enhanced-input p-1 border rounded-md text-sm ${errors[name] ? 'invalid-input' : ''}`;
    const selectClass = (name: string) => `w-full enhanced-input p-1 border rounded-md text-sm ${errors[name] ? 'invalid-input' : ''}`;
    const textareaClass = (name: string) => `w-full enhanced-input p-1 border rounded-md text-sm ${errors[name] ? 'invalid-input' : ''}`;
    
    const EditableValue: React.FC<{ name: string; children: React.ReactNode }> = ({ name, children }) => (
        <div>
            {children}
            {errors[name] && <p className="text-xs text-danger mt-1">{errors[name]}</p>}
        </div>
    );
    
    if (!editedProfile) return null;

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">自社情報</h2>
                    <p className="text-secondary">ご登録いただいている企業様の情報です。</p>
                </div>
                 {isEditing ? (
                    <div className="space-x-3">
                        <button onClick={handleCancel} className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors focus-ring">
                            キャンセル
                        </button>
                        <button onClick={handleSave} className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors focus-ring">
                            <i className="fas fa-save mr-2"></i>保存
                        </button>
                    </div>
                 ) : (
                    <button onClick={() => setIsEditing(true)} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors focus-ring">
                        <i className="fas fa-edit mr-2"></i>編集
                    </button>
                 )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
                
                <Section title="基本情報" icon="fa-id-card">
                    <InfoRow label="企業ID" value={companyProfile.id} />
                    <InfoRow label="会社名" value={isEditing ? <EditableValue name="company_name"><input type="text" name="company_name" value={editedProfile.company_name || ''} onChange={handleChange} className={inputClass('company_name')} /></EditableValue> : companyProfile.company_name} />
                    <InfoRow label="メイン担当者名" value={isEditing ? <EditableValue name="contact_person"><input type="text" name="contact_person" value={editedProfile.contact_person || ''} onChange={handleChange} className={inputClass('contact_person')} /></EditableValue> : companyProfile.contact_person} />
                    <InfoRow label="登録メールアドレス" value={isEditing ? <EditableValue name="email"><input type="email" name="email" value={editedProfile.email || ''} onChange={handleChange} className={inputClass('email')} disabled /></EditableValue> : companyProfile.email} />
                    <InfoRow label="契約プラン" value={
                        <span className="font-semibold text-primary flex items-center">
                            {currentPlan?.name || '不明'}
                            <Link to="/app/plan-change" className="ml-4 text-xs text-blue-600 hover:underline">(プランを変更)</Link>
                        </span>
                    } />
                    <InfoRow label="ステータス" value={<span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${companyProfile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{statusLabels[companyProfile.status as keyof typeof statusLabels]}</span>} />
                </Section>
                
                <Section title="登記情報" icon="fa-file-alt">
                    <InfoRow label="郵便番号" value={isEditing ? <EditableValue name="postal_code"><input type="text" name="postal_code" value={editedProfile.postal_code || ''} onChange={handleChange} className={inputClass('postal_code')} /></EditableValue> : companyProfile.postal_code} />
                    <InfoRow label="本店所在地" value={isEditing ? 
                        <EditableValue name="address">
                            <div className="space-y-1">
                                <input type="text" name="prefecture" value={editedProfile.prefecture || ''} onChange={handleChange} placeholder="都道府県" className={inputClass('prefecture')} />
                                <input type="text" name="city" value={editedProfile.city || ''} onChange={handleChange} placeholder="市区町村" className={inputClass('city')} />
                                <input type="text" name="address1" value={editedProfile.address1 || ''} onChange={handleChange} placeholder="番地" className={inputClass('address1')} />
                                <input type="text" name="address2" value={editedProfile.address2 || ''} onChange={handleChange} placeholder="建物名・部屋番号" className={inputClass('address2')} />
                            </div>
                        </EditableValue> 
                        : `${companyProfile.prefecture || ''} ${companyProfile.city || ''} ${companyProfile.address1 || ''} ${companyProfile.address2 || ''}`.trim()} />
                    <InfoRow label="設立年月日" value={isEditing ? <EditableValue name="establishment_date"><input type="date" name="establishment_date" value={editedProfile.establishment_date || ''} onChange={handleChange} className={inputClass('establishment_date')} /></EditableValue> : companyProfile.establishment_date ? new Date(companyProfile.establishment_date).toLocaleDateString('ja-JP') : ''} />
                    <InfoRow label="資本金" value={isEditing ? <EditableValue name="capital"><input type="text" name="capital" value={editedProfile.capital || ''} onChange={handleChange} className={inputClass('capital')} /></EditableValue> : companyProfile.capital} />
                </Section>
                
                <Section title="企業情報" icon="fa-building">
                    <InfoRow label="事業内容" value={isEditing ? <EditableValue name="business_description"><textarea name="business_description" value={editedProfile.business_description || ''} onChange={handleChange} rows={3} className={textareaClass('business_description')} /></EditableValue> : companyProfile.business_description} />
                    <InfoRow label="ウェブサイト" value={isEditing ? <EditableValue name="website"><input type="url" name="website" value={editedProfile.website || ''} onChange={handleChange} className={inputClass('website')} /></EditableValue> : companyProfile.website ? <a href={companyProfile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{companyProfile.website}</a> : '-'} />
                    <InfoRow label="電話番号" value={isEditing ? <EditableValue name="phone"><input type="tel" name="phone" value={editedProfile.phone || ''} onChange={handleChange} className={inputClass('phone')} /></EditableValue> : companyProfile.phone} />
                    <InfoRow label="従業員数" value={isEditing ? <EditableValue name="employee_count"><input type="text" name="employee_count" value={editedProfile.employee_count || ''} onChange={handleChange} className={inputClass('employee_count')} /></EditableValue> : companyProfile.employee_count} />
                </Section>
            </div>
        </div>
    );
};

export default CompanyInfoIntegrated;
