import React, { useState, useEffect } from 'react';
import { announcementsAPI, handleAPIError } from '../../services/apiClient';
import type { Announcement } from '../../types.ts';

type CategoryFilter = 'すべて' | Announcement['category'];
type ViewMode = 'list' | 'card';

const Announcements: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<CategoryFilter>('すべて');
    const [viewMode, setViewMode] = useState<ViewMode>('card');
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

    // Fetch announcements from API
    useEffect(() => {
        const fetchAnnouncements = async () => {
            try {
                setLoading(true);
                const response = await announcementsAPI.getAll();
                if (response.success && response.data) {
                    // Convert read status (not stored in DB, so default to false)
                    const announcementsWithRead = response.data.map((ann: any) => ({
                        ...ann,
                        read: false,
                    }));
                    setAnnouncements(announcementsWithRead);
                }
            } catch (err) {
                setError(handleAPIError(err));
            } finally {
                setLoading(false);
            }
        };

        fetchAnnouncements();
    }, []);

    const visibleAnnouncements = announcements.filter((ann: any) => 
        ann.status === 'published' && ann.published_at && new Date(ann.published_at) <= new Date()
    );

    const categories: CategoryFilter[] = ['すべて', 'メンテナンス', 'サービス情報', 'セキュリティ', 'その他'];

    const filteredAnnouncements = visibleAnnouncements.filter(ann => 
        filter === 'すべて' || ann.category === filter
    );
    
    const getPriorityClass = (priority: Announcement['priority']) => {
        switch(priority) {
            case '緊急': return 'bg-red-100 text-red-800 border-red-300';
            case '重要': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            default: return 'bg-blue-100 text-blue-800 border-blue-300';
        }
    };

    const getCategoryIcon = (category: Announcement['category']) => {
        switch(category) {
            case 'メンテナンス': return 'fas fa-tools';
            case 'サービス情報': return 'fas fa-info-circle';
            case 'セキュリティ': return 'fas fa-shield-alt';
            default: return 'fas fa-bullhorn';
        }
    };
    
    const handleSelectAnnouncement = (announcement: Announcement) => {
        setSelectedAnnouncement(announcement);
        // Mark as read locally
        setAnnouncements(prev => 
            prev.map(ann => 
                ann.id === announcement.id ? { ...ann, read: true } : ann
            )
        );
    };
    
    const AnnouncementListItem: React.FC<{ announcement: any }> = ({ announcement }) => (
         <li onClick={() => handleSelectAnnouncement(announcement)} 
            className={`p-4 cursor-pointer flex items-start space-x-4 transition-colors ${selectedAnnouncement?.id === announcement.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
            
            <div className="flex-shrink-0 w-8 text-center pt-1">
                {!announcement.read && <span className="w-2.5 h-2.5 bg-blue-500 rounded-full inline-block mb-2"></span>}
                <i className={`${getCategoryIcon(announcement.category)} text-lg text-gray-400`}></i>
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">{announcement.title}</p>
                <div className="flex items-center mt-1 text-xs text-gray-500">
                    <span className={`font-semibold mr-2 px-1.5 py-0.5 rounded ${getPriorityClass(announcement.priority)}`}>
                        {announcement.priority}
                    </span>
                    <span>{announcement.published_at || announcement.created_at}</span>
                </div>
            </div>
        </li>
    );
    
    const AnnouncementCardItem: React.FC<{ announcement: any }> = ({ announcement }) => (
         <li onClick={() => handleSelectAnnouncement(announcement)}
            className={`p-4 cursor-pointer rounded-lg border transition-colors ${selectedAnnouncement?.id === announcement.id ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'}`}>
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-1">
                        {!announcement.read && <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>}
                        <p className="text-sm font-semibold text-gray-800 truncate">{announcement.title}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                        <span>{announcement.published_at || announcement.created_at}</span> | <span>{announcement.category}</span>
                    </div>
                </div>
                <span className={`ml-2 text-xs font-semibold px-2 py-1 rounded border ${getPriorityClass(announcement.priority)}`}>
                    {announcement.priority}
                </span>
            </div>
        </li>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
                <span className="ml-3 text-lg text-gray-600">読み込み中...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <i className="fas fa-exclamation-circle text-red-500 mr-2"></i>
                <span className="text-red-700">{error}</span>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">お知らせ</h1>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1.5 rounded ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        title="リスト表示"
                    >
                        <i className="fas fa-list"></i>
                    </button>
                    <button
                        onClick={() => setViewMode('card')}
                        className={`px-3 py-1.5 rounded ${viewMode === 'card' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                        title="カード表示"
                    >
                        <i className="fas fa-th"></i>
                    </button>
                </div>
            </div>
            
            <div className="mb-4 flex flex-wrap gap-2">
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                            filter === cat 
                                ? 'bg-primary text-white' 
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {filteredAnnouncements.length === 0 ? (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <i className="fas fa-inbox text-4xl text-gray-400 mb-3"></i>
                    <p className="text-gray-600">該当するお知らせがありません</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-lg shadow">
                            <div className="p-4 border-b bg-gray-50">
                                <h2 className="font-semibold text-gray-800">お知らせ一覧</h2>
                                <p className="text-xs text-gray-500 mt-1">{filteredAnnouncements.length}件</p>
                            </div>
                            <ul className="divide-y max-h-[600px] overflow-y-auto">
                                {filteredAnnouncements.map(ann => 
                                    viewMode === 'list' 
                                        ? <AnnouncementListItem key={ann.id} announcement={ann} />
                                        : <AnnouncementCardItem key={ann.id} announcement={ann} />
                                )}
                            </ul>
                        </div>
                    </div>
                    
                    <div className="lg:col-span-2">
                        {selectedAnnouncement ? (
                            <div className="bg-white rounded-lg shadow p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <span className={`inline-block text-xs font-semibold px-2 py-1 rounded border mb-2 ${getPriorityClass(selectedAnnouncement.priority)}`}>
                                            {selectedAnnouncement.priority}
                                        </span>
                                        <h2 className="text-2xl font-bold text-gray-800 mb-2">{selectedAnnouncement.title}</h2>
                                        <div className="flex items-center text-sm text-gray-500">
                                            <i className={`${getCategoryIcon(selectedAnnouncement.category)} mr-2`}></i>
                                            <span className="mr-4">{selectedAnnouncement.category}</span>
                                            <i className="far fa-calendar mr-2"></i>
                                            <span>{(selectedAnnouncement as any).published_at || (selectedAnnouncement as any).created_at}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                                    {selectedAnnouncement.content}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 rounded-lg p-12 text-center border-2 border-dashed border-gray-300">
                                <i className="far fa-hand-pointer text-5xl text-gray-400 mb-4"></i>
                                <p className="text-gray-600">左側のリストからお知らせを選択してください</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Announcements;
