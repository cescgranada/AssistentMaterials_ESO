
import { GoogleGenAI, Type } from "@google/genai";
import { MaterialParams, TopicConfig, GeneratedMaterial } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Fase 1: Anàlisi d'estructura (Índex fidel)
 */
export const analyzeContentParts = async (fileText: string, manualText: string): Promise<{ title: string; snippet: string }[]> => {
  const model = "gemini-3-flash-preview";
  const prompt = `
    TASCA: Analitzar el document i extreure'n una Taula de Continguts (Índex) autònoma i fidel.
    INSTRUCCIONS:
    1. Identifica els títols principals.
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

/**
 * Generació de l'esquema o imatge IA per a la teoria
 */
export const generateAIImage = async (prompt: string): Promise<string> => {
  const imageAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await imageAI.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `Diagrama educatiu professional per a l'ESO: ${prompt}. Net, didàctic.` }],
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

/**
 * Fase 2: Generació de contingut (Protocol ESO v3)
 */
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
    PROTOCOL D'OBEDIÈNCIA: Ets un motor de materials didàctics ESO.
    
    ESTILS OBLIGATORIS:
    - Títol principal de cada document: [MAIN_TITLE] Calibri 18pt Negreta.
    - Subtítols de secció: Calibri 14pt Negreta.
    - Text general: Calibri 12pt Normal.
    - NO usis MAI '$'. NO LaTeX en la resposta.
    
    ESTRUCTURA DE CADA BLOC:
    - Bloc 1: Títol general sense número.
    - Bloc 2 en endavant: Comença per "1. [Nom]", "2. [Nom]", etc. (eliminant qualsevol número previ del document original).
    
    LLISTAT EXERCICIS:
    - Format llista bullet (*) però sense el punt o bala visible.
    - Numeració: [Núm. Bloc].[Núm. Exercici]. [Enunciat]
    
    SOLUCIONARIS:
    - Deben contenir l'enunciat original i la resolució PAS A PAS ben explicada.
    
    TAULA CURRICULAR:
    | Competències específiques | Sabers bàsics | Taxonomia de bloom | Principis de la DUA | Quins exercicis hi ha per fer-ho |
    
    TAGS DE SORTIDA:
    [GENERAL_START]
    [MAIN_TITLE] Material Alumnat: ${params.subject}
    [ADAPTACIO_START]
    [MAIN_TITLE] Material Adaptat DUA: ${params.subject}
    [PEDAGOGIA_START]
    [MAIN_TITLE] Taula de Programació
    [SOL_GENERAL_START]
    [MAIN_TITLE] Solucionari Detallat
    [SOL_ADAPTADA_START]
    [MAIN_TITLE] Solucionari Adaptat Detallat
    
    TEMES:
    ${topicsJson}
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: params.settings.model,
      contents: prompt,
      config: {
        systemInstruction: "Ets un motor de generació determinista d'ESO. No usis mai '$'. Títols 18pt Negreta. Subtítols 14pt Negreta. Text 12pt Normal. Exercicis numerats X.Y. sense bales.",
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
    throw new Error("Error en la generació.");
  }
};
