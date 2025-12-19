
import { GoogleGenAI, Type } from "@google/genai";
import { MaterialParams, TopicConfig, GeneratedMaterial } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeContentParts = async (fileText: string, manualText: string): Promise<{ title: string; snippet: string }[]> => {
  const model = "gemini-3-flash-preview";
  const prompt = `
    TASCA: Analitzar el document i extreure'n una Taula de Continguts (Índex) autònoma i fidel per a una unitat didàctica d'ESO.
    INSTRUCCIONS:
    1. Identifica els títols principals del document o de la descripció.
    2. Retorna un JSON format per un array d'objectes amb "title" i "snippet".
    
    TEXT: ${fileText.substring(0, 15000)}
    DESCRIPCIÓ MANUAL: ${manualText}
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            snippet: { type: Type.STRING }
          },
          required: ["title", "snippet"]
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [{ title: "Contingut Principal", snippet: "Anàlisi general del document." }];
  }
};

export const generateAIImage = async (prompt: string): Promise<string> => {
  const imageAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await imageAI.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `Diagrama educatiu professional per a l'ESO: ${prompt}. Estil net, fons blanc.` }],
    },
    config: {
      imageConfig: { aspectRatio: "16:9" }
    },
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No imatge");
};

export const generateMaterialStream = async (
  params: MaterialParams,
  onUpdate: (material: GeneratedMaterial) => void
): Promise<void> => {
  const selectedTopics = params.topics.filter(t => t.isIncluded);
  const topicsJson = JSON.stringify(selectedTopics.map((t, idx) => ({
    bloc_num: idx + 1,
    títol_original: t.title,
    títol_formatat: idx === 0 ? t.title : `${idx}. ${t.title.replace(/^\d+[\s.]*/, '')}`,
    teoria: t.theory,
    sistematitzacio: t.systematizationCount,
    ampliacio: t.extensionCount,
    adaptat: t.isAdapted
  })), null, 2);

  const prompt = `
    DIRECTRIUS DE FORMAT OBLIGATÒRIES PER A MICROSOFT WORD:
    
    1. Títols Principals: Usa Markdown "# Títol". (Això es renderitzarà com a Calibri 18, Negreta).
    2. Subtítols: Usa Markdown "## Subtítol". (Això es renderitzarà com a Calibri 14, Negreta).
    3. Cos del text: Text estàndard sense marques. (Això es renderitzarà com a Calibri 12, Estàndard).
    
    ESTRUCTURA DE CONTINGUT:
    - Bloc 1: Títol general sense número.
    - Bloc 2 en endavant: "1. [Nom]", "2. [Nom]", etc.
    - Exercicis: Llista bullet markdown (*) amb numeració interna X.Y. (Ex: "* 1.1. Calcula...").
    
    TAULA CURRICULAR: Genera una TAULA MARKDOWN amb 5 columnes: 
    | Competències específiques | Sabers bàsics | Taxonomia de bloom | Principis de la DUA | Quins exercicis hi ha per fer-ho |
    
    REGLA DE CONSISTÈNCIA: Aplica aquesta jerarquia en tots i cadascun dels documents.
    
    NOTA DE CONTROL DE QUALITAT AL FINAL DE CADA RESPOSTA:
    "📏 Format de document a punt per a Word: Títol (C18B), Subtítols (C14B), Cos (C12)."

    TAGS DE SORTIDA: [GENERAL_START], [ADAPTACIO_START], [PEDAGOGIA_START], [SOL_GENERAL_START], [SOL_ADAPTADA_START].
    Cada secció ha de començar amb [MAIN_TITLE] i el títol en format "# Títol".
    
    TEMES: ${topicsJson}
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: params.settings.model,
      contents: prompt,
      config: {
        systemInstruction: "Ets un motor de generació didàctica ESO. Títols # (18pt), Subtítols ## (14pt), Text (12pt). Taules markdown. Afegeix nota de control.",
        temperature: params.settings.temperature,
      }
    });

    let fullAccumulated = "";
    for await (const chunk of responseStream) {
      if (chunk.text) {
        fullAccumulated += chunk.text;
        const [_, rest0] = fullAccumulated.split('[GENERAL_START]');
        const [genPart, rest1] = (rest0 || "").split('[ADAPTACIO_START]');
        const [adapPart, rest2] = (rest1 || "").split('[PEDAGOGIA_START]');
        const [pedPart, rest3] = (rest2 || "").split('[SOL_GENERAL_START]');
        const [solGenPart, solAdapPart] = (rest3 || "").split('[SOL_ADAPTADA_START]');
        
        onUpdate({
          general: genPart?.trim() || "",
          adapted: adapPart?.trim() || "",
          pedagogical: pedPart?.trim() || "",
          solGeneral: solGenPart?.trim() || "",
          solAdapted: solAdapPart?.trim() || "",
          hasAdaptedVersion: selectedTopics.some(t => t.isAdapted)
        });
      }
    }
  } catch (error) {
    throw new Error("Error de motor IA.");
  }
};
