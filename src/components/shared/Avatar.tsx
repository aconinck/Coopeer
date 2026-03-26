import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { colors, typography } from '../../constants/theme';

interface AvatarProps {
  uri?: string;
  name: string;
  size?: number;
}

// Returns initials for the fallback avatar
function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const style = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (uri) {
    return <Image source={{ uri }} style={[styles.image, style]} />;
  }

  return (
    <View style={[styles.fallback, style]}>
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.gray100,
  },
  fallback: {
    backgroundColor: colors.primaryMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
});
