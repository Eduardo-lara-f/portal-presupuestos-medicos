'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MaintainersIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/maintainers/procedures');
  }, [router]);

  return null;
}