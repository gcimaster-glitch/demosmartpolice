import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useClientData } from '../../ClientDataContext.tsx';
import AIChatFAB from '../AIChatFAB.tsx';

const testimonials = [
    { name: '田中 圭', company: '株式会社A&B', quote: '導入前はSNSでの些細な火種に常に怯えていましたが、スマートポリスさんのおかげで安心して事業に集中できるようになりました。特に定期的なレポーティングは、我々が気づかないリスクを可視化してくれて助かっています。', avatar: 'https://i.pravatar.cc/150?u=tanaka' },
    { name: '鈴木 浩二', company: 'XYZ Logistics', quote: '専属の危機管理官の方が非常に頼りになります。法務・労務の知識も豊富で、単なるセキュリティ対策以上の価値を感じています。まさに「用心棒」という言葉がぴったりです。', avatar: 'https://i.pravatar.cc/150?u=suzuki' },
    { name: '佐藤 優子', company: 'クリエイティブ・デザインズ', quote: 'フリーランスの集まりで法人成りしたばかりの我々にとって、月額費用を抑えつつ専門家のアドバイスを受けられるスタンダードプランは最適でした。コスト以上の安心感を得られています。', avatar: 'https://i.pravatar.cc/150?u=sato' },
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

    const navLinks = [
        { href: "#about", label: "スマートポリスとは" },
        { href: "#services", label: "対応領域" },
        { href: "#strengths", label: "私たちの強み" },
        { href: "#process", label: "ご利用の流れ" },
        { href: "#plans", label: "料金プラン" },
        { href: "#testimonials", label: "お客様の声" },
        { href: "#faq", label: "よくある質問" },
    ];
    
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
                    <nav className="hidden lg:flex space-x-6">
                        {navLinks.map(link => (
                             <a key={link.href} href={link.href} className="text-gray-600 hover:text-primary transition-colors text-sm">{link.label}</a>
                        ))}
                    </nav>
                    <div className="flex items-center space-x-4">
                        <Link to="/login" className="text-sm text-primary hover:underline">ログイン</Link>
                        <Link to="/register" className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">新規登録</Link>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative bg-gray-800 text-white py-24 md:py-32">
                <div className="absolute inset-0">
                    <img src="https://images.unsplash.com/photo-1558021211-6514f3b140f5?q=80&w=1974&auto=format&fit=crop" alt="Team working" className="w-full h-full object-cover opacity-20" />
                </div>
                <div className="container mx-auto px-6 text-center relative z-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight md:leading-relaxed">
                        あらゆる企業リスクに、先手を打つ。<br />
                        <span className="text-blue-300">スマートポリスが、揺るぎない安心を。</span>
                    </h1>
                    <p className="mt-6 text-lg text-gray-300 max-w-3xl mx-auto">
                        “事件未満”のグレーゾーンで迅速に介入し、貴社の事業継続を包括的に支援します。
                    </p>
                    <div className="mt-10 flex justify-center items-center space-x-4">
                        <a href="#plans" className="bg-primary text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors shadow-lg transform hover:scale-105">
                            料金プランを見る
                        </a>
                         <Link to="/register" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-bold text-lg hover:bg-white hover:text-primary transition-colors shadow-lg transform hover:scale-105">
                            まずは無料登録
                        </Link>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section id="about" className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                             <h2 className="text-3xl font-bold text-gray-900 mb-4">スマートポリスとは？</h2>
                             <p className="text-gray-600 leading-relaxed mb-4">
                                日本で初めて<span className="font-bold text-primary">元警察官を中心とした危機管理・リスクマネジメント専門チーム</span>による、会員制トラブル相談・解決支援サービスです。警察・検察OB、弁護士、セキュリティ専門家など、各分野のプロフェッショナルが集結しています。
                            </p>
                             <p className="text-gray-600 leading-relaxed">
                                「事件にはなっていないが危険」「報復が怖くて警察に相談できない」——こうした“事件未満”のグレーゾーンで迅速かつ適切に介入し、事態を鎮静化・解決へ導きます。
                            </p>
                        </div>
                        <div>
                            <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop" alt="Professionals discussing" className="rounded-lg shadow-xl" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="py-20 bg-gray-50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900">対応可能なトラブル領域</h2>
                        <p className="text-secondary mt-2">企業から個人まで、日常に潜む様々なリスクに対応します。</p>
                    </div>
                     <div className="grid md:grid-cols-2 gap-10">
                        <div>
                            <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center"><i className="fas fa-building text-blue-500 mr-3"></i><span className="text-gray-800">企業向け</span></h3>
                            <div className="space-y-4">
                                {['社内不正・情報漏洩', 'ハラスメント問題', '反社会的勢力からの接触', '経営層・従業員の身辺警護', 'SNS炎上・風評被害対策', 'サイバーセキュリティ対策'].map(item => (
                                    <div key={item} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500 text-gray-800">{item}</div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center"><i className="fas fa-user-shield text-green-500 mr-3"></i><span className="text-gray-800">個人・団体向け</span></h3>
                            <div className="space-y-4">
                                {['ストーカー・DV・近隣トラブル', 'ネット誹謗中傷', '家族間トラブル・財産管理', '詐欺被害・金銭トラブル', '反社チェック・取引先調査', '旅行・イベント時の安全対策'].map(item => (
                                    <div key={item} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500 text-gray-800">{item}</div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Strengths Section */}
            <section id="strengths" className="py-20 bg-white">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900">スマートポリスの強み</h2>
                        <p className="text-secondary mt-2">経験豊富な専門家チームだからこそ提供できる価値があります。</p>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: 'fa-user-shield', title: '元警察官の現場力', text: '捜査現場で培った観察力・交渉力で、事件化前の状況でも正確に事態を把握します。' },
                            { icon: 'fa-sitemap', title: 'ワンストップ対応', text: '相談から調査、交渉、防護、弁護士連携まで、1つの窓口で完結させます。' },
                            { icon: 'fa-eye', title: '防諜・予防のプロ', text: '危機が顕在化する前の兆候を掴み、被害に遭う前に予防措置を講じます。' },
                            { icon: 'fa-clock', title: '24時間対応体制', text: '突発的なトラブルにも即応。緊急度の高い案件は数時間以内に現場派遣が可能です。' }
                        ].map(item => (
                            <div key={item.title} className="bg-gray-50 p-6 rounded-lg text-center transition-transform transform hover:-translate-y-2 border">
                                <div className="text-primary text-4xl mb-4"><i className={`fas ${item.icon}`}></i></div>
                                <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                                <p className="text-sm text-gray-600 mt-2">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            
            {/* Process Section */}
            <section id="process" className="py-20 bg-gray-50">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-gray-900">ご利用の流れ</h2>
                        <p className="text-secondary mt-2">シンプルかつ迅速なプロセスで問題解決をサポートします。</p>
                    </div>
                    <div className="relative">
                        <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gray-300"></div>
                        <div className="relative grid grid-cols-1 md:grid-cols-5 gap-8">
                            {[
                                { num: 1, title: '初回ヒアリング', icon: 'fa-comments' },
                                { num: 2, title: '状況分析と方針提示', icon: 'fa-search' },
                                { num: 3, title: '契約締結', icon: 'fa-file-signature' },
                                { num: 4, title: '調査・対策実行', icon: 'fa-cogs' },
                                { num: 5, title: '再発防止策', icon: 'fa-shield-alt' }
                            ].map(step => (
                                <div key={step.num} className="text-center">
                                    <div className="relative">
                                        <div className="w-16 h-16 mx-auto bg-primary text-white rounded-full flex items-center justify-center text-2xl z-10 relative">
                                            <i className={`fas ${step.icon}`}></i>
                                        </div>
                                    </div>
                                    <h3 className="mt-4 font-semibold text-gray-800">{step.num}. {step.title}</h3>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>


            {/* Plans Section */}
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
                                     <li key={index} className="flex items-start"><i className="fas fa-check-circle text-gray-400 mr-2 mt-1"></i><span className="text-gray-600">{feature}</span></li>
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
                                         <li key={index} className="flex items-start"><i className="fas fa-check-circle text-green-500 mr-2 mt-1"></i><span className="text-gray-600">{feature}</span></li>
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
                                    <span className="text-gray-800">{item.question}</span>
                                    <i className={`fas fa-chevron-down transition-transform text-gray-500 ${openFaq === index ? 'rotate-180' : ''}`}></i>
                                </button>
                                {openFaq === index && (
                                    <div className="p-4 border-t bg-gray-50 text-gray-600">
                                        <p className="text-gray-600">{item.answer}</p>
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
                    <h2 className="text-3xl font-bold text-white">「事件にならない社会」を目指して。</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-gray-200">日常に潜むリスクを可視化し、予防の文化を根付かせます。企業や個人が本来の活動に専念できる安心な環境を、スマートポリスが提供します。</p>
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
                    <p className="text-gray-300">&copy; 2024 スマートポリス (運営: 一般社団法人 日本危機管理機構). All rights reserved.</p>
                </div>
            </footer>
            <AIChatFAB />
        </div>
    );
};

export default LandingPage;