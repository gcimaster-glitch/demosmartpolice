import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { Announcement } from '../../../types.ts';
import { useClientData } from '../../../ClientDataContext.tsx';

const initialFormState: Partial<Omit<Announcement, 'id' | 'read' | 'createdAt'>> = {
    title: '', content: '', category: 'サービス情報', priority: '一般', status: 'draft', publishedAt: null,
};

const AnnouncementEditorView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { announcements, saveAnnouncement, deleteAnnouncement } = useClientData();

    const isCreating = location.pathname.endsWith('/new');
    const announcement = isCreating ? null : announcements.find(a => a.id === Number(id));
    
    const [formData, setFormData] = useState(() => {
        if (isCreating) {
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            return { ...initialFormState, publishedAt: now.toISOString().slice(0,16) };
        }
        if (announcement) {
            const publishedDate = announcement.publishedAt ? new Date(announcement.publishedAt) : new Date();
            publishedDate.setMinutes(publishedDate.getMinutes() - publishedDate.getTimezoneOffset());
            return {
                title: announcement.title || '',
                content: announcement.content || '',
                category: announcement.category || 'サービス情報',
                priority: announcement.priority || '一般',
                status: announcement.status || 'draft',
                publishedAt: publishedDate.toISOString().slice(0, 16),
            };
        }
        return initialFormState;
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.title?.trim()) newErrors.title = 'タイトルを入力してください。';
        if (!formData.content?.trim()) newErrors.content = '内容を入力してください。';
        if (!formData.publishedAt) newErrors.publishedAt = '公開日時を設定してください。';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = (publish: boolean = false) => {
        if (!validate() || !formData.publishedAt) return;
        
        const finalStatus = publish ? 'published' : formData.status;
        const publicationDate = new Date(formData.publishedAt);

        const dataToSave = { 
            ...formData, 
            status: finalStatus,
            publishedAt: publicationDate.toISOString() 
        };
        saveAnnouncement(dataToSave, announcement?.id);
        navigate('/app/announcements');
    };

    const handleDelete = () => {
        if(announcement && window.confirm('このお知らせを削除しますか？')) {
            deleteAnnouncement(announcement.id);
            navigate('/app/announcements');
        }
    };
    
    return (
        <div className="fade-in space-y-6">
            <button onClick={() => navigate('/app/announcements')} className="text-sm text-primary mb-2 flex items-center">
                <i className="fas fa-chevron-left mr-2"></i>お知らせ一覧に戻る
            </button>
             <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">{isCreating ? '新規お知らせ作成' : 'お知らせの編集'}</h3>
                    {!isCreating && <button onClick={handleDelete} className="text-red-600 hover:text-red-800 text-sm"><i className="fas fa-trash-alt mr-1"></i>削除</button>}
                </div>
                <div className="p-6 space-y-4 flex-grow overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">タイトル</label>
                        <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className={`mt-1 w-full p-2 border border-gray-300 rounded-md enhanced-input ${errors.title ? 'invalid-input' : ''}`}/>
                        {errors.title && <p className="text-xs text-danger mt-1">{errors.title}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">内容</label>
                        <textarea value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} rows={8} className={`mt-1 w-full p-2 border border-gray-300 rounded-md enhanced-input ${errors.content ? 'invalid-input' : ''}`}/>
                        {errors.content && <p className="text-xs text-danger mt-1">{errors.content}</p>}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700">カテゴリ</label><select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as Announcement['category']})} className="mt-1 w-full p-2 border border-gray-300 rounded-md enhanced-input"><option>メンテナンス</option><option>サービス情報</option><option>イベント</option><option>セキュリティ</option></select></div>
                        <div><label className="block text-sm font-medium text-gray-700">重要度</label><select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value as Announcement['priority']})} className="mt-1 w-full p-2 border border-gray-300 rounded-md enhanced-input"><option>一般</option><option>重要</option><option>緊急</option></select></div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">公開日時</label>
                            <input type="datetime-local" value={formData.publishedAt || ''} onChange={e => setFormData({...formData, publishedAt: e.target.value})} className={`mt-1 w-full p-2 border border-gray-300 rounded-md enhanced-input ${errors.publishedAt ? 'invalid-input' : ''}`}/>
                             {errors.publishedAt && <p className="text-xs text-danger mt-1">{errors.publishedAt}</p>}
                        </div>
                    </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-between items-center">
                    <button onClick={() => handleSave(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">下書き保存</button>
                    <div className="space-x-3">
                        <button onClick={() => navigate('/app/announcements')} className="px-4 py-2">キャンセル</button>
                        <button onClick={() => handleSave(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                            { (formData.publishedAt && new Date(formData.publishedAt) > new Date()) ? '予約投稿' : '公開'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AnnouncementListView: React.FC = () => {
    const { announcements, hasPermission } = useClientData();
    const navigate = useNavigate();
    const canEdit = hasPermission('EDIT_ANNOUNCEMENTS');

    const getStatusText = (ann: Announcement) => {
        if (ann.status === 'published') {
            if (ann.publishedAt && new Date(ann.publishedAt) > new Date()) {
                return '予約済み';
            }
            return '公開中';
        }
        return '下書き';
    }
    
    const getStatusClass = (ann: Announcement) => {
        const status = getStatusText(ann);
        switch(status) {
            case '公開中': return 'bg-green-100 text-green-800';
            case '予約済み': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    }


    return (
        <div className="fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div><h1 className="text-3xl font-bold text-gray-800">お知らせ管理</h1><p className="text-gray-500">クライアントへのお知らせを作成・管理します。</p></div>
                {canEdit && <button onClick={() => navigate('/app/announcements/new')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"><i className="fas fa-plus mr-2"></i>新規作成</button>}
            </div>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイトル</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">公開日</th></tr></thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {announcements.map(ann => (
                            <tr key={ann.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/app/announcements/${ann.id}`)}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ann.id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ann.title}</td>
                                <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(ann)}`}>{getStatusText(ann)}</span></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ann.publishedAt ? new Date(ann.publishedAt).toLocaleString('ja-JP') : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const AdminAnnouncements: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const isEditOrCreate = !!id || location.pathname.endsWith('/new');
    const { hasPermission } = useClientData();
    const canEdit = hasPermission('EDIT_ANNOUNCEMENTS');

    if (isEditOrCreate && canEdit) {
        return <AnnouncementEditorView />;
    }
    return <AnnouncementListView />;
};

export default AdminAnnouncements;