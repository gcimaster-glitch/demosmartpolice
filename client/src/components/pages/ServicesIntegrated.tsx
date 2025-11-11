import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext.tsx';
import { servicesAPI, handleAPIError } from '../../services/apiClient.ts';
import ApplicationModal from '../ApplicationModal.tsx';

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  longDescription: string;
  price: number;
  priceType: 'monthly' | 'one-time' | 'per-use';
  icon: string;
  color: string;
  status: string;
}

interface ServiceApplication {
  id: string;
  serviceId: string;
  serviceName: string;
  clientId: number;
  userId: number;
  notes: string;
  status: 'pending' | 'approved' | 'rejected';
  applicationDate: string;
}

const ServicesIntegrated: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [applications, setApplications] = useState<ServiceApplication[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isApplyModalOpen, setApplyModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const servicesResponse = await servicesAPI.getAll();
        if (servicesResponse.success) {
          setServices(servicesResponse.data as Service[]);
        }

        const applicationsResponse = await servicesAPI.getMyApplications();
        if (applicationsResponse.success) {
          setApplications(applicationsResponse.data);
        }
      } catch (err) {
        setError(handleAPIError(err));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleOpenApplyModal = (service: Service) => {
    setSelectedService(service);
    setApplyModalOpen(true);
  };

  const handleSubmitApply = async (data: { notes: string; userName: string; userEmail: string }) => {
    if (!user || !selectedService) return;

    try {
      const response = await servicesAPI.apply({
        serviceId: selectedService.id,
        notes: data.notes,
        userName: data.userName,
        userEmail: data.userEmail,
      });

      if (response.success) {
        alert(response.message || 'サービスを申し込みました。担当者からの連絡をお待ちください。');
        setApplyModalOpen(false);
        setSelectedService(null);
        
        // Reload applications
        const applicationsResponse = await servicesAPI.getMyApplications();
        if (applicationsResponse.success) {
          setApplications(applicationsResponse.data);
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

  // Detail view
  if (id) {
    const service = services.find(s => s.id === id);
    if (!service) {
      return <div>サービスが見つかりません。</div>;
    }

    return (
      <div className="fade-in">
        <nav className="flex items-center text-sm text-secondary mb-4" aria-label="パンくずナビ">
          <Link to="/app" className="hover:text-primary">ホーム</Link>
          <span className="mx-2">＞</span>
          <Link to="/app/services" className="hover:text-primary">サービス</Link>
          <span className="mx-2">＞</span>
          <span className="text-gray-900">{service.name}</span>
        </nav>
        <div className={`bg-white rounded-lg shadow-md border-t-4 border-${service.color} overflow-hidden`}>
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
              <div className="mb-4 md:mb-0">
                <div className="flex items-center mb-2">
                  <div className={`w-12 h-12 rounded-lg bg-${service.color.split('-')[0]}-100 flex items-center justify-center mr-4`}>
                    <i className={`${service.icon} text-2xl text-${service.color}`}></i>
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900">{service.name}</h2>
                </div>
                <p className="text-secondary ml-16">{service.description}</p>
              </div>
              <div className="flex-shrink-0 md:ml-6 text-right">
                <p className="text-xl md:text-2xl font-bold text-gray-800 mb-2">
                  ¥{service.price.toLocaleString()}
                  <span className="text-sm font-normal text-gray-600"> / {service.priceType === 'monthly' ? '月' : '回'}</span>
                </p>
                <button onClick={() => handleOpenApplyModal(service)} className="py-2 px-6 rounded-md font-medium text-white bg-primary hover:bg-blue-700 focus-ring shadow-sm">
                  <i className="fas fa-file-signature mr-2"></i>このサービスに申し込む
                </button>
              </div>
            </div>
            <div className="prose max-w-none text-gray-700 leading-relaxed mt-6" dangerouslySetInnerHTML={{ __html: service.longDescription.replace(/\n/g, '<br />') }}></div>
          </div>
          <div className="p-6 bg-gray-50 border-t flex flex-col sm:flex-row justify-center items-center gap-4">
            <button onClick={() => handleOpenApplyModal(service)} className="w-full sm:w-auto py-3 px-8 rounded-md font-medium text-white bg-primary hover:bg-blue-700 focus-ring shadow-sm">
              <i className="fas fa-file-signature mr-2"></i>このサービスに申し込む
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List view
  const ServiceCard: React.FC<{ service: Service }> = ({ service }) => (
    <div key={service.id} className="bg-white rounded-lg shadow-md border p-6 flex flex-col hover:shadow-lg transition-shadow">
      <div className="flex items-start mb-4">
        <div className={`w-12 h-12 rounded-lg bg-${service.color.split('-')[0]}-100 flex items-center justify-center mr-4 flex-shrink-0`}>
          <i className={`${service.icon} text-2xl text-${service.color}`}></i>
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
          <p className="text-sm font-semibold text-gray-500">¥{service.price.toLocaleString()} ({service.priceType === 'monthly' ? '月額' : '一回'})</p>
        </div>
      </div>
      <p className="text-gray-600 flex-grow mb-6">{service.description}</p>
      <div className="grid grid-cols-2 gap-2 mt-auto">
        <button onClick={() => navigate(`/app/services/${service.id}`)} className="col-span-2 py-2 px-3 rounded-md text-sm font-medium text-primary bg-blue-50 hover:bg-blue-100">詳細を見る</button>
        <button onClick={() => handleOpenApplyModal(service)} className="col-span-2 py-2 px-3 rounded-md text-sm font-medium text-white bg-primary hover:bg-blue-700">申し込む</button>
      </div>
    </div>
  );

  const getStatusClass = (status: ServiceApplication['status']) => {
    if (status === 'approved') return 'bg-green-100 text-green-800';
    if (status === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">サービス</h2>
          <p className="text-secondary">貴社のビジネスを守るための各種サービスをご提供します</p>
        </div>
        <div className="bg-gray-200 p-1 rounded-lg flex-shrink-0">
          <button onClick={() => setViewMode('card')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'card' ? 'bg-white shadow' : ''}`}>
            <i className="fas fa-th-large"></i>
          </button>
          <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'list' ? 'bg-white shadow' : ''}`}>
            <i className="fas fa-list"></i>
          </button>
        </div>
      </div>
      
      {viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {services.map(service => <ServiceCard key={service.id} service={service} />)}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">サービス名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">概要</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">価格</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {services.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-lg bg-${s.color.split('-')[0]}-100 flex items-center justify-center mr-4 flex-shrink-0`}>
                        <i className={`${s.icon} text-lg text-${s.color}`}></i>
                      </div>
                      <div className="text-sm font-medium text-gray-900">{s.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{s.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">¥{s.price.toLocaleString()} ({s.priceType === 'monthly' ? '月額' : '一回'})</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <button onClick={() => navigate(`/app/services/${s.id}`)} className="text-primary hover:underline">詳細</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">申込履歴</h3>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">サービス名</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申込日</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {applications.length > 0 ? applications.map(app => (
                <tr key={app.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{app.serviceName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(app.applicationDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(app.status)}`}>
                      {app.status}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={3} className="text-center py-10 text-gray-500">申込履歴はありません。</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isApplyModalOpen && selectedService && (
        <ApplicationModal 
          type="service"
          item={selectedService as any}
          onClose={() => setApplyModalOpen(false)}
          onSubmit={handleSubmitApply}
        />
      )}
    </div>
  );
};

export default ServicesIntegrated;
