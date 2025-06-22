import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

const Splash = () => {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/login');
    }, 2500); // 2.5 seconds

    return () => clearTimeout(timer);
  }, [router, scaleAnim, opacityAnim]);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: opacityAnim, transform: [{ scale: scaleAnim }] }}>
        <Image
          source={require('../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
  },
});

export default Splash; 