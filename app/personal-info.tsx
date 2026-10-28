import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { colors, space, type } from '../src/constants/theme';
import { useSession } from '../src/state/session';
import { ActionBar, PrimaryButton } from '../src/ui/Buttons';
import { Screen } from '../src/ui/Screen';

export default function PersonalInfoScreen() {
  const session = useSession();
  const [name, setName] = useState(session.user?.name ?? '');
  const trimmed = name.trim();
  const canSave = trimmed.length >= 2 && trimmed !== session.user?.name;

  return (
    <Screen
      title="Personal info"
      footer={
        <ActionBar>
          <PrimaryButton
            title="Save"
            disabled={!canSave}
            onPress={async () => {
              await session.updateName(trimmed);
              router.back();
            }}
          />
        </ActionBar>
      }
    >
      <View style={styles.field}>
        <Text style={[type.caption, styles.label]}>Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Full name"
          placeholderTextColor={colors.label3}
          textContentType="name"
          autoCapitalize="words"
          style={[type.title3, styles.input]}
        />
      </View>
      <View style={styles.field}>
        <Text style={[type.caption, styles.label]}>Phone</Text>
        <Text style={[type.title3, styles.readOnly]}>{session.user?.phone ?? ''}</Text>
      </View>
      <Text style={[type.footnote, styles.label]}>Your phone number is how you sign in. No password needed.</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.xs, borderBottomWidth: 1, borderBottomColor: colors.separator, paddingVertical: space.sm },
  label: { color: colors.label2 },
  input: { color: colors.label, paddingVertical: 0 },
  readOnly: { color: colors.label2, fontWeight: '500' },
});
