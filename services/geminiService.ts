
import { GoogleGenAI, Type } from "@google/genai";
import { MaterialParams, GeneratedMaterial } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analitza el text per extreure els blocs o temes principals.
 */
export const analyzeContentParts = async (fileText: string, manualText: string): Promise<{ title: string; snippet: string }[]> => {
  const model = "gemini-3-flash-preview";
  const prompt = `
    TASCA: Analitzar el document i extreure'n una Taula de Continguts (Índex) per a una unitat didàctica d'ESO.
    1. Identifica els títols principals.
    2. Retorna un JSON: array d'objectes amb "title" i "snippet".
    
    TEXT: ${fileText.substring(0, 15000)}
    DESCRIPCIÓ: ${manualText}
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
    return [{ title: "Contingut Principal", snippet: "Anàlisi general." }];
  }
};

/**
 * Genera el material complet seguint el protocol mestre.
 */
export const generateMaterialStream = async (
  params: MaterialParams,
  onUpdate: (material: GeneratedMaterial) => void
): Promise<void> => {
  const selectedTopics = params.topics.filter(t => t.isIncluded);
  const topicsJson = JSON.stringify(selectedTopics, null, 2);

  const prompt = `
    🧱 PROTOCOL MESTRE DEFINITIU (EDICIÓ BLINDADA)
    
    Ets un Expert en Disseny Pedagògic d'ESO. Genera una unitat de ${params.subject} per a ${params.grade} d'ESO.
    
    TEMES/BLOCS SELECCIONATS:
    ${topicsJson}
    
    <RULES_DE_FERRO>
    1. PROHIBICIÓ TOTAL DE DÒLARS ($): No utilitzis MAI el símbol $. Prohibit el format LaTeX. Qualsevol fórmula o variable ha d'anar en Text Pla i Negreta. (Ex: F = m · a).
    2. NUMERACIÓ ALGORÍTMICA OBLIGATÒRIA: Tot exercici ha de començar amb el prefix [Apartat].[Exercici].. (Exemple: 1.1., 1.2., 2.1....).
    3. RESULTATS: Tots els exercicis han de tancar-se amb: (**Resultat: [Valor]**).
    4. SÍMBOLS UNICODE: Fes servir només: Σ, π, ·, :, √, ±, x², cm³, H₂O, Δ.
    </RULES_DE_FERRO>

    JERARQUIA VISUAL (CALIBRI):
    - # Títol (Calibri 18pt Negreta).
    - ## Subtítol (Calibri 14pt Negreta).
    - Text (Calibri 12pt).

    ESTRUCTURA DE SORTIDA (5 DOCUMENTS):
    [GENERAL_START]
    # ${params.subject} - Alumnat
    Teoria i exercicis per a tots els blocs seleccionats.
    
    [ADAPTACIO_START]
    # ${params.subject} - Suport DUA
    Genera contingut ADAPTAT (DUA) NOMÉS per als blocs que tinguin "isAdapted: true". 
    Si un bloc no té "isAdapted: true", ignora'l en aquest document o resumeix-lo molt breument com a context.
    Usa llenguatge clar, bastides cognitives i exercicis guiats.
    
    [PEDAGOGIA_START]
    # Programació Curricular
    Taula Markdown 5 columnes: Competència, Sabers, Bloom, DUA, Observacions.
    
    [SOL_GENERAL_START]
    # Solucionari General
    Enunciat + Resolució detallada pas a pas de cada exercici del document General.
    
    [SOL_ADAPTADA_START]
    # Solucionari Adaptat
    Enunciat + Resolució pas a pas de cada exercici del document Adaptat.

    NOTA FINAL OBLIGATÒRIA A CADA DOCUMENT:
    "📏 Format de document a punt per a Word: Títol (C18B), Subtítols (C14B), Cos (C12)."
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "Ets un motor de generació ESO blindat. Títols # (18pt), ## (14pt), text (12pt). Numeració X.Y. obligatòria. Resultats (**Resultat: valor**) obligatoris. PROHIBIT l'ús de $ o LaTeX.",
        temperature: params.settings.temperature,
      }
    });

    let fullAccumulated = "";
    for await (const chunk of responseStream) {
      if (chunk.text) {
        fullAccumulated += chunk.text;
        const sections = fullAccumulated.split(/\[GENERAL_START\]|\[ADAPTACIO_START\]|\[PEDAGOGIA_START\]|\[SOL_GENERAL_START\]|\[SOL_ADAPTADA_START\]/);
        
        onUpdate({
          general: sections[1]?.trim() || "",
          adapted: sections[2]?.trim() || "",
          pedagogical: sections[3]?.trim() || "",
          solGeneral: sections[4]?.trim() || "",
          solAdapted: sections[5]?.trim() || "",
          hasAdaptedVersion: selectedTopics.some(t => t.isAdapted)
        });
      }
    }
  } catch (error) {
    throw new Error("Error en la comunicació amb el motor d'IA.");
  }
};
