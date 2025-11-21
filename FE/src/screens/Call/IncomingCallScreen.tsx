import React, { useCallback, useEffect, useState } from 'react';
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
import { CallButton } from '../../components/CallButtons';
import responsive from '../../utils/responsive';

interface IncomingCallScreenProps {
  onAccept?: () => void;
  onDecline?: () => void;
}

export const IncomingCallScreen = React.memo(({
  onAccept,
  onDecline,
}: IncomingCallScreenProps) => {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const MAX_WIDTH = isTablet ? 420 : 360;
  const [isInteractionComplete, setIsInteractionComplete] = useState(false);

  useEffect(() => {
    const interactionPromise = InteractionManager.runAfterInteractions(() => {
      setIsInteractionComplete(true);
      console.log('IncomingCallScreen: Interactions complete');
    });

    return () => interactionPromise.cancel();
  }, []);

  const handleAccept = useCallback(() => {
    console.log('통화 수락');
    onAccept?.();
  }, [onAccept]);

  const handleDecline = useCallback(() => {
    console.log('통화 거절');
    onDecline?.();
  }, [onDecline]);

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
        </View>
      </ScrollView>
      
      {/* 하단 고정 버튼 */}
      <View style={styles.callActionContainer}>
        {/* Accept Button (초록색) - 왼쪽 */}
        <CallButton type="accept" onPress={handleAccept} />
        
        {/* Decline Button (빨간색) - 오른쪽 */}
        <CallButton type="decline" onPress={handleDecline} />
      </View>
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
  },
  callActionContainer: {
    position: 'absolute',
    left: responsive(16),
    right: responsive(16),
    bottom: responsive(86),
    flexDirection: 'row' as any,
    alignItems: 'center' as any,
    justifyContent: 'center' as any,
    height: responsive(80),
    gap: responsive(116),
  },
});

