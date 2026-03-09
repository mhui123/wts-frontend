import React, { useEffect, useRef, useState, useCallback } from 'react';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import LoginRequired from '../components/LoginRequired';
import '../styles/components/FileUpload.css';


type BrokerType = 'kiwoom' | 'toss';

interface BrokerInfo {
    id: BrokerType;
    name: string;
    description: string;
    icon: string;
    supportedFormats: string[];
    maxFileSize: number;
}

interface UploadedFile {
    file: File;
    id: string;
    progress: number;
    status: 'pending' | 'uploading' | 'success' | 'syncing' | 'completed' | 'error';
    error?: string;
    syncProgress?: number; // 동기화 진행률 추가
}

const BROKER_INFO: Record<BrokerType, BrokerInfo> = {
    kiwoom: {
        id: 'kiwoom',
        name: '키움증권',
        description: '키움증권 영웅문 거래내역서 (CSV)',
        icon: '🏢',
        supportedFormats: ['.csv'],
        maxFileSize: 50 * 1024 * 1024 // 50MB
    },
    toss: {
        id: 'toss',
        name: '토스증권',
        description: '토스증권 거래내역서 (PDF)',
        icon: '💳',
        supportedFormats: ['.pdf'],
        maxFileSize: 50 * 1024 * 1024 // 50MB
    }
};


const FileUpload: React.FC = () => {
    const { me } = useAuth();
    const [selectedBroker, setSelectedBroker] = useState<BrokerType | null>(null);
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isGlobalSyncing, setIsGlobalSyncing] = useState(false); // 전역 동기화 상태
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 파일 검증
    const validateFile = (file: File): string | null => {
        if (!selectedBroker) {
            return '증권사를 먼저 선택해주세요.';
        }
        const brokerInfo = BROKER_INFO[selectedBroker];

        // 파일 형식 검증
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!brokerInfo.supportedFormats.includes(fileExtension)) {
            return `${brokerInfo.name}는 ${brokerInfo.supportedFormats.join(', ')} 파일만 지원합니다.`;
        }
        
        // 파일 크기 제한
        if (file.size > brokerInfo.maxFileSize) {
            return `파일 크기는 ${Math.round(brokerInfo.maxFileSize / (1024 * 1024))}MB를 초과할 수 없습니다.`;
        }
        
        return null;
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
    }, [files, selectedBroker]);

    // 증권사별 업로드 엔드포인트 결정
    const getUploadEndpoint = (brokerType: BrokerType, isMulti: boolean = false): string => {
        if (isMulti) {
            return '/python/uploadMultiplesTradeHistory'; // 다중 파일 업로드 엔드포인트
        }
        switch (brokerType) {
            case 'kiwoom':
                return '/python/uploadKiwoomTradeHistory';
            case 'toss':
                return '/python/uploadTradeHistory'; // 토스증권 전용 엔드포인트
            default:
                return '/python/uploadTradeHistory';
        }
    };

    // 서버 @RequestPart("brokerType") BrokerType 파싱과 호환되도록 브로커 타입을 JSON 파트로 직렬화한다.
    const appendBrokerTypePart = (formData: FormData, brokerType: BrokerType) => {
        const normalizedBrokerType = brokerType.toUpperCase();
        const brokerTypePart = new Blob([JSON.stringify(normalizedBrokerType)], {
            type: 'application/json',
        });
        formData.append('brokerType', brokerTypePart);
    };

    // 파일 업로드
    const uploadFile = async (uploadedFile: UploadedFile) => {
        if (!me?.id || !selectedBroker) {
            setFiles(prev => prev.map(f => 
                f.id === uploadedFile.id 
                    ? { ...f, status: 'error', error: '로그인 및 증권사 선택이 필요합니다.' }
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
            appendBrokerTypePart(formData, selectedBroker);
            
            const endpoint = getUploadEndpoint(selectedBroker);
            const response = await api.post(endpoint, formData, {
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
            console.log(`${BROKER_INFO[selectedBroker].name} ${uploadedFile.file.name} 업로드 결과:`, response.data.message);

            if (response.data.success) {
                setFiles(prev => prev.map(f => 
                    f.id === uploadedFile.id 
                        ? { ...f, status: 'success', progress: 100 }
                        : f
                ));
                
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
    const uploadAllFiles = async () => {
        if (!me?.id || !selectedBroker) {
            setFiles(prev => prev.map(f => 
                f.status === 'pending'
                    ? { ...f, status: 'error', error: '로그인 및 증권사 선택이 필요합니다.' }
                    : f
            ));
            return;
        }

        const pendingFiles = files.filter(f => f.status === 'pending');
        if (pendingFiles.length === 0) return;

        setFiles(prev => prev.map(f => 
            f.status === 'pending'
                ? { ...f, status: 'uploading', progress: 0 }
                : f
        ));

        try {
            const formData = new FormData();
            pendingFiles.forEach(f => formData.append('files', f.file)); // 서버: @RequestPart("files")
            formData.append('userId', me.id.toString());
            appendBrokerTypePart(formData, selectedBroker);

            const endpoint = getUploadEndpoint(selectedBroker, true);
            const response = await api.post(endpoint, formData, {
                onUploadProgress: (progressEvent) => {
                    const progress = progressEvent.total 
                        ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
                        : 0;

                    setFiles(prev => prev.map(f => 
                        pendingFiles.some(p => p.id === f.id)
                            ? { ...f, progress }
                            : f
                    ));
                }
            });

            if (response.data.success) {
                setFiles(prev => prev.map(f => 
                    pendingFiles.some(p => p.id === f.id)
                        ? { ...f, status: 'success', progress: 100 }
                        : f
                ));
                
                setTimeout(() => {
                    setFiles(prev => prev.filter(f => !pendingFiles.some(p => p.id === f.id)));
                }, 3000);
            } else {
                setFiles(prev => prev.map(f => 
                    pendingFiles.some(p => p.id === f.id)
                        ? { ...f, status: 'error', error: response.data.message || '업로드에 실패했습니다.' }
                        : f
                ));
            }
        } catch (error: any) {
            console.error('Upload failed:', error);
            setFiles(prev => prev.map(f => 
                pendingFiles.some(p => p.id === f.id)
                    ? { ...f, status: 'error', error: error.response?.data?.message || '업로드에 실패했습니다.' }
                    : f
            ));
        }
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

    // 증권사 선택 초기화
    const resetBrokerSelection = () => {
        setSelectedBroker(null);
        setFiles([]);
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

        if (!selectedBroker) return;
        
        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            addFiles(droppedFiles);
        }
    }, [addFiles, selectedBroker]);

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

    if (!selectedBroker) {
        return (
            <div className="file-upload-container">
                <div className="file-upload-header">
                    <h1 className="file-upload-title">
                        📈 거래내역 업로드
                    </h1>
                    <p className="file-upload-subtitle">
                        먼저 사용하시는 증권사를 선택해주세요.
                    </p>
                </div>

                <div className="broker-selection-container">
                    <h2 className="broker-selection-title">증권사 선택</h2>
                    
                    <div className="broker-cards">
                        {(Object.keys(BROKER_INFO) as BrokerType[]).map((brokerKey) => {
                            const broker = BROKER_INFO[brokerKey];
                            return (
                                <div
                                    key={broker.id}
                                    className="broker-card"
                                    onClick={() => setSelectedBroker(broker.id)}
                                >
                                    <div className="broker-card-icon">
                                        {broker.icon}
                                    </div>
                                    <div className="broker-card-content">
                                        <h3 className="broker-card-name">
                                            {broker.name}
                                        </h3>
                                        <p className="broker-card-description">
                                            {broker.description}
                                        </p>
                                        <div className="broker-card-formats">
                                            <span className="broker-card-formats-label">지원 형식:</span>
                                            <span className="broker-card-formats-list">
                                                {broker.supportedFormats.join(', ')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="broker-card-arrow">
                                        →
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* 증권사별 안내사항 */}
                    <div className="broker-guide">
                        <h4 className="broker-guide-title">
                            💡 증권사별 안내사항
                        </h4>
                        <div className="broker-guide-items">
                            <div className="broker-guide-item">
                                <strong>🏢 키움증권:</strong>
                                <ul>
                                    <li>영웅문4에서 다운로드한 CSV 거래내역서</li>
                                    <li>영웅문4 → [0365] 거래내역 → Excel로 저장 </li>
                                </ul>
                            </div>
                            <div className="broker-guide-item">
                                <strong>💳 토스증권:</strong>
                                <ul>
                                    <li>토스증권 앱/웹에서 PDF 거래내역서</li>
                                    <li>계좌 관리 → 증명서 발급하기 → 거래내역서 → 날짜 지정 및 "전체" 거래내역 → PDF 다운로드</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <div className="file-upload-container">
            {/* 전역 동기화 상태 표시 */}
            {isGlobalSyncing && (
                <div className="file-upload-sync-notification">
                    🔄 포트폴리오 동기화 중...
                </div>
            )}

            {/* 헤더 - 선택된 증권사 정보 포함 */}
            <div className="file-upload-header">
                <div className="file-upload-title-wrapper">
                    <h1 className="file-upload-title">
                        {BROKER_INFO[selectedBroker].icon} {BROKER_INFO[selectedBroker].name} 거래내역 업로드
                    </h1>
                    <button 
                        onClick={resetBrokerSelection}
                        className="broker-change-btn"
                    >
                        증권사 변경
                    </button>
                </div>
                <div className="selected-broker-indicator">
                    <span className="selected-broker-badge">
                        {BROKER_INFO[selectedBroker].icon} {BROKER_INFO[selectedBroker].name} 선택됨
                    </span>
                    <span className="selected-broker-formats">
                        지원 형식: {BROKER_INFO[selectedBroker].supportedFormats.join(', ')}
                    </span>
                </div>
                <p className="file-upload-subtitle">
                    {BROKER_INFO[selectedBroker].description} 파일을 업로드하여 포트폴리오를 분석하세요.
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
                    {isDragOver ? '파일을 여기에 놓으세요' : `${BROKER_INFO[selectedBroker].name} ${BROKER_INFO[selectedBroker].supportedFormats.join('/')} 파일을 드래그하거나 클릭하여 선택`}
                </h3>
                <p className="file-upload-dropzone-description">
                    최대 {Math.round(BROKER_INFO[selectedBroker].maxFileSize / (1024 * 1024))}MB의 {BROKER_INFO[selectedBroker].supportedFormats.join(', ')} 파일을 업로드할 수 있습니다.
                </p>
                
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={BROKER_INFO[selectedBroker].supportedFormats.join(',')}
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

            {/* 증권사별 안내 사항 */}
            <div className="file-upload-guide">
                <h4 className="file-upload-guide-title">
                    💡 {BROKER_INFO[selectedBroker].name} 업로드 안내사항
                </h4>
                <ul className="file-upload-guide-list">
                    <li>{BROKER_INFO[selectedBroker].supportedFormats.join(', ')} 형식의 거래내역서만 업로드 가능합니다.</li>
                    <li>파일 크기는 최대 {Math.round(BROKER_INFO[selectedBroker].maxFileSize / (1024 * 1024))}MB까지 지원됩니다.</li>
                    <li>업로드 완료 후 자동으로 포트폴리오 동기화가 진행됩니다.</li>
                    <li>동기화 완료된 파일은 3초 후 자동으로 제거됩니다.</li>
                    <li>처리 완료 후 대시보드에서 분석 결과를 확인할 수 있습니다.</li>
                </ul>
            </div>
        </div>
    );

};

export default FileUpload;