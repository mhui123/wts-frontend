import type { RouteObject } from 'react-router-dom';
import Health from '../pages/Health';
import Login from '../pages/Login';
import TradeHistory from '../pages/TradeHistory';
//import DashboardHome from '../pages/DashboardHome';
import DashboardHome_Renew from '../pages/DashboardHome_Renew';
import FileUpload from '../pages/FileUpload';
// import 구문에 추가
import KiwoomApiManager from '../pages/KiwoomApiManager';
import WatchList from '../components/kiwoom/WatchList';
import AccountStatus from '../components/kiwoom/AccountStatus';
import OrderHistory from '../components/kiwoom/OrderHistory';

const NotFound = () => <div>Not Found</div>;

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <DashboardHome_Renew />,
  },
  {
    path: '/health',
    element: <Health />,
  },
  {
    path: '/trade-history',
    element: <TradeHistory />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
  {
    path: '/upload',
    element: <FileUpload />,
  },
  {
    path: '/kiwoom-api',
    element: <KiwoomApiManager />,
  },
  {
    path: '/kiwoom/watchlist',
    element: <WatchList />,
  },
  {
    path: '/kiwoom/account',
    element: <AccountStatus />,
  },
  {
    path: '/kiwoom/orders',
    element: <OrderHistory />,
  },
];
