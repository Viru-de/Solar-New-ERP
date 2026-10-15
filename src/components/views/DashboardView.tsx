import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { AdminDashboard } from '../dashboards/AdminDashboard';
import { SalesDashboard } from '../dashboards/SalesDashboard';
import { ProjectDashboard } from '../dashboards/ProjectDashboard';
import { FieldDashboard } from '../dashboards/FieldDashboard';
import { ServiceDashboard } from '../dashboards/ServiceDashboard';
import { FinanceDashboard } from '../dashboards/FinanceDashboard';
import { HrDashboard } from '../dashboards/HrDashboard';
import { CustomerPortalView } from './CustomerPortalView';

export const DashboardView: React.FC = () => {
  const { currentRole } = useAuth();

  switch (currentRole) {
    case 'Admin':
      return <AdminDashboard />;

    case 'Sales Manager':
    case 'Sales Executive':
      return <SalesDashboard />;

    case 'Project Manager':
      return <ProjectDashboard />;

    case 'Site Survey Engineer':
    case 'Site Inspector':
    case 'Civil Team':
    case 'Structure Team':
    case 'Installation Team':
    case 'Electrical Team':
      return <FieldDashboard />;

    case 'Service Manager':
    case 'Technician':
      return <ServiceDashboard />;

    case 'Accountant':
      return <FinanceDashboard />;

    case 'HR Manager':
      return <HrDashboard />;

    case 'Customer':
      return <CustomerPortalView />;

    default:
      return <AdminDashboard />;
  }
};
