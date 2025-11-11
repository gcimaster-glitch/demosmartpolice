import React, { useState } from 'react';
import { useClientData } from '../../ClientDataContext.tsx';
import { useAuth } from '../../AuthContext.tsx';
import type { Event, EventApplication } from '../../types.ts';
import ApplicationModal from '../ApplicationModal.tsx';

type ViewMode = 'card' | 'list';

const Events: React.FC = () => {
    const { events, applyForEvent, getEventApplicationStatus, currentClient } = useClientData();
    const { user } = useAuth();
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(events.length > 0 ? events[0] : null);
    const [isApplyModalOpen, setApplyModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>('card');

    const handleApplySubmit = (data: { notes: string; userName: string; userEmail: string; }) => {
         if (!user || !currentClient || !selectedEvent) {
            alert('ユーザー情報またはイベント情報が見つかりません。');
            return;
        }
        
        const applicationData: Omit<EventApplication, 'eventId' | 'applicationDate'> = {
            clientId: currentClient.id,
            userId: user.email,
            userName: data.userName,
            userEmail: data.userEmail,
            notes: data.notes,
        };

        const result = applyForEvent(applicationData, selectedEvent.id);
        alert(result.message);

        if (result.success) {
            const newApplicationForState: EventApplication = {
                ...applicationData,
                eventId: selectedEvent.id,
                applicationDate: new Date().toISOString(),
            };
            setSelectedEvent(prev => prev ? { ...prev, applicants: [...prev.applicants, newApplicationForState] } : null);
            setApplyModalOpen(false);
        }
    };

    const formatDate = (dateString: string) => new Date(dateString).toLocaleString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', weekday: 'short' });

    const EventCard: React.FC<{ event: Event }> = ({ event }) => (
        <div onClick={() => setSelectedEvent(event)} className={`bg-white rounded-lg shadow-md border flex flex-col cursor-pointer hover:shadow-lg transition-shadow h-full ${selectedEvent?.id === event.id ? 'border-primary ring-2 ring-primary' : ''}`}>
             <img src={event.mainImageUrl} alt={event.title} className="w-full h-40 object-cover rounded-t-lg" />
            <div className="p-4 flex flex-col flex-grow">
                <span className="text-xs font-semibold text-primary mb-1">{event.category}</span>
                <h3 className="text-md font-bold text-gray-900 mb-2 flex-grow">{event.title}</h3>
                <div className="space-y-1 text-xs text-gray-600 mb-3">
                    <div className="flex items-center"><i className="fas fa-calendar-alt w-4 text-gray-400 mr-2"></i><span>{formatDate(event.date)}</span></div>
                    <div className="flex items-center"><i className="fas fa-map-marker-alt w-4 text-gray-400 mr-2"></i><span>{event.location}</span></div>
                </div>
                 <div className="flex items-center justify-between text-xs mt-auto">
                    <span className="font-bold text-gray-800">{event.applicants.length} / {event.capacity} 名</span>
                </div>
            </div>
        </div>
    );
    
     const EventListItem: React.FC<{ event: Event }> = ({ event }) => (
         <tr onClick={() => setSelectedEvent(event)} className={`cursor-pointer hover:bg-gray-50 ${selectedEvent?.id === event.id ? 'bg-blue-50' : ''}`}>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{event.title}</div>
                <div className="text-sm text-gray-500">{event.category}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(event.date)}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{event.location}</td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{event.applicants.length} / {event.capacity}</td>
        </tr>
    );

    const DetailView: React.FC<{ event: Event }> = ({ event }) => {
        const isFull = event.applicants.length >= event.capacity;
        const isApplied = getEventApplicationStatus(event.id);
        const applicantRatio = event.capacity > 0 ? (event.applicants.length / event.capacity) * 100 : 0;

        const handleApplyClick = () => {
            if (event.location === 'オンライン') {
                if (!window.confirm("このオンラインイベントへの参加にはチケットが1枚消費されます。よろしいですか？")) {
                    return;
                }
            }
            setApplyModalOpen(true);
        };

        return (
            <div className="bg-white rounded-lg shadow-md h-full flex flex-col">
                <img src={event.mainImageUrl} alt={event.title} className="w-full h-56 object-cover rounded-t-lg" />
                <div className="p-6 border-b flex-grow">
                    <span className="text-xs font-semibold text-primary mb-1">{event.category}</span>
                    <h3 className="text-2xl font-bold text-gray-900">{event.title}</h3>
                    <div className="space-y-2 text-sm text-gray-600 my-4">
                        <div className="flex items-center"><i className="fas fa-calendar-alt w-5 mr-2 text-gray-400"></i><span>{formatDate(event.date)}</span></div>
                        <div className="flex items-center"><i className="fas fa-map-marker-alt w-5 mr-2 text-gray-400"></i><span>{event.location}</span></div>
                    </div>
                    <div className="prose max-w-none text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: event.description.replace(/\n/g, '<br />') }}></div>
                </div>
                <div className="p-6 bg-gray-50 rounded-b-lg mt-auto">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">申込状況</span>
                        <span className="text-sm font-bold text-gray-900">{event.applicants.length} / {event.capacity} 名</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4"><div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${applicantRatio}%` }}></div></div>
                    {event.status === '募集中' && (
                        <button onClick={handleApplyClick} disabled={isFull || isApplied} className="w-full py-2 px-4 rounded-md font-medium text-white bg-primary hover:bg-blue-700 disabled:bg-gray-400">
                            {isApplied ? '申込済み' : isFull ? '満員御礼' : '申し込む'}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="fade-in">
            <div className="flex justify-between items-center mb-6">
                 <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">イベント</h2>
                    <p className="text-secondary">会員様向けの交流会や勉強会にご参加いただけます。</p>
                </div>
                 <div className="bg-gray-200 p-1 rounded-lg flex-shrink-0">
                    <button onClick={() => setViewMode('card')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'card' ? 'bg-white shadow' : ''}`}><i className="fas fa-th-large"></i></button>
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm ${viewMode === 'list' ? 'bg-white shadow' : ''}`}><i className="fas fa-list"></i></button>
                </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
                <aside className="md:w-3/5">
                    {viewMode === 'card' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {events.map(event => <EventCard key={event.id} event={event} />)}
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-md overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">イベント名</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">日時</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">場所</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">申込</th>
                            </tr></thead><tbody className="bg-white divide-y divide-gray-200">{events.map(e => <EventListItem key={e.id} event={e} />)}</tbody></table>
                        </div>
                    )}
                </aside>
                <main className="md:w-2/5 flex-shrink-0">
                    {selectedEvent ? <DetailView event={selectedEvent} /> : (
                        <div className="bg-white rounded-lg shadow-sm h-full flex items-center justify-center text-gray-500 p-8 min-h-[50vh]">
                            <div className="text-center">
                                <i className="fas fa-arrow-left text-2xl text-gray-400 mb-4"></i>
                                <p>リストからイベントを選択して詳細を表示します。</p>
                            </div>
                        </div>
                    )}
                </main>
            </div>
             {isApplyModalOpen && selectedEvent && (
                <ApplicationModal 
                    type="event"
                    item={selectedEvent}
                    onClose={() => setApplyModalOpen(false)}
                    onSubmit={handleApplySubmit}
                />
            )}
        </div>
    );
};

export default Events;
