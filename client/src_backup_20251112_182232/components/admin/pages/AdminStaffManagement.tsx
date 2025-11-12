import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { Staff, StaffRole, StaffSkill, StaffQualification, StaffCareer } from '../../../types.ts';
import { useClientData } from '../../../ClientDataContext.tsx';
import ImageUploader from '../ImageUploader.tsx';

const roleLabels: Record<StaffRole, string> = {
    CrisisManager: '危機管理官',
    Consultant: 'コンサルタント',
    Legal: '弁護士',
    Accounting: '公認会計士',
    Admin: '管理者',
};

const approvalStatusLabels: Record<Staff['approvalStatus'], string> = {
    approved: '承認済み',
    pending: '承認待ち',
};

const emptyAddress = { postalCode: '', prefecture: '', city: '', address1: '', address2: '' };

const initialFormState: Omit<Staff, 'id' | 'assignedClients' | 'joinedDate'> = {
    name: '',
    realName: '', businessName: '', displayNameType: 'real', email: '', role: 'Consultant', position: '', phone: '', photoUrl: '', profile: '', status: 'active', approvalStatus: 'pending',
    personalInfo: { dateOfBirth: '', gender: '男性', address: emptyAddress },
    skills: [],
    qualifications: [],
    careerHistory: [],
    emergencyContact: { name: '', relationship: '', phone: '' },
};

const StaffEditorView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { staff: staffList, saveStaff, approveStaff } = useClientData();

    const isCreating = location.pathname.endsWith('/new');
    const staffMember = isCreating ? null : staffList.find(s => s.id === Number(id));

    const [formData, setFormData] = useState<Omit<Staff, 'id' | 'assignedClients' | 'joinedDate'>>(() => {
        if (isCreating) return initialFormState;
        return {
            ...initialFormState,
            ...staffMember,
            name: staffMember?.realName || staffMember?.name || '',
            realName: staffMember?.realName || staffMember?.name || '',
            businessName: staffMember?.businessName || '',
            displayNameType: staffMember?.displayNameType || 'real',
            personalInfo: staffMember?.personalInfo || initialFormState.personalInfo,
            skills: staffMember?.skills || [],
            qualifications: staffMember?.qualifications || [],
            careerHistory: staffMember?.careerHistory || [],
            emergencyContact: staffMember?.emergencyContact || initialFormState.emergencyContact,
        };
    });
    
    const [activeTab, setActiveTab] = useState('basic');
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const validate = () => {
        const newErrors: { [key: string]: string } = {};
        if (!formData.realName?.trim()) newErrors.realName = '本名を入力してください。';
        if (!formData.email?.trim()) {
            newErrors.email = 'メールアドレスを入力してください。';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = '有効なメールアドレス形式ではありません。';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    
    const handleSave = () => {
        if (!validate()) return;
        saveStaff(formData, staffMember?.id);
        navigate('/app/staff');
    };

    const handleApprove = () => {
        if(staffMember) {
            approveStaff(staffMember.id);
            navigate('/app/staff');
        }
    };
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, path?: string) => {
        const { name, value } = e.target;
        if (path === 'personalInfo.address') {
            const keys = name.split('.');
            setFormData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, address: { ...prev.personalInfo.address, [keys[1]]: value } } }));
        } else if (path) {
            setFormData(prev => ({ ...prev, [path]: { ...(prev as any)[path], [name]: value } }));
        } else {
            if (name === 'realName') {
                setFormData(prev => ({ ...prev, name: value, realName: value }));
            } else {
                setFormData(prev => ({ ...prev, [name]: value }));
            }
        }
    };
    
    const handleDynamicListChange = (listName: 'skills' | 'qualifications' | 'careerHistory', index: number, field: string, value: any) => {
        const list = (formData as any)[listName] as any[];
        const newList = [...list];
        newList[index] = { ...newList[index], [field]: value };
        setFormData(prev => ({ ...prev, [listName]: newList }));
    };

    const addDynamicListItem = (listName: 'skills' | 'qualifications' | 'careerHistory') => {
        const newItem: any = { id: `new_${Date.now()}` };
        switch(listName) {
            case 'skills': newItem.skillName = ''; newItem.skillLevel = 3; break;
            case 'qualifications': newItem.qualificationName = ''; newItem.acquisitionDate = ''; break;
            case 'careerHistory': newItem.companyName = ''; newItem.position = ''; newItem.startDate = ''; newItem.endDate = ''; newItem.description = ''; break;
        }
        setFormData(prev => ({ ...prev, [listName]: [...(prev[listName] || []), newItem] }));
    };

    const removeDynamicListItem = (listName: keyof Staff, id: string) => {
        const list = (formData as any)[listName] as any[];
        setFormData(prev => ({ ...prev, [listName]: list.filter(item => item.id !== id) }));
    };

    if (!isCreating && !staffMember) {
        return <div className="text-center p-8 bg-white rounded-lg shadow-md">担当者が見つかりません。</div>;
    }

    const inputClass = "mt-1 w-full p-2 border border-gray-300 rounded-md enhanced-input";

    return (
        <div className="fade-in space-y-6">
            <button onClick={() => navigate('/app/staff')} className="text-sm text-primary mb-2 flex items-center">
                <i className="fas fa-chevron-left mr-2"></i>担当者一覧に戻る
            </button>
            <div className="bg-white rounded-lg shadow-md flex flex-col">
                <div className="p-6 border-b"><h3 className="text-lg font-medium text-gray-900">{isCreating ? '新規担当者の追加' : '担当者情報の編集'}</h3></div>
                
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-4 px-6">
                        <button onClick={() => setActiveTab('basic')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'basic' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>基本情報</button>
                        <button onClick={() => setActiveTab('skills')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'skills' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>スキル・経歴</button>
                        <button onClick={() => setActiveTab('emergency')} className={`py-3 px-1 border-b-2 font-medium text-sm ${activeTab === 'emergency' ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>緊急連絡先</button>
                    </nav>
                </div>
                
                <div className="p-6 space-y-6 flex-grow overflow-y-auto">
                    {activeTab === 'basic' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div><label className="block text-sm font-medium text-gray-700">顔写真</label><ImageUploader imageUrl={formData.photoUrl} onImageChange={(url) => setFormData(p=>({...p, photoUrl: url}))} onImageRemove={()=>setFormData(p=>({...p, photoUrl:''}))} recommendedSizeText="推奨: 200x240px" maxWidth={200} maxHeight={240} /></div>
                                <div className="md:col-span-2 space-y-4">
                                    <div><label className="block text-sm font-medium text-gray-700">本名<span className="text-danger">*</span></label><input type="text" name="realName" value={formData.realName} onChange={e=>handleInputChange(e)} className={`${inputClass} ${errors.realName ? 'invalid-input' : ''}`}/><p className="text-xs text-danger mt-1 h-3">{errors.realName}</p></div>
                                    <div><label className="block text-sm font-medium text-gray-700">業務名</label><input type="text" name="businessName" value={formData.businessName} onChange={e=>handleInputChange(e)} className={inputClass}/></div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">クライアントへの表示名</label>
                                        <div className="mt-2 flex space-x-4">
                                            <label className="flex items-center"><input type="radio" name="displayNameType" value="real" checked={formData.displayNameType === 'real'} onChange={handleInputChange} /><span className="ml-2 text-gray-700">本名</span></label>
                                            <label className="flex items-center"><input type="radio" name="displayNameType" value="business" checked={formData.displayNameType === 'business'} onChange={handleInputChange} /><span className="ml-2 text-gray-700">業務名</span></label>
                                        </div>
                                    </div>
                                    <div><label className="block text-sm font-medium text-gray-700">メールアドレス<span className="text-danger">*</span></label><input type="email" name="email" value={formData.email} onChange={e=>handleInputChange(e)} className={`${inputClass} ${errors.email ? 'invalid-input' : ''}`}/><p className="text-xs text-danger mt-1 h-3">{errors.email}</p></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700">役職カテゴリ</label><select name="role" value={formData.role} onChange={e=>handleInputChange(e)} className={inputClass}>{Object.entries(roleLabels).map(([k, l]) => (<option key={k} value={k}>{l}</option>))}</select></div>
                                <div><label className="block text-sm font-medium text-gray-700">役職名</label><input type="text" name="position" value={formData.position} onChange={e=>handleInputChange(e)} className={inputClass}/></div>
                                <div><label className="block text-sm font-medium text-gray-700">電話番号</label><input type="tel" name="phone" value={formData.phone} onChange={e=>handleInputChange(e)} className={inputClass}/></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><label className="block text-sm font-medium text-gray-700">生年月日</label><input type="date" name="dateOfBirth" value={formData.personalInfo?.dateOfBirth} onChange={e=>handleInputChange(e, 'personalInfo')} className={inputClass}/></div>
                                <div><label className="block text-sm font-medium text-gray-700">性別</label><select name="gender" value={formData.personalInfo?.gender} onChange={e=>handleInputChange(e, 'personalInfo')} className={inputClass}><option>男性</option><option>女性</option><option>その他</option></select></div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">住所</label>
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-2 mt-1">
                                    <input type="text" name="address.postalCode" value={formData.personalInfo.address.postalCode} onChange={e => handleInputChange(e, 'personalInfo.address')} placeholder="郵便番号" className={inputClass + " md:col-span-1"} />
                                    <input type="text" name="address.prefecture" value={formData.personalInfo.address.prefecture} onChange={e => handleInputChange(e, 'personalInfo.address')} placeholder="都道府県" className={inputClass + " md:col-span-1"} />
                                    <input type="text" name="address.city" value={formData.personalInfo.address.city} onChange={e => handleInputChange(e, 'personalInfo.address')} placeholder="市区町村" className={inputClass + " md:col-span-4"} />
                                    <input type="text" name="address.address1" value={formData.personalInfo.address.address1} onChange={e => handleInputChange(e, 'personalInfo.address')} placeholder="番地" className={inputClass + " md:col-span-3"} />
                                    <input type="text" name="address.address2" value={formData.personalInfo.address.address2} onChange={e => handleInputChange(e, 'personalInfo.address')} placeholder="建物名・部屋番号" className={inputClass + " md:col-span-3"} />
                                </div>
                            </div>
                            <div><label className="block text-sm font-medium text-gray-700">プロフィール概要</label><textarea name="profile" value={formData.profile} onChange={e=>handleInputChange(e)} rows={3} className={inputClass}/></div>
                        </div>
                    )}
                    {activeTab === 'skills' && (
                        <div className="space-y-6">
                            <div>
                                <h4 className="font-semibold mb-2">スキル</h4>
                                {(formData.skills || []).map((skill, i) => (
                                    <div key={skill.id} className="grid grid-cols-12 gap-2 items-center mb-2 p-2 bg-gray-50 rounded">
                                        <div className="col-span-6"><input type="text" value={skill.skillName} onChange={e => handleDynamicListChange('skills', i, 'skillName', e.target.value)} placeholder="スキル名" className={inputClass}/></div>
                                        <div className="col-span-5 flex items-center">
                                            <input type="range" min="1" max="5" value={skill.skillLevel} onChange={e => handleDynamicListChange('skills', i, 'skillLevel', parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                                            <span className="ml-3 font-semibold w-4">{skill.skillLevel}</span>
                                        </div>
                                        <div className="col-span-1 text-right"><button type="button" onClick={() => removeDynamicListItem('skills', skill.id)} className="text-red-500 hover:text-red-700 p-1"><i className="fas fa-trash"></i></button></div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addDynamicListItem('skills')} className="text-sm text-blue-600 hover:text-blue-800 mt-2"><i className="fas fa-plus mr-1"></i>スキルを追加</button>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2">資格</h4>
                                {(formData.qualifications || []).map((qual, i) => (
                                    <div key={qual.id} className="grid grid-cols-12 gap-2 items-center mb-2 p-2 bg-gray-50 rounded">
                                        <div className="col-span-6"><input type="text" value={qual.qualificationName} onChange={e => handleDynamicListChange('qualifications', i, 'qualificationName', e.target.value)} className={inputClass} placeholder="資格名" /></div>
                                        <div className="col-span-5"><input type="date" value={qual.acquisitionDate} onChange={e => handleDynamicListChange('qualifications', i, 'acquisitionDate', e.target.value)} className={inputClass} /></div>
                                        <div className="col-span-1 text-right"><button type="button" onClick={() => removeDynamicListItem('qualifications', qual.id)} className="text-red-500 hover:text-red-700 p-1"><i className="fas fa-trash"></i></button></div>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addDynamicListItem('qualifications')} className="text-sm text-blue-600 hover:text-blue-800 mt-2"><i className="fas fa-plus mr-1"></i>資格を追加</button>
                            </div>

                            <div>
                                <h4 className="font-semibold mb-2">経歴</h4>
                                {(formData.careerHistory || []).map((career, i) => (
                                    <div key={career.id} className="p-3 border rounded-md mb-3 bg-gray-50 space-y-2">
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="text" value={career.companyName} onChange={e => handleDynamicListChange('careerHistory', i, 'companyName', e.target.value)} className={inputClass} placeholder="会社名" />
                                            <input type="text" value={career.position} onChange={e => handleDynamicListChange('careerHistory', i, 'position', e.target.value)} className={inputClass} placeholder="役職" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input type="date" value={career.startDate} onChange={e => handleDynamicListChange('careerHistory', i, 'startDate', e.target.value)} className={inputClass} />
                                            <input type="date" value={career.endDate} onChange={e => handleDynamicListChange('careerHistory', i, 'endDate', e.target.value)} className={inputClass} />
                                        </div>
                                        <textarea value={career.description} onChange={e => handleDynamicListChange('careerHistory', i, 'description', e.target.value)} className={inputClass} placeholder="業務内容" rows={2} />
                                        <button type="button" onClick={() => removeDynamicListItem('careerHistory', career.id)} className="text-xs text-red-500 hover:text-red-700"><i className="fas fa-trash mr-1"></i>この経歴を削除</button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addDynamicListItem('careerHistory')} className="text-sm text-blue-600 hover:text-blue-800 mt-2"><i className="fas fa-plus mr-1"></i>経歴を追加</button>
                            </div>
                        </div>
                    )}
                    {activeTab === 'emergency' && (
                        <div className="space-y-4">
                            <h4 className="font-semibold mb-2">緊急連絡先</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg border">
                                <div><label className="block text-sm font-medium text-gray-700">氏名</label><input type="text" name="name" value={formData.emergencyContact?.name} onChange={e=>handleInputChange(e, 'emergencyContact')} className={inputClass}/></div>
                                <div><label className="block text-sm font-medium text-gray-700">続柄</label><input type="text" name="relationship" value={formData.emergencyContact?.relationship} onChange={e=>handleInputChange(e, 'emergencyContact')} className={inputClass}/></div>
                                <div><label className="block text-sm font-medium text-gray-700">電話番号</label><input type="tel" name="phone" value={formData.emergencyContact?.phone} onChange={e=>handleInputChange(e, 'emergencyContact')} className={inputClass}/></div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 bg-gray-50 flex justify-between items-center mt-auto">
                    <div>
                         {!isCreating && staffMember?.approvalStatus === 'pending' && (
                            <button onClick={handleApprove} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">
                                <i className="fas fa-check-circle mr-2"></i>この担当者を承認する
                            </button>
                        )}
                    </div>
                    <div className="space-x-3">
                        <button onClick={() => navigate('/app/staff')} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50">キャンセル</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">保存</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StaffListView: React.FC = () => {
    const { staff, clients, hasPermission } = useClientData();
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [viewMode, setViewMode] = useState<'list'|'card'>('list');
    const [expandedStaffId, setExpandedStaffId] = useState<number | null>(null);
    const navigate = useNavigate();
    const canEdit = hasPermission('EDIT_STAFF');

    const filteredStaff = useMemo(() => {
        return staff.filter(s => {
            const searchLower = searchTerm.toLowerCase();
            return (
                (s.realName.toLowerCase().includes(searchLower) || (s.businessName && s.businessName.toLowerCase().includes(searchLower)) || s.email.toLowerCase().includes(searchLower) || (roleLabels[s.role] && roleLabels[s.role].toLowerCase().includes(searchLower)) || (s.status === 'active' ? '有効' : '無効').includes(searchLower)) &&
                (roleFilter === '' || s.role === roleFilter) &&
                (statusFilter === '' || s.status === statusFilter)
            );
        });
    }, [staff, searchTerm, roleFilter, statusFilter]);
    
    const toggleExpand = (staffId: number) => {
        setExpandedStaffId(prev => prev === staffId ? null : staffId);
    };

    const StaffCard: React.FC<{ staffMember: Staff }> = ({ staffMember }) => (
        <div onClick={() => navigate(`/app/staff/${staffMember.id}`)} className="bg-white rounded-lg shadow-md border p-4 flex flex-col cursor-pointer hover:shadow-lg transition-shadow">
            <div className="flex items-start mb-3">
                <img className="h-16 w-16 rounded-full object-cover mr-4" src={staffMember.photoUrl} alt={staffMember.realName} />
                <div className="flex-1">
                    <h3 className="font-bold text-gray-800">{staffMember.realName}</h3>
                    <p className="text-sm text-primary">{staffMember.position}</p>
                    <div className="mt-1">
                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${staffMember.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{staffMember.status === 'active' ? '有効' : '無効'}</span>
                         <span className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${staffMember.approvalStatus === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{approvalStatusLabels[staffMember.approvalStatus]}</span>
                    </div>
                </div>
            </div>
        </div>
    );
    
    return (
        <div className="fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">担当者管理</h1>
                    <p className="text-gray-500">スマートポリスの担当者を管理します。</p>
                </div>
                <div className="flex items-center space-x-4">
                     <div className="bg-gray-200 p-1 rounded-lg">
                        <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'list' ? 'bg-white shadow' : ''}`}><i className="fas fa-list"></i></button>
                        <button onClick={() => setViewMode('card')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'card' ? 'bg-white shadow' : ''}`}><i className="fas fa-th-large"></i></button>
                    </div>
                    {canEdit && (
                        <button onClick={() => navigate('/app/staff/new')} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm">
                            <i className="fas fa-plus mr-2"></i>新規担当者追加
                        </button>
                    )}
                </div>
            </div>
             <div className="bg-white p-4 rounded-lg shadow-md">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input type="text" placeholder="名前, メール, 役職, ステータス..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="md:col-span-2 w-full p-2 border rounded-md enhanced-input" />
                    <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-full p-2 border rounded-md enhanced-input">
                        <option value="">全ての役職カテゴリ</option>{Object.entries(roleLabels).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                    </select>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full p-2 border rounded-md enhanced-input">
                        <option value="">全てのステータス</option><option value="active">有効</option><option value="inactive">無効</option>
                    </select>
                </div>
            </div>
            {viewMode === 'list' ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-1 py-3"></th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">担当者</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">役職</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">ステータス</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">承認</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStaff.map(s => {
                                const assigned = clients.filter(c => c.mainAssigneeId === s.id || c.subAssigneeId === s.id);
                                return (
                                <React.Fragment key={s.id}>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-1 py-4"><button onClick={() => toggleExpand(s.id)} disabled={assigned.length === 0} className="w-6 h-6 text-gray-500 disabled:opacity-30"><i className={`fas fa-chevron-${expandedStaffId === s.id ? 'down' : 'right'}`}></i></button></td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10"><img className="h-10 w-10 rounded-full object-cover" src={s.photoUrl} alt={s.realName} /></div>
                                                <div className="ml-4"><div className="text-sm font-medium text-gray-900">{s.realName}</div><div className="text-xs text-gray-500">{s.email}</div></div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">{s.position}</td>
                                        <td className="px-4 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${s.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{s.status === 'active' ? '有効' : '無効'}</span></td>
                                        <td className="px-4 py-4 whitespace-nowrap"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${s.approvalStatus === 'approved' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{approvalStatusLabels[s.approvalStatus]}</span></td>
                                        <td className="px-4 py-4"><button onClick={() => navigate(`/app/staff/${s.id}`)} className="text-primary hover:text-blue-700">詳細</button></td>
                                    </tr>
                                    {expandedStaffId === s.id && (
                                        <tr><td colSpan={6} className="p-0"><div className="bg-blue-50 p-3">
                                            <h4 className="font-semibold text-xs mb-2 pl-2">担当クライアント ({assigned.length}社)</h4>
                                            <table className="min-w-full bg-white rounded-md">
                                                 <thead className="bg-blue-100 text-blue-800 text-xs"><tr>
                                                    <th className="px-2 py-1 text-left">企業名</th><th className="px-2 py-1 text-left">プラン</th><th className="px-2 py-1 text-left">役割</th>
                                                </tr></thead>
                                                <tbody>
                                                    {assigned.map(c => (
                                                        <tr key={c.id} className="text-xs border-b border-blue-100"><td className="px-2 py-1.5">{c.companyName}</td><td className="px-2 py-1.5">{clients.find(cl=>cl.planId)?.planId}</td><td className="px-2 py-1.5">{c.mainAssigneeId === s.id ? '主担当' : '副担当'}</td></tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div></td></tr>
                                    )}
                                </React.Fragment>
                            )})}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStaff.map(s => <StaffCard key={s.id} staffMember={s}/>)}
                </div>
            )}
        </div>
    );
};

const AdminStaffManagement: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const isEditOrCreate = !!id || location.pathname.endsWith('/new');
    const { hasPermission } = useClientData();
    const canEdit = hasPermission('EDIT_STAFF');

    if (isEditOrCreate && canEdit) {
        return <StaffEditorView />;
    }
    return <StaffListView />;
};

export default AdminStaffManagement;