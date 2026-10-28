import { createContext, useContext, type ComponentType, type ReactNode } from 'react';
import { router } from 'expo-router';
import { Screen } from './Screen';
import { sheetController } from './sheetController';

// Detail content (place, game, club, attendees) is written once and rendered either
// inside the bottom sheet (in-app) or as a routed page (deep links, Clubs tab).

export interface DetailLayoutProps {
  title: string;
  trailing?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export type SheetRoute =
  | { kind: 'place'; id: string }
  | { kind: 'game'; id: string }
  | { kind: 'club'; id: string }
  | { kind: 'attendees'; id: string };

export interface DetailNav {
  place: (id: string) => void;
  game: (id: string) => void;
  club: (id: string) => void;
  attendees: (id: string) => void;
}

const PageLayout = (props: DetailLayoutProps) => <Screen variant="page" {...props} />;
const ModalLayout = (props: DetailLayoutProps) => <Screen variant="sheet" {...props} />;

const LayoutContext = createContext<ComponentType<DetailLayoutProps>>(PageLayout);

// From a routed page: games and places still open in the sheet; clubs push a page.
const routeNav: DetailNav = {
  place: (id) => sheetController.open({ kind: 'place', id }),
  game: (id) => sheetController.open({ kind: 'game', id }),
  club: (id) => router.push(`/club/${id}`),
  attendees: (id) => sheetController.open({ kind: 'attendees', id }),
};

const NavContext = createContext<DetailNav>(routeNav);

export function DetailLayout(props: DetailLayoutProps) {
  const Layout = useContext(LayoutContext);
  return <Layout {...props} />;
}

export const useDetailNav = () => useContext(NavContext);

export function DetailHost({ layout, nav, children }: { layout: ComponentType<DetailLayoutProps>; nav: DetailNav; children: ReactNode }) {
  return (
    <LayoutContext.Provider value={layout}>
      <NavContext.Provider value={nav}>{children}</NavContext.Provider>
    </LayoutContext.Provider>
  );
}

/** Wraps a detail rendered by a route file (deep link or full page). */
export function RouteDetail({ variant, children }: { variant: 'page' | 'sheet'; children: ReactNode }) {
  return (
    <DetailHost layout={variant === 'page' ? PageLayout : ModalLayout} nav={routeNav}>
      {children}
    </DetailHost>
  );
}
