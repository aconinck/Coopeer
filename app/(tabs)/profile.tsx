import { type ReactNode } from 'react';
import { ProfileDetail } from '../../src/details/ProfileDetail';
import { DetailHost, type DetailLayoutProps, type DetailNav } from '../../src/ui/DetailLayout';
import { Screen } from '../../src/ui/Screen';
import { sheetController } from '../../src/ui/sheetController';
import { router } from 'expo-router';

// Tab-aware layout: uses tab-bar spacing so Sign out is never hidden behind the glass bar.
const TabLayout = (props: DetailLayoutProps) => <Screen variant="tab" {...props} />;

const nav: DetailNav = {
  place: (id) => sheetController.open({ kind: 'place', id }),
  game: (id) => sheetController.open({ kind: 'game', id }),
  club: (id) => router.push(`/club/${id}` as Parameters<typeof router.push>[0]),
  attendees: (id) => sheetController.open({ kind: 'attendees', id }),
  player: (id) => sheetController.open({ kind: 'player', id }),
};

export default function ProfileScreen(): ReactNode {
  return (
    <DetailHost layout={TabLayout} nav={nav}>
      <ProfileDetail />
    </DetailHost>
  );
}
