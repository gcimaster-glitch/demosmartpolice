import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { staffAPI } from '../../../services/apiClient';

interface Staff {
  id: number;
  name: string;
  real_name: string;
  business_name?: string;
  display_name_type: 'real' | 'business';
  email: string;
  role: string;
  position?: string;
  phone?: string;
  photo_url?: string;
  profile?: string;
  status: 'active' | 'inactive';
  approval_status: 'pending' | 'approved' | 'rejected';
  assigned_clients?: number;
  joined_date?: string;
}

const roleLabels: Record<string, string> = {
  CrisisManager: '危機管理官',
  Consultant: 'コンサルタント',
  Legal: '弁護士',
  Admin: '管理者',
  Support: 'サポート',
};

const AdminStaffManagementSimple: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state for create/edit
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    realName: '',
    businessName: '',
    displayNameType: 'real' as 'real' | 'business',
    email: '',
    role: 'Consultant',
    position: '',
    phone: '',
    photoUrl: '',
    profile: '',
  });

  const isCreating = window.location.hash.includes('/new');
  const isDetailView = id && !isCreating;

  useEffect(() => {
    if (!isCreating && !id) {
      fetchStaff();
    } else if (isDetailView && id) {
      fetchStaffDetail(parseInt(id));
    } else if (isCreating) {
      setLoading(false); // For create mode, no need to fetch
    }
  }, [id, isCreating, isDetailView]);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const response = await staffAPI.getAll();
      if (response.success) {
        setStaff(response.data || []);
      } else {
        setError(response.error || 'データの取得に失敗しました');
      }
    } catch (err) {
      console.error('Staff fetch error:', err);
      setError('スタッフ一覧の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaffDetail = async (staffId: number) => {
    try {
      setLoading(true);
      const response = await staffAPI.getById(staffId);
      if (response.success && response.data?.staff) {
        const s = response.data.staff;
        setFormData({
          name: s.name || '',
          realName: s.real_name || '',
          businessName: s.business_name || '',
          displayNameType: s.display_name_type || 'real',
          email: s.email || '',
          role: s.role || 'Consultant',
          position: s.position || '',
          phone: s.phone || '',
          photoUrl: s.photo_url || '',
          profile: s.profile || '',
        });
      } else {
        setError(response.error || 'スタッフが見つかりません');
      }
    } catch (err) {
      console.error('Staff detail fetch error:', err);
      setError('スタッフ詳細の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.realName || !formData.email) {
        alert('本名とメールアドレスは必須です');
        return;
      }

      const data = {
        name: formData.realName,
        realName: formData.realName,
        businessName: formData.businessName || undefined,
        displayNameType: formData.displayNameType,
        email: formData.email,
        role: formData.role,
        position: formData.position || undefined,
        phone: formData.phone || undefined,
        photoUrl: formData.photoUrl || undefined,
        profile: formData.profile || undefined,
      };

      let response;
      if (isDetailView && id) {
        response = await staffAPI.update(parseInt(id), data);
      } else {
        response = await staffAPI.create(data);
      }

      if (response.success) {
        alert(isDetailView ? 'スタッフ情報を更新しました' : 'スタッフを登録しました');
        navigate('/app/admin/staff');
      } else {
        alert(response.error || '保存に失敗しました');
      }
    } catch (err) {
      console.error('Save error:', err);
      alert('保存に失敗しました');
    }
  };

  const handleApprove = async (staffId: number) => {
    try {
      const response = await staffAPI.approve(staffId);
      if (response.success) {
        alert('スタッフを承認しました');
        if (isDetailView) {
          fetchStaffDetail(staffId);
        } else {
          fetchStaff();
        }
      } else {
        alert(response.error || '承認に失敗しました');
      }
    } catch (err) {
      console.error('Approve error:', err);
      alert('承認に失敗しました');
    }
  };

  const handleDelete = async (staffId: number) => {
    if (!window.confirm('このスタッフを削除しますか？')) return;
    
    try {
      const response = await staffAPI.delete(staffId);
      if (response.success) {
        alert('スタッフを削除しました');
        navigate('/app/admin/staff');
      } else {
        alert(response.error || '削除に失敗しました');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('削除に失敗しました');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredStaff = staff.filter(s => {
    const searchLower = searchTerm.toLowerCase();
    return (
      s.real_name?.toLowerCase().includes(searchLower) ||
      s.email?.toLowerCase().includes(searchLower) ||
      s.role?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return <div className="text-center p-8">読み込み中...</div>;
  }

  // Create/Edit Form
  if (isCreating || isDetailView) {
    return (
      <div className="fade-in space-y-6">
        <button onClick={() => navigate('/app/admin/staff')} className="text-sm text-primary mb-2 flex items-center">
          <i className="fas fa-chevron-left mr-2"></i>担当者一覧に戻る
        </button>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6">
            {isCreating ? '新規担当者の追加' : '担当者情報の編集'}
          </h3>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  本名<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="realName"
                  value={formData.realName}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  業務名
                </label>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  メールアドレス<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  役職カテゴリ
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                >
                  {Object.entries(roleLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  役職名
                </label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  電話番号
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  写真URL
                </label>
                <input
                  type="url"
                  name="photoUrl"
                  value={formData.photoUrl || ''}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md"
                  placeholder="https://example.com/photo.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">画像のURLを入力してください</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                表示名タイプ
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="displayNameType"
                    value="real"
                    checked={formData.displayNameType === 'real'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  本名
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="displayNameType"
                    value="business"
                    checked={formData.displayNameType === 'business'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  業務名
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                プロフィール
              </label>
              <textarea
                name="profile"
                value={formData.profile}
                onChange={handleInputChange}
                rows={4}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            {isDetailView && (
              <button
                onClick={() => handleDelete(parseInt(id!))}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                削除
              </button>
            )}
            <button
              onClick={() => navigate('/app/admin/staff')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              保存
            </button>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="fade-in space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">担当者管理</h1>
          <p className="text-gray-500">スマートポリスの担当者を管理します。</p>
        </div>
        <button
          onClick={() => navigate('/app/admin/staff/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <i className="fas fa-plus mr-2"></i>新規担当者追加
        </button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <input
          type="text"
          placeholder="名前、メール、役職で検索..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full p-2 border rounded-md"
        />
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">担当者</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">役職</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">承認</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">担当数</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStaff.map(s => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-gray-900">{s.real_name}</div>
                  <div className="text-xs text-gray-500">{s.email}</div>
                </td>
                <td className="px-4 py-4 text-sm text-gray-700">
                  {s.position || roleLabels[s.role] || s.role}
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    s.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {s.status === 'active' ? '有効' : '無効'}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    s.approval_status === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {s.approval_status === 'approved' ? '承認済み' : '承認待ち'}
                  </span>
                  {s.approval_status === 'pending' && (
                    <button
                      onClick={() => handleApprove(s.id)}
                      className="ml-2 text-xs text-blue-600 hover:text-blue-800"
                    >
                      承認
                    </button>
                  )}
                </td>
                <td className="px-4 py-4 text-sm text-gray-700">
                  {s.assigned_clients || 0}社
                </td>
                <td className="px-4 py-4 text-right">
                  <button
                    onClick={() => navigate(`/app/admin/staff/${s.id}`)}
                    className="text-primary hover:text-blue-700"
                  >
                    詳細
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredStaff.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            スタッフが登録されていません
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStaffManagementSimple;
