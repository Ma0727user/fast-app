/**
 * FAST - Transferência Screen
 * Instruções para transferência bancária e upload do comprovativo
 */

import { ModalFeedback } from "@/components/ModalFeedback";
import { Button } from "@/components/ui/Button";
import { Colors, FontSizes, formatPrice, Spacing } from "@/constants/theme";
import { getStoreData, StoreData } from "@/services/authService";
import {
  FileInfo,
  uploadComprovativo,
  validarArquivo,
} from "@/services/uploadService";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const VALOR_TOTAL = 75032;

export default function TransferenciaScreen() {
  const router = useRouter();
  const [comprovativo, setComprovativo] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [storeData, setStoreData] = useState<StoreData | null>(null);
  const [loadingStore, setLoadingStore] = useState(true);

  // Buscar dados da loja ao iniciar
  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const data = await getStoreData();
        setStoreData(data);
      } catch (error) {
        console.error("Erro ao buscar dados da loja:", error);
      } finally {
        setLoadingStore(false);
      }
    };
    fetchStoreData();
  }, []);

  // Estados do Modal de Feedback
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"success" | "error">("success");
  const [modalMessage, setModalMessage] = useState("");

  const handleCopyIBAN = () => {
    // Implementar lógica de copiar
  };

  // Função para selecionar imagem
  const handleSelecionarComprovativo = async () => {
    try {
      // Solicitar permissão
      const permissao = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissao.granted) {
        setModalType("error");
        setModalMessage(
          "É necessário permitir acesso à galeria para selecionar imagens.",
        );
        setModalVisible(true);
        return;
      }

      // Abrir seletor de imagens
      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        selectionLimit: 1,
      });

      if (!resultado.canceled && resultado.assets[0]) {
        const asset = resultado.assets[0];

        // Criar objeto FileInfo
        const file: FileInfo = {
          uri: asset.uri,
          type: asset.mimeType || "image/jpeg",
          name: asset.fileName || "comprovativo.jpg",
          size: asset.fileSize,
        };

        // Validar arquivo
        const validacao = validarArquivo(file);
        if (!validacao.valido) {
          setModalType("error");
          setModalMessage(validacao.erro || "Arquivo inválido");
          setModalVisible(true);
          return;
        }

        setComprovativo(asset.uri);
        setFileInfo(file);
      }
    } catch (error) {
      console.error("Erro ao selecionar imagem:", error);
      setModalType("error");
      setModalMessage("Erro ao selecionar imagem. Tente novamente.");
      setModalVisible(true);
    }
  };

  // Função para enviar comprovativo
  const handleEnviar = async () => {
    if (!fileInfo) {
      setModalType("error");
      setModalMessage("Por favor, selecione o comprovativo da transferência.");
      setModalVisible(true);
      return;
    }

    try {
      setIsUploading(true);

      // ID da encomenda (deve ser passado via route params ou store)
      const encomendaId = "1"; // TODO: Obter da navegação ou store

      await uploadComprovativo(encomendaId, fileInfo);

      // Sucesso
      setModalType("success");
      setModalMessage(
        "Comprovativo enviado com sucesso! A sua encomenda será processada em breve.",
      );
      setModalVisible(true);

      // Redirecionar após sucesso
      setTimeout(() => {
        router.replace("/(tabs)/MinhasEncomendasScreen");
      }, 2000);
    } catch (error: any) {
      console.error("Erro ao enviar comprovativo:", error);

      // Tratamento de erros baseado no código HTTP
      const erroMessage = error.message || "Erro desconhecido";
      setModalType("error");
      setModalMessage(erroMessage);
      setModalVisible(true);
    } finally {
      setIsUploading(false);
    }
  };

  // Função para fechar modal
  const handleModalClose = () => {
    setModalVisible(false);
    if (modalType === "success") {
      router.replace("/(tabs)/MinhasEncomendasScreen");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>{"<"} Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>TRANSFERÊNCIA BANCÁRIA</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Instruções */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>FAÇA A TRANSFERÊNCIA</Text>
          <Text style={styles.instructionText}>
            Faça a transferência para o IBAN abaixo. Após a transferência, anexe
            o comprovativo para confirmarmos o pagamento.
          </Text>
        </View>

        {/* IBAN */}
        <View style={styles.ibanContainer}>
          <Text style={styles.ibanLabel}>IBAN PARA TRANSFERÊNCIA</Text>
          <View style={styles.ibanBox}>
            <Text style={styles.ibanText}>
              {storeData?.iban || "A carregar..."}
            </Text>
            <TouchableOpacity
              onPress={handleCopyIBAN}
              style={styles.copyButton}
            >
              <Ionicons name="copy-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Valor */}
        <View style={styles.valorContainer}>
          <Text style={styles.valorLabel}>VALOR A TRANSFERIR</Text>
          <Text style={styles.valorText}>{formatPrice(VALOR_TOTAL)}</Text>
        </View>

        {/* Informações do Banco */}
        <View style={styles.bankInfoCard}>
          <Text style={styles.bankInfoTitle}>INFORMAÇÕES DO BANCO</Text>
          <Text style={styles.bankInfoText}>
            Titular: {storeData?.titular || "A carregar..."}
          </Text>
          <Text style={styles.bankInfoText}>
            Loja: {storeData?.nome_loja || "A carregar..."}
          </Text>
        </View>

        {/* Upload do Comprovativo */}
        <View style={styles.uploadContainer}>
          <Text style={styles.uploadLabel}>COMPROVATIVO DA TRANSFERÊNCIA</Text>
          <TouchableOpacity
            style={[
              styles.uploadButton,
              comprovativo && styles.uploadButtonSelected,
            ]}
            onPress={handleSelecionarComprovativo}
          >
            {comprovativo ? (
              <Image
                source={{ uri: comprovativo }}
                style={styles.comprovativoPreview}
                resizeMode="cover"
              />
            ) : (
              <>
                <Ionicons
                  name="cloud-upload-outline"
                  size={32}
                  color={Colors.primary}
                />
                <Text style={styles.uploadText}>
                  Toque para anexar o comprovativo
                </Text>
                <Text style={styles.uploadSubtext}>
                  JPG, PNG ou PDF (máx. 5MB)
                </Text>
              </>
            )}
          </TouchableOpacity>
          {comprovativo && (
            <TouchableOpacity
              style={styles.changeImageButton}
              onPress={handleSelecionarComprovativo}
            >
              <Text style={styles.changeImageText}>Alterar Imagem</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notas */}
        <View style={styles.notesContainer}>
          <Text style={styles.notesText}>
            Após a confirmação do pagamento, a sua encomenda será processada. O
            prazo de entrega começa a contar após a confirmação.
          </Text>
        </View>
      </ScrollView>

      {/* Botão Fixo no Rodapé */}
      <View style={styles.footerButton}>
        <Button
          title={isUploading ? "A enviar..." : "Enviar Comprovativo"}
          onPress={handleEnviar}
          disabled={isUploading}
        />
      </View>

      {/* Modal de Feedback */}
      <ModalFeedback
        visible={modalVisible}
        variant={modalType}
        message={modalMessage}
        confirmText={modalType === "success" ? "OK" : "Fechar"}
        onConfirm={handleModalClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  backButton: {
    fontSize: FontSizes.md,
    color: Colors.primary,
    fontWeight: "600",
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
  },
  placeholder: {
    width: 60,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 120,
  },
  instructionCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  instructionTitle: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  instructionText: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    lineHeight: 22,
  },
  ibanContainer: {
    marginBottom: Spacing.lg,
  },
  ibanLabel: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  ibanBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: Spacing.md,
  },
  ibanText: {
    fontSize: FontSizes.lg,
    fontWeight: "600",
    color: Colors.primary,
    letterSpacing: 1,
  },
  copyButton: {
    padding: Spacing.xs,
  },
  valorContainer: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
    backgroundColor: Colors.primary,
    marginBottom: Spacing.lg,
  },
  valorLabel: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    opacity: 0.8,
  },
  valorText: {
    fontSize: FontSizes.xxl,
    fontWeight: "700",
    color: Colors.white,
    letterSpacing: 1,
  },
  bankInfoCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  bankInfoTitle: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  bankInfoText: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    lineHeight: 22,
  },
  uploadContainer: {
    marginBottom: Spacing.lg,
  },
  uploadLabel: {
    fontSize: FontSizes.sm,
    fontWeight: "700",
    color: Colors.primary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  uploadButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.lightGray,
    borderStyle: "dashed",
    padding: Spacing.xl,
  },
  uploadButtonSelected: {
    borderStyle: "solid",
    borderColor: Colors.success,
  },
  comprovativoPreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  changeImageButton: {
    marginTop: Spacing.sm,
    alignItems: "center",
  },
  changeImageText: {
    color: Colors.primary,
    fontSize: FontSizes.sm,
    textDecorationLine: "underline",
  },
  uploadText: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
    marginTop: Spacing.sm,
  },
  uploadSubtext: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    marginTop: Spacing.xs,
  },
  notesContainer: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    padding: Spacing.md,
  },
  notesText: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    lineHeight: 22,
    textAlign: "center",
  },
  footerButton: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
});
