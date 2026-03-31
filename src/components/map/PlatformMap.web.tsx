// Web stub for react-native-maps — renders nothing (web uses discover.web.tsx instead)
import React from 'react';
import { View } from 'react-native';

export const MapView = ({ style, children }: { style?: object; children?: React.ReactNode }) => (
  <View style={style}>{children}</View>
);

export const Marker = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

export default MapView;
