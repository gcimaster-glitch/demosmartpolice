import React, { useState, useRef } from 'react';

interface ImageUploaderProps {
    imageUrl: string | null | undefined;
    onImageChange: (dataUrl: string) => void;
    onImageRemove: () => void;
    recommendedSizeText: string;
    maxWidth: number;
    maxHeight: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
    imageUrl,
    onImageChange,
    onImageRemove,
    recommendedSizeText,
    maxWidth,
    maxHeight,
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                if (width > height) {
                    if (width > maxWidth) {
                        height = Math.round((height * maxWidth) / width);
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = Math.round((width * maxHeight) / height);
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                    onImageChange(dataUrl);
                }
                setIsProcessing(false);
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const triggerFileSelect = () => fileInputRef.current?.click();

    return (
        <div className="space-y-2">
            <div className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center border overflow-hidden">
                {imageUrl ? (
                    <img src={imageUrl} alt="プレビュー" className="w-full h-full object-cover" />
                ) : (
                    <i className="fas fa-image text-3xl text-gray-300"></i>
                )}
            </div>
            <div className="space-x-2">
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={triggerFileSelect}
                    disabled={isProcessing}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-200"
                >
                    {isProcessing ? '処理中...' : 'アップロード'}
                </button>
                {imageUrl && (
                     <button
                        type="button"
                        onClick={onImageRemove}
                        className="px-3 py-2 text-sm text-red-600 hover:text-red-800"
                    >
                        削除
                    </button>
                )}
            </div>
            <p className="text-xs text-gray-500">{recommendedSizeText}</p>
        </div>
    );
};

export default ImageUploader;
