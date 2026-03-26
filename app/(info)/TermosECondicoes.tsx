/**
 * FAST - Termos e Condições
 * Tela com texto longo corrido sobre os termos de uso
 */

import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { Stack, useRouter } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text } from "react-native";

export default function TermosECondicoes() {
  const router = useRouter();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "TERMOS E CONDIÇÕES",
          headerTitleStyle: styles.headerTitle,
          headerStyle: styles.header,
          headerTintColor: Colors.primary,
          headerBackTitle: "Voltar",
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          <Text style={styles.title}>TERMOS E CONDIÇÕES</Text>

          <Text style={styles.text}>
            {"\n"}1. Introdução{"\n"}
            Bem-vindo à FAST. Ao utilizar este aplicativo, concorda com os
            seguintes termos e condições. Se não concordar com algum dos termos,
            não utilize os nossos serviços.
            {"\n\n"}2. Definições{"\n"}
            "FAST", "nós", "nosso" refere-se à empresa de comércio eletrónico
            FAST, registrada em Angola. "Utilizador", "você" refere-se à pessoa
            que acessa ou utiliza o aplicativo.
            {"\n\n"}3. Elegibilidade{"\n"}
            Para utilizar os nossos serviços, deve ter pelo menos 18 anos de
            idade e capacidade legal para celebrar contratos.
            {"\n\n"}4. Conta de Utilizador{"\n"}
            Ao criar uma conta, é responsável por manter a confidencialidade da
            sua palavra-passe e pelas atividades realizadas sob a sua conta.
            {"\n\n"}5. Produtos e Preços{"\n"}
            Todos os produtos apresentados estão sujeitos à disponibilidade. Os
            preços são apresentados em Kwanza (Kz) e incluem IVA. Reservamo-nos
            o direito de alterar preços a qualquer momento.
            {"\n\n"}6. Pagamento{"\n"}
            Aceitamos transferência bancária e pagamento na entrega (TPA). O
            pagamento deve ser recebido antes do envio do produto.
            {"\n\n"}7. Entrega{"\n"}A entrega é realizada em todo o território
            nacional de Angola. Os prazos de entrega variam entre 5 a 15 dias
            úteis, dependendo da localização.
            {"\n\n"}8. Devoluções e Reembolsos{"\n"}O utilizador pode devolver
            qualquer produto no prazo de 14 dias após a receção, desde que o
            produto esteja em perfeito estado e na embalagem original.
            {"\n\n"}9. Propriedade Intelectual{"\n"}
            Todo o conteúdo deste aplicativo, incluindo textos, imagens,
            logótipos e design, é propriedade da FAST e está protegido por
            direitos de autor.
            {"\n\n"}10. Limitação de Responsabilidade{"\n"}A FAST não será
            responsável por quaisquer danos indiretos, incidentais ou
            consequenciais decorrentes da utilização do aplicativo.
            {"\n\n"}11. Lei Aplicável{"\n"}
            Estes termos são regidos pelas leis de Angola. Qualquer disputa será
            resolvida pelos tribunais de Luanda.
            {"\n\n"}12. Contacto{"\n"}
            Para qualquer dúvida sobre estes termos, contacte-nos através do
            email: suporte@fast.co.ao
          </Text>

          <Text style={styles.lastUpdate}>Última atualização: Março 2026</Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  header: {
    backgroundColor: Colors.background,
  },
  headerTitle: {
    fontSize: FontSizes.md,
    fontWeight: "700",
    color: Colors.primary,
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: "700",
    color: Colors.primary,
    marginBottom: Spacing.lg,
  },
  text: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    lineHeight: 22,
    textAlign: "justify",
  },
  lastUpdate: {
    fontSize: FontSizes.xs,
    color: Colors.lightGray,
    marginTop: Spacing.xl,
    textAlign: "center",
  },
});
