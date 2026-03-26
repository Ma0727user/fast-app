/**
 * FAST - Splash Screen
 * Tela inicial com verificação de sessão automática
 */

import { Colors } from "@/constants/theme";
import {
  checkAndRefreshToken,
  getToken,
  getUser,
} from "@/services/authService";
import { useStore } from "@/store/useStore";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, View } from "react-native";

export default function SplashScreen() {
  const router = useRouter();
  const setUser = useStore((state) => state.setUser);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    verificarSessao();
  }, []);

  const verificarSessao = async () => {
    try {
      // Verificar e atualizar token automaticamente (refresh)
      const tokenValido = await checkAndRefreshToken();

      if (tokenValido) {
        // Restaurar dados do usuário
        const userData = await getUser();
        // Buscar token do SecureStore
        const token = await getToken();
        if (userData && token) {
          // Atualizar store com usuário e token salvos
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
          console.log("Sessão restaurada para:", userData.name, "com token");

          // Redirecionar para Home (usuário já logado)
          router.replace("/(tabs)");
          return;
        }
      }

      // Se não há token ou dados inválidos, ir para login
      router.replace("/login");
    } catch (error) {
      console.error("Erro ao verificar sessão:", error);
      router.replace("/login");
    } finally {
      setIsChecking(false);
    }
  };

  // Se ainda está verificando, mostrar splash
  // Caso contrário, o router.replace já redirecionou
  if (isChecking) {
    return (
      <View style={styles.container}>
        <Image
          source={require("@/assets/images/fast-logo-white.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    );
  }

  // Este componente não deveria renderizar nada após verificação
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 200,
    height: 80,
  },
});
