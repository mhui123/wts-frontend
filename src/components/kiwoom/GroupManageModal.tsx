import React, { useState, useEffect } from 'react';
import CustomDialog from '../common/CustomDialog';
import { useCustomDialog } from '../../hooks/useCustomDialog';

interface WatchGroup {
  id: string;
  name: string;
  createdAt: string;
  stockCodes: string[];
}

interface StockItem {
  code: string;
  name: string;
  price: number;
  change: number;
  changeRate: number;
  volume: number;
}

interface GroupedStockData {
  [groupId: string]: StockItem[];
}

interface GroupManageModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: WatchGroup[];
  currentGroupId: string;
  groupedStockData: GroupedStockData;
  onCreateGroup: (groupName: string) => void;
  onDeleteGroup: (groupId: string) => void;
  onSelectGroup: (groupId: string) => void;
  onRenameGroup: (groupId: string, newName: string) => void;
  onDeleteStock: (groupId: string, stockCode: string) => void;
  onMoveStock: (stockCode: string, fromGroupId: string, toGroupId: string) => void;
}

const GroupManageModal: React.FC<GroupManageModalProps> = ({
  isOpen,
  onClose,
  groups,
  currentGroupId,
  groupedStockData,
  onCreateGroup,
  onDeleteGroup,
  onSelectGroup,
  onRenameGroup,
  onDeleteStock,
  onMoveStock
}) => {
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>(currentGroupId);
  const [isCreating, setIsCreating] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const { dialogState, showAlert, showConfirm } = useCustomDialog();

  useEffect(() => {
    if (currentGroupId !== selectedGroup) {
      console.log('currentGroupId 변경 감지:', { from: selectedGroup, to: currentGroupId });
      setSelectedGroup(currentGroupId);
    }
  }, [currentGroupId, selectedGroup]);

  if (!isOpen) return null;

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      showAlert('입력 오류', '그룹명을 입력해주세요.', 'warning');
      return;
    }

    if (groups.some(g => g.name === newGroupName.trim())) {
      showAlert('중복 오류', '이미 존재하는 그룹명입니다.', 'warning');
      return;
    }

    onCreateGroup(newGroupName.trim());
    setNewGroupName('');
    setIsCreating(false);
  };

  const handleDeleteGroup = (groupId: string) => {
    const groupSizeIsOne = groups.length <= 1;
    const defaultGroupId = groups[0].id;

    if (groupSizeIsOne && groupId === defaultGroupId) {
      showAlert('삭제 불가', '마지막 그룹은 삭제할 수 없습니다.', 'warning');
      return;
    }

    const group = groups.find(g => g.id === groupId);
    const stockCount = groupedStockData[groupId]?.length || 0;
    
    const executeDelete = () => {
      onDeleteGroup(groupId);
      if (selectedGroup === groupId) {
        const remainingGroups = groups.filter(g => g.id !== groupId);
        const newSelectedGroupId = remainingGroups.length > 0 ? remainingGroups[0].id : 'default';
        
        console.log('새로 선택할 그룹 ID:', newSelectedGroupId);
        onSelectGroup(newSelectedGroupId);
      }
    };

    if (stockCount > 0) {
      showConfirm(
        '그룹 삭제 확인',
        `'${group?.name}' 그룹에는 ${stockCount}개의 종목이 있습니다.\n삭제하시겠습니까?\n\n※ 종목들도 함께 삭제됩니다.`,
        executeDelete,
        'danger'
      );
    } else {
      showConfirm(
        '그룹 삭제 확인',
        `'${group?.name}' 그룹을 삭제하시겠습니까?`,
        executeDelete,
        'danger'
      );
    }
  };

  // 그룹명 편집 시작
  const handleStartRename = (group: WatchGroup) => {
    setEditingGroupId(group.id);
    setEditingGroupName(group.name);
  };

  // 그룹명 변경 완료
  const handleConfirmRename = () => {
    if (!editingGroupName.trim()) {
      showAlert('입력 오류', '그룹명을 입력해주세요.', 'warning');
      return;
    }

    if (groups.some(g => g.name === editingGroupName.trim() && g.id !== editingGroupId)) {
      showAlert('중복 오류', '이미 존재하는 그룹명입니다.', 'warning');
      return;
    }

    if (editingGroupId) {
      onRenameGroup(editingGroupId, editingGroupName.trim());
      setEditingGroupId(null);
      setEditingGroupName('');
    }
  };

  // 그룹명 편집 취소
  const handleCancelRename = () => {
    setEditingGroupId(null);
    setEditingGroupName('');
  };

  // 키 이벤트 처리
  const handleRenameKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmRename();
    } else if (e.key === 'Escape') {
      handleCancelRename();
    }
  };

  const selectedGroupStocks = groupedStockData[selectedGroup] || [];

  return (
    <div className="group-modal-overlay">
      <div className="group-modal">
        <div className="group-modal-header">
          <h3>그룹 관리</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="group-modal-content">
          {/* 그룹 목록 */}
          <div className="group-list-section">
            <div className="section-header">
              <h4>그룹 목록</h4>
              {!isCreating ? (
                <button 
                  onClick={() => setIsCreating(true)}
                  className="create-group-btn"
                >
                  ➕ 새 그룹
                </button>
              ) : (
                <div className="create-group-form">
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="그룹명 입력"
                    className="group-name-input"
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateGroup()}
                    autoFocus
                  />
                  <button onClick={handleCreateGroup} className="confirm-btn">✓</button>
                  <button 
                    onClick={() => {
                      setIsCreating(false);
                      setNewGroupName('');
                    }} 
                    className="cancel-btn"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            <div className="group-list">
              {groups.map((group) => (
                <div 
                  key={group.id}
                  className={`group-item ${selectedGroup === group.id ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGroup(group.id);
                    onSelectGroup(group.id);
                  }}
                >
                  <div className="group-info">
                    {editingGroupId === group.id ? (
                      <div className="rename-group-form">
                        <input
                          type="text"
                          value={editingGroupName}
                          onChange={(e) => setEditingGroupName(e.target.value)}
                          placeholder={group.name}
                          className="group-rename-input"
                          onKeyDown={handleRenameKeyPress}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleConfirmRename();
                          }}
                          className="confirm-btn"
                        >
                          ✓
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelRename();
                          }}
                          className="cancel-btn"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="group-name">{group.name}</span>
                        <span className="stock-count">
                          ({groupedStockData[group.id]?.length || 0}개)
                        </span>
                      </>
                    )}
                  </div>
                  <div className="group-actions">
                    {group.id === currentGroupId && (
                      <span className="current-badge">현재</span>
                    )}
                    {editingGroupId !== group.id && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartRename(group);
                          }}
                          className="rename-btn"
                          title="그룹명 변경"
                        >
                          ✏️
                        </button>
                        {group.id !== 'default' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteGroup(group.id);
                            }}
                            className="delete-group-btn"
                          >
                            🗑️
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 선택된 그룹의 종목 목록 */}
          <div className="group-stocks-section">
            <h4>
              {groups.find(g => g.id === selectedGroup)?.name} 그룹 종목 
              ({selectedGroupStocks.length}개)
            </h4>
            
            {selectedGroupStocks.length > 0 ? (
              <div className="group-stocks-list">
                {selectedGroupStocks.map((stock) => (
                  <div key={stock.code} className="stock-item">
                    <div className="stock-info">
                      <strong>{stock.name}</strong>
                      <span className="stock-code">{stock.code}</span>
                    </div>
                    <div className="stock-actions">
                      {groups.length > 1 && (
                        <select
                          onChange={(e) => {
                            if (e.target.value && e.target.value !== selectedGroup) {
                              onMoveStock(stock.code, selectedGroup, e.target.value);
                            }
                          }}
                          className="move-select"
                        >
                          <option value="">이동할 그룹</option>
                          {groups
                            .filter(g => g.id !== selectedGroup)
                            .map(g => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                      )}
                      <button
                        onClick={() => onDeleteStock(selectedGroup, stock.code)}
                        className="delete-stock-btn"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-group">
                <p>이 그룹에는 종목이 없습니다.</p>
              </div>
            )}
          </div>
        </div>

        <div className="group-modal-footer">
          <button onClick={onClose} className="close-modal-btn">
            닫기
          </button>
        </div>
      </div>
      {/* 범용 Alert/Confirm 다이얼로그 */}
        <CustomDialog
          isOpen={dialogState?.isOpen || false}
          title={dialogState?.title || ''}
          message={dialogState?.message || ''}
          isConfirm={dialogState?.isConfirm ?? true}
          confirmText={dialogState?.confirmText}
          cancelText={dialogState?.cancelText}
          onConfirm={dialogState?.onConfirm || (() => {})}
          onCancel={dialogState?.onCancel}
          type={dialogState?.type}
        />
      </div>
  );
};

export default GroupManageModal;