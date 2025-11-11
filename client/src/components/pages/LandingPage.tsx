import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useClientData } from '../../ClientDataContext.tsx';
import AIChatFAB from '../AIChatFAB.tsx';

const testimonials = [
    { name: '田中 圭', company: '株式会社A&B', quote: '導入前はSNSでの些細な火種に常に怯えていましたが、スマートポリスさんのおかげで安心して事業に集中できるようになりました。特に定期的なレポーティングは、我々が気づかないリスクを可視化してくれて助かっています。', avatar: 'https://i.pravatar.cc/150?img=1' },
    { name: '鈴木 浩二', company: 'XYZ Logistics', quote: '専属の危機管理官の方が非常に頼りになります。法務・労務の知識も豊富で、単なるセキュリティ対策以上の価値を感じています。まさに「用心棒」という言葉がぴったりです。', avatar: 'https://i.pravatar.cc/150?img=3' },
    { name: '佐藤 優子', company: 'クリエイティブ・デザインズ', quote: 'フリーランスの集まりで法人成りしたばかりの我々にとって、月額費用を抑えつつ専門家のアドバイスを受けられるスタンダードプランは最適でした。コスト以上の安心感を得られています。', avatar: 'https://i.pravatar.cc/150?img=5' },
];

const faqItems = [
    { question: 'どのような業種の企業が利用していますか？', answer: 'IT、製造業、小売業、飲食業、物流業など、多岐にわたる業種の企業様にご利用いただいております。企業の規模も、スタートアップから上場企業まで様々です。' },
    { question: '契約期間に縛りはありますか？', answer: 'プランによって異なりますが、月契約と年契約をご用意しております。お客様の状況に合わせて柔軟に対応いたしますので、お気軽にご相談ください。' },
    { question: '実際に問題が発生した際の料金はどうなりますか？', answer: 'プランに応じた月額費用のほか、緊急出動など実働が発生した際には別途費用がかかる場合がございます。料金体系の詳細は、各プランのページをご確認ください。' },
    { question: '地方の企業でも対応可能ですか？', answer: 'はい、全国対応しております。オンラインでのご相談が中心となりますが、必要に応じて現地へ専門家を派遣することも可能です（別途交通費・出張費がかかります）。' },
];

const LandingPage: React.FC = () => {
    const { plans } = useClientData();
    const [openFaq, setOpenFaq] = useState<number | null>(null);
    const publicPlans = plans.filter(p => p.isPublic && p.id !== 'plan_free').sort((a,b) => a.monthlyFee - b.monthlyFee);

    return (
        <div className="bg-white font-jp">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                    <a href="#" className="flex items-center space-x-2">
                        <svg className="h-8 w-8 text-primary" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-3zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V13H5V6.3l7-3.11v10.8z"/>
                        </svg>
                        <span className="font-bold text-xl text-gray-800">スマートポリス</span>
                    </a>
                    <nav className="hidden md:flex space-x-8">
                        <a href="#about" className="text-gray-600 hover:text-primary transition-colors">スマートポリスとは？</a>
                        <a href="#services" className="text-gray-600 hover:text-primary transition-colors">サービス内容</a>
                        <a href="#plans" className="text-gray-600 hover:text-primary transition-colors">料金プラン</a>
                        <a href="#testimonials" className="text-gray-600 hover:text-primary transition-colors">お客様の声</a>
                        <a href="#faq" className="text-gray-600 hover:text-primary transition-colors">よくある質問</a>
                    </nav>
                    <div className="flex items-center space-x-4">
                        <Link to="/login" className="text-sm text-primary hover:underline">ログイン</Link>
                        <Link to="/register" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">新規登録</Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative bg-gray-800 text-white py-24 md:py-32">
                <div className="absolute inset-0">
                    <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1920&auto=format&fit=crop" alt="Team working" className="w-full h-full object-cover opacity-20" />
                </div>
                <div className="container mx-auto px-6 text-center relative z-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight md:leading-relaxed shadow-text">
                        あらゆる企業リスクに、先手を打つ。<br />
                        <span className="text-blue-300">スマートポリスが、揺るぎない安心を。</span>
                    </h1>
                    <p className="mt-6 text-lg text-gray-300 max-w-3xl mx-auto">
                        経験豊富な専門家チームが、平時の体制構築から有事の即応まで、貴社の事業継続を包括的に支援します。
                    </p>
                    <div className="mt-10 flex justify-center items-center space-x-4">
                        <a href="#plans" className="bg-primary text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg transform hover:scale-105">
                            サービス詳細・料金プラン
                        </a>
                    </div>
                </div>
            </section>
            
            {/* About, Services Sections (as before, potentially with image additions) */}
            <section id="services" className="py-20 bg-gray-50">
                <div className="container mx-auto px-6">
                     <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900">サービス内容</h2>
                        <p className="text-secondary mt-2">企業が直面する様々なリスクに対応します</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="bg-white p-6 rounded-lg shadow-sm border text-center transition-transform transform hover:-translate-y-2">
                           <img src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=800&auto=format&fit=crop" className="w-full h-32 object-cover rounded-md mb-4" alt="Customer complaint"/>
                            <h3 className="text-lg font-semibold text-gray-800">カスハラ・不当要求対応</h3>
                            <p className="text-sm text-gray-600 mt-2">悪質なクレームや不当な要求に対し、専門家が介入し対応を代行。従業員の精神的負担を軽減します。</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border text-center transition-transform transform hover:-translate-y-2">
                           <img src="https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?q=80&w=800&auto=format&fit=crop" className="w-full h-32 object-cover rounded-md mb-4" alt="Social Media"/>
                            <h3 className="text-lg font-semibold text-gray-800">SNS炎上・風評被害対策</h3>
                            <p className="text-sm text-gray-600 mt-2">ネット上の炎上やネガティブな口コミを監視・分析。鎮静化やブランドイメージ回復を支援します。</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border text-center transition-transform transform hover:-translate-y-2">
                            <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=800&auto=format&fit=crop" className="w-full h-32 object-cover rounded-md mb-4" alt="Business deal"/>
                            <h3 className="text-lg font-semibold text-gray-800">反社チェック・取引先調査</h3>
                            <p className="text-sm text-gray-600 mt-2">コンプライアンス遵守のため、取引先が反社会的勢力と関係がないかなどを徹底的に調査します。</p>
                        </div>
                        <div className="bg-white p-6 rounded-lg shadow-sm border text-center transition-transform transform hover:-translate-y-2">
                           <img src="https://images.unsplash.com/photo-1544890225-2f3faec4cd60?q=80&w=800&auto=format&fit=crop" className="w-full h-32 object-cover rounded-md mb-4" alt="Cyber security"/>
                            <h3 className="text-lg font-semibold text-gray-800">サイバーセキュリティ対策</h3>
                            <p className="text-sm text-gray-600 mt-2">不正アクセスや情報漏洩から企業を守るため、システムの脆弱性診断やセキュリティ体制の構築を支援します。</p>
                        </div>
                    </div>
                </div>
            </section>
            {/* Plans Section... */}
            <section id="plans" className="py-20">
                 <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900">料金プラン</h2>
                        <p className="text-secondary mt-2">貴社の規模とニーズに合わせたプランをお選びいただけます</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
                       {/* Free Plan */}
                        <div className="border rounded-lg p-6 bg-white shadow-md flex flex-col">
                            <h4 className="text-xl font-bold text-gray-900 mb-2">フリー</h4>
                            <p className="text-secondary mb-6 h-12">まずはお試しで</p>
                            <p className="text-4xl font-bold text-gray-900 mb-6">¥0<span className="text-lg font-normal text-gray-600">/月</span></p>
                            <ul className="space-y-3 text-gray-600 flex-grow mb-6">
                                {['お知らせの閲覧', 'セミナーへの申込', '運営へのお問い合わせ'].map((feature, index) => (
                                     <li key={index} className="flex items-start"><i className="fas fa-check-circle text-gray-400 mr-2 mt-1"></i><span>{feature}</span></li>
                                ))}
                            </ul>
                            <Link to="/register/easy" className="mt-auto block w-full text-center py-3 px-6 bg-gray-700 text-white rounded-lg hover:bg-gray-800">
                                無料で始める
                            </Link>
                        </div>
                        
                        {publicPlans.map(plan => (
                             <div key={plan.id} className={`border rounded-lg p-6 bg-white shadow-lg flex flex-col relative ${plan.id === 'plan_premium' ? 'border-2 border-primary' : ''}`}>
                                {plan.id === 'plan_premium' && <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full absolute -top-3 left-1/2 -translate-x-1/2">一番人気</span>}
                                <h4 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                                <p className="text-secondary mb-6 h-12">{plan.catchphrase}</p>
                                <p className="text-4xl font-bold text-gray-900 mb-6">
                                    {plan.monthlyFee > 0 ? `¥${plan.monthlyFee.toLocaleString()}`: '個別見積'}
                                    {plan.monthlyFee > 0 && <span className="text-lg font-normal text-gray-600">/月</span>}
                                </p>
                                <ul className="space-y-3 text-gray-600 flex-grow mb-6">
                                    {plan.features.map((feature, index) => (
                                         <li key={index} className="flex items-start"><i className="fas fa-check-circle text-green-500 mr-2 mt-1"></i><span>{feature}</span></li>
                                    ))}
                                </ul>
                                <Link to="/register/detailed" className="mt-auto block w-full text-center py-3 px-6 bg-primary text-white rounded-lg hover:bg-blue-700">
                                    このプランで登録
                                </Link>
                            </div>
                        ))}
                    </div>
                 </div>
            </section>

            {/* Testimonials Section */}
            <section id="testimonials" className="py-20 bg-gray-50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900">お客様の声</h2>
                        <p className="text-secondary mt-2">多くの企業様から信頼をいただいています</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="bg-white p-6 rounded-lg shadow-md border">
                                <p className="text-gray-600 mb-6">"{testimonial.quote}"</p>
                                <div className="flex items-center">
                                    <img src={testimonial.avatar} alt={testimonial.name} className="w-12 h-12 rounded-full mr-4" />
                                    <div>
                                        <p className="font-semibold text-gray-900">{testimonial.name}</p>
                                        <p className="text-sm text-gray-500">{testimonial.company}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-20">
                <div className="container mx-auto px-6 max-w-3xl">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900">よくある質問</h2>
                    </div>
                    <div className="space-y-4">
                        {faqItems.map((item, index) => (
                            <div key={index} className="border rounded-lg">
                                <button onClick={() => setOpenFaq(openFaq === index ? null : index)} className="w-full flex justify-between items-center p-4 text-left font-semibold text-gray-800">
                                    <span>{item.question}</span>
                                    <i className={`fas fa-chevron-down transition-transform ${openFaq === index ? 'rotate-180' : ''}`}></i>
                                </button>
                                {openFaq === index && (
                                    <div className="p-4 border-t bg-gray-50 text-gray-600">
                                        <p>{item.answer}</p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* CTA Section */}
            <section className="bg-primary py-20 text-white">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold">今すぐビジネスを守る第一歩を。</h2>
                    <p className="mt-4 max-w-2xl mx-auto">リスクは待ってくれません。まずは無料登録から、貴社の安心を確保しましょう。</p>
                    <div className="mt-8">
                        <Link to="/register" className="bg-white text-primary px-8 py-3 rounded-lg font-bold text-lg hover:bg-gray-200 transition-colors shadow-lg">
                            無料で新規登録
                        </Link>
                    </div>
                </div>
            </section>


            {/* Footer */}
            <footer className="bg-gray-800 text-white">
                <div className="container mx-auto px-6 py-8 text-center">
                    <p>&copy; 2024 スマートポリス. All rights reserved.</p>
                </div>
            </footer>
            <AIChatFAB />
        </div>
    );
};

export default LandingPage;