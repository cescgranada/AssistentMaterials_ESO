
import { GoogleGenAI, Type } from "@google/genai";
import { MaterialParams, GeneratedMaterial } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeContentParts = async (fileContent: string, manualDescription: string): Promise<{ title: string, snippet: string }[]> => {
  const model = 'gemini-3-flash-preview';
  const prompt = `
    Analitza aquesta unitat didàctica i divideix-la en els 3-5 temes o apartats més importants.
    PROPORCIONA NOMÉS JSON.
    Document: ${fileContent.substring(0, 10000)}
    Descripció: ${manualDescription}
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            snippet: { type: Type.STRING },
          },
          required: ['title', 'snippet'],
        },
      },
    },
  });

  return JSON.parse(response.text || "[]");
};

export const generateEducationalMaterial = async (params: MaterialParams): Promise<GeneratedMaterial> => {
  const model = params.settings.model || 'gemini-3-pro-preview';
  
  const topicsStr = params.topics
    .filter(t => t.isIncluded)
    .map(t => `- TEMA: ${t.title}. Teoria: ${t.theory}. Exercicis base: ${t.systematizationCount}. Exercicis repte: ${t.extensionCount}. Adaptat DUA: ${t.isAdapted ? 'SI' : 'NO'}`)
    .join('\n');

  const systemInstruction = `
    PROTOCOLO MESTRE DEFINITIU (V. 2025). 
    IDIOMA: ca. MATERIA: ${params.subject}. CURS: ${params.grade}.
    REGLES CRÍTIQUES:
    1. NO LATEX. Usa text pla i negreta.
    2. VISUAL FIRST: Taules, infografies descrites i organitzadors visuals rics.
    3. LLISTA GARANTIDA: Exercicis en llista amb "- ". Línia en blanc entre ells.
    4. FORMAT EXERCICIS: [Apartat].[Número]. (ex: 1.1.) i acaba amb (**Resultat: [Valor]**).
    5. TEORIA: Aplica el nivell especificat per cada tema.
    6. DOCUMENTS: Genera 5 seccions clarament separades per una etiqueta [SECTION_ID].
  `;

  const prompt = `
    Genera el material didàctic segons aquests temes:
    ${topicsStr}
    
    ESTRUCTURA DE SORTIDA (Obligatòria amb separadors):
    [DOC_GENERAL]
    ... contingut ...
    [DOC_ADAPTAT]
    ... contingut ...
    [DOC_PEDAGOGIC]
    ... taula curricular 5 columnes (Competències, Sabers, Bloom, DUA, Exercicis) ...
    [SOL_GENERAL]
    ... solucionari ...
    [SOL_ADAPTAT]
    ... solucionari adaptat ...
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
      temperature: params.settings.temperature,
    },
  });

  const fullText = response.text || "";
  
  const extract = (tag: string) => {
    const parts = fullText.split(`[${tag}]`);
    if (parts.length < 2) return "Contingut no generat.";
    const content = parts[1].split('[DOC_')[0].split('[SOL_')[0].trim();
    return content;
  };

  return {
    general: extract('DOC_GENERAL'),
    adapted: extract('DOC_ADAPTAT'),
    pedagogical: extract('DOC_PEDAGOGIC'),
    solGeneral: extract('SOL_GENERAL'),
    solAdapted: extract('SOL_ADAPTAT')
  };
};
