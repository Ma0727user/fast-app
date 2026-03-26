/**
 * FAST - FAQ Screen
 * Tela de Perguntas Frequentes com accordion
 */

import { Colors, FontSizes, Spacing } from "@/constants/theme";
import { getFaqs } from "@/services/authService";
import { Ionicons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View style={styles.faqItem}>
      <TouchableOpacity
        style={styles.faqQuestion}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.questionText}>{question}</Text>
        <Ionicons
          name={isExpanded ? "remove" : "add"}
          size={24}
          color={Colors.primary}
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.faqAnswer}>
          <Text style={styles.answerText}>{answer}</Text>
        </View>
      )}
    </View>
  );
};

export default function FaqScreen() {
  const [faqItems, setFaqItems] = useState<
    { question: string; answer: string }[]
  >([]);
  const [loading, setLoading] = useState(true);

  // Buscar FAQs ao iniciar
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const faqs = await getFaqs();
        // Converter formato da API para formato do componente
        const formattedFaqs = faqs.map((faq) => ({
          question: faq.pergunta,
          answer: faq.resposta,
        }));
        setFaqItems(formattedFaqs);
      } catch (error) {
        console.error("Erro ao buscar FAQs:", error);
        // Mantém array vazio em caso de erro
        setFaqItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "PERGUNTAS FREQUENTES",
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
          {loading ? (
            <Text style={styles.answerText}>A carregar...</Text>
          ) : faqItems.length === 0 ? (
            <Text style={styles.answerText}>Nenhuma pergunta encontrada</Text>
          ) : (
            faqItems.map((item, index) => (
              <FAQItem
                key={index}
                question={item.question}
                answer={item.answer}
              />
            ))
          )}
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
  faqItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  faqQuestion: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  questionText: {
    fontSize: FontSizes.md,
    fontWeight: "600",
    color: Colors.primary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  faqAnswer: {
    paddingBottom: Spacing.md,
  },
  answerText: {
    fontSize: FontSizes.sm,
    color: Colors.secondary,
    lineHeight: 22,
  },
});
