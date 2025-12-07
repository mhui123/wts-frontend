import React, { useEffect, useRef, useState, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

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

            // 업로드 완료 상태로 변경
            setFiles(prev => prev.map(f => 
                f.id === uploadedFile.id 
                    ? { ...f, status: 'success', progress: 100 }
                    : f
            ));

            console.log('Upload successful:', response.data.message);

            // 업로드 성공 시 자동으로 동기화 시작
            if (response.status === 200) {
                //await syncPortfolioItems(uploadedFile);
                
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

    return (
        <div style={{ 
            padding: '40px', 
            background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
            minHeight: '100vh',
            color: '#FFFFFF'
        }}>
            {/* 전역 동기화 상태 표시 */}
            {isGlobalSyncing && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: 'rgba(59, 130, 246, 0.9)',
                    padding: '12px 20px',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: '500',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    animation: 'pulse 2s infinite'
                }}>
                    🔄 포트폴리오 동기화 중...
                </div>
            )}

            {/* 헤더 */}
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ 
                    fontSize: '32px', 
                    fontWeight: '700', 
                    margin: '0 0 16px 0',
                    background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    📈 거래내역 업로드
                </h1>
                <p style={{ 
                    fontSize: '16px', 
                    color: '#94A3B8', 
                    margin: 0,
                    lineHeight: 1.6
                }}>
                    증권사에서 다운로드한 거래내역 PDF 파일을 업로드하여 포트폴리오를 분석하세요.
                </p>
            </div>

            {/* 업로드 영역 */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${isDragOver ? '#3B82F6' : '#374151'}`,
                    borderRadius: '16px',
                    padding: '60px 40px',
                    textAlign: 'center',
                    background: isDragOver 
                        ? 'rgba(59, 130, 246, 0.1)' 
                        : 'rgba(17, 24, 39, 0.8)',
                    transition: 'all 0.3s ease',
                    marginBottom: '32px',
                    cursor: 'pointer'
                }}
                onClick={() => fileInputRef.current?.click()}
            >
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                    {isDragOver ? '📁' : '📄'}
                </div>
                <h3 style={{ 
                    fontSize: '20px', 
                    fontWeight: '600', 
                    margin: '0 0 8px 0',
                    color: '#FFFFFF'
                }}>
                    {isDragOver ? '파일을 여기에 놓으세요' : 'PDF 파일을 드래그하거나 클릭하여 선택'}
                </h3>
                <p style={{ 
                    fontSize: '14px', 
                    color: '#9CA3AF', 
                    margin: 0 
                }}>
                    최대 50MB의 PDF 파일을 업로드할 수 있습니다.
                </p>
                
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                />
            </div>

            {/* 파일 목록 */}
            {files.length > 0 && (
                <div style={{
                    background: 'rgba(17, 24, 39, 0.8)',
                    borderRadius: '16px',
                    border: '1px solid rgba(75, 85, 99, 0.3)',
                    overflow: 'hidden'
                }}>
                    {/* 헤더 */}
                    <div style={{
                        padding: '24px',
                        borderBottom: '1px solid rgba(75, 85, 99, 0.3)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h3 style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            margin: 0,
                            color: '#FFFFFF'
                        }}>
                            📋 업로드 목록 ({files.length}개 파일)
                        </h3>
                        
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={uploadAllFiles}
                                disabled={!files.some(f => f.status === 'pending')}
                                style={{
                                    padding: '8px 16px',
                                    background: files.some(f => f.status === 'pending')
                                        ? 'linear-gradient(135deg, #3B82F6, #1D4ED8)'
                                        : 'rgba(75, 85, 99, 0.5)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: '#FFFFFF',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: files.some(f => f.status === 'pending') ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.2s'
                                }}
                            >
                                모두 업로드
                            </button>

                            {files.some(f => f.status === 'completed') && (
                                <button
                                    onClick={clearCompletedFiles}
                                    style={{
                                        padding: '8px 16px',
                                        background: 'linear-gradient(135deg, #10B981, #059669)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#FFFFFF',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    완료 파일 정리
                                </button>
                            )}
                            
                            <button
                                onClick={clearAllFiles}
                                style={{
                                    padding: '8px 16px',
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '8px',
                                    color: '#EF4444',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                모두 삭제
                            </button>
                        </div>
                    </div>

                    {/* 파일 리스트 */}
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {files.map((file) => (
                            <div
                                key={file.id}
                                style={{
                                    padding: '20px 24px',
                                    borderBottom: '1px solid rgba(75, 85, 99, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    background: file.status === 'completed' 
                                        ? 'rgba(16, 185, 129, 0.1)' 
                                        : 'transparent'
                                }}
                            >
                                {/* 파일 아이콘 */}
                                <div style={{ 
                                    fontSize: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '40px',
                                    height: '40px'
                                }}>
                                    {getStatusIcon(file.status)}
                                </div>

                                {/* 파일 정보 */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        color: '#FFFFFF',
                                        marginBottom: '4px',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        {file.file.name}
                                    </div>
                                    <div style={{
                                        fontSize: '12px',
                                        color: '#9CA3AF'
                                    }}>
                                        {formatFileSize(file.file.size)} • {getStatusText(file.status)}
                                        {file.error && (
                                            <span style={{ color: '#EF4444' }}> • {file.error}</span>
                                        )}
                                    </div>
                                </div>

                                {/* 진행률 바 */}
                                {(file.status === 'uploading' || file.status === 'syncing') && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        {/* 업로드 진행률 */}
                                        {file.status === 'uploading' && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>업로드</span>
                                                <div style={{
                                                    width: '100px',
                                                    height: '6px',
                                                    background: 'rgba(75, 85, 99, 0.5)',
                                                    borderRadius: '3px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${file.progress}%`,
                                                        height: '100%',
                                                        background: 'linear-gradient(90deg, #3B82F6, #1D4ED8)',
                                                        transition: 'width 0.3s ease'
                                                    }}></div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* 동기화 진행률 */}
                                        {file.status === 'syncing' && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <span style={{ fontSize: '12px', color: '#9CA3AF' }}>동기화</span>
                                                <div style={{
                                                    width: '100px',
                                                    height: '6px',
                                                    background: 'rgba(75, 85, 99, 0.5)',
                                                    borderRadius: '3px',
                                                    overflow: 'hidden'
                                                }}>
                                                    <div style={{
                                                        width: `${file.syncProgress || 0}%`,
                                                        height: '100%',
                                                        background: 'linear-gradient(90deg, #10B981, #059669)',
                                                        transition: 'width 0.3s ease'
                                                    }}></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* 액션 버튼 */}
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    {file.status === 'pending' && (
                                        <button
                                            onClick={() => uploadFile(file)}
                                            style={{
                                                padding: '6px 12px',
                                                background: 'linear-gradient(135deg, #10B981, #059669)',
                                                border: 'none',
                                                borderRadius: '6px',
                                                color: '#FFFFFF',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            업로드
                                        </button>
                                    )}
                                    
                                    {file.status !== 'uploading' && file.status !== 'syncing' && (
                                        <button
                                            onClick={() => removeFile(file.id)}
                                            style={{
                                                padding: '6px 12px',
                                                background: 'rgba(239, 68, 68, 0.2)',
                                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                                borderRadius: '6px',
                                                color: '#EF4444',
                                                fontSize: '12px',
                                                fontWeight: '500',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
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
            <div style={{
                marginTop: '40px',
                padding: '24px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px'
            }}>
                <h4 style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#3B82F6',
                    margin: '0 0 12px 0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    💡 업로드 안내사항
                </h4>
                <ul style={{
                    fontSize: '14px',
                    color: '#CBD5E1',
                    lineHeight: 1.6,
                    margin: 0,
                    paddingLeft: '20px'
                }}>
                    <li>PDF 형식의 거래내역서만 업로드 가능합니다.</li>
                    <li>파일 크기는 최대 50MB까지 지원됩니다.</li>
                    <li>업로드 완료 후 자동으로 포트폴리오 동기화가 진행됩니다.</li>
                    <li>동기화 완료된 파일은 3초 후 자동으로 제거됩니다.</li>
                    <li>처리 완료 후 대시보드에서 분석 결과를 확인할 수 있습니다.</li>
                </ul>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
};

export default FileUpload;