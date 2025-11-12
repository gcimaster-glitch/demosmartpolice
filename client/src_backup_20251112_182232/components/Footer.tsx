

import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-gray-800 text-white py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h5 className="font-semibold mb-3">お困りの時は</h5>
                        <p className="text-sm text-gray-300 mb-2">まず相談を投稿してください。</p>
                        <p className="text-sm text-gray-300">緊急の場合は電話連絡も合わせて行ってください。</p>
                    </div>
                    <div>
                        <h5 className="font-semibold mb-3">問い合わせ窓口</h5>
                        <p className="text-sm text-gray-300">平日 9:00-18:00</p>
                        <p className="text-sm text-gray-300">050-1792-5635</p>
                    </div>
                    <div>
                        <h5 className="font-semibold mb-3">ポリシー</h5>
                        <ul className="text-sm text-gray-300 space-y-1">
                            <li><a href="#" className="hover:text-white focus-ring rounded">プライバシーポリシー</a></li>
                            <li><a href="#" className="hover:text-white focus-ring rounded">利用規約</a></li>
                        </ul>
                    </div>
                    <div>
                        <h5 className="font-semibold mb-3">システム情報</h5>
                        <p className="text-sm text-gray-300">バージョン: v1.0.0</p>
                        <p className="text-sm text-gray-300">更新日: 2024-08-28</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;