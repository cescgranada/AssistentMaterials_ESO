import { GoogleGenAI, Type } from "@google/genai";
import { MaterialParams, TopicConfig, GeneratedMaterial } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Fase 1: Extracció d'Índex i Aprofundiment Interactiu
 */
export const analyzeContentParts = async (fileText: string, manualText: string): Promise<{ title: string; snippet: string }[]> => {
  const model = "gemini-3-flash-preview";
  
  const prompt = `Rol: Analista de documents i expert en disseny curricular.
    Identifica els apartats principals per crear una unitat didàctica de l'ESO.
    TEXT: ${fileText.substring(0, 10000)}
    DESCRIPCIÓ: ${manualText}
    Retorna un JSON amb un array d'objectes: "title" i "snippet".`;

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
    return [{ title: "Contingut General", snippet: "Basat en el document." }];
  }
};

/**
 * Genera una imatge basada en un prompt
 */
export const generateAIImage = async (prompt: string): Promise<string> => {
  const imageAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await imageAI.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [{ text: `Professional educational diagram or photo for ESO students: ${prompt}. High quality, clear, white background if it is a scheme.` }],
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
  throw new Error("No s'ha pogut generar la imatge");
};

/**
 * Fase 2: Generació del material basat en la configuració granular
 */
export const generateMaterialStream = async (
  params: MaterialParams,
  onUpdate: (material: GeneratedMaterial) => void
): Promise<void> => {
  const model = "gemini-3-pro-preview";
  
  const selectedTopics = params.topics.filter(t => t.isIncluded);
  const topicsJson = JSON.stringify(selectedTopics.map((t, idx) => ({
    num_apartat: idx + 1,
    títol: t.title,
    teoria: t.theory,
    sistematitzacio: t.systematizationCount,
    ampliacio: t.extensionCount,
    adaptacio: t.isAdapted
  })), null, 2);

  const prompt = `
    Ets un expert en disseny de materials per a l'ESO (${params.subject}, ${params.grade}).
    
    REGLA D'OR DE NUMERACIÓ:
    Totes les llistes d'exercicis s'han de presentar amb numeració composta jeràrquica vertical.
    Format: [Número d'Apartat].[Número d'Exercici]. [Enunciat] (Res: [Resultat])
    Exemple: 1.1. Calcula la massa... (Res: 5kg)
             1.2. Calcula la velocitat... (Res: 2m/s)
             2.1. Defineix la cèl·lula...
    
    REQUISITS DE TEORIA I VISUALS:
    - Quan la teoria sigui "detallada", HAS D'AFEGIR esquemes i imatges.
    - Per a cada esquema o imatge, inserta exactament aquest tag: [VISUAL: Descripció detallada del que ha de mostrar el diagrama o la foto]. 
    - No posis el tag dins de blocs de codi. Posa'l entre paràgrafs.
    
    REQUISITS DE CURRÍCULUM:
    - Al resum pedagògic, Competències i Sabers s'han d'escriure en la seva TOTALITAT (Codi + Text íntegre oficial).
    
    SOLUCIONARIS:
    - Escriu l'enunciat original seguit de la resolució pas a pas detallada.
    
    CONFIGURACIÓ:
    ${topicsJson}
    
    ESTRUCTURA (5 documents separats per: [ADAPTACIO_START], [PEDAGOGIA_START], [SOL_GENERAL_START], [SOL_ADAPTADA_START]):
    1. [GENERAL] (amb [VISUAL: ...] i numeració X.Y.)
    2. [ADAPTAT]
    3. [RESUM PEDAGÒGIC] (Taula amb TEXT COMPLET de competències i sabers)
    4. [SOLUCIONARI BASE] (Enunciat + Solució pas a pas)
    5. [SOLUCIONARI ADAPTAT] (Enunciat + Solució pas a pas)
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: model,
      contents: prompt,
      config: {
        systemInstruction: "Ets un expert docent. Ets exigent amb la numeració X.Y. i la inclusió de visuals mitjançant el tag [VISUAL: ...]. No usis mai el símbol '$'.",
        temperature: 0.2,
      }
    });

    let fullAccumulated = "";
    for await (const chunk of responseStream) {
      if (chunk.text) {
        fullAccumulated += chunk.text;
        const [genPart, rest1] = fullAccumulated.split('[ADAPTACIO_START]');
        const [adapPart, rest2] = (rest1 || "").split('[PEDAGOGIA_START]');
        const [pedPart, rest3] = (rest2 || "").split('[SOL_GENERAL_START]');
        const [solGenPart, solAdapPart] = (rest3 || "").split('[SOL_ADAPTADA_START]');
        
        onUpdate({
          general: genPart || "",
          adapted: adapPart || "",
          pedagogical: pedPart || "",
          solGeneral: solGenPart || "",
          solAdapted: solAdapPart || "",
          hasAdaptedVersion: selectedTopics.some(t => t.isAdapted)
        });
      }
    }
  } catch (error) {
    console.error(error);
    throw new Error("Error generant el material.");
  }
};