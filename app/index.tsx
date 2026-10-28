import { Redirect } from 'expo-router';
import { useSession } from '../src/state/session';

export default function Index() {
  const session = useSession();
  if (!session.isReady) return null;
  return <Redirect href={session.isSignedIn ? '/map' : '/welcome'} />;
}
