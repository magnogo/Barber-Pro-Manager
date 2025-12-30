
import { GoogleGenAI } from "@google/genai";

export const generateWhatsAppMessage = async (
  barbershopName: string,
  tone: 'friendly' | 'formal' | 'trendy',
  type: 'welcome' | 'confirmation'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Você é um assistente de marketing para uma barbearia chamada "${barbershopName}".
    Escreva uma mensagem curta e envolvente para WhatsApp do tipo: ${type} (boas-vindas ou confirmação).
    Tom: ${tone}.
    Idioma: Português do Brasil.
    ${type === 'welcome' ? 'Inclua um placeholder para o nome do cliente.' : 'Inclua placeholders para confirmar detalhes do agendamento (data/hora).'}
    Não use formatação markdown, apenas texto simples com emojis.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "Não foi possível gerar a mensagem.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Erro ao gerar mensagem. Tente novamente.";
  }
};

export const analyzeDailyPerformance = async (
  appointmentsCount: number,
  revenue: number,
  services: string[]
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Analise o desempenho diário desta barbearia:
    - Agendamentos: ${appointmentsCount}
    - Receita Estimada: R$${revenue}
    - Principais Serviços: ${services.join(', ')}
    
    Dê um insight motivacional ou dica de 1 frase para o dono.
    Idioma: Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "Bom trabalho hoje!";
  } catch (error) {
    return "Continue com o bom trabalho!";
  }
};

export const analyzeClientBaseMarketing = async (
  stats: {
    total: number,
    vips: number,
    atRisk: number,
    newOnes: number,
    topService: string
  }
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Analise esta base de clientes de uma barbearia e sugira uma campanha de marketing curta (max 40 palavras):
    - Total de Clientes: ${stats.total}
    - Clientes VIP (Fiéis): ${stats.vips}
    - Clientes Em Risco (Não voltam há tempos): ${stats.atRisk}
    - Novos Clientes (Este mês): ${stats.newOnes}
    - Serviço mais vendido: ${stats.topService}
    
    Sugira uma ação prática para aumentar a recorrência.
    Idioma: Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "Crie um programa de fidelidade para seus clientes VIP!";
  } catch (error) {
    return "Analise seus clientes inativos e ofereça um cupom de retorno!";
  }
};

export const getClientRetentionStrategy = async (
  clientName: string,
  totalSpent: number,
  topService: string,
  favDay: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    Crie uma estratégia de retenção personalizada para o cliente "${clientName}":
    - Valor total já gasto: R$ ${totalSpent}
    - Serviço favorito: ${topService}
    - Costuma vir aos: ${favDay}
    
    Dê uma dica de 1 frase de como o barbeiro pode oferecer um plano de assinatura para ele na próxima visita.
    Idioma: Português do Brasil.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "Ofereça um pacote mensal com desconto.";
  } catch (error) {
    return "Mostre as vantagens de ser um cliente recorrente.";
  }
};
