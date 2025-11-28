import React, { useRef } from 'react';
import { ScrollView, ScrollViewProps, Platform, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

interface PinchZoomScrollViewProps extends ScrollViewProps {
  children: React.ReactNode;
  minZoom?: number;
  maxZoom?: number;
}

// react-native-reanimated 3.x에서는 ScrollView를 직접 createAnimatedComponent로 감싸기
// ScrollView는 React Native의 네이티브 컴포넌트이므로 직접 사용 가능 (함수 컴포넌트가 아님)
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);

const PinchZoomScrollView: React.FC<PinchZoomScrollViewProps> = ({
  children,
  minZoom = 1,
  maxZoom = 3,
  ...scrollViewProps
}) => {
  const pinchRef = useRef(null);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const scrollEnabled = useSharedValue(true);

  const onPinchGestureEvent = (event: any) => {
    'worklet';
    const newScale = Math.max(minZoom, Math.min(maxZoom, savedScale.value * event.nativeEvent.scale));
    scale.value = newScale;
    scrollEnabled.value = scale.value === 1;
  };

  const onPinchHandlerStateChange = (event: any) => {
    'worklet';
    if (event.nativeEvent.oldState === State.ACTIVE) {
      savedScale.value = scale.value;
      if (scale.value < 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
      }
      scrollEnabled.value = scale.value === 1;
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const scrollViewStyle = useAnimatedStyle(() => {
    return {
      flex: 1,
    };
  });

  // iOS에서는 ScrollView의 기본 zoom 기능 사용
  if (Platform.OS === 'ios') {
    return (
      <ScrollView
        {...scrollViewProps}
        minimumZoomScale={minZoom}
        maximumZoomScale={maxZoom}
        showsVerticalScrollIndicator={scrollViewProps.showsVerticalScrollIndicator ?? true}
        showsHorizontalScrollIndicator={scrollViewProps.showsHorizontalScrollIndicator ?? false}
      >
        {children}
      </ScrollView>
    );
  }

  // Android에서는 GestureHandler와 Reanimated 사용
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PinchGestureHandler
        ref={pinchRef}
        onGestureEvent={onPinchGestureEvent}
        onHandlerStateChange={onPinchHandlerStateChange}
        simultaneousHandlers={[]}
      >
        <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
          <AnimatedScrollView
            {...scrollViewProps}
            showsVerticalScrollIndicator={scrollViewProps.showsVerticalScrollIndicator ?? true}
            showsHorizontalScrollIndicator={scrollViewProps.showsHorizontalScrollIndicator ?? false}
            style={scrollViewStyle}
          >
            {children}
          </AnimatedScrollView>
        </Animated.View>
      </PinchGestureHandler>
    </GestureHandlerRootView>
  );
};

export default PinchZoomScrollView;
