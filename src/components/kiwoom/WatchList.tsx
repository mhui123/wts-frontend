import React, { useState, useEffect } from 'react';
import kiwoomApi from '../../api/kiwoomApi';
import StockSearchInput from './StockSearchInput';
import GroupManageModal from './GroupManageModal';
import { useAuth } from '../../contexts/AuthContext'


interface StockItem {
  code: string;
  name: string;
  price: number;
  change: number;
  changeRate: number;
  volume: number;
}

interface ToAddItem {
  stockCd: string;
  stockNm: string;
}

interface WatchGroup {
  id: string;
  name: string;
  createdAt: string;
  stockCodes: string[]; // 해당 그룹에 속한 종목 코드들
}

interface GroupedStockData {
  [groupId: string]: StockItem[];
}

// 백엔드 API 응답 타입 정의
interface BackendStockItem {
  stockCd: string;
  stockNm: string;
  nowPrice: number;
  changePrice: number;
  changeRate: string;  // "+0.18" 형태
  tradeVolume: number;
  market: string;
  itemId: number;
  createdAt: string;
  // 기타 필드들은 필요시 추가
}

interface BackendWatchGroup {
  groupId: number;
  groupName: string;
  createdAt: string;
  displayOrder: number;
  description: string | null;
  items: BackendStockItem[];
  itemCount: number;
}

const WatchList: React.FC = () => {
  const { me } = useAuth();
  const [groups, setGroups] = useState<WatchGroup[]>([
    { id: 'default', name: 'default', createdAt: new Date().toISOString(), stockCodes: [] }
  ]);
  const [currentGroupId, setCurrentGroupId] = useState<string>('default');
  const [currentGroupName, setCurrentGroupName] = useState<string>('default');
  const [groupedStockData, setGroupedStockData] = useState<GroupedStockData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toAddList, setToAddList] = useState<ToAddItem[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  // 현재 선택된 그룹의 종목 목록
  const currentWatchList = groupedStockData[currentGroupId] || [];

  // 그룹 변경 추적 (Dirty Flag)
  const [dirtyGroups, setDirtyGroups] = useState<Set<string>>(new Set());
  const [deletedGroups, setDeletedGroups] = useState<Set<string>>(new Set());

  // 그룹 변경 표시 함수
  const markGroupDirty = (groupId: string) => {
    setDirtyGroups(prev => new Set(prev).add(groupId));
  };

  // 그룹 변경 표시 초기화
  const clearDirtyGroups = () => {
    setDirtyGroups(new Set());
  };
  
  

  const handleStockAdd = (stockCd: string, stockNm: string) => {
    // 중복 체크 - 이미 관심종목에 있는지 확인
    const isInWatchList = currentWatchList.some(stock => stock.code === stockCd);
    if (isInWatchList) {
      setError(`${stockNm}(${stockCd})는 이미 관심종목에 등록되어 있습니다.`);
      return;
    }

    // 중복 체크 - 이미 추가 대기 목록에 있는지 확인
    const isInToAddList = toAddList.some(item => item.stockCd === stockCd);
    if (isInToAddList) {
      setError(`${stockNm}(${stockCd})는 이미 추가 대기 목록에 있습니다.`);
      return;
    }

    // 추가 대기 목록에 추가
    setToAddList(prev => [...prev, { stockCd, stockNm }]);
    setError(null); // 에러 메시지 초기화
    
    // 성공 메시지 (선택사항)
    console.log(`${stockNm}(${stockCd})가 추가 대기 목록에 추가되었습니다.`);
  };

   // 그룹 생성
  const createGroup = (groupName: string) => {
    const newGroup: WatchGroup = {
      id: `group_${Date.now()}`, // 임시 ID 생성
      name: groupName,
      createdAt: new Date().toISOString(),
      stockCodes: []
    };
    
    setGroups(prev => [...prev, newGroup]);
    setGroupedStockData(prev => ({
      ...prev,
      [newGroup.id]: []
    }));
    
    markGroupDirty(newGroup.id);
  };

  // 그룹 삭제
  const deleteGroup = (groupId: string) => {
    if (groupId === 'default') return;
    
    setGroups(prev => prev.filter(g => g.id !== groupId));

    if(!groupId.startsWith('group_')){
      setDeletedGroups(prev => new Set(prev).add(groupId));
    }
    
    setGroupedStockData(prev => {
      const newData = { ...prev };
      delete newData[groupId];
      return newData;
    });

    if (currentGroupId === groupId) {
      setCurrentGroupId(groups[0].id);
    }
    
  };

  // 그룹 선택
  const selectGroup = (groupId: string) => {
    setCurrentGroupId(groupId);
    setCurrentGroupName(groups.find(g => g.id === groupId)?.name || 'default');
  };

  // 특정 그룹에서 종목 삭제
  const deleteStockFromGroup = (groupId: string, stockCode: string) => {
    setGroupedStockData(prev => ({
      ...prev,
      [groupId]: (prev[groupId] || []).filter(stock => stock.code !== stockCode)
    }));

    setGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, stockCodes: group.stockCodes.filter(code => code !== stockCode) }
        : group
    ));
    
    markGroupDirty(groupId);
  };

  // 종목을 다른 그룹으로 이동
  const moveStockToGroup = (stockCode: string, fromGroupId: string, toGroupId: string) => {
    const stockToMove = groupedStockData[fromGroupId]?.find(stock => stock.code === stockCode);
    if (!stockToMove) return;

    setGroupedStockData(prev => ({
      ...prev,
      [fromGroupId]: (prev[fromGroupId] || []).filter(stock => stock.code !== stockCode),
      [toGroupId]: [...(prev[toGroupId] || []), stockToMove]
    }));

    setGroups(prev => prev.map(group => {
      if (group.id === fromGroupId) {
        return { ...group, stockCodes: group.stockCodes.filter(code => code !== stockCode) };
      } else if (group.id === toGroupId) {
        return { ...group, stockCodes: [...group.stockCodes, stockCode] };
      }
      return group;
    }));
    
    markGroupDirty(fromGroupId);
    markGroupDirty(toGroupId);
  };

  const renameGroup = (groupId: string, newName: string) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId 
        ? { ...group, name: newName }
        : group
    ));
    
    // 변경 추적
    markGroupDirty(groupId);
  };

  useEffect(() => {
    fetchWatchList();
  }, []);

  const fetchWatchList = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 그룹별 관심종목 조회 (백엔드 API 구조 예시)
      const response = await kiwoomApi.get(`/watchList/groups/${me?.id}`);
      // API 응답 구조 확인 및 데이터 처리
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const backendGroups = response.data.data as BackendWatchGroup[];
        const { transformedGroups, transformedGroupedStockData } = transformBackendData(backendGroups);
        
        // 상태 업데이트
        setGroups(transformedGroups);
        setGroupedStockData(transformedGroupedStockData);
        const currentGroupIdIsTemp = currentGroupId.startsWith('group_');
        
        if (transformedGroups.length > 0) {
          if(currentGroupIdIsTemp) {
            setCurrentGroupId(groups.find(g => g.name === currentGroupName)?.id || 'default');
          } else if(transformedGroups.length === 1 || deletedGroups.has(currentGroupId)) {
            setCurrentGroupId(transformedGroups[0].id);
          } else {
            setCurrentGroupId(currentGroupId);
          }
        }
        
        console.log('관심종목 데이터 로드 완료:', transformedGroups.length, '개 그룹');
        console.log(`현재그룹코드 : ${currentGroupId}` )
      } else {
        setError(response.data.message || '관심종목을 불러오는 데 실패했습니다.');
        // 샘플 데이터로 기본 그룹에 종목 추가
        const sampleStocks: StockItem[] = [
          { code: '005930', name: '삼성전자', price: 71000, change: 1000, changeRate: 1.43, volume: 12345678 },
          { code: '000660', name: 'SK하이닉스', price: 89000, change: -2000, changeRate: -2.20, volume: 8765432 },
          { code: '035420', name: 'NAVER', price: 205000, change: 3000, changeRate: 1.49, volume: 5432109 },
          { code: '005490', name: 'POSCO홀딩스', price: 415000, change: -5000, changeRate: -1.19, volume: 3210987 },
          { code: '051910', name: 'LG화학', price: 425000, change: 8000, changeRate: 1.92, volume: 2109876 },
        ];
        
        setGroupedStockData(prev => ({
          ...prev,
          default: sampleStocks
        }));
        
        // 기본 그룹의 stockCodes 업데이트
        setGroups(prev => prev.map(group => 
          group.id === 'default' 
            ? { ...group, stockCodes: sampleStocks.map(s => s.code) }
            : group
        ));
      }
      
      
      
    } catch (error) {
      console.error('관심종목 조회 실패:', error);
      setError('관심종목을 불러올 수 없습니다. 네트워크 연결을 확인해주세요.');
      
      // 기본 그룹으로 초기화
      const defaultGroup: WatchGroup = {
        id: 'default',
        name: 'default',
        createdAt: new Date().toISOString(),
        stockCodes: []
      };
      
      setGroups([defaultGroup]);
      setGroupedStockData({ default: [] });
      setCurrentGroupId('default');
      
    } finally {
      setLoading(false);
    }
  };

  // 백엔드 데이터를 프론트엔드 형태로 변환
  const transformBackendData = (backendGroups: BackendWatchGroup[]) => {
    const transformedGroups: WatchGroup[] = [];
    const transformedGroupedStockData: GroupedStockData = {};
    
    backendGroups.forEach(backendGroup => {
      const groupId = backendGroup.groupId.toString();
      
      // WatchGroup 변환
      const group: WatchGroup = {
        id: groupId,
        name: backendGroup.groupName,
        createdAt: backendGroup.createdAt,
        stockCodes: backendGroup.items.map(item => item.stockCd)
      };
      transformedGroups.push(group);
      
      // StockItem 변환
      const transformedStocks: StockItem[] = backendGroup.items.map(item => ({
        code: item.stockCd,
        name: item.stockNm,
        price: Math.abs(item.nowPrice), // 음수 값 처리
        change: item.changePrice,
        changeRate: parseFloat(item?.changeRate?.replace(/[+%]/g, '') ?? '0.00'), // "+0.18%" → 0.18
        volume: item.tradeVolume
      }));
      
      transformedGroupedStockData[groupId] = transformedStocks;
    });
    
    return { transformedGroups, transformedGroupedStockData };
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  // 관심종목 백엔드 추가 요청
  const addStocksToWatchList = async () => {
    if (toAddList.length === 0) {
      setError('추가할 종목이 없습니다.');
      return;
    }

    try {
      setIsAdding(true);
      setError(null);

      // 백엔드에 관심종목 추가 요청
      const stockCodes = toAddList.map(item => item.stockCd);
      const response = await kiwoomApi.post('/watchlist/add', {
        groupName: groups.find(g => g.id === currentGroupId)?.name || 'default',
        stockCodes: stockCodes,
        userId : me?.id
      });

      if (response.data.success) {
        // 성공시 목록 새로고침
        await fetchWatchList();
        
        // 추가 대기 목록 초기화
        setToAddList([]);
        
        console.log(`${toAddList.length}개 종목이 관심종목에 추가되었습니다.`);
      } else {
        setError(response.data.message || '종목 추가에 실패했습니다.');
      }

    } catch (error) {
      console.error('관심종목 추가 실패:', error);
      setError('종목 추가 요청 중 오류가 발생했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  // 추가 대기 목록에서 특정 종목 제거
  const removeFromToAddList = (stockCd: string) => {
    setToAddList(prev => prev.filter(item => item.stockCd !== stockCd));
  };

  // 추가 대기 목록 전체 초기화
  const clearToAddList = () => {
    setToAddList([]);
  };


  const syncWithBackend = async () => {
    const hasChanges = dirtyGroups.size > 0 || deletedGroups.size > 0;
    
    if (!hasChanges) {
      console.log('변경된 그룹이 없습니다. 동기화를 건너뜁니다.');
      setShowGroupModal(false);
      return;
    }

    // 상태 일관성 검증
    const inconsistentGroups = Array.from(dirtyGroups).filter(id => deletedGroups.has(id));
      if (inconsistentGroups.length > 0) {
        console.warn('상태 불일치 감지:', inconsistentGroups);
        // dirtyGroups에서 삭제된 그룹 제거
        setDirtyGroups(prev => {
          const cleaned = new Set(prev);
          inconsistentGroups.forEach(id => cleaned.delete(id));
          return cleaned;
        });
      }
      
      try {
        setLoading(true);
        setError(null);
        
        const promises: Promise<any>[] = [];
        
        // 1. 업데이트/생성된 그룹들 처리
        if (dirtyGroups.size > 0) {
          console.log('동기화할 그룹들:', Array.from(dirtyGroups));
          
          const updatePromises = Array.from(dirtyGroups)
            .filter(groupId => {
              // 삭제된 그룹은 업데이트에서 제외
              if (deletedGroups.has(groupId)) {
                console.warn(`삭제된 그룹 ${groupId}을 업데이트에서 제외합니다.`);
                return false;
              }
              
              // 존재하는 그룹만 포함
              const exists = groups.find(g => g.id === groupId);
              if (!exists) {
                console.warn(`존재하지 않는 그룹 ${groupId}을 업데이트에서 제외합니다.`);
                return false;
              }
              
              return true;
            })
            .map(groupId => {
              const group = groups.find(g => g.id === groupId)!;
              const stockCodes = (groupedStockData[groupId] || []).map(stock => stock.code);
              
              console.log('UPDATE 요청 데이터:', { 
                groupId, 
                groupName: group.name, 
                stockCodesCount: stockCodes.length,
                url: `/watchlist/syncgroups/${me?.id}`
              });
              
              return kiwoomApi.post(`/watchlist/syncgroups/${me?.id}`, {
                groupId: parseInt(groupId) || groupId,
                groupName: group.name,
                stockCodes: stockCodes,
                userId: me?.id
              }).then(response => {
                console.log('UPDATE 성공:', { groupId, response: response.data });
                return { status: 'fulfilled', response, groupId, type: 'update' };
              })
              .catch(error => {
                console.error('UPDATE 실패 상세:', {
                  groupId,
                  error: error.message,
                  status: error.response?.status,
                  data: error.response?.data
                });
                return { status: 'rejected', error, groupId, type: 'update' };
              });
            });
          
          promises.push(...updatePromises);
        }
        
        // 2. 삭제된 그룹들 처리
        if (deletedGroups.size > 0) {
          console.log('삭제할 그룹들:', Array.from(deletedGroups));
          
          const deletePromises = Array.from(deletedGroups).map(groupId => {
            console.log('DELETE 요청 시작:', `/watchlist/delgroups/${me?.id}/${groupId}`);
            
            return kiwoomApi.delete(`/watchlist/delgroups/${me?.id}/${groupId}`)
              .then(response => {
                console.log('DELETE 성공:', { groupId, response: response.data });
                return { status: 'fulfilled', response, groupId, type: 'delete' };
              })
              .catch(error => {
                console.error('DELETE 실패 상세:', {
                  groupId,
                  error: error.message,
                  status: error.response?.status,
                  data: error.response?.data
                });
                return { status: 'rejected', error, groupId, type: 'delete' };
              });
          });
          
          promises.push(...deletePromises);
        }
        
        const results = await Promise.allSettled(promises);
        
        let successCount = 0;
        let failCount = 0;
        
        results.forEach((result) => {
          if (result.status === 'fulfilled') {
            const value = result.value;
            if (value.status === 'fulfilled') {
              successCount++;
              console.log(`${value.type === 'delete' ? '삭제' : '동기화'} 성공: 그룹 ${value.groupId}`);
            } else if (value.status === 'rejected') {
              failCount++;
              console.error(`${value.type === 'delete' ? '삭제' : '동기화'} 실패: 그룹 ${value.groupId}`, value.error);
            }
          } else {
            failCount++;
            console.error('Promise 실패:', result.reason);
          }
        });
        
        if (failCount === 0) {
          clearDirtyGroups();
          setDeletedGroups(new Set()); // 삭제된 그룹 목록 초기화
          console.log(`${successCount}개 그룹 처리 완료`);
          await fetchWatchList();
        } else {
          setError(`${successCount}개 처리 성공, ${failCount}개 처리 실패`);
        }
        
    } catch (error) {
      console.error('동기화 실패:', error);
      setError('동기화에 실패했습니다.');
    } finally {
      setLoading(false);
      setShowGroupModal(false);
    } 
  };

  if (loading) {
    return (
      <div className="watchlist-container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>관심종목을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card watchlist-container">
      <div className="watchlist-header">
        <h2>관심종목</h2>
        <div className="search-section">
          <StockSearchInput
            onStockSelect={handleStockAdd}
            placeholder="종목명 또는 코드로 검색..."
          />
        </div>
        <div className="header-actions">
          <button onClick={fetchWatchList} className="refresh-btn">
            🔄 새로고침
          </button>
          {toAddList.length > 0 && (
            <button 
              onClick={addStocksToWatchList}
              disabled={isAdding}
              className="add-btn primary"
            >
              {isAdding ? '추가 중...' : `➕ ${toAddList.length}개 종목 추가`}
            </button>
          )}
          {toAddList.length > 0 && (
            <button 
              onClick={clearToAddList}
              disabled={isAdding}
              className="clear-btn"
            >
              🗑️ 대기목록 초기화
            </button>
          )}
        </div>
      </div>
      
      {/* 추가 대기 목록 표시 */}
      {toAddList.length > 0 && (
        <div className="to-add-list">
          <h4>추가 대기 목록 ({toAddList.length}개)</h4>
          <div className="to-add-items">
            {toAddList.map((item) => (
              <div key={item.stockCd} className="to-add-item">
                <span className="stock-info">
                  <strong>{item.stockNm}</strong>
                  <code>{item.stockCd}</code>
                </span>
                <button 
                  onClick={() => removeFromToAddList(item.stockCd)}
                  className="remove-btn"
                  title="목록에서 제거"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* 그룹 관리 섹션 */}
      <div className="group-management-section">
        <div className="group-selector">
          <label htmlFor="group-select">그룹:</label>
          <select 
            id="group-select"
            value={currentGroupId}
            onChange={(e) => setCurrentGroupId(e.target.value)}
            className="group-select"
          >
            {groups.map(group => (
              <option key={group.id} value={group.id}>
                {group.name} ({groupedStockData[group.id]?.length || 0}개)
              </option>
            ))}
          </select>
        </div>
        
        <button 
          onClick={() => setShowGroupModal(true)}
          className="group-manage-btn"
        >
          📁 그룹관리
        </button>
      </div>

      <div className="watchlist-table">
        <table>
          <thead>
            <tr>
              <th>종목명</th>
              <th>종목코드</th>
              <th>현재가</th>
              <th>전일대비</th>
              <th>등락률</th>
              <th>거래량</th>
            </tr>
          </thead>
          <tbody>
            {currentWatchList.map((stock) => (
              <tr key={stock.code} className="stock-row">
                <td className="stock-name">
                  <strong>{stock.name}</strong>
                </td>
                <td className="stock-code">{stock.code}</td>
                <td className="stock-price">
                  {formatNumber(stock.price)}원
                </td>
                <td className={`stock-change ${stock.change >= 0 ? 'positive' : 'negative'}`}>
                  {stock.change > 0 ? '+' : ''}{formatNumber(stock.change)}
                </td>
                <td className={`stock-rate ${stock.changeRate >= 0 ? 'positive' : 'negative'}`}>
                  {stock.changeRate > 0 ? '+' : ''}{stock.changeRate}%
                </td>
                <td className="stock-volume">
                  {formatNumber(stock.volume)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {currentWatchList.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>관심종목이 없습니다</h3>
          <p>관심있는 종목을 추가해보세요.</p>
        </div>
      )}

      {/* 그룹 관리 모달 */}
      <GroupManageModal
        isOpen={showGroupModal}
        // onClose={() => setShowGroupModal(false)}
        onClose={syncWithBackend}
        groups={groups}
        currentGroupId={currentGroupId}
        groupedStockData={groupedStockData}
        onCreateGroup={createGroup}
        onDeleteGroup={deleteGroup}
        onSelectGroup={selectGroup}
        onDeleteStock={deleteStockFromGroup}
        onMoveStock={moveStockToGroup}
        onRenameGroup={renameGroup}
      />
    </div>
  );
};

export default WatchList;