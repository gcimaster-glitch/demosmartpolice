import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { Material } from '../../../types.ts';
import { useClientData } from '../../../ClientDataContext.tsx';
import FileUploader from '../FileUploader.tsx';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const initialFormState: Omit<Material, 'id' | 'uploadedAt'> = {
    title: '',
    description: '',
    category: 'サービスパンフレット',
    fileName: '',
    fileUrl: '', // This would be handled by backend in a real app
    fileSize: '',
};

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const MaterialEditorView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { materials, addMaterial, updateMaterial, deleteMaterial } = useClientData();

    const isCreating = location.pathname.endsWith('/new');
    const material = isCreating ? null : materials.find(m => m.id === Number(id));

    const [formData, setFormData] = useState<Omit<Material, 'id' | 'uploadedAt'>>(isCreating ? initialFormState : material || initialFormState);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.title.trim()) newErrors.title = 'タイトルを入力してください。';
        if (formData.description.length > 150) newErrors.description = '説明は150文字以内で入力してください。';
        if (isCreating && !selectedFile) newErrors.file = 'ファイルをアップロードしてください。';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        
        const dataToSave = { ...formData };
        if (selectedFile) {
            dataToSave.fileName = selectedFile.name;
            dataToSave.fileSize = formatBytes(selectedFile.size);
            // In a real app, you would upload the file and get a URL
            dataToSave.fileUrl = '#'; // Placeholder
        }

        if (isCreating) {
            addMaterial(dataToSave);
        } else if(material) {
            updateMaterial(material.id, dataToSave);
        }
        navigate('/app/materials');
    };

    const handleDelete = () => {
        if (material && window.confirm('この資料を削除しますか？')) {
            deleteMaterial(material.id);
            navigate('/app/materials');
        }
    };
    
    const handleFileSelect = (file: File) => {
        setSelectedFile(file);
        setFormData(prev => ({...prev, fileName: file.name}));
        if(errors.file) setErrors(prev => ({...prev, file: ''}));
    };

    return (
        <div className="fade-in space-y-6">
            <button onClick={() => navigate('/app/materials')} className="text-sm text-primary mb-2 flex items-center">
                <i className="fas fa-chevron-left mr-2"></i>資料一覧に戻る
            </button>
            <div className="bg-white rounded-lg shadow-md flex flex-col">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">{isCreating ? '新規資料アップロード' : '資料の編集'}</h3>
                    {!isCreating && <button onClick={handleDelete} className="text-red-600 hover:text-red-800 text-sm"><i className="fas fa-trash-alt mr-1"></i>削除</button>}
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">タイトル <span className="text-danger">*</span></label>
                        <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={`mt-1 w-full p-2 border rounded-md enhanced-input ${errors.title ? 'invalid-input' : ''}`} />
                        {errors.title && <p className="text-xs text-danger mt-1">{errors.title}</p>}
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">説明</label>
                        <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} maxLength={150} className={`mt-1 w-full p-2 border rounded-md enhanced-input ${errors.description ? 'invalid-input' : ''}`} />
                        <div className="text-xs text-gray-500 text-right">{formData.description.length}/150</div>
                        {errors.description && <p className="text-xs text-danger mt-1">{errors.description}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">カテゴリ</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as Material['category']})} className="mt-1 w-full p-2 border rounded-md enhanced-input">
                            <option>サービスパンフレット</option><option>法令資料</option><option>社内研修資料</option><option>その他</option>
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">ファイル <span className="text-danger">*</span></label>
                        <FileUploader onFileSelect={handleFileSelect} maxSize={MAX_FILE_SIZE} fileName={formData.fileName} />
                        {errors.file && <p className="text-xs text-danger mt-1">{errors.file}</p>}
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                    <button onClick={() => navigate('/app/materials')} className="px-4 py-2 border rounded-md">キャンセル</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">保存</button>
                </div>
            </div>
        </div>
    );
};

const MaterialListView: React.FC = () => {
    const { materials, hasPermission } = useClientData();
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    const navigate = useNavigate();
    const canEdit = hasPermission('EDIT_MATERIALS');
    
    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ja-JP');

    return (
        <div className="fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div><h1 className="text-3xl font-bold text-gray-800">資料室管理</h1><p className="text-gray-500">クライアント向け資料のアップロードと管理を行います。</p></div>
                {canEdit && <button onClick={() => navigate('/app/materials/new')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"><i className="fas fa-plus mr-2"></i>新規アップロード</button>}
            </div>
             <div className="flex justify-end">
                <div className="bg-gray-200 p-1 rounded-lg">
                    <button onClick={() => setViewMode('card')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'card' ? 'bg-white shadow' : ''}`}><i className="fas fa-th-large"></i></button>
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'list' ? 'bg-white shadow' : ''}`}><i className="fas fa-list"></i></button>
                </div>
            </div>

            {viewMode === 'card' ? (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {materials.map(m => (
                        <div key={m.id} onClick={() => navigate(`/app/materials/${m.id}`)} className="bg-white rounded-lg shadow-md border flex flex-col cursor-pointer hover:shadow-lg transition-shadow">
                            <div className="p-6 flex flex-col flex-grow">
                                <h3 className="text-md font-bold text-gray-900 mb-2">{m.title}</h3>
                                <p className="text-sm text-gray-600 flex-grow mb-4">{m.description}</p>
                                <div className="text-xs text-gray-500 border-t pt-3 mt-auto space-y-1">
                                    <p>カテゴリ: {m.category}</p>
                                    <p>ファイル名: {m.fileName}</p>
                                    <p>更新日: {formatDate(m.uploadedAt)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイトル</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">カテゴリ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">更新日</th>
                        </tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {materials.map(m => (
                                <tr key={m.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/app/materials/${m.id}`)}>
                                    <td className="px-6 py-4 font-medium text-gray-900">{m.title}</td>
                                    <td className="px-6 py-4 text-sm text-gray-700">{m.category}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(m.uploadedAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};


const AdminMaterialsManagement: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const isEditOrCreate = !!id || location.pathname.endsWith('/new');
    const { hasPermission } = useClientData();
    const canEdit = hasPermission('EDIT_MATERIALS');

    if (isEditOrCreate && canEdit) {
        return <MaterialEditorView />;
    }
    return <MaterialListView />;
};

export default AdminMaterialsManagement;