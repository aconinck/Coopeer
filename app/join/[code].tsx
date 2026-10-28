import { Redirect, useLocalSearchParams } from 'expo-router';

/** Deep link: coopeer://join/<code> */
export default function JoinWithCode() {
  const { code } = useLocalSearchParams<{ code: string }>();
  return <Redirect href={`/join?mode=code&code=${encodeURIComponent(code ?? '')}`} />;
}
