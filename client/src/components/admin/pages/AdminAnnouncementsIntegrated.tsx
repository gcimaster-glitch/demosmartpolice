import React, { useEffect, useState } from 'react';
import { announcementsAPI } from '../../../services/apiClient.ts';

interface Announcement {
    id: number;
    title: string;
    summary: string;
    content: string;
    category: string;
    priority: '高' | '中' | '低';
    status: 'draft' | 'published';
    published_at: string;
    created_at: string;
}

const AdminAnnouncementsIntegrated: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        content: '',
        category: '一般',
        priority: '中' as '高' | '中' | '低',
        status: 'draft' as 'draft' | 'published',
    });

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            // 管理者用は全てのお知らせを取得
            const response = await announcementsAPI.getAll();
            if (response.success) {
                setAnnouncements(response.data || []);
            } else {
                setError(response.error || 'データの取得に失敗しました');
            }
        } catch (err) {
            console.error('Announcements fetch error:', err);
            setError('お知らせ一覧の読み込みに失敗しました');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            if (editingAnnouncement) {
                const response = await announcementsAPI.update(editingAnnouncement.id, formData);
                if (response.success) {
                    fetchAnnouncements();
                    setShowCreateModal(false);
                    setEditingAnnouncement(null);
                    resetForm();
                    alert('お知らせを更新しました');
                } else {
                    alert(response.error || '更新に失敗しました');
                }
            } else {
                const response = await announcementsAPI.create(formData);
                if (response.success) {
                    fetchAnnouncements();
                    setShowCreateModal(false);
                    resetForm();
                    alert('お知らせを作成しました');
                } else {
                    alert(response.error || '作成に失敗しました');
                }
            }
        } catch (err) {
            console.error('Save announcement error:', err);
            alert('保存に失敗しました');
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('このお知らせを削除してもよろしいですか?')) return;

        try {
            const response = await announcementsAPI.delete(id);
            if (response.success) {
                fetchAnnouncements();
                alert('お知らせを削除しました');
            } else {
                alert(response.error || '削除に失敗しました');
            }
        } catch (err) {
            console.error('Delete announcement error:', err);
            alert('削除に失敗しました');
        }
    };

    const handleEdit = (announcement: Announcement) => {
        setEditingAnnouncement(announcement);
        setFormData({
            title: announcement.title,
            summary: announcement.summary,
            content: announcement.content,
            category: announcement.category,
            priority: announcement.priority,
            status: announcement.status,
        });
        setShowCreateModal(true);
    };

    const resetForm = () => {
        setFormData({
            title: '',
            summary: '',
            content: '',
            category: '一般',
            priority: '中',
            status: 'draft',
        });
    };

    const getStatusBadge = (status: string) => {
        return status === 'published' 
            ? <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">公開中</span>
            : <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">下書き</span>;
    };

    if (loading) {
        return (
            <div className="fade-in flex items-center justify-center h-64">
                <div className="text-center">
                    <i className="fas fa-spinner fa-spin text-4xl text-primary mb-4"></i>
                    <p className="text-gray-600">読み込み中...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fade-in">
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                    <div className="flex">
                        <i className="fas fa-exclamation-circle text-xl mr-3"></i>
                        <div>
                            <p className="font-bold">エラー</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">お知らせ管理</h1>
                    <p className="text-gray-600 mt-2">クライアント向けお知らせの作成・管理</p>
                </div>
                <button
                    onClick={() => {
                        resetForm();
                        setEditingAnnouncement(null);
                        setShowCreateModal(true);
                    }}
                    className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <i className="fas fa-plus mr-2"></i>
                    新規作成
                </button>
            </div>

            {/* お知らせ一覧 */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                タイトル
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                カテゴリ
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                ステータス
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                公開日
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                操作
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {announcements.length > 0 ? (
                            announcements.map((announcement) => (
                                <tr key={announcement.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">{announcement.title}</div>
                                        <div className="text-xs text-gray-500 mt-1">{announcement.summary}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600">{announcement.category}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(announcement.status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-600">
                                            {announcement.published_at 
                                                ? new Date(announcement.published_at).toLocaleDateString('ja-JP')
                                                : '-'
                                            }
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(announcement)}
                                                className="text-primary hover:text-blue-700"
                                                title="編集"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(announcement.id)}
                                                className="text-red-600 hover:text-red-800"
                                                title="削除"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    お知らせがまだありません
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 作成・編集モーダル */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {editingAnnouncement ? 'お知らせを編集' : '新しいお知らせを作成'}
                            </h2>
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            タイトル <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => setFormData({...formData, title: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            要約
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.summary}
                                            onChange={(e) => setFormData({...formData, summary: e.target.value})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            本文 <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={formData.content}
                                            onChange={(e) => setFormData({...formData, content: e.target.value})}
                                            rows={8}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                カテゴリ
                                            </label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            >
                                                <option value="一般">一般</option>
                                                <option value="重要">重要</option>
                                                <option value="メンテナンス">メンテナンス</option>
                                                <option value="機能追加">機能追加</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                ステータス
                                            </label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                            >
                                                <option value="draft">下書き</option>
                                                <option value="published">公開</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowCreateModal(false);
                                            setEditingAnnouncement(null);
                                            resetForm();
                                        }}
                                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        {editingAnnouncement ? '更新する' : '作成する'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminAnnouncementsIntegrated;
