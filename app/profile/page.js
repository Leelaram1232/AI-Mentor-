'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Profile is now a tab inside the dashboard.
// This page redirects there with the profile tab active.
export default function ProfilePage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return null;
}
