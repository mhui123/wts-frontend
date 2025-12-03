import type { RouteObject } from 'react-router-dom';
import Health from '../pages/Health';
import Login from '../pages/Login';
import TradeHistory from '../pages/TradeHistory';
import DashboardHome from '../pages/DashboardHome';
import DashboardHome_Renew from '../pages/DashboardHome_Renew';

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
];
