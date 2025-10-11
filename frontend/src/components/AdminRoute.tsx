import type { ReactNode } from 'react';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  return <>{children}</>;
};

export default AdminRoute;
