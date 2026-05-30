import React from 'react';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import WorkspacePage from './pages/WorkspacePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SubscriptionPage from './pages/SubscriptionPage';
import DomainSettingsPage from './pages/DomainSettingsPage';
import type { ReactNode } from 'react';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  /** Accessible without login. Routes without this flag require authentication. */
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: 'Landing',
    path: '/',
    element: <LandingPage />,
    public: true,
  },
  {
    name: 'Login',
    path: '/login',
    element: <LoginPage />,
    public: true,
  },
  {
    name: 'Home',
    path: '/home',
    element: <HomePage />,
    public: false,
  },
  {
    name: 'Dashboard',
    path: '/dashboard',
    element: <DashboardPage />,
    public: false,
  },
  {
    name: 'Subscription',
    path: '/subscription',
    element: <SubscriptionPage />,
    public: false,
  },
  {
    name: 'DomainSettings',
    path: '/domain',
    element: <DomainSettingsPage />,
    public: false,
  },
  {
    name: 'Workspace',
    path: '/workspace',
    element: <WorkspacePage />,
    public: true,
  },
  {
    name: 'WorkspaceNew',
    path: '/workspace/new',
    element: <WorkspacePage />,
    public: false,
  },
  {
    name: 'WorkspaceProject',
    path: '/workspace/:id',
    element: <WorkspacePage />,
    public: false,
  },
];
