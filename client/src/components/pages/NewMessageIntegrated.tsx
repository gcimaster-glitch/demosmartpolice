import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ticketsAPI } from "../../services/apiClient.ts";

const NewMessageIntegrated: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    subject: "",
    category: "一般相談",
    priority: "中" as '高' | '中' | '低',
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      setError('件名とメッセージは必須です');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const response = await ticketsAPI.create(formData);
      
      if (response.success) {
        // 成功したらメッセージ一覧に戻る
        navigate('/app/messages');
      } else {
        setError(response.error || '送信に失敗しました');
      }
    } catch (err) {
      console.error('Create ticket error:', err);
      setError('チケットの作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fade-in max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">新しい相談を投稿</h2>
        <p className="text-sm text-gray-600 mt-1">運営に相談やお問い合わせを送信できます</p>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6">
          <div className="flex">
            <i className="fas fa-exclamation-circle text-xl mr-3"></i>
            <div>
              <p className="font-bold">エラー</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            件名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="例: カスタマーハラスメント対応について"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              カテゴリ
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="一般相談">一般相談</option>
              <option value="緊急対応">緊急対応</option>
              <option value="契約関連">契約関連</option>
              <option value="技術サポート">技術サポート</option>
              <option value="その他">その他</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              優先度
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            >
              <option value="低">低</option>
              <option value="中">中</option>
              <option value="高">高</option>
            </select>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            メッセージ <span className="text-red-500">*</span>
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={10}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="詳細な内容をご記入ください..."
            required
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/app/messages')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={submitting}
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                送信中...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane mr-2"></i>
                送信する
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewMessageIntegrated;
