import React from 'react';
import { Outlet, useLocation, Link, useParams, useNavigate } from 'react-router-dom';
import MessagesList from './MessagesListIntegrated.tsx';

const MessagesLayout: React.FC = () => {
    const location = useLocation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const isDetailView = !!id || location.pathname.endsWith('/new');

    const getBreadcrumb = () => {
        return (
            <>
                <Link to="/app" className="hover:text-primary">ホーム</Link>
                <span className="mx-2">＞</span>
                <Link to="/app/messages" className={`hover:text-primary ${!isDetailView ? 'text-gray-900' : ''}`}>相談</Link>

                {isDetailView && (
                    <>
                        <span className="mx-2">＞</span>
                        {location.pathname.endsWith('/new') ? (
                            <span className="text-gray-900">新規相談</span>
                        ) : (
                            <span className="text-gray-900">相談詳細 (ID: {id})</span>
                        )}
                    </>
                )}
            </>
        );
    };

    return (
        <div className="fade-in">
             <nav className="hidden md:flex items-center text-sm text-secondary mb-4" aria-label="パンくずナビ">
                {getBreadcrumb()}
            </nav>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">相談</h2>
                    <p className="text-secondary">お困りごとの相談や質問にご利用ください</p>
                </div>
                <div className="flex items-center space-x-4">
                    <button onClick={() => navigate('/app/ticket-history')} className="bg-white text-primary border border-primary px-6 py-3 rounded-lg hover:bg-blue-50 transition-colors focus-ring">
                        <i className="fas fa-history mr-2"></i>
                        チケット管理
                    </button>
                    <button onClick={() => navigate('/app/messages/new')} className="bg-primary text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors focus-ring">
                        <i className="fas fa-edit mr-2"></i>
                        新規相談
                    </button>
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6">
                <aside className={`md:w-2/5 lg:w-1/3 flex-shrink-0 ${isDetailView ? 'hidden md:block' : 'block w-full'}`}>
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden h-full">
                       <MessagesList />
                    </div>
                </aside>
                <main className={`flex-grow ${isDetailView ? 'block w-full' : 'hidden md:block'}`}>
                     {isDetailView ? (
                        <Outlet />
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm h-full flex items-center justify-center text-gray-500 p-8">
                            <div className="text-center">
                                <i className="fas fa-comments text-4xl text-gray-300 mb-4"></i>
                                <h3 className="text-lg font-medium text-gray-700">相談を選択してください</h3>
                                <p className="mt-1 text-sm text-gray-500">左のリストから相談を選択して詳細を表示するか、<br/>新しい相談を開始してください。</p>
                                <div className="mt-6">
                                    <button
                                        onClick={() => navigate('/app/messages/new')}
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                                    >
                                        <i className="fas fa-edit -ml-1 mr-2"></i>
                                        新規相談
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default MessagesLayout;