
import React from 'react';

interface PlaceholderPageProps {
    title: string;
}

const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
    return (
        <div className="fade-in text-center py-20">
            <div className="bg-white p-12 rounded-lg shadow-md inline-block">
                <i className="fas fa-tools text-5xl text-gray-300 mb-4"></i>
                <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
                <p className="text-gray-500">このページは現在準備中です。</p>
            </div>
        </div>
    );
};

export default PlaceholderPage;
