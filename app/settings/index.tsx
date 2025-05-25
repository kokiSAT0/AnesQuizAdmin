import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/Screen';
import { AppHeader } from '@/components/AppHeader';
import { Text, TextInput, Button, useTheme } from 'react-native-paper';
import { useDebugStore } from '@/src/store/debug';

export default function Settings() {
  const theme = useTheme();
  const enabled = useDebugStore((s) => s.enabled);
  const enable = useDebugStore((s) => s.enable);
  const disable = useDebugStore((s) => s.disable);
  const clearLogs = useDebugStore((s) => s.clearLogs);
  const [pass, setPass] = useState('');

  const toggle = () => {
    if (enabled) {
      disable();
      clearLogs();
    } else if (pass === '0604') {
      enable();
    } else {
      alert('パスワードが違います');
    }
    setPass('');
  };

  return (
    <Screen style={{ backgroundColor: theme.colors.background }}>
      <AppHeader title="設定" onBack={() => router.back()} />
      <View style={{ marginTop: 24 }}>
        <Text style={{ marginBottom: 8 }}>
          デバッグモード: {enabled ? 'ON' : 'OFF'}
        </Text>
        <TextInput
          label="パスワード"
          secureTextEntry
          value={pass}
          onChangeText={setPass}
          style={{ marginBottom: 12 }}
        />
        <Button mode="contained" onPress={toggle}>
          {enabled ? 'デバッグを無効化' : 'デバッグを有効化'}
        </Button>
      </View>
    </Screen>
  );
}
