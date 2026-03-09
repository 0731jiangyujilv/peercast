'use client';

import { TabItem, Tabs } from '@worldcoin/mini-apps-ui-kit-react';
import { Bank, Home, User } from 'iconoir-react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * This component uses the UI Kit to navigate between pages
 * Bottom navigation is the most common navigation pattern in Mini Apps
 * We require mobile first design patterns for mini apps
 * Read More: https://docs.world.org/mini-apps/design/app-guidelines#mobile-first
 */

export const Navigation = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState('predictions');

  useEffect(() => {
    if (pathname.includes('/predictions') || pathname.includes('/prediction/') || pathname.includes('/create')) {
      setValue('predictions');
    } else if (pathname.includes('/mock')) {
      setValue('mock');
    } else if (pathname.includes('/home')) {
      setValue('home');
    }
  }, [pathname]);

  const handleValueChange = (newValue: string) => {
    setValue(newValue);
    if (newValue === 'predictions') {
      router.push('/predictions');
    } else if (newValue === 'mock') {
      router.push('/mock');
    } else if (newValue === 'home') {
      router.push('/home');
    }
  };

  return (
    <Tabs value={value} onValueChange={handleValueChange}>
      <TabItem value="predictions" icon={<Home />} label="Predictions" />
      <TabItem value="wallet" icon={<Bank />} label="Wallet" />
      <TabItem value="profile" icon={<User />} label="Profile" />
    </Tabs>
  );
};
