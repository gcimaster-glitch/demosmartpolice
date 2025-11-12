import React, { useState } from 'react';

const SettingsCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b"><h3 className="text-lg font-semibold text-gray-800">{title}</h3></div>
        <div className="p-6 space-y-4">{children}</div>
        <div className="p-4 bg-gray-50 text-right">
            <button onClick={() => alert('設定を保存しました。（シミュレーション）')} className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700">保存</button>
        </div>
    </div>
);

const InputField: React.FC<{ label: string, name: string, type?: string, value?: string, placeholder?: string }> = ({ label, name, type = 'text', value = '', placeholder }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <input type={type} name={name} id={name} defaultValue={value} placeholder={placeholder} className="mt-1 w-full p-2 border rounded-md enhanced-input" />
    </div>
);

// FIX: Add placeholder prop to TextareaField to allow passing placeholder text.
const TextareaField: React.FC<{ label: string, name: string, rows?: number, value?: string, placeholder?: string }> = ({ label, name, rows = 3, value = '', placeholder }) => (
    <div>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700">{label}</label>
        <textarea name={name} id={name} rows={rows} defaultValue={value} placeholder={placeholder} className="mt-1 w-full p-2 border rounded-md enhanced-input" />
    </div>
);

const ToggleSwitch: React.FC<{ label: string, enabled: boolean }> = ({ label, enabled }) => {
    const [isEnabled, setIsEnabled] = useState(enabled);
    return (
        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <button onClick={() => setIsEnabled(!isEnabled)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isEnabled ? 'bg-primary' : 'bg-gray-200'}`}>
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
};

const EmailSettings = () => (
    <SettingsCard title="メール設定">
        <h4 className="text-md font-semibold text-gray-700 mb-3 border-b pb-2">送信者情報</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="送信元名称" name="sender_name" value="スマートポリス" />
            <InputField label="送信元メールアドレス" name="sender_email" type="email" value="support@smartpolice.jp" />
            <InputField label="返信先名称" name="reply_to_name" value="スマートポリスサポート" />
            <InputField label="返信先メールアドレス" name="reply_to_email" type="email" value="support@smartpolice.jp" />
        </div>

        <h4 className="text-md font-semibold text-gray-700 mt-6 mb-3 border-b pb-2">SMTPサーバー設定</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <InputField label="SMTPホスト" name="smtp_host" placeholder="smtp.example.com" />
            <InputField label="SMTPポート" name="smtp_port" type="number" placeholder="587" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
             <div>
                <label htmlFor="smtp_encryption" className="block text-sm font-medium text-gray-700">暗号化</label>
                <select name="smtp_encryption" id="smtp_encryption" className="mt-1 w-full p-2 border rounded-md enhanced-input">
                    <option value="tls">TLS</option>
                    <option value="ssl">SSL</option>
                    <option value="none">なし</option>
                </select>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <InputField label="SMTPユーザー名" name="smtp_user" />
            <InputField label="SMTPパスワード" name="smtp_pass" type="password" />
        </div>
         <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">テストメール送信</label>
            <div className="flex items-center space-x-2 mt-1">
                <input type="email" placeholder="送信先メールアドレス" className="w-full p-2 border rounded-md enhanced-input" />
                <button onClick={() => alert('テストメールを送信しました。（シミュレーション）')} className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-slate-600 whitespace-nowrap">テスト送信</button>
            </div>
        </div>
        
        <h4 className="text-md font-semibold text-gray-700 mt-6 mb-3 border-b pb-2">メールテンプレート</h4>
        <TextareaField label="メールフッター（署名）" name="email_footer" value={`---\nスマートポリス株式会社\nWeb: https://smartpolice.jp\nTel: 050-1792-5635`} rows={4} placeholder="全ての送信メールの末尾に挿入されます。" />
    </SettingsCard>
);


const AnalyticsSettings = () => (
    <SettingsCard title="アクセス解析設定">
        <InputField label="Google Analytics測定ID" name="ga_id" placeholder="G-XXXXXXXXXX" />
        <InputField label="サイトマップURL" name="sitemap_url" type="url" placeholder="https://example.com/sitemap.xml" />
        <TextareaField label="ビーコンタグ（body終了タグ直前）" name="beacon_tag" placeholder="<script>...</script>" rows={4} />
    </SettingsCard>
);

const LogSettings = () => {
    const [retention, setRetention] = useState(180);
    const [backup, setBackup] = useState(4);

    return (
        <SettingsCard title="ログ設定">
             <h4 className="text-md font-semibold text-gray-700 mb-3 border-b pb-2">保存・バックアップ</h4>
            <div>
                <label htmlFor="log_retention" className="block text-sm font-medium text-gray-700">ログの保存期間: <span className="font-bold text-primary">{retention}日</span></label>
                <input type="range" id="log_retention" min="30" max="365" value={retention} onChange={e => setRetention(Number(e.target.value))} className="w-full mt-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
                <div className="text-xs text-gray-500 flex justify-between"><span>30日</span><span>180日</span><span>365日</span></div>
            </div>
            <div>
                <label htmlFor="log_backup" className="block text-sm font-medium text-gray-700">バックアップ世代数: <span className="font-bold text-primary">{backup}世代</span></label>
                <input type="range" id="log_backup" min="1" max="12" value={backup} onChange={e => setBackup(Number(e.target.value))} className="w-full mt-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"/>
                <div className="text-xs text-gray-500 flex justify-between"><span>1世代</span><span>6世代</span><span>12世代</span></div>
            </div>
            <h4 className="text-md font-semibold text-gray-700 mt-6 mb-3 border-b pb-2">記録するアクション</h4>
            <div className="space-y-3">
                <ToggleSwitch label="ログイン / ログアウト" enabled={true} />
                <ToggleSwitch label="データ閲覧（クライアント情報、相談内容など）" enabled={true} />
                <ToggleSwitch label="データ変更（作成、更新、削除）" enabled={true} />
            </div>
             <h4 className="text-md font-semibold text-gray-700 mt-6 mb-3 border-b pb-2">エクスポート設定</h4>
            <InputField label="デフォルトファイル名" name="log_export_filename" value="smartpolice_audit_log.csv" />
        </SettingsCard>
    );
};

const ImageSettings = () => (
    <SettingsCard title="画像・フォルダ設定">
        <InputField label="アップロード最大サイズ（MB）" name="upload_max_size" type="number" value="25" />
        <InputField label="ダウンロード最大サイズ（MB）" name="download_max_size" type="number" value="100" />
        <InputField label="フォルダ容量上限（GB）" name="folder_capacity" type="number" value="10" />
        <div>
            <label htmlFor="image_retention" className="block text-sm font-medium text-gray-700">画像の保管期限（日）</label>
            <input type="range" id="image_retention" min="30" max="730" defaultValue="365" className="w-full mt-1" />
            <div className="text-xs text-gray-500 flex justify-between"><span>30日</span><span>1年</span><span>2年</span></div>
        </div>
        <button className="text-sm text-red-600 hover:text-red-800"><i className="fas fa-trash-alt mr-2"></i>アップロード履歴を削除</button>
    </SettingsCard>
);

const LoginSettings = () => (
    <SettingsCard title="ログイン連携">
        <div className="space-y-4">
            <div className="p-3 border rounded-md">
                <ToggleSwitch label="Googleログイン" enabled={true} />
                <div className="mt-2 space-y-2">
                    <InputField label="クライアントID" name="google_client_id" />
                    <InputField label="クライアントシークレット" name="google_client_secret" type="password" />
                </div>
            </div>
            <div className="p-3 border rounded-md">
                <ToggleSwitch label="LINEログイン" enabled={false} />
            </div>
            <div className="p-3 border rounded-md">
                <ToggleSwitch label="Yahoo! Japanログイン" enabled={false} />
            </div>
        </div>
    </SettingsCard>
);

const ApiSettings = () => {
    const handleConnect = (service: string) => {
        alert(`${service}との連携を開始します... (シミュレーション)`);
    };
    
    return (
     <SettingsCard title="API連携">
        <div className="space-y-4">
            <div className="p-3 border rounded-md bg-gray-50">
                <h4 className="font-semibold text-gray-800 mb-2">Zoom連携</h4>
                <div className="space-y-2">
                    <InputField label="API Key" name="zoom_api_key" />
                    <InputField label="API Secret" name="zoom_api_secret" type="password" />
                </div>
                <div className="mt-3 text-right">
                    <button onClick={() => handleConnect('Zoom')} className="bg-secondary text-white px-3 py-1 rounded-md text-sm hover:bg-slate-600">
                        <i className="fas fa-plug mr-2"></i>連携
                    </button>
                </div>
            </div>
            <div className="p-3 border rounded-md bg-gray-50">
                <h4 className="font-semibold text-gray-800 mb-2">Stripe決済連携</h4>
                <div className="space-y-2">
                    <InputField label="公開可能キー" name="stripe_publishable_key" />
                    <InputField label="シークレットキー" name="stripe_secret_key" type="password" />
                </div>
                 <div className="mt-3 text-right">
                    <button onClick={() => handleConnect('Stripe')} className="bg-secondary text-white px-3 py-1 rounded-md text-sm hover:bg-slate-600">
                        <i className="fas fa-plug mr-2"></i>連携
                    </button>
                </div>
            </div>
            <div className="p-3 border rounded-md bg-gray-50">
                <h4 className="font-semibold text-gray-800 mb-2">LINE連携</h4>
                <div className="space-y-2">
                    <InputField label="Channel Access Token" name="line_access_token" />
                    <InputField label="Channel Secret" name="line_channel_secret" type="password" />
                </div>
                 <div className="mt-3 text-right">
                    <button onClick={() => handleConnect('LINE')} className="bg-secondary text-white px-3 py-1 rounded-md text-sm hover:bg-slate-600">
                        <i className="fas fa-plug mr-2"></i>連携
                    </button>
                </div>
            </div>
        </div>
    </SettingsCard>
    );
};


const AdminSettings: React.FC = () => {
    const [activeSection, setActiveSection] = useState('login');
    
    const sections: { [key: string]: { label: string; icon: string; component: React.FC } } = {
        email: { label: 'メール設定', icon: 'fa-envelope', component: EmailSettings },
        analytics: { label: 'アクセス解析設定', icon: 'fa-chart-bar', component: AnalyticsSettings },
        logs: { label: 'ログ設定', icon: 'fa-clipboard-list', component: LogSettings },
        images: { label: '画像・フォルダ設定', icon: 'fa-folder', component: ImageSettings },
        login: { label: 'ログイン連携', icon: 'fa-sign-in-alt', component: LoginSettings },
        api: { label: 'API連携', icon: 'fa-cogs', component: ApiSettings },
    };

    const ActiveComponent = sections[activeSection].component;

    return (
        <div className="fade-in">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">システム設定</h1>
            <div className="flex flex-col md:flex-row gap-8">
                <aside className="md:w-1/4 lg:w-1/5">
                    <nav className="space-y-1">
                        {Object.entries(sections).map(([key, { label, icon }]) => (
                            <button
                                key={key}
                                onClick={() => setActiveSection(key)}
                                className={`w-full flex items-center px-4 py-2 text-sm font-medium rounded-md text-left ${
                                    activeSection === key ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                                <i className={`fas ${icon} w-6 mr-2`}></i>
                                {label}
                            </button>
                        ))}
                    </nav>
                </aside>
                <main className="flex-1">
                    <ActiveComponent />
                </main>
            </div>
        </div>
    );
};

export default AdminSettings;