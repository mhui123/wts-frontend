import React, { useEffect, useRef, useState, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import LoginRequired from '../components/LoginRequired';
import '../styles/components/FileUpload.css';

interface UploadedFile {
    file: File;
    id: string;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'syncing' | 'completed' | 'error';
    error?: string;
    syncProgress?: number; // 동기화 진행률 추가
}

const FileUpload: React.FC = () => {
    const { me } = useAuth();
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isGlobalSyncing, setIsGlobalSyncing] = useState(false); // 전역 동기화 상태
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 파일 검증
    const validateFile = (file: File): string | null => {
        // PDF 파일만 허용
        if (file.type !== 'application/pdf') {
            return 'PDF 파일만 업로드 가능합니다.';
        }
        
        // 파일 크기 제한 (50MB)
        if (file.size > 50 * 1024 * 1024) {
            return '파일 크기는 50MB를 초과할 수 없습니다.';
        }
        
        return null;
    };

    // 포트폴리오 동기화 함수
    const syncPortfolioItems = async (uploadedFile: UploadedFile) => {
        if (!me?.id) return;

        // 동기화 상태로 변경
        setFiles(prev => prev.map(f => 
            f.id === uploadedFile.id 
                ? { ...f, status: 'syncing', syncProgress: 0 }
                : f
        ));

        setIsGlobalSyncing(true);

        try {
            // 가짜 진행률 시뮬레이션 (실제 API는 진행률을 제공하지 않을 수 있음)
            const progressInterval = setInterval(() => {
                setFiles(prev => prev.map(f => {
                    if (f.id === uploadedFile.id && f.status === 'syncing') {
                        const currentProgress = f.syncProgress || 0;
                        const newProgress = Math.min(currentProgress + Math.random() * 15, 85);
                        return { ...f, syncProgress: newProgress };
                    }
                    return f;
                }));
            }, 500);

            // 실제 동기화 API 호출
            const syncResponse = await api.get('/syncLatestPortfolioItems', { 
                params: { userId: me.id } 
            });

            // 진행률 완료
            clearInterval(progressInterval);
            
            if (syncResponse.status === 200) {
                // 동기화 완료 상태로 변경
                setFiles(prev => prev.map(f => 
                    f.id === uploadedFile.id 
                        ? { ...f, status: 'completed', syncProgress: 100 }
                        : f
                ));

                console.log('Portfolio sync successful:', syncResponse.data);

                // 3초 후 파일 제거 (사용자가 완료 상태를 볼 수 있도록)
                setTimeout(() => {
                    setFiles(prev => prev.filter(f => f.id !== uploadedFile.id));
                }, 3000);
            } else {
                throw new Error('동기화에 실패했습니다.');
            }

        } catch (error: any) {
            console.error('Portfolio sync failed:', error);
            
            setFiles(prev => prev.map(f => 
                f.id === uploadedFile.id 
                    ? { 
                        ...f, 
                        status: 'error', 
                        error: error.response?.data?.message || '포트폴리오 동기화에 실패했습니다.' 
                    }
                    : f
            ));
        } finally {
            setIsGlobalSyncing(false);
        }
    };

    // 파일 추가
    const addFiles = useCallback((newFiles: FileList | File[]) => {
        const validFiles: UploadedFile[] = [];
        
        Array.from(newFiles).forEach((file) => {
            const error = validateFile(file);
            
            // 중복 파일 체크
            const isDuplicate = files.some(f => 
                f.file.name === file.name && 
                f.file.size === file.size && 
                f.file.lastModified === file.lastModified
            );
            
            if (isDuplicate) {
                return;
            }
            
            validFiles.push({
                file,
                id: `${file.name}-${Date.now()}-${Math.random()}`,
                progress: 0,
                status: error ? 'error' : 'pending',
                error: error || undefined,
                syncProgress: 0
            });
        });
        
        setFiles(prev => [...prev, ...validFiles]);
    }, [files]);

    // 파일 업로드
    const uploadFile = async (uploadedFile: UploadedFile) => {
        if (!me?.id) {
            setFiles(prev => prev.map(f => 
                f.id === uploadedFile.id 
                    ? { ...f, status: 'error', error: '로그인이 필요합니다.' }
                    : f
            ));
            return;
        }

        setFiles(prev => prev.map(f => 
            f.id === uploadedFile.id 
                ? { ...f, status: 'uploading', progress: 0 }
                : f
        ));
        
        try {
            const formData = new FormData();
            formData.append('file', uploadedFile.file);
            formData.append('userId', me.id.toString());

            const response = await api.post('/python/uploadTradeHistory', formData, {
                // headers: {
                //     'Content-Type': 'multipart/form-data',
                // },
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total 
                        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        : 0;
                    
                    setFiles(prev => prev.map(f => 
                        f.id === uploadedFile.id 
                            ? { ...f, progress }
                            : f
                    ));
                }
            });
            console.log(response.data.message);

            // 업로드 성공 시 자동으로 동기화 시작
            if (response.data.success) {
                // await syncPortfolioItems(uploadedFile);
                // 업로드 완료 상태로 변경
                setFiles(prev => prev.map(f => 
                    f.id === uploadedFile.id 
                        ? { ...f, status: 'success', progress: 100 }
                        : f
                ));
                
                // 3초 후 파일 제거 (사용자가 완료 상태를 볼 수 있도록)
                setTimeout(() => {
                    setFiles(prev => prev.filter(f => f.id !== uploadedFile.id));
                }, 3000);
            } else {
                setFiles(prev => prev.map(f => 
                    f.id === uploadedFile.id 
                        ? { 
                            ...f, 
                            status: 'error', 
                            error: response.data.message || '업로드에 실패했습니다.' 
                        }
                        : f
                ));

                // 3초 후 파일 제거 (사용자가 완료 상태를 볼 수 있도록)
                setTimeout(() => {
                    setFiles(prev => prev.filter(f => f.id !== uploadedFile.id));
                }, 3000);
            }

        } catch (error: any) {
            console.error('Upload failed:', error);
            
            setFiles(prev => prev.map(f => 
                f.id === uploadedFile.id 
                    ? { 
                        ...f, 
                        status: 'error', 
                        error: error.response?.data?.message || '업로드에 실패했습니다.' 
                    }
                    : f
            ));
        }
    };

    // 모든 파일 업로드
    const uploadAllFiles = () => {
        files
            .filter(f => f.status === 'pending')
            .forEach(uploadFile);
    };

    // 파일 제거
    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    // 모든 파일 제거
    const clearAllFiles = () => {
        setFiles([]);
    };

    // 완료된 파일들 일괄 제거
    const clearCompletedFiles = () => {
        setFiles(prev => prev.filter(f => f.status !== 'completed'));
    };

    // 드래그 앤 드롭 핸들러
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            addFiles(droppedFiles);
        }
    }, [addFiles]);

    // 파일 선택 핸들러
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files);
        }
        e.target.value = '';
    };

    // 파일 크기 포맷
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getStatusIcon = (status: UploadedFile['status']) => {
        switch (status) {
            case 'pending': return '📄';
            case 'uploading': return '⏳';
            case 'success': return '✅';
            case 'syncing': return '🔄';
            case 'completed': return '🎉';
            case 'error': return '❌';
            default: return '📄';
        }
    };

    const getStatusText = (status: UploadedFile['status']) => {
        switch (status) {
            case 'pending': return '대기 중';
            case 'uploading': return '업로드 중';
            case 'success': return '업로드 완료';
            case 'syncing': return '동기화 중';
            case 'completed': return '처리 완료';
            case 'error': return '실패';
            default: return '알 수 없음';
        }
    };
    if(!me) {
        return <LoginRequired />;
    }
    return (
        <div className="file-upload-container">
            {/* 전역 동기화 상태 표시 */}
            {isGlobalSyncing && (
                <div className="file-upload-sync-notification">
                    🔄 포트폴리오 동기화 중...
                </div>
            )}

            {/* 헤더 */}
            <div className="file-upload-header">
                <h1 className="file-upload-title">
                    📈 거래내역 업로드
                </h1>
                <p className="file-upload-subtitle">
                    증권사에서 다운로드한 거래내역 PDF 파일을 업로드하여 포트폴리오를 분석하세요.
                </p>
            </div>

            {/* 업로드 영역 */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`file-upload-dropzone ${isDragOver ? 'drag-over' : 'default'}`}
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="file-upload-dropzone-icon">
                    {isDragOver ? '📁' : '📄'}
                </div>
                <h3 className="file-upload-dropzone-title">
                    {isDragOver ? '파일을 여기에 놓으세요' : 'PDF 파일을 드래그하거나 클릭하여 선택'}
                </h3>
                <p className="file-upload-dropzone-description">
                    최대 50MB의 PDF 파일을 업로드할 수 있습니다.
                </p>
                
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="file-upload-hidden-input"
                />
            </div>

            {/* 파일 목록 */}
            {files.length > 0 && (
                <div className="file-upload-list-container">
                    {/* 헤더 */}
                    <div className="file-upload-list-header">
                        <h3 className="file-upload-list-title">
                            📋 업로드 목록 ({files.length}개 파일)
                        </h3>
                        
                        <div className="file-upload-list-actions">
                            <button
                                onClick={uploadAllFiles}
                                disabled={!files.some(f => f.status === 'pending')}
                                className={`file-upload-btn file-upload-btn-upload ${
                                    !files.some(f => f.status === 'pending') ? 'disabled' : ''
                                }`}
                            >
                                모두 업로드
                            </button>

                            {files.some(f => f.status === 'completed') && (
                                <button
                                    onClick={clearCompletedFiles}
                                    className="file-upload-btn file-upload-btn-clear-completed"
                                >
                                    완료 파일 정리
                                </button>
                            )}
                            
                            <button
                                onClick={clearAllFiles}
                                className="file-upload-btn file-upload-btn-clear-all"
                            >
                                모두 삭제
                            </button>
                        </div>
                    </div>

                    {/* 파일 리스트 */}
                    <div className="file-upload-list">
                        {files.map((file) => (
                            <div
                                key={file.id}
                                className={`file-upload-item ${file.status === 'completed' ? 'completed' : ''}`}
                            >
                                {/* 파일 아이콘 */}
                                <div className="file-upload-item-icon">
                                    {getStatusIcon(file.status)}
                                </div>

                                {/* 파일 정보 */}
                                <div className="file-upload-item-info">
                                    <div className="file-upload-item-name">
                                        {file.file.name}
                                    </div>
                                    <div className="file-upload-item-details">
                                        {formatFileSize(file.file.size)} • {getStatusText(file.status)}
                                        {file.error && (
                                            <span className="file-upload-item-error"> • {file.error}</span>
                                        )}
                                    </div>
                                </div>

                                {/* 진행률 바 */}
                                {(file.status === 'uploading' || file.status === 'syncing') && (
                                    <div className="file-upload-progress-container">
                                        {/* 업로드 진행률 */}
                                        {file.status === 'uploading' && (
                                            <div className="file-upload-progress-row">
                                                <span className="file-upload-progress-label">업로드</span>
                                                <div className="file-upload-progress-bar">
                                                    <div 
                                                        className="file-upload-progress-fill upload"
                                                        style={{ width: `${file.progress}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* 동기화 진행률 */}
                                        {file.status === 'syncing' && (
                                            <div className="file-upload-progress-row">
                                                <span className="file-upload-progress-label">동기화</span>
                                                <div className="file-upload-progress-bar">
                                                    <div 
                                                        className="file-upload-progress-fill sync"
                                                        style={{ width: `${file.syncProgress || 0}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 액션 버튼 */}
                                <div className="file-upload-item-actions">
                                    {file.status === 'pending' && (
                                        <button
                                            onClick={() => uploadFile(file)}
                                            className="file-upload-action-btn file-upload-action-btn-upload"
                                        >
                                            업로드
                                        </button>
                                    )}
                                    
                                    {file.status !== 'uploading' && file.status !== 'syncing' && (
                                        <button
                                            onClick={() => removeFile(file.id)}
                                            className="file-upload-action-btn file-upload-action-btn-remove"
                                        >
                                            {file.status === 'completed' ? '완료' : '삭제'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 안내 사항 */}
            <div className="file-upload-guide">
                <h4 className="file-upload-guide-title">
                    💡 업로드 안내사항
                </h4>
                <ul className="file-upload-guide-list">
                    <li>PDF 형식의 거래내역서만 업로드 가능합니다.</li>
                    <li>파일 크기는 최대 50MB까지 지원됩니다.</li>
                    <li>업로드 완료 후 자동으로 포트폴리오 동기화가 진행됩니다.</li>
                    <li>동기화 완료된 파일은 3초 후 자동으로 제거됩니다.</li>
                    <li>처리 완료 후 대시보드에서 분석 결과를 확인할 수 있습니다.</li>
                </ul>
            </div>
        </div>
    );

};

export default FileUpload;