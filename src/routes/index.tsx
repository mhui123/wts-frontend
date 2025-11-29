import type { RouteObject } from 'react-router-dom';
import Health from '../pages/Health';
import Login from '../pages/Login';
import TradeHistory from '../pages/TradeHistory';

const DashboardHome = () => (
  <div className="cards">
    <div className="card">
      <div className="card-title">Overview</div>
      <div className="card-body">Quick stats and summary.</div>
    </div>
    <div className="card">
      <div className="card-title">Recent Activity</div>
      <div className="card-body">No recent activity.</div>
    </div>
    <div className="card">
      <div className="card-title">System Health</div>
      <div className="card-body">All systems nominal.</div>
    </div>
  </div>
);

const NotFound = () => <div>Not Found</div>;

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <DashboardHome />,
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
