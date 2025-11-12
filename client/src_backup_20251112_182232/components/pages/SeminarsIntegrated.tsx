import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext.tsx';
import { seminarsAPI, handleAPIError } from '../../services/apiClient.ts';
import ApplicationModal from '../ApplicationModal.tsx';

interface Seminar {
  id: number;
  title: string;
  description: string;
  category: 'セキュリティ' | 'マネジメント' | '法務' | 'その他';
  date: string;
  location: string;
  capacity: number;
  status: '募集中' | '開催済み' | '中止';
  mainImageUrl: string;
  subImageUrls: string[];
  pdfUrl?: string;
  applicants: any[];
}

type CategoryFilter = 'すべて' | Seminar['category'];
type ViewMode = 'card' | 'list';

const SeminarsIntegrated: React.FC = () => {
  const { user } = useAuth();
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('すべて');
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [selectedSeminar, setSelectedSeminar] = useState<Seminar | null>(null);
  const [mainImage, setMainImage] = useState<string | null>(null);
  const [isApplyModalOpen, setApplyModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  
  const categories: CategoryFilter[] = ['すべて', 'セキュリティ', 'マネジメント', '法務', 'その他'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const seminarsResponse = await seminarsAPI.getAll();
        if (seminarsResponse.success) {
          setSeminars(seminarsResponse.data as Seminar[]);
          if (seminarsResponse.data.length > 0) {
            setSelectedSeminar(seminarsResponse.data[0] as Seminar);
            setMainImage(seminarsResponse.data[0].mainImageUrl);
          }
        }

        const applicationsResponse = await seminarsAPI.getMyApplications();
        if (applicationsResponse.success) {
          setMyApplications(applicationsResponse.data);
        }
      } catch (err) {
        setError(handleAPIError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredSeminars = seminars.filter(seminar => {
    if (seminar.status === '中止') return false;
    if (categoryFilter === 'すべて') return true;
    return seminar.category === categoryFilter;
  });

  const isApplied = (seminarId: number) => {
    return myApplications.some(app => app.seminarId === seminarId);
  };

  const handleApplySubmit = async (data: { notes: string; userName: string; userEmail: string }) => {
    if (!user || !selectedSeminar) {
      alert('ユーザー情報またはセミナー情報が見つかりません。');
      return;
    }

    try {
      const response = await seminarsAPI.apply({
        seminarId: selectedSeminar.id,
        notes: data.notes,
        userName: data.userName,
        userEmail: data.userEmail,
      });

      if (response.success) {
        alert(response.message || 'セミナーに申し込みました');
        setApplyModalOpen(false);
        
        // Reload data
        const seminarsResponse = await seminarsAPI.getAll();
        if (seminarsResponse.success) {
          setSeminars(seminarsResponse.data as Seminar[]);
          const updatedSeminar = (seminarsResponse.data as Seminar[]).find((s: Seminar) => s.id === selectedSeminar.id);
          if (updatedSeminar) {
            setSelectedSeminar(updatedSeminar);
          }
        }

        const applicationsResponse = await seminarsAPI.getMyApplications();
        if (applicationsResponse.success) {
          setMyApplications(applicationsResponse.data);
        }
      } else {
        alert('申込に失敗しました: ' + (response.error || '不明なエラー'));
      }
    } catch (err) {
      alert('申込に失敗しました: ' + handleAPIError(err));
    }
  };

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

  if (error) {
    return (
      <div className="fade-in text-center py-20">
        <div className="bg-white p-12 rounded-lg shadow-md inline-block">
          <i className="fas fa-exclamation-triangle text-5xl text-red-400 mb-4"></i>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">エラー</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', weekday: 'short' });
  const getStatusClass = (status: Seminar['status']) => status === '募集中' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';

  const handleSelectSeminar = (seminar: Seminar) => {
    setSelectedSeminar(seminar);
    setMainImage(seminar.mainImageUrl);
  };

  const SeminarCard: React.FC<{ seminar: Seminar }> = ({ seminar }) => (
    <div onClick={() => handleSelectSeminar(seminar)}
      className={`bg-white rounded-lg shadow-md border flex flex-col cursor-pointer hover:shadow-lg transition-shadow h-full ${selectedSeminar?.id === seminar.id ? 'border-primary ring-2 ring-primary' : ''}`}>
      <img src={seminar.mainImageUrl} alt={seminar.title} className="w-full h-40 object-cover rounded-t-lg" />
      <div className="p-4 flex flex-col flex-grow">
        <span className="text-xs font-semibold text-primary mb-1">{seminar.category}</span>
        <h3 className="text-md font-bold text-gray-900 mb-2 flex-grow">{seminar.title}</h3>
        <div className="space-y-1 text-xs text-gray-600 mb-3">
          <div className="flex items-center"><i className="fas fa-calendar-alt w-4 text-gray-400 mr-2"></i><span>{formatDate(seminar.date)}</span></div>
          <div className="flex items-center"><i className="fas fa-map-marker-alt w-4 text-gray-400 mr-2"></i><span>{seminar.location}</span></div>
        </div>
        <div className="flex items-center justify-between text-xs mt-auto">
          <span className={`inline-block px-2 py-1 font-semibold rounded ${getStatusClass(seminar.status)}`}>{seminar.status}</span>
          <span className="font-bold text-gray-800">{seminar.applicants.length} / {seminar.capacity} 名</span>
        </div>
      </div>
    </div>
  );

  const SeminarListItem: React.FC<{ seminar: Seminar }> = ({ seminar }) => (
    <tr onClick={() => handleSelectSeminar(seminar)} className={`cursor-pointer hover:bg-gray-50 ${selectedSeminar?.id === seminar.id ? 'bg-blue-50' : ''}`}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{seminar.title}</div>
        <div className="text-sm text-gray-500">{seminar.category}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(seminar.date)}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{seminar.location}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{seminar.applicants.length} / {seminar.capacity}</td>
      <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(seminar.status)}`}>{seminar.status}</span></td>
    </tr>
  );

  const DetailView: React.FC<{ seminar: Seminar }> = ({ seminar }) => {
    const isFull = seminar.applicants.length >= seminar.capacity;
    const hasApplied = isApplied(seminar.id);
    const applicantRatio = seminar.capacity > 0 ? (seminar.applicants.length / seminar.capacity) * 100 : 0;
    
    const handleApplyClick = () => {
      if (seminar.location === 'オンライン') {
        if (!window.confirm("このオンラインセミナーへの参加にはチケットが1枚消費されます。よろしいですか？")) {
          return;
        }
      }
      setApplyModalOpen(true);
    };

    return (
      <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
        <div className="p-6 border-b">
          <span className="text-xs font-semibold text-primary mb-1">{seminar.category}</span>
          <h3 className="text-2xl font-bold text-gray-900">{seminar.title}</h3>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
          <div className="mb-4">
            <img src={mainImage || seminar.mainImageUrl} alt={seminar.title} className="w-full h-64 object-cover rounded-lg mb-2"/>
            <div className="flex gap-2">
              {[seminar.mainImageUrl, ...seminar.subImageUrls].map((url, i) => (
                <img key={i} src={url} onClick={() => setMainImage(url)} className={`w-1/4 h-16 object-cover rounded cursor-pointer border-2 ${mainImage === url ? 'border-primary' : 'border-transparent'}`}/>
              ))}
            </div>
          </div>
          <div className="prose max-w-none text-gray-700 leading-relaxed mb-6" dangerouslySetInnerHTML={{ __html: seminar.description.replace(/\n/g, '<br />') }}></div>

          <div className="space-y-3 text-sm text-gray-800 bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start"><i className="fas fa-calendar-alt w-5 text-gray-500 mr-2 mt-1"></i><span>{formatDate(seminar.date)}</span></div>
            <div className="flex items-start"><i className="fas fa-map-marker-alt w-5 text-gray-500 mr-2 mt-1"></i><span>{seminar.location}</span></div>
            {seminar.pdfUrl && <a href={seminar.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center text-primary hover:underline"><i className="fas fa-file-pdf w-5 text-gray-500 mr-2"></i><span>パンフレットをダウンロード</span></a>}
          </div>
        </div>
        <div className="p-6 bg-gray-50 rounded-b-lg mt-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">申込状況</span>
            <span className="text-sm font-bold text-gray-900">{seminar.applicants.length} / {seminar.capacity} 名</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${applicantRatio}%` }}></div></div>
          {seminar.status === '募集中' && (
            <button onClick={handleApplyClick} disabled={isFull || hasApplied} className="w-full py-2 px-4 rounded-md font-medium text-white bg-primary hover:bg-blue-700 disabled:bg-gray-400">
              {hasApplied ? '申込済み' : isFull ? '満員御礼' : '申し込む'}
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">セミナー</h2>
        <p className="text-secondary">専門家によるセミナーで、貴社のセキュリティレベル向上を支援します</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex justify-between items-center">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map(cat => (
            <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-4 py-2 text-sm font-medium rounded-full transition-colors whitespace-nowrap ${categoryFilter === cat ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {cat}
            </button>
          ))}
        </div>
        <div className="bg-gray-200 p-1 rounded-lg flex-shrink-0">
          <button onClick={() => setViewMode('card')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'card' ? 'bg-white shadow' : ''}`}><i className="fas fa-th-large"></i></button>
          <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'list' ? 'bg-white shadow' : ''}`}><i className="fas fa-list"></i></button>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        <aside className="xl:w-3/5">
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredSeminars.map(seminar => <SeminarCard key={seminar.id} seminar={seminar} />)}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">セミナー名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">場所</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申込</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredSeminars.map(s => <SeminarListItem key={s.id} seminar={s} />)}
                </tbody>
              </table>
            </div>
          )}
        </aside>
        <main className="xl:w-2/5 flex-shrink-0">
          {selectedSeminar ? <DetailView seminar={selectedSeminar} /> : (
            <div className="bg-white rounded-lg shadow-sm h-full flex items-center justify-center text-gray-500 p-8 min-h-[50vh]">
              <div className="text-center"><i className="fas fa-arrow-left text-2xl text-gray-400 mb-4"></i><p>リストからセミナーを選択して詳細を表示します。</p></div>
            </div>
          )}
        </main>
      </div>
      {isApplyModalOpen && selectedSeminar && (
        <ApplicationModal 
          type="seminar"
          item={selectedSeminar as any}
          onClose={() => setApplyModalOpen(false)}
          onSubmit={handleApplySubmit}
        />
      )}
    </div>
  );
};

export default SeminarsIntegrated;
