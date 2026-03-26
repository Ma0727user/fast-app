/**
 * FAST - Payment Confirmation Screen
 * Tela de confirmação de pagamento com polling automático e notificações
 */

import { Button } from "@/components/ui/Button";
import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { PaymentStatus, usePaymentStatus } from "@/hooks/usePaymentStatus";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    AccessibilityInfo,
    Alert,
    Animated,
    Dimensions,
    Easing,
    StyleSheet,
    Text,
    Vibration,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

export default function PaymentConfirmationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Parâmetros do pagamento
  const paymentId = (params.paymentId as string) || "0";
  const valor = parseFloat((params.valor as string) || "0");
  const entidade = (params.entidade as string) || "";
  const referencia = (params.referencia as string) || "";

  // Estado para animação de sucesso
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);

  // Animações
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const rotateAnim = React.useRef(new Animated.Value(0)).current;
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  // Configurações do hook
  const {
    loading,
    paymentStatus,
    error,
    tempoRestante,
    isPolling,
    startPolling,
    pausePolling,
    restartPolling,
    checkPaymentNow,
  } = usePaymentStatus({
    paymentId,
    pollingInterval: 5000,
    maxTimeout: 120000,
    onStatusChange: (status) => {
      // Acessibilidade: anunciar mudança de status
      AccessibilityInfo.announceForAccessibility(
        `Status do pagamento: ${getStatusText(status)}`,
      );
    },
    onSuccess: () => {
      // Vibrar e reproduzir som ao confirmar pagamento
      handlePaymentSuccess();
    },
    onError: (errorMsg) => {
      console.error("[PaymentConfirmation] Erro:", errorMsg);
    },
    onTimeout: () => {
      handleTimeout();
    },
  });

  // Função para tratar pagamento confirmado
  const handlePaymentSuccess = useCallback(() => {
    console.log("[PaymentConfirmation] Pagamento confirmado!");

    // Vibrar dispositivo
    Vibration.vibrate([0, 500, 200, 500]);

    // Mostrar animação de sucesso
    setShowSuccessAnimation(true);

    // Após 2 segundos, navegar para ResumoCompraScreen
    setTimeout(() => {
      router.replace({
        pathname: "/(checkout)/ResumoCompraScreen",
        params: {
          paymentId,
          valor: String(valor),
          entidade,
          referencia,
          status: "PAID",
          data: new Date().toISOString(),
        },
      });
    }, 2000);
  }, [paymentId, valor, entidade, referencia, router]);

  // Função para tratar timeout
  const handleTimeout = useCallback(() => {
    console.log("[PaymentConfirmation] Timeout atingido");
    Alert.alert(
      "Tempo Esgotado",
      "O tempo para confirmação do pagamento foi excedido. Deseja verificar novamente?",
      [
        {
          text: "Verificar Agora",
          onPress: () => restartPolling(),
        },
        {
          text: "Verificar Manualmente",
          style: "cancel",
          onPress: () => {
            router.replace({
              pathname: "/(tabs)/MinhasEncomendasScreen",
            });
          },
        },
      ],
    );
  }, [restartPolling, router]);

  // Animação de pulso para status pendente
  useEffect(() => {
    if (paymentStatus === PaymentStatus.PENDING && isPolling) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [paymentStatus, isPolling, pulseAnim]);

  // Animação de rotação para carregamento
  useEffect(() => {
    if (loading || isPolling) {
      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      rotate.start();
      return () => rotate.stop();
    }
  }, [loading, isPolling, rotateAnim]);

  // Animação de progresso do tempo restante
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: tempoRestante / 120000, // 120000ms = 2 minutos
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [tempoRestante, progressAnim]);

  // Iniciar polling ao montar componente
  useEffect(() => {
    startPolling();

    // Cleanup ao desmontar
    return () => {
      pausePolling();
    };
  }, []);

  // Função para formatar tempo restante
  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  // Obter texto do status
  const getStatusText = (status: PaymentStatus): string => {
    switch (status) {
      case PaymentStatus.PENDING:
        return "Aguardando confirmação";
      case PaymentStatus.PAID:
        return "Pagamento confirmado";
      case PaymentStatus.FAILED:
        return "Pagamento falhou";
      case PaymentStatus.EXPIRED:
        return "Pagamento expirou";
      default:
        return "Status desconhecido";
    }
  };

  // Obter ícone do status
  const getStatusIconName = (status: PaymentStatus): any => {
    switch (status) {
      case PaymentStatus.PENDING:
        return "sync-outline";
      case PaymentStatus.PAID:
        return "checkmark-circle";
      case PaymentStatus.FAILED:
        return "close-circle";
      case PaymentStatus.EXPIRED:
        return "alert-circle";
      default:
        return "help-circle";
    }
  };

  // Obter cor do status
  const getStatusColor = (status: PaymentStatus): string => {
    switch (status) {
      case PaymentStatus.PENDING:
        return Colors.warning;
      case PaymentStatus.PAID:
        return Colors.success;
      case PaymentStatus.FAILED:
        return Colors.error;
      case PaymentStatus.EXPIRED:
        return Colors.secondary;
      default:
        return Colors.primary;
    }
  };

  // Interpolar rotação
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>CONFIRMAÇÃO</Text>
        <Text style={styles.subtitle}>Aguarde a confirmação do pagamento</Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        {/* Animated Icon */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              transform: [{ scale: pulseAnim }],
              backgroundColor: getStatusColor(paymentStatus) + "20",
            },
          ]}
        >
          {paymentStatus === PaymentStatus.PENDING ? (
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons
                name="sync-outline"
                size={64}
                color={getStatusColor(paymentStatus)}
              />
            </Animated.View>
          ) : paymentStatus === PaymentStatus.PAID ? (
            <Ionicons
              name="checkmark-circle"
              size={64}
              color={getStatusColor(paymentStatus)}
            />
          ) : (
            <Ionicons
              name={getStatusIconName(paymentStatus)}
              size={64}
              color={getStatusColor(paymentStatus)}
            />
          )}
        </Animated.View>

        {/* Status Text */}
        <Text
          style={[styles.statusText, { color: getStatusColor(paymentStatus) }]}
        >
          {getStatusText(paymentStatus)}
        </Text>

        {/* Payment Info */}
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentLabel}>Valor</Text>
          <Text style={styles.paymentValue}>
            {valor.toLocaleString("pt-AO", {
              style: "currency",
              currency: "AOA",
            })}
          </Text>
        </View>

        {entidade ? (
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>Entidade</Text>
            <Text style={styles.paymentValue}>{entidade}</Text>
          </View>
        ) : null}

        {referencia ? (
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>Referência</Text>
            <Text style={styles.paymentValue}>{referencia}</Text>
          </View>
        ) : null}
      </View>

      {/* Progress Bar / Time Remaining */}
      {paymentStatus === PaymentStatus.PENDING && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>
            Tempo restante: {formatTime(tempoRestante)}
          </Text>
          <View style={styles.progressBar}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"],
                  }),
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Error Message */}
      {error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={24} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {paymentStatus === PaymentStatus.PENDING && (
          <>
            <Button
              title="Verificar Agora"
              onPress={checkPaymentNow}
              disabled={loading}
            />
            <View style={styles.buttonSpacer} />
            <Button
              title="Verificar Manualmente"
              onPress={() => {
                pausePolling();
                router.replace("/(tabs)/MinhasEncomendasScreen");
              }}
            />
          </>
        )}

        {(paymentStatus === PaymentStatus.FAILED ||
          paymentStatus === PaymentStatus.EXPIRED) && (
          <Button title="Tentar Novamente" onPress={restartPolling} />
        )}
      </View>

      {/* Support Info */}
      <View style={styles.supportInfo}>
        <Text style={styles.supportText}>Precisa de ajuda? Contacte-nos:</Text>
        <Text style={styles.supportContact}>suporte@fast.co.ao</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.secondary,
    marginTop: Spacing.sm,
  },
  statusCard: {
    margin: Spacing.lg,
    padding: Spacing.xl,
    backgroundColor: Colors.white,
    borderRadius: 16,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  statusText: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    marginBottom: Spacing.lg,
  },
  paymentInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  paymentLabel: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
  },
  paymentValue: {
    fontSize: FontSizes.sm,
    fontWeight: "600",
    color: Colors.primary,
  },
  progressContainer: {
    padding: Spacing.lg,
  },
  progressLabel: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.error,
  },
  actions: {
    padding: Spacing.lg,
  },
  buttonSpacer: {
    height: Spacing.md,
  },
  supportInfo: {
    padding: Spacing.lg,
    alignItems: "center",
  },
  supportText: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
  },
  supportContact: {
    fontSize: FontSizes.sm,
    color: Colors.primary,
    fontWeight: "600",
    marginTop: Spacing.xs,
  },
});
