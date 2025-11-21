import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  ScrollView,
  useWindowDimensions,
  InteractionManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import responsive from '../../utils/responsive';

interface ActiveCallScreenProps {
  // 추후 통화 관련 props 추가 가능
}

export const ActiveCallScreen = React.memo(({}: ActiveCallScreenProps) => {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = responsive(isTablet ? 420 : 360);
  const [isInteractionComplete, setIsInteractionComplete] = useState(false);

  useEffect(() => {
    const interactionPromise = InteractionManager.runAfterInteractions(() => {
      setIsInteractionComplete(true);
      console.log('ActiveCallScreen: Interactions complete');
    });

    return () => interactionPromise.cancel();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#60584d" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.pageWrapper, { maxWidth: MAX_WIDTH }]}>
          {/* App Logo - 232x232 */}
          <Image
            source={require('../../../assets/images/icon.png')}
            style={styles.appLogo}
            contentFit="contain"
            cachePolicy="disk"
            priority="high"
            transition={150}
          />
          
          {/* Voice Wave Icon - 232x115 */}
          <Image
            source={require('../../../assets/images/VoiceWaveIcon.png')}
            style={styles.voiceWaveIcon}
            contentFit="contain"
            cachePolicy="disk"
            priority="high"
            transition={150}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#60584d',
  },
  scrollContent: {
    paddingHorizontal: responsive(16),
    paddingTop: responsive(70),
    paddingBottom: responsive(120),
    alignItems: 'center' as any,
    flexGrow: 1,
  },
  pageWrapper: {
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center' as any,
  },
  appLogo: {
    width: responsive(232),
    height: responsive(232),
    marginTop: responsive(100),
    marginBottom: responsive(24),
  },
  voiceWaveIcon: {
    width: responsive(232),
    height: responsive(115),
  },
});

