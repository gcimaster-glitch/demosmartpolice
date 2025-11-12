import React, { useState } from 'react';
import { useClientData } from '../../ClientDataContext.tsx';
import type { Announcement } from '../../types.ts';

type CategoryFilter = 'すべて' | Announcement['category'];
type ViewMode = 'list' | 'card';

const Announcements: React.FC = () => {
    const { announcements, markAnnouncementAsRead } = useClientData();
    const [filter, setFilter] = useState<CategoryFilter>('すべて');
    const [viewMode, setViewMode] = useState<ViewMode>('card');
    
    const visibleAnnouncements = announcements.filter(ann => 
        ann.status === 'published' && ann.publishedAt && new Date(ann.publishedAt) <= new Date()
    );

    const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

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
        if (!announcement.read) {
            markAnnouncementAsRead(announcement.id);
        }
    };
    
    const AnnouncementListItem: React.FC<{ announcement: Announcement }> = ({ announcement }) => (
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
                    <span>{announcement.publishedAt || announcement.createdAt}</span>
                </div>
            </div>
        </li>
    );
    
    const AnnouncementCardItem: React.FC<{ announcement: Announcement }> = ({ announcement }) => (
         <li onClick={() => handleSelectAnnouncement(announcement)}
            className={`p-4 cursor-pointer rounded-lg border transition-colors ${selectedAnnouncement?.id === announcement.id ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-gray-50'}`}>
            <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center mb-1">
                        {!announcement.read && <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 flex-shrink-0"></span>}
                        <p className="text-sm font-semibold text-gray-800 truncate">{announcement.title}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                        <span>{announcement.publishedAt || announcement.createdAt}</span> | <span>{announcement.category}</span>
                    </div>
                </div>
                 <span className={`text-xs font-semibold ml-2 px-2 py-0.5 rounded-full ${getPriorityClass(announcement.priority)}`}>
                    {announcement.priority}
                </span>
            </div>
            <p className="text-xs text-gray-600 mt-2 line-clamp-2">{announcement.content}</p>
        </li>
    );

    return (
        <div className="fade-in">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">お知らせ</h2>
                <p className="text-secondary">システムメンテナンスや新機能に関する情報をお届けします</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex justify-between items-center flex-wrap gap-2">
                <div className="flex space-x-2 overflow-x-auto pb-2">
                    {categories.map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${filter === cat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                 <div className="bg-gray-200 p-1 rounded-lg flex-shrink-0">
                    <button onClick={() => setViewMode('card')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'card' ? 'bg-white shadow' : ''}`}><i className="fas fa-th-large"></i></button>
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'list' ? 'bg-white shadow' : ''}`}><i className="fas fa-list"></i></button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
                <aside className="md:w-2/5 lg:w-1/3 flex-shrink-0">
                    <div className={`${viewMode === 'list' ? 'bg-white rounded-lg shadow-sm overflow-hidden' : ''} h-full max-h-[70vh] overflow-y-auto`}>
                        <ul className={`${viewMode === 'list' ? 'divide-y divide-gray-200' : 'space-y-3'}`}>
                            {filteredAnnouncements.length > 0 ? filteredAnnouncements.map(ann => (
                                viewMode === 'list' 
                                ? <AnnouncementListItem key={ann.id} announcement={ann} />
                                : <AnnouncementCardItem key={ann.id} announcement={ann} />
                            )) : (
                                <li className="p-6 text-center text-gray-500">
                                    該当するお知らせはありません。
                                </li>
                            )}
                        </ul>
                    </div>
                </aside>
                <main className="flex-grow">
                     {selectedAnnouncement ? (
                        <div className="bg-white rounded-lg shadow-sm h-full">
                            <div className="p-6 border-b">
                                <span className={`text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full border ${getPriorityClass(selectedAnnouncement.priority)}`}>
                                    {selectedAnnouncement.priority}
                                </span>
                                <h3 className="text-xl font-bold text-gray-900 mt-2">{selectedAnnouncement.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">公開日: {selectedAnnouncement.publishedAt || selectedAnnouncement.createdAt} | カテゴリ: {selectedAnnouncement.category}</p>
                            </div>
                            <div className="p-6 max-h-[55vh] overflow-y-auto text-gray-800" dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content.replace(/\n/g, '<br />') }}>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm h-full flex items-center justify-center text-gray-500 p-8">
                            <div className="text-center">
                                <i className="fas fa-arrow-left text-2xl text-gray-400 mb-4"></i>
                                <p>リストからお知らせを選択して詳細を表示します。</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default Announcements;