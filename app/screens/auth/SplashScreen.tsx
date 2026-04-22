/**
 * FAST - Splash Screen Route
 * Tela de splash dedicada com verificação de sessão automática
 */

import {
    checkAndRefreshToken,
    getToken,
    getUser,
} from "@/services/authService";
import { useStore } from "@/store/useStore";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SplashScreenRoute() {
  const router = useRouter();
  const setUser = useStore((state) => state.setUser);
  const [isChecking, setIsChecking] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.96)).current;
  const screenOpacity = useRef(new Animated.Value(1)).current;

  const navegarComFade = useCallback(
    (rota: "/(tabs)") => {
      if (isNavigating) return;

      setIsNavigating(true);
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        router.replace(rota);
      });
    },
    [isNavigating, router, screenOpacity],
  );

  const verificarSessao = useCallback(async () => {
    const tempoMinimo = new Promise<void>((resolve) =>
      setTimeout(resolve, 4000),
    );

    try {
      const [tokenValido] = await Promise.all([
        checkAndRefreshToken(),
        tempoMinimo,
      ]);

      if (tokenValido) {
        const userData = await getUser();
        const token = await getToken();

        if (userData && token) {
          setUser(
            {
              id: userData.id,
              name: userData.name,
              phone: userData.phone,
              email: userData.email,
              addresses: userData.addresses || [],
            },
            token,
          );
        }
      }

      navegarComFade("/(tabs)");
    } catch (error) {
      await tempoMinimo;
      console.error("Erro ao verificar sessão:", error);
      navegarComFade("/(tabs)");
    } finally {
      setIsChecking(false);
    }
  }, [navegarComFade, setUser]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();

    verificarSessao();
  }, [logoOpacity, logoScale, verificarSessao]);

  if (isChecking || isNavigating) {
    return (
      <SafeAreaView style={styles.container}>
        <Animated.View
          style={[
            styles.container,
            { opacity: screenOpacity },
            {
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <Animated.View
            style={{
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            }}
          >
            <Image
              source={require("@/assets/images/fast-logo-white.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    );
  }

  return <SafeAreaView style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 210,
    height: 84,
  },
});
