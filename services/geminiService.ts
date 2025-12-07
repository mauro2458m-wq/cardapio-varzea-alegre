import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateEnhancedDescription = async (itemName: string, ingredients: string): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key not found. Returning original text.");
    return `Delicioso ${itemName} feito com ${ingredients}.`;
  }

  try {
    const prompt = `
      Atue como um chef de cozinha experiente e copywriter de cardápios.
      Crie uma descrição curta, apetitosa e vendedora para um item de cardápio.
      Nome do prato: ${itemName}
      Ingredientes/Detalhes básicos: ${ingredients}
      
      A descrição deve ter no máximo 2 frases. Use português do Brasil. Enfatize o sabor e a qualidade.
      Não use aspas na resposta.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || `Delicioso ${itemName} preparado especialmente para você.`;
  } catch (error) {
    console.error("Error generating description:", error);
    return `Delicioso ${itemName} com ${ingredients}.`;
  }
};