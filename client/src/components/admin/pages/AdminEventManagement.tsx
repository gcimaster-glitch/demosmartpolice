import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { Event, EventApplication } from '../../../types.ts';
import { useClientData } from '../../../ClientDataContext.tsx';
import ImageUploader from '../ImageUploader.tsx';

const initialFormState: Omit<Event, 'id'> = {
    title: '', description: '', category: '交流会', date: '', location: '', capacity: 30, status: '募集中', mainImageUrl: '', applicants: [],
};

const EventEditorView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { events, clients, saveEvent, deleteEvent, deleteEventApplication } = useClientData(); 

    const isCreating = location.pathname.endsWith('/new');
    const event = isCreating ? null : events.find(e => e.id === Number(id));
    
    const [formData, setFormData] = useState<Omit<Event, 'id'>>(() => {
        if (isCreating) return { ...initialFormState, applicants: [] };
        if (event) {
             const localDate = new Date(event.date).toLocaleString('sv-SE', { timeZone: 'Asia/Tokyo' }).replace(' ', 'T').substring(0, 16);
            return { ...event, date: localDate };
        }
        return { ...initialFormState, applicants: [] };
    });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.title.trim()) newErrors.title = 'イベント名を入力してください。';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = () => {
        if (!validate()) return;
        const utcDate = new Date(formData.date).toISOString();
        const finalData = { ...formData, date: utcDate };
        saveEvent(finalData, event?.id);
        navigate('/app/events');
    };

    const handleDelete = () => {
        if (event && window.confirm('このイベントを削除しますか？')) {
            deleteEvent(event.id);
            navigate('/app/events');
        }
    };
    
    const handleDeleteApplicant = (userId: string) => {
        if(event && window.confirm('この申込をキャンセルしますか？')) {
            deleteEventApplication(event.id, userId);
            setFormData(prev => ({...prev, applicants: prev.applicants.filter(app => app.userId !== userId)}));
        }
    };

    const downloadCSV = () => {
        if (!event) return;
        const headers = ['申込日', '企業名', '氏名', 'メールアドレス', '備考'];
        const rows = event.applicants.map(app => [
            new Date(app.applicationDate).toLocaleString(),
            clients.find(c => c.id === app.clientId)?.companyName || 'N/A',
            app.userName,
            app.userEmail,
            `"${app.notes.replace(/"/g, '""')}"`
        ]);
        const csvContent = "data:text/csv;charset=utf-8," 
            + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
        
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `event_${event.id}_applicants.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'capacity' ? parseInt(value, 10) : value }));
    };

    return (
        <div className="fade-in space-y-6">
            <button onClick={() => navigate('/app/events')} className="text-sm text-primary mb-2 flex items-center">
                <i className="fas fa-chevron-left mr-2"></i>イベント一覧に戻る
            </button>
            <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-900">{isCreating ? '新規イベント作成' : 'イベントの編集'}</h3>
                    {!isCreating && <button onClick={handleDelete} className="text-red-600 hover:text-red-800 text-sm"><i className="fas fa-trash-alt mr-1"></i>削除</button>}
                </div>
                <div className="p-6 space-y-4 flex-grow overflow-y-auto">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">タイトル</label>
                        <input type="text" name="title" value={formData.title} onChange={handleInputChange} className={`mt-1 w-full p-2 border rounded-md enhanced-input ${errors.title ? 'invalid-input' : ''}`}/>
                        {errors.title && <p className="text-xs text-danger mt-1">{errors.title}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">説明</label>
                        <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="mt-1 w-full p-2 border rounded-md enhanced-input"/>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700">開催日時</label><input type="datetime-local" name="date" value={formData.date} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md enhanced-input"/></div>
                        <div><label className="block text-sm font-medium text-gray-700">場所</label><input type="text" name="location" value={formData.location} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md enhanced-input"/></div>
                        <div><label className="block text-sm font-medium text-gray-700">定員</label><input type="number" name="capacity" value={formData.capacity} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md enhanced-input"/></div>
                        <div><label className="block text-sm font-medium text-gray-700">カテゴリ</label><select name="category" value={formData.category} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md enhanced-input"><option>交流会</option><option>勉強会</option><option>その他</option></select></div>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">メイン画像</label>
                        {/* FIX: Add missing maxSizeInMB prop */}
                        <ImageUploader imageUrl={formData.mainImageUrl} onImageChange={url => setFormData(p => ({...p, mainImageUrl: url}))} onImageRemove={() => setFormData(p => ({...p, mainImageUrl: ''}))} recommendedSizeText="推奨サイズ: 800x400px" maxWidth={800} maxHeight={400} maxSizeInMB={1} />
                    </div>
                    
                    {!isCreating && event && (
                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-semibold">申込者一覧 ({event.applicants.length}名)</h4>
                                <button onClick={downloadCSV} className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"><i className="fas fa-download mr-1"></i>CSVダウンロード</button>
                            </div>
                            <div className="max-h-60 overflow-y-auto border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50 sticky top-0"><tr>
                                        <th className="px-4 py-2 text-left">申込日</th><th className="px-4 py-2 text-left">企業名</th><th className="px-4 py-2 text-left">氏名</th><th className="px-4 py-2 text-left">アクション</th>
                                    </tr></thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {event.applicants.map(app => (
                                            <tr key={app.userId}>
                                                <td className="px-4 py-2">{new Date(app.applicationDate).toLocaleDateString()}</td>
                                                <td className="px-4 py-2">{clients.find(c => c.id === app.clientId)?.companyName}</td>
                                                <td className="px-4 py-2">{app.userName}</td>
                                                <td className="px-4 py-2"><button onClick={() => handleDeleteApplicant(app.userId)} className="text-red-500 hover:text-red-700"><i className="fas fa-trash"></i></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-end space-x-3">
                    <button onClick={() => navigate('/app/events')} className="px-4 py-2 border rounded-md text-gray-700 bg-white hover:bg-gray-50">キャンセル</button>
                    <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">保存</button>
                </div>
            </div>
        </div>
    );
};


const EventListView: React.FC = () => {
    const { events, hasPermission } = useClientData(); 
    const navigate = useNavigate();
    const canEdit = hasPermission('EDIT_EVENTS');
    const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
    
    return (
        <div className="fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div><h1 className="text-3xl font-bold text-gray-800">イベント管理</h1><p className="text-gray-500">クライアント向けイベントの作成と管理を行います。</p></div>
                {canEdit && <button onClick={() => navigate('/app/events/new')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm"><i className="fas fa-plus mr-2"></i>新規作成</button>}
            </div>

            <div className="flex justify-end">
                <div className="bg-gray-200 p-1 rounded-lg">
                    <button onClick={() => setViewMode('card')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'card' ? 'bg-white shadow' : ''}`}><i className="fas fa-th-large"></i></button>
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'list' ? 'bg-white shadow' : ''}`}><i className="fas fa-list"></i></button>
                </div>
            </div>

            {viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {events.map(e => (
                        <div key={e.id} onClick={() => navigate(`/app/events/${e.id}`)} className="bg-white rounded-lg shadow-md border flex flex-col cursor-pointer hover:shadow-lg transition-shadow">
                            <img src={e.mainImageUrl} alt={e.title} className="w-full h-40 object-cover rounded-t-lg" />
                            <div className="p-4 flex flex-col flex-grow">
                                <h3 className="text-md font-bold text-gray-900 mb-2 flex-grow">{e.title}</h3>
                                <p className="text-sm text-gray-500">{new Date(e.date).toLocaleString('ja-JP')}</p>
                                <p className="text-sm text-gray-500">{e.applicants.length} / {e.capacity} 名</p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="bg-white rounded-lg shadow-md overflow-hidden">
                     <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50"><tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">イベント名</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申込状況</th>
                        </tr></thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {events.map(e => (
                                <tr key={e.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/app/events/${e.id}`)}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{e.title}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(e.date).toLocaleString('ja-JP')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{e.applicants.length} / {e.capacity}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const AdminEventManagement: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const isEditOrCreate = !!id || location.pathname.endsWith('/new');
    const { hasPermission } = useClientData();
    const canEdit = hasPermission('EDIT_EVENTS');

    if (isEditOrCreate && canEdit) {
        return <EventEditorView />;
    }
    return <EventListView />;
};

export default AdminEventManagement;
