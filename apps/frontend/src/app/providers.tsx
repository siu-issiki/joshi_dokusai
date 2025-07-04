'use client';

import { AuthProvider } from '@/lib/auth';
import { SoundNotificationProvider } from '@/contexts/SoundNotificationContext';

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SoundNotificationProvider>{children}</SoundNotificationProvider>
    </AuthProvider>
  );
}
