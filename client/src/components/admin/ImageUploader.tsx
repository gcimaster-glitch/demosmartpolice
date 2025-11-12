import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface ImageUploaderProps {
    imageUrl: string | null | undefined;
    onImageChange: (dataUrl: string) => void;
    onImageRemove: () => void;
    recommendedSizeText: string;
    maxWidth: number;
    maxHeight: number;
    maxSizeInMB: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
    imageUrl,
    onImageChange,
    onImageRemove,
    recommendedSizeText,
    maxWidth,
    maxHeight,
    maxSizeInMB,
}) => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
        setError('');
        if (fileRejections.length > 0) {
            setError(`ファイルサイズが大きすぎます (最大${maxSizeInMB}MB)。`);
            return;
        }
        const file = acceptedFiles[0];
        if (!file) return;

        setIsProcessing(true);
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let { width, height } = img;

                const ratio = width / height;

                if (width > maxWidth) {
                    width = maxWidth;
                    height = width / ratio;
                }
                if (height > maxHeight) {
                    height = maxHeight;
                    width = height * ratio;
                }
                
                // Final check to ensure it fits both dimensions
                if (width > maxWidth) {
                    width = maxWidth;
                    height = width / ratio;
                }
                 if (height > maxHeight) {
                    height = maxHeight;
                    width = height * ratio;
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
    }, [maxSizeInMB, maxWidth, maxHeight, onImageChange]);
    
     const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        maxSize: maxSizeInMB * 1024 * 1024,
        accept: { 'image/*': ['.jpeg', '.png', '.gif', '.jpg'] },
        multiple: false,
    });

    const triggerFileSelect = () => fileInputRef.current?.click();

    return (
        <div className="space-y-2">
            <div 
                {...getRootProps()}
                className="w-full h-32 bg-gray-100 rounded-md flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary cursor-pointer transition-colors overflow-hidden"
            >
                 <input {...getInputProps()} />
                {imageUrl ? (
                    <img src={imageUrl} alt="プレビュー" className="w-full h-full object-contain" />
                ) : (
                    <div className="text-center text-gray-500">
                        <i className="fas fa-image text-3xl"></i>
                        <p className="text-xs mt-1">クリック or ドラッグ&ドロップ</p>
                    </div>
                )}
            </div>
            <div className="space-x-2">
                <button
                    type="button"
                    onClick={triggerFileSelect}
                    disabled={isProcessing}
                    className="px-3 py-1 border border-gray-300 rounded-md text-xs text-gray-700 bg-white hover:bg-gray-50 disabled:bg-gray-200"
                >
                    {isProcessing ? '処理中...' : 'ファイルを選択'}
                </button>
                {imageUrl && (
                     <button
                        type="button"
                        onClick={onImageRemove}
                        className="px-3 py-1 text-xs text-red-600 hover:text-red-800"
                    >
                        削除
                    </button>
                )}
            </div>
            <p className="text-xs text-gray-500">{recommendedSizeText}</p>
            {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
    );
};

export default ImageUploader;