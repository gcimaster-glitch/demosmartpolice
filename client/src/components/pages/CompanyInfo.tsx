import React, { useState, useEffect } from 'react';
import { useClientData } from '../../ClientDataContext.tsx';
import { useAuth } from '../../AuthContext.tsx';
import { Link } from 'react-router-dom';
import type { Address, Client } from '../../types.ts';
import ImageUploader from '../admin/ImageUploader.tsx';

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


const CompanyInfo: React.FC = () => {
    const { user } = useAuth();
    const { currentClient: companyProfile, saveClient: saveCompanyProfile, plans } = useClientData();
    const [isEditing, setIsEditing] = useState(false);
    const [editedProfile, setEditedProfile] = useState<Client | undefined | null>(companyProfile);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    
    const currentPlan = companyProfile ? plans.find(p => p.id === companyProfile.planId) : undefined;

    useEffect(() => {
        setEditedProfile(companyProfile);
    }, [companyProfile, isEditing]);

    if (!companyProfile || !user) {
         return (
            <div className="fade-in text-center py-20">
                 <div className="bg-white p-12 rounded-lg shadow-md inline-block">
                    <i className="fas fa-exclamation-triangle text-5xl text-red-400 mb-4"></i>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">情報が見つかりません</h2>
                    <p className="text-gray-500">企業のプロファイル情報を読み込めませんでした。</p>
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
        if (!editedProfile.companyName.trim()) newErrors.companyName = '会社名を入力してください。';
        if (!editedProfile.contactPerson.trim()) newErrors.contactPerson = '担当者名を入力してください。';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedProfile.email)) newErrors.email = '有効なメールアドレス形式ではありません。';
        if (!/^\d{13}$/.test(editedProfile.corporateNumber)) newErrors.corporateNumber = '法人番号は13桁の数字で入力してください。';
        if (editedProfile.website && !/^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/.test(editedProfile.website)) newErrors.website = '有効なURL形式ではありません。';
        if (!/^\d{10,11}$/.test(editedProfile.phone.replace(/-/g, ''))) newErrors.phone = '有効な電話番号形式ではありません（ハイフンなし）。';

        if (editedProfile.paymentMethod === 'credit_card') {
            if (!editedProfile.cardNumber || !/^\d{14,16}$/.test(editedProfile.cardNumber.replace(/\s/g, ''))) newErrors.cardNumber = 'カード番号は14〜16桁の数字で入力してください。';
            const expiryRegex = /^(0[1-9]|1[0-2])\/?([0-9]{2})$/;
            if (!editedProfile.cardExpiry || !expiryRegex.test(editedProfile.cardExpiry)) {
                newErrors.cardExpiry = '有効期限はMM/YY形式で入力してください。';
            } else {
                const match = editedProfile.cardExpiry.match(expiryRegex);
                if (match) {
                    const month = parseInt(match[1], 10);
                    const year = parseInt(`20${match[2]}`, 10);
                    const now = new Date();
                    const lastDayOfMonth = new Date(year, month, 0);
                    if (lastDayOfMonth < now) {
                        newErrors.cardExpiry = '有効期限が切れています。';
                    }
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleCancel = () => {
        setEditedProfile(companyProfile);
        setIsEditing(false);
        setErrors({});
    };

    const handleSave = () => {
        if (!editedProfile || !validate()) return;
        saveCompanyProfile(editedProfile);
        setIsEditing(false);
        setErrors({});
        alert('企業情報を更新しました。');
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditedProfile(prev => {
            if (!prev) return null;
            const keys = name.split('.');
            if (keys.length === 2) {
                const [objectKey, fieldKey] = keys as [keyof Client, string];
                return {
                    ...prev,
                    [objectKey]: {
                        ...(prev[objectKey] as object),
                        [fieldKey]: value,
                    },
                };
            } else {
                return { ...prev, [name]: value };
            }
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
    
    if (!editedProfile) return null; // Should not happen due to the guard above

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
                    <InfoRow label="企業ロゴ" value={isEditing ? 
                        <ImageUploader 
                            imageUrl={editedProfile.companyLogoUrl}
                            onImageChange={url => setEditedProfile(p => p ? {...p, companyLogoUrl: url} : null)}
                            onImageRemove={() => setEditedProfile(p => p ? {...p, companyLogoUrl: ''} : null)}
                            maxWidth={200}
                            maxHeight={200}
                            maxSizeInMB={1}
                            recommendedSizeText="推奨: 200x200px, 1MB以下"
                        /> : 
                        companyProfile.companyLogoUrl ? <img src={companyProfile.companyLogoUrl} alt="企業ロゴ" className="max-h-16" /> : '未設定'} 
                    />
                    <InfoRow label="企業ID" value={companyProfile.id} />
                    <InfoRow label="会社名" value={isEditing ? <EditableValue name="companyName"><input type="text" name="companyName" value={editedProfile.companyName} onChange={handleChange} className={inputClass('companyName')} /></EditableValue> : companyProfile.companyName} />
                    <InfoRow label="メイン担当者名" value={isEditing ? <EditableValue name="contactPerson"><input type="text" name="contactPerson" value={editedProfile.contactPerson} onChange={handleChange} className={inputClass('contactPerson')} /></EditableValue> : companyProfile.contactPerson} />
                    <InfoRow label="登録メールアドレス" value={isEditing ? <EditableValue name="email"><input type="email" name="email" value={editedProfile.email} onChange={handleChange} className={inputClass('email')} /></EditableValue> : companyProfile.email} />
                    <InfoRow label="契約プラン" value={
                        <span className="font-semibold text-primary flex items-center">
                            {currentPlan?.name || '不明'}
                            <Link to="/app/plan-change" className="ml-4 text-xs text-blue-600 hover:underline">(プランを変更)</Link>
                        </span>
                    } />
                    <InfoRow label="ステータス" value={<span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${companyProfile.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{statusLabels[companyProfile.status]}</span>} />
                </Section>
                
                <Section title="登記情報" icon="fa-file-alt">
                    <InfoRow label="法人番号" value={isEditing ? <EditableValue name="corporateNumber"><input type="text" name="corporateNumber" value={editedProfile.corporateNumber} onChange={handleChange} className={inputClass('corporateNumber')} /></EditableValue> : companyProfile.corporateNumber} />
                    <InfoRow label="本店所在地" value={isEditing ? 
                        <EditableValue name="address">
                            <div className="space-y-1">
                                <input type="text" name="address.prefecture" value={editedProfile.address.prefecture} onChange={handleChange} placeholder="都道府県" className={inputClass('address.prefecture')} />
                                <input type="text" name="address.city" value={editedProfile.address.city} onChange={handleChange} placeholder="市区町村" className={inputClass('address.city')} />
                                <input type="text" name="address.address1" value={editedProfile.address.address1} onChange={handleChange} placeholder="番地" className={inputClass('address.address1')} />
                                <input type="text" name="address.address2" value={editedProfile.address.address2} onChange={handleChange} placeholder="建物名・部屋番号" className={inputClass('address.address2')} />
                            </div>
                        </EditableValue> 
                        : addressToString(companyProfile.address)} />
                    <InfoRow label="設立年月日" value={isEditing ? <EditableValue name="establishmentDate"><input type="date" name="establishmentDate" value={editedProfile.establishmentDate || ''} onChange={handleChange} className={inputClass('establishmentDate')} /></EditableValue> : companyProfile.establishmentDate ? new Date(companyProfile.establishmentDate).toLocaleDateString('ja-JP') : ''} />
                    <InfoRow label="資本金" value={isEditing ? <EditableValue name="capital"><input type="text" name="capital" value={editedProfile.capital || ''} onChange={handleChange} className={inputClass('capital')} /></EditableValue> : companyProfile.capital} />
                </Section>
                
                <Section title="企業情報" icon="fa-building">
                    <InfoRow label="事業内容" value={isEditing ? <EditableValue name="businessDescription"><textarea name="businessDescription" value={editedProfile.businessDescription || ''} onChange={handleChange} rows={3} className={textareaClass('businessDescription')} /></EditableValue> : companyProfile.businessDescription} />
                    <InfoRow label="ウェブサイト" value={isEditing ? <EditableValue name="website"><input type="url" name="website" value={editedProfile.website} onChange={handleChange} className={inputClass('website')} /></EditableValue> : <a href={companyProfile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{companyProfile.website}</a>} />
                    <InfoRow label="電話番号" value={isEditing ? <EditableValue name="phone"><input type="tel" name="phone" value={editedProfile.phone} onChange={handleChange} className={inputClass('phone')} /></EditableValue> : companyProfile.phone} />
                    <InfoRow label="従業員数" value={isEditing ? <EditableValue name="employeeCount"><input type="text" name="employeeCount" value={editedProfile.employeeCount || ''} onChange={handleChange} className={inputClass('employeeCount')} /></EditableValue> : companyProfile.employeeCount} />
                </Section>
                
                 <Section title="請求・支払い情報" icon="fa-receipt">
                    <InfoRow label="請求先住所" value={isEditing ? 
                        <EditableValue name="billingAddress">
                           <div className="space-y-1">
                                <input type="text" name="billingAddress.prefecture" value={editedProfile.billingAddress?.prefecture || ''} onChange={handleChange} placeholder="都道府県" className={inputClass('billingAddress.prefecture')} />
                                <input type="text" name="billingAddress.city" value={editedProfile.billingAddress?.city || ''} onChange={handleChange} placeholder="市区町村" className={inputClass('billingAddress.city')} />
                                <input type="text" name="billingAddress.address1" value={editedProfile.billingAddress?.address1 || ''} onChange={handleChange} placeholder="番地" className={inputClass('billingAddress.address1')} />
                                <input type="text" name="billingAddress.address2" value={editedProfile.billingAddress?.address2 || ''} onChange={handleChange} placeholder="建物名・部屋番号" className={inputClass('billingAddress.address2')} />
                            </div>
                        </EditableValue> 
                        : addressToString(companyProfile.billingAddress)} />
                    <InfoRow label="お支払い方法" value={isEditing ? 
                        <EditableValue name="paymentMethod"><select name="paymentMethod" value={editedProfile.paymentMethod} onChange={handleChange} className={selectClass('paymentMethod')}>
                            <option value="credit_card">クレジットカード</option>
                            <option value="bank_transfer">銀行振込</option>
                        </select></EditableValue> 
                        : paymentMethodLabels[companyProfile.paymentMethod]} />
                    {editedProfile.paymentMethod === 'credit_card' && (
                        <>
                            <InfoRow label="カード番号" value={isEditing ? <EditableValue name="cardNumber"><input type="text" name="cardNumber" value={editedProfile.cardNumber || ''} onChange={handleChange} className={`${inputClass('cardNumber')} font-mono`} /></EditableValue> : <span className="font-mono">{companyProfile.cardNumber}</span>} />
                            <InfoRow label="有効期限" value={isEditing ? <EditableValue name="cardExpiry"><input type="text" name="cardExpiry" value={editedProfile.cardExpiry || ''} onChange={handleChange} className={`${inputClass('cardExpiry')} font-mono`} placeholder="MM/YY" /></EditableValue> : <span className="font-mono">{companyProfile.cardExpiry}</span>} />
                        </>
                    )}
                </Section>
            </div>
        </div>
    );
};

export default CompanyInfo;