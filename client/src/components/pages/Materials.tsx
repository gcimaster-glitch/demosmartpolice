import React, { useState, useMemo } from 'react';
import { useClientData } from '../../ClientDataContext.tsx';
import type { Material } from '../../types.ts';

type CategoryFilter = 'すべて' | Material['category'];
type ViewMode = 'card' | 'list';

const Materials: React.FC = () => {
    const { materials } = useClientData();
    const [filter, setFilter] = useState<CategoryFilter>('すべて');
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState<ViewMode>('card');

    const categories: CategoryFilter[] = ['すべて', 'サービスパンフレット', '法令資料', '社内研修資料', 'その他'];

    const filteredMaterials = useMemo(() => {
        return materials.filter(material => {
            const categoryMatch = filter === 'すべて' || material.category === filter;
            const searchMatch = searchTerm === '' ||
                material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                material.description.toLowerCase().includes(searchTerm.toLowerCase());
            return categoryMatch && searchMatch;
        });
    }, [materials, filter, searchTerm]);

    const getCategoryIcon = (category: Material['category']) => {
        switch(category) {
            case 'サービスパンフレット': return 'fas fa-book-open';
            case '法令資料': return 'fas fa-gavel';
            case '社内研修資料': return 'fas fa-chalkboard-teacher';
            default: return 'fas fa-file-alt';
        }
    };

    const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('ja-JP');
    
    const MaterialCard: React.FC<{ material: Material }> = ({ material }) => (
         <div className="bg-white rounded-lg shadow-md border flex flex-col hover:shadow-lg transition-shadow h-full">
            <div className="p-6 flex flex-col flex-grow">
                <div className="flex items-start mb-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
                        <i className={`${getCategoryIcon(material.category)} text-xl text-primary`}></i>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-md font-bold text-gray-900 leading-snug">{material.title}</h3>
                        <p className="text-xs text-gray-500 mt-1">{material.category}</p>
                    </div>
                </div>
                <p className="text-sm text-gray-600 flex-grow mb-4">{material.description}</p>
                <div className="text-xs text-gray-500 border-t pt-3 mt-auto space-y-1">
                    <div className="flex justify-between"><span>ファイル名:</span> <span className="font-medium text-gray-700 truncate pl-2">{material.fileName}</span></div>
                    <div className="flex justify-between"><span>サイズ:</span> <span className="font-medium text-gray-700">{material.fileSize}</span></div>
                    <div className="flex justify-between"><span>更新日:</span> <span className="font-medium text-gray-700">{formatDate(material.uploadedAt)}</span></div>
                </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-b-lg">
                <a href={material.fileUrl} download={material.fileName} className="w-full block text-center py-2 px-4 bg-primary text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                    <i className="fas fa-download mr-2"></i>ダウンロード
                </a>
            </div>
        </div>
    );
    
    const MaterialListItem: React.FC<{ material: Material }> = ({ material }) => (
         <tr className="hover:bg-gray-50">
            <td className="px-6 py-4 whitespace-nowrap">
                 <div className="flex items-center">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center mr-4 flex-shrink-0">
                        <i className={`${getCategoryIcon(material.category)} text-lg text-primary`}></i>
                    </div>
                    <div className="text-sm font-medium text-gray-900">{material.title}</div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{material.category}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{material.fileName}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(material.uploadedAt)}</td>
             <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                <a href={material.fileUrl} download={material.fileName} className="text-primary hover:underline">ダウンロード</a>
            </td>
        </tr>
    );

    return (
        <div className="fade-in">
            <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">資料室</h2>
                <p className="text-secondary">各種資料をダウンロードいただけます。</p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6 sticky top-[65px] z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <div className="md:col-span-2 flex items-center gap-4">
                        <input
                            type="text"
                            placeholder="キーワードで検索..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full enhanced-input p-2 border rounded-md"
                        />
                         <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as CategoryFilter)}
                            className="w-full enhanced-input p-2 border rounded-md"
                        >
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                    </div>
                     <div className="flex justify-end">
                        <div className="bg-gray-200 p-1 rounded-lg">
                            <button onClick={() => setViewMode('card')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'card' ? 'bg-white shadow' : ''}`}><i className="fas fa-th-large"></i></button>
                            <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'list' ? 'bg-white shadow' : ''}`}><i className="fas fa-list"></i></button>
                        </div>
                    </div>
                </div>
            </div>

            {filteredMaterials.length > 0 ? (
                viewMode === 'card' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMaterials.map(material => <MaterialCard key={material.id} material={material} />)}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">タイトル</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">カテゴリ</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ファイル名</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">更新日</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
                        </tr></thead><tbody className="bg-white divide-y divide-gray-200">{filteredMaterials.map(m => <MaterialListItem key={m.id} material={m} />)}</tbody></table>
                    </div>
                )
            ) : (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center text-gray-500">
                    <i className="fas fa-box-open text-4xl mb-4 text-gray-300"></i>
                    <p>該当する資料はありません。</p>
                </div>
            )}
        </div>
    );
};

export default Materials;