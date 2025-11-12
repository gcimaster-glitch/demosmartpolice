import React, { useState, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    maxSize: number; // in bytes
    fileName: string | null;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, maxSize, fileName }) => {
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
        setError(null);
        if (rejectedFiles.length > 0) {
            setError(`ファイルサイズが大きすぎます。最大: ${formatBytes(maxSize)}`);
            return;
        }
        if (acceptedFiles.length > 0) {
            onFileSelect(acceptedFiles[0]);
        }
    }, [onFileSelect, maxSize]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        maxSize,
        multiple: false,
    });

    return (
        <div>
            <div {...getRootProps()} className={`p-6 border-2 border-dashed rounded-lg cursor-pointer text-center transition-colors ${isDragActive ? 'border-primary bg-blue-50' : 'border-gray-300 hover:border-primary'}`}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center justify-center">
                    <i className="fas fa-cloud-upload-alt text-4xl text-gray-400 mb-2"></i>
                    {fileName ? (
                        <div>
                            <p className="font-semibold text-gray-800">{fileName}</p>
                            <p className="text-sm text-gray-500 mt-1">ファイルをドラッグ＆ドロップするか、クリックして変更</p>
                        </div>
                    ) : (
                        <p className="text-gray-500">ここにファイルをドラッグ＆ドロップするか、クリックして選択</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">最大ファイルサイズ: {formatBytes(maxSize)}</p>
                </div>
            </div>
            {error && <p className="text-xs text-danger mt-1">{error}</p>}
        </div>
    );
};

export default FileUploader;
