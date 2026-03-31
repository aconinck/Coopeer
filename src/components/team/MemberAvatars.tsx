import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Avatar } from '../shared/Avatar';
import { colors, typography, radius } from '../../constants/theme';
import type { Member } from '../../types';

interface MemberAvatarsProps {
  members: Member[];
  maxVisible?: number;
  size?: number;
}

export function MemberAvatars({
  members,
  maxVisible = 4,
  size = 24,
}: MemberAvatarsProps) {
  const visible = members.slice(0, maxVisible);
  const overflow = members.length - maxVisible;

  return (
    <View style={styles.row}>
      {visible.map((member, index) => (
        <View
          key={member.id}
          style={[
            styles.avatarWrapper,
            { marginLeft: index === 0 ? 0 : -(size * 0.3) },
          ]}
        >
          <View style={[styles.border, { borderRadius: size, padding: 1 }]}>
            <Avatar uri={member.avatar} name={member.name} size={size} />
          </View>
        </View>
      ))}
      {overflow > 0 && (
        <View
          style={[
            styles.overflow,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -(size * 0.3),
            },
          ]}
        >
          <Text style={[styles.overflowText, { fontSize: size * 0.35 }]}>
            +{overflow}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrapper: {
    zIndex: 1,
  },
  border: {
    backgroundColor: colors.white,
  },
  overflow: {
    backgroundColor: colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },
  overflowText: {
    color: colors.gray500,
    fontWeight: typography.weights.bold,
  },
});
