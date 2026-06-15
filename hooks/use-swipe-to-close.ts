import { useRef, useMemo, useCallback } from 'react';
import { Animated, PanResponder, Dimensions } from 'react-native';

export function useSwipeToClose(onClose: () => void) {
  const translateY = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get('window').height;

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gs) => gs.dy > 5,
    onPanResponderGrant: () => {
      translateY.setOffset(0);
      translateY.setValue(0);
    },
    onPanResponderMove: (_, gs) => {
      if (gs.dy > 0) {
        translateY.setValue(gs.dy * 0.8);
      }
    },
    onPanResponderRelease: (_, gs) => {
      translateY.flattenOffset();
      if (gs.dy > 100 || gs.vy > 0.5) {
        Animated.timing(translateY, {
          toValue: screenHeight,
          duration: 200,
          useNativeDriver: true,
        }).start(() => onClose());
      } else {
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
        }).start();
      }
    },
  }), [onClose, screenHeight]);

  const closeWithAnimation = useCallback(() => {
    Animated.timing(translateY, {
      toValue: screenHeight,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onClose());
  }, [onClose, translateY, screenHeight]);

  return { translateY, panResponder, closeWithAnimation };
}
