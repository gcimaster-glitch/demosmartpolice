import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Message, Participant, MessageTicket, StaffRole } from '../../types.ts';
import { generateSuggestedReplies, generateReplyDraft } from '../../services/geminiService.ts';
import { sendNewMessageEmail } from '../../services/notificationService.ts';
import { useAuth } from '../../AuthContext.tsx';
import { useClientData } from '../../ClientDataContext.tsx';


const MessageDetail: React.FC = () => {
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { tickets, staff, clientUsers, updateTicketStatus, consumeTicket, currentClient, getStaffDisplayName } = useClientData();

    const ticketId = Number(id);
    const currentTicket = tickets.find(t => t.id === ticketId);

    const [newMessage, setNewMessage] = useState('');
    const [suggestedReplies, setSuggestedReplies] = useState<string[]>([]);
    const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
    const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
    const typingTimeoutRef = useRef<number | null>(null);

    const staffRoleToParticipantRole = (role: StaffRole): Participant['role'] => {
        const roleMap: Record<StaffRole, Participant['role']> = {
            'CrisisManager': '危機管理官',
            'Consultant': '担当者',
            'Legal': '弁護士',
            'Accounting': '公認会計士',
            'Admin': '副担当者'
        };
        return roleMap[role];
    };

    const clientUser = useMemo(() => clientUsers.find(cu => cu.email === user?.email), [clientUsers, user]);
    const assignee = useMemo(() => staff.find(s => s.id === currentTicket?.assigneeId), [staff, currentTicket]);

    const [messages, setMessages] = useState<Message[]>(() => {
        if (!clientUser || !assignee) return [];
        return [
            { id: '1', sender: clientUser.name, senderType: 'user', avatar: 'fas fa-user', text: '顧客から商品に対する苦情が寄せられました。対応方法をご相談させてください。', timestamp: '2024-08-28T14:00:15Z', readBy: [] },
            { id: '2', sender: getStaffDisplayName(assignee.id), senderType: 'support', avatar: 'fas fa-shield-alt', text: '承知いたしました。まず、商品の具体的な問題点と、顧客からの要求内容を詳しく教えていただけますか？', timestamp: '2024-08-28T14:02:45Z', readBy: [clientUser.name] },
            { id: '3', sender: clientUser.name, senderType: 'user', avatar: 'fas fa-user', text: '商品は電子機器で、電源が入らないという問題です。顧客は購入から1週間しか経っておらず、全額返金を要求しています。', timestamp: '2024-08-28T14:05:12Z', readBy: [getStaffDisplayName(assignee.id)] }
        ];
    });

    const [participants, setParticipants] = useState<Participant[]>([]);
    const [invitableMembers, setInvitableMembers] = useState<Participant[]>([]);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isParticipantsOpen, setIsParticipantsOpen] = useState(true);
    const [inviteSearchTerm, setInviteSearchTerm] = useState('');

    const isCompleted = currentTicket?.status === '完了';

    useEffect(() => {
        if (newMessage.length >= 5 && !isCompleted) {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            typingTimeoutRef.current = window.setTimeout(async () => {
                setIsLoadingSuggestions(true);
                const conversationHistory = messages.map(m => `${m.senderType === 'user' ? '顧客' : 'サポート'}: ${m.text}`).join('\n');
                const suggestions = await generateSuggestedReplies(conversationHistory, newMessage);
                setSuggestedReplies(suggestions);
                setIsLoadingSuggestions(false);
            }, 800);
        } else {
            setSuggestedReplies([]);
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        }
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
        };
    }, [newMessage, messages, isCompleted]);

    useEffect(() => {
        const initialParticipants: Participant[] = [];
        if (clientUser) {
            initialParticipants.push({
                id: `client-${clientUser.id}`, name: clientUser.name,
                role: clientUser.role === 'CLIENTADMIN' ? 'クライアント管理者' : 'クライアント担当者',
                avatar: 'fas fa-user-tie'
            });
        }
        if (assignee) {
             initialParticipants.push({
                id: `staff-${assignee.id}`, name: getStaffDisplayName(assignee.id),
                role: staffRoleToParticipantRole(assignee.role),
                avatar: 'fas fa-shield-alt'
            });
        }
        setParticipants(initialParticipants);
    }, [clientUser, assignee, getStaffDisplayName]);

    useEffect(() => {
        const participantIds = new Set(participants.map(p => p.id));
        
        // FIX: Splitting the array creation into two explicitly typed arrays resolves the type inference issue.
        const staffMembers: Participant[] = staff
            .filter(s => s.approvalStatus === 'approved')
            .map(s => ({
                id: `staff-${s.id}`,
                name: getStaffDisplayName(s.id),
                role: staffRoleToParticipantRole(s.role),
                avatar: s.role === 'Legal' ? 'fas fa-gavel' : s.role === 'Accounting' ? 'fas fa-calculator' : 'fas fa-user-shield'
            }));

        const clientMembers: Participant[] = clientUsers
            .filter(cu => cu.clientId === currentClient?.id)
            .map(cu => ({
                id: `client-${cu.id}`,
                name: cu.name,
                role: cu.role === 'CLIENTADMIN' ? 'クライアント管理者' : 'クライアント担当者',
                avatar: 'fas fa-user'
            }));
        
        const allPossibleMembers: Participant[] = [...staffMembers, ...clientMembers];
        
        setInvitableMembers(allPossibleMembers.filter(member => !participantIds.has(member.id)));
    }, [participants, staff, clientUsers, currentClient, getStaffDisplayName]);


    const formatTimestamp = (isoString: string) => {
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) {
                return isoString; // Invalid date, return original string
            }
            return new Intl.DateTimeFormat('ja-JP', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).format(date);
        } catch (e) {
            return isoString; // Fallback on error
        }
    };

    const getExpirationInfo = (expirationDate?: string, status?: MessageTicket['status']) => {
        if (!expirationDate || status === '完了') {
            return null;
        }

        const now = new Date();
        const expiry = new Date(expirationDate);
        const diffHours = (expiry.getTime() - now.getTime()) / (1000 * 60 * 60);

        let colorClass = 'text-gray-600';
        let text = '対応期限';
        if (diffHours < 0) {
            colorClass = 'text-red-600 font-bold';
            text = '期限超過';
        } else if (diffHours < 48) {
            colorClass = 'text-yellow-600';
            text = '期限間近';
        }

        const formattedDate = new Intl.DateTimeFormat('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(expiry);

        return (
            <div className={`mt-2 text-sm ${colorClass}`}>
                <i className="fas fa-hourglass-end mr-2"></i>
                {text}: {formattedDate}
            </div>
        );
    };

    const handleGenerateDraft = async () => {
        setIsGeneratingDraft(true);
        const conversationHistory = messages.map(m => `${m.senderType === 'user' ? 'クライアント' : 'サポート'}: ${m.text}`).join('\n');
        const prompt = `あなたはスマートポリスの優秀なサポート担当者です。以下の会話履歴を元に、顧客への丁寧でプロフェッショナルな返信案を作成してください。\n\n会話履歴:\n---\n${conversationHistory}\n---\n\n返信案:`;

        try {
            const draft = await generateReplyDraft(prompt);
            setNewMessage(draft);
            setSuggestedReplies([]); // Clear quick suggestions if any
        } catch (error) {
            console.error("Failed to generate draft:", error);
            alert('AI返信案の生成に失敗しました。');
        } finally {
            setIsGeneratingDraft(false);
        }
    };

    const handleInvite = (member: Participant) => {
        if (!currentClient) {
            alert("クライアント情報が見つかりません。");
            return;
        }

        const isSpecialist = member.role === '弁護士' || member.role === '公認会計士';

        if (isSpecialist) {
            const confirmed = window.confirm(
                `${member.role}「${member.name}」を招待します。\n` +
                "専門家を招待すると、チケットが1枚追加で消費されます。よろしいですか？"
            );

            if (!confirmed) {
                return;
            }
            
            const success = consumeTicket(currentClient.id, '専門家招待', `専門家招待: ${member.name} (${member.role})`, ticketId, 1);
            if (!success) {
                alert("チケット残数が不足しているため、専門家を招待できません。");
                return;
            }
        }
        
        setParticipants(prev => [...prev, member]);
        setInviteSearchTerm('');

        const systemMessageText = isSpecialist
            ? `${member.name}（${member.role}）がチャットに参加しました。（チケット1枚消費）`
            : `${member.name}（${member.role}）がチャットに参加しました。`;

        const systemMessage: Message = {
            id: `sys-${Date.now()}`,
            sender: 'システム',
            senderType: 'system',
            avatar: '',
            text: systemMessageText,
            timestamp: new Date().toISOString(),
            readBy: [],
        };
        setMessages(prev => [...prev, systemMessage]);
    };

    const handleCompleteConsultation = () => {
        const confirmed = window.confirm(`この相談を完了しますか？`);
        if (!confirmed) {
            return;
        }

        const ticketToComplete = tickets.find(t => t.id === ticketId);

        if (!ticketToComplete) {
            alert('エラー: 対象の相談が見つかりません。');
            return;
        }
        if (ticketToComplete.status === '完了') {
            alert('この相談は既に完了しています。');
            return;
        }

        updateTicketStatus(ticketId, '完了');
        alert('相談を完了しました。');
        navigate('/app/messages');
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === '' || !user || isCompleted || !currentTicket || !assignee) return;

        const msg: Message = {
            id: (messages.length + 1).toString(),
            sender: user.name,
            senderType: 'user',
            avatar: 'fas fa-user',
            text: newMessage,
            timestamp: new Date().toISOString(),
            readBy: []
        };
        setMessages(prev => [...prev, msg]);
        
        sendNewMessageEmail('support@smartpolice.jp', currentTicket.subject, newMessage, user.name);

        setNewMessage('');
        setSuggestedReplies([]);

        setTimeout(() => {
            const replyText = 'ご連絡ありがとうございます。内容を確認し、対応方針をご提案します。少々お待ちください。';
            const reply: Message = {
                id: (messages.length + 2).toString(),
                sender: getStaffDisplayName(assignee.id),
                senderType: 'support',
                avatar: 'fas fa-shield-alt',
                text: replyText,
                timestamp: new Date().toISOString(),
                readBy: [user.name]
            };
            setMessages(prev => [...prev, reply]);
            
            if (user && currentTicket) {
                sendNewMessageEmail(user.email, currentTicket.subject, replyText, getStaffDisplayName(assignee.id));
            }
        }, 2000);
    };
    
    const filteredInvitableMembers = invitableMembers.filter(member =>
        member.name.toLowerCase().includes(inviteSearchTerm.toLowerCase()) ||
        member.role.toLowerCase().includes(inviteSearchTerm.toLowerCase())
    );

    if (!currentTicket) {
        return (
            <div className="bg-white rounded-lg shadow-sm h-full flex items-center justify-center text-gray-500 p-8">
                <div className="text-center">
                    <i className="fas fa-exclamation-circle text-2xl text-red-400 mb-4"></i>
                    <p>相談チケットが見つかりません。</p>
                    <button onClick={() => navigate('/app/messages')} className="mt-4 bg-primary text-white px-4 py-2 rounded-lg">
                        相談一覧に戻る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
             <button onClick={() => navigate('/app/messages')} className="md:hidden flex items-center text-sm text-primary mb-4 p-2 bg-blue-50 rounded-lg">
                <i className="fas fa-chevron-left mr-2"></i>
                相談一覧に戻る
            </button>
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{currentTicket?.subject || '相談詳細'}</h2>
                        {getExpirationInfo(currentTicket?.expirationDate, currentTicket?.status)}
                    </div>
                    <div className="flex items-center flex-shrink-0 ml-4">
                        <button onClick={() => setIsInviteModalOpen(true)} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:bg-gray-400" disabled={isCompleted}>
                            <i className="fas fa-user-plus mr-2"></i>メンバー追加
                        </button>
                        <button onClick={handleCompleteConsultation} disabled={isCompleted} className="ml-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400">
                            <i className="fas fa-check-circle mr-2"></i>相談完了
                        </button>
                    </div>
                </div>
                <div className="mt-4 border-t pt-4">
                    <button onClick={() => setIsParticipantsOpen(!isParticipantsOpen)} className="w-full text-left font-semibold text-gray-800 flex justify-between items-center">
                        <span><i className="fas fa-users mr-2 text-blue-600"></i>参加メンバー ({participants.length}名)</span>
                        <i className={`fas fa-chevron-down transition-transform ${isParticipantsOpen ? 'rotate-180' : ''}`}></i>
                    </button>
                    {isParticipantsOpen && (
                         <div className="mt-3 flex flex-wrap gap-3">
                            {participants.map(p => (
                                <div key={p.id} className="flex items-center space-x-2 bg-gray-100 p-2 rounded-lg">
                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                                        <i className={`${p.avatar} text-gray-600`}></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{p.name}</p>
                                        <p className="text-xs text-gray-500">{p.role}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm flex flex-col" style={{ height: '60vh' }}>
                <div id="chat-messages" className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((msg) => {
                         if (msg.senderType === 'system') {
                            return (
                                <div key={msg.id} className="text-center my-2">
                                    <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full">
                                        <i className="fas fa-info-circle mr-2"></i>
                                        {msg.text}
                                    </span>
                                </div>
                            );
                        }
                        return(
                        <div key={msg.id} className={`flex items-start space-x-3 ${msg.senderType === 'user' ? 'justify-end' : ''}`}>
                            {msg.senderType !== 'user' && (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.senderType === 'support' ? 'bg-red-500' : 'bg-blue-500'}`}>
                                    <i className={`${msg.avatar} text-white text-sm`}></i>
                                </div>
                            )}
                            <div className={`flex-1 max-w-md ${msg.senderType === 'user' ? 'text-right' : ''}`}>
                                <div className="flex items-center space-x-2 mb-1" style={{ justifyContent: msg.senderType === 'user' ? 'flex-end' : 'flex-start' }}>
                                    <span className="font-semibold text-gray-900 text-sm">{msg.sender}</span>
                                    <span className="text-xs text-gray-500">{formatTimestamp(msg.timestamp)}</span>
                                </div>
                                <div className={`rounded-lg px-4 py-3 ${msg.senderType === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                                    <p className="text-sm text-left">{msg.text}</p>
                                </div>
                            </div>
                             {msg.senderType === 'user' && (
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-500`}>
                                    <i className={`${msg.avatar} text-white text-sm`}></i>
                                </div>
                            )}
                        </div>
                    )})}
                </div>
                
                 <div className="border-t border-gray-200 p-4">
                     {isCompleted ? (
                        <div className="text-center text-gray-500 bg-gray-100 p-4 rounded-lg">
                            <i className="fas fa-check-circle mr-2 text-green-500"></i>この相談は完了しています。
                        </div>
                    ) : (
                        <form onSubmit={handleSendMessage} className="space-y-2">
                            <div className="flex justify-end mb-1">
                                <button
                                    type="button"
                                    onClick={handleGenerateDraft}
                                    disabled={isGeneratingDraft || isLoadingSuggestions}
                                    className="px-4 py-1.5 bg-blue-50 text-primary border border-blue-200 rounded-lg text-xs font-semibold hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 transition-colors focus-ring"
                                >
                                    {isGeneratingDraft ? (
                                        <><i className="fas fa-spinner fa-spin mr-2"></i>生成中...</>
                                    ) : (
                                        <><i className="fas fa-magic mr-2"></i>AIで下書きを作成</>
                                    )}
                                </button>
                            </div>
                            {(isLoadingSuggestions || suggestedReplies.length > 0) && (
                                <div className="p-2 space-x-2">
                                    <span className="text-xs font-semibold text-gray-500"><i className="fas fa-robot mr-1"></i>AI返信候補:</span>
                                    {isLoadingSuggestions ? (
                                        <span className="text-xs text-gray-500 italic">生成中...</span>
                                    ) : (
                                        suggestedReplies.map((reply, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => { setNewMessage(reply); setSuggestedReplies([]); }}
                                                className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs hover:bg-blue-200"
                                            >
                                                {reply}
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}
                            <div className="flex items-end space-x-3">
                                <textarea value={newMessage} onChange={(e) => setNewMessage(e.target.value)} rows={2} className="w-full enhanced-input p-2 border rounded-lg resize-none" placeholder="メッセージを入力してください..." />
                                <button type="submit" className="bg-blue-600 text-white px-4 h-10 rounded-lg hover:bg-blue-700 transition-colors focus-ring disabled:bg-gray-400">
                                    <i className="fas fa-paper-plane"></i>
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setIsInviteModalOpen(false)}>
                    <div className="bg-white rounded-lg shadow-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b"> <h3 className="text-xl font-bold text-gray-900">メンバーの追加・管理</h3> </div>
                        <div className="p-6">
                            <div className="relative mb-4">
                                <input type="text" placeholder="名前や役職で検索..." value={inviteSearchTerm} onChange={(e) => setInviteSearchTerm(e.target.value)} className="w-full enhanced-input p-2 pl-10 border rounded-md" />
                                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            </div>
                            <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-600 mb-2">招待可能なメンバー</h4>
                                    <div className="space-y-2">
                                        {filteredInvitableMembers.length > 0 ? filteredInvitableMembers.map(member => {
                                             const isSpecialist = member.role === '弁護士' || member.role === '公認会計士';
                                             return (
                                            <div key={member.id} className="flex items-center justify-between p-2 hover:bg-gray-100 rounded">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3"> <i className={`${member.avatar} text-gray-600`}></i> </div>
                                                    <div>
                                                        <p className="font-medium">{member.name}</p>
                                                        <div className="flex items-center">
                                                            <p className="text-sm text-gray-500">{member.role}</p>
                                                            {isSpecialist && <span className="ml-2 text-xs font-bold text-yellow-600 flex items-center gap-1"><i className="fas fa-ticket-alt"></i>チケット消費</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleInvite(member)} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">招待</button>
                                            </div>
                                        )}) : <p className="text-center text-gray-500 text-sm p-4">招待できるメンバーがいません。</p>}
                                    </div>
                                </div>
                                <div className="border-t border-gray-200"></div>
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-600 mb-2">参加中のメンバー</h4>
                                    <div className="space-y-2">
                                        {participants.map(member => (
                                            <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                                <div className="flex items-center">
                                                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3"><i className={`${member.avatar} text-gray-600`}></i></div>
                                                    <div><p className="font-medium text-gray-800">{member.name}</p><p className="text-sm text-gray-500">{member.role}</p></div>
                                                </div>
                                                <span className="text-xs text-green-600 font-semibold">参加中</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 flex justify-end">
                            <button onClick={() => setIsInviteModalOpen(false)} className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100">閉じる</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageDetail;