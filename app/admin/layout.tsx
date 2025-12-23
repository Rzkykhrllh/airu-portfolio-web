import { ReactNode } from 'react';

interface AdminLayoutWrapperProps {
  children: ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  return children;
}
