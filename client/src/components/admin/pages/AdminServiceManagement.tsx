import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { Service } from '../../../types';
import { useClientData } from '../../../ClientDataContext.tsx';
import ImageUploader from '../ImageUploader.tsx';

const initialFormState: Omit<Service, 'id'> = {
    name: '', category: 'consulting', description: '', longDescription: '', price: 0, priceType: 'one-time', icon: 'fas fa-info-circle', color: 'gray-500', status: 'active', mainImageUrl: '', subImageUrls: [],
};

const ServiceEditorView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { services, createService, updateService } = useClientData();

    const isCreating = location.pathname.endsWith('/new');
    const service = isCreating ? null : services.find(s => s.id === id);

    const [formData, setFormData] = useState(isCreating ? initialFormState : service || initialFormState);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.name.trim()) newErrors.name = 'サービス名を入力してください。';
        if (!formData.description.trim()) newErrors.description = '概要を入力してください。';
        if (!formData.longDescription.trim()) newErrors.longDescription = '詳細説明を入力してください。';
        if (isNaN(formData.price) || formData.price < 0) {
            newErrors.price = '価格は0以上の数値を入力してください。';
        }
        if (!formData.icon.trim()) newErrors.icon = 'アイコンクラス名を入力してください（例: fas fa-shield-alt）。';
        if (!formData.color.trim()) newErrors.color = 'Tailwindの色クラス名を入力してください（例: blue-500）。';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        const finalData = { ...formData, subImageUrls: (formData.subImageUrls || []).filter(url => url) };
        if (service) {
            updateService({ ...finalData, id: service.id });
        } else {
            createService(finalData);
        }
        navigate('/app/services');
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'price' ? parseInt(value, 10) : value }));
    };
    
    const handleSubImageChange = (url: string, index: number) => {
        const newUrls = [...(formData.subImageUrls || [])];
        newUrls[index] = url;
        setFormData(prev => ({ ...prev, subImageUrls: newUrls }));
    };
    
    const handleSubImageRemove = (index: number) => {
        const newUrls = [...(formData.subImageUrls || [])];
        newUrls.splice(index, 1);
        setFormData(prev => ({ ...prev, subImageUrls: newUrls }));
    };

    return (
        <div className="fade-in space-y-6">
            <button onClick={() => navigate('/app/services')} className="text-sm text-primary mb-2 flex items-center">
                <i className="fas fa-chevron-left mr-2"></i>サービス一覧に戻る
            </button>
            <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
                <div className="p-6 border-b"><h3 className="text-lg font-medium text-gray-900">{isCreating ? '新規サービス作成' : 'サービスの編集'}</h3></div>
                <div className="p-6 space-y-4 flex-grow overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">サービス名</label>
                        <input type="text" name="name" value={formData.name} onChange={handleInputChange} className={`mt-1 w-full p-2 border rounded-md enhanced-input ${errors.name ? 'invalid-input' : ''}`}/>
                        {errors.name && <p className="text-xs text-danger mt-1">{errors.name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">概要</label>
                        <input type="text" name="description" value={formData.description} onChange={handleInputChange} className={`mt-1 w-full p-2 border rounded-md enhanced-input ${errors.description ? 'invalid-input' : ''}`}/>
                        {errors.description && <p className="text-xs text-danger mt-1">{errors.description}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">詳細説明</label>
                        <textarea name="longDescription" value={formData.longDescription} onChange={handleInputChange} rows={4} className={`mt-1 w-full p-2 border rounded-md enhanced-input ${errors.longDescription ? 'invalid-input' : ''}`}/>
                        {errors.longDescription && <p className="text-xs text-danger mt-1">{errors.longDescription}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">価格</label>
                            <input type="number" name="price" value={formData.price} onChange={handleInputChange} className={`mt-1 w-full p-2 border rounded-md enhanced-input ${errors.price ? 'invalid-input' : ''}`}/>
                             {errors.price && <p className="text-xs text-danger mt-1">{errors.price}</p>}
                        </div>
                        <div><label className="block text-sm font-medium text-gray-700">価格タイプ</label><select name="priceType" value={formData.priceType} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md enhanced-input"><option value="one-time">一回</option><option value="monthly">月額</option><option value="per-use">回ごと</option></select></div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700">アイコン (FontAwesome)</label>
                            <input type="text" name="icon" value={formData.icon} onChange={handleInputChange} className={`mt-1 w-full p-2 border rounded-md enhanced-input ${errors.icon ? 'invalid-input' : ''}`}/>
                             {errors.icon && <p className="text-xs text-danger mt-1">{errors.icon}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">色 (Tailwind)</label>
                            <input type="text" name="color" value={formData.color} onChange={handleInputChange} className={`mt-1 w-full p-2 border rounded-md enhanced-input ${errors.color ? 'invalid-input' : ''}`}/>
                            {errors.color && <p className="text-xs text-danger mt-1">{errors.color}</p>}
                        </div>
                    </div>
                    <div><label className="block text-sm font-medium text-gray-700">ステータス</label><select name="status" value={formData.status} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md enhanced-input"><option value="active">有効</option><option value="inactive">無効</option></select></div>
                    <div className="border-t pt-4">
                        <h4 className="text-md font-semibold text-gray-800 mb-2">画像設定</h4>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">メイン画像</label>
                            {/* FIX: Add missing maxSizeInMB prop */}
                            <ImageUploader imageUrl={formData.mainImageUrl} onImageChange={url => setFormData(p => ({...p, mainImageUrl: url}))} onImageRemove={() => setFormData(p => ({...p, mainImageUrl: ''}))} recommendedSizeText="推奨サイズ: 800x400px" maxWidth={800} maxHeight={400} maxSizeInMB={1} />
                        </div>
                         <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700">サブ画像 (最大3枚)</label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                {[0, 1, 2].map(i => (
                                    // FIX: Add missing maxSizeInMB prop
                                    <ImageUploader key={i} imageUrl={formData.subImageUrls ? formData.subImageUrls[i] : ''} onImageChange={url => handleSubImageChange(url, i)} onImageRemove={() => handleSubImageRemove(i)} recommendedSizeText="推奨: 400x300px" maxWidth={400} maxHeight={300} maxSizeInMB={1} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3 mt-auto">
                    <button onClick={() => navigate('/app/services')} className="px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-50">キャンセル</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">保存</button>
                </div>
            </div>
        </div>
    );
};

const ServiceListView: React.FC = () => {
    const { services, hasPermission } = useClientData();
    const navigate = useNavigate();
    const canEdit = hasPermission('EDIT_SERVICES');

    return (
        <div className="fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div><h1 className="text-3xl font-bold text-gray-800">サービス管理</h1><p className="text-gray-500">クライアントに提供するサービスを管理します。</p></div>
                {canEdit && <button onClick={() => navigate('/app/services/new')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"><i className="fas fa-plus mr-2"></i>新規サービス作成</button>}
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">サービス名</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">価格</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th></tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {services.map(s => (<tr key={s.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/app/services/${s.id}`)}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.id}</td>
                            <td className="px-6 py-4 font-medium text-gray-900">{s.name}</td>
                            <td className="px-6 py-4 text-sm text-gray-700">¥{s.price.toLocaleString()}</td>
                            <td className="px-6 py-4"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${s.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{s.status}</span></td>
                        </tr>))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdminServiceManagement: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const isEditOrCreate = !!id || location.pathname.endsWith('/new');

    if (isEditOrCreate) {
        return <ServiceEditorView />;
    }
    return <ServiceListView />;
};

export default AdminServiceManagement;
