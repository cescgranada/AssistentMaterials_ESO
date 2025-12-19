
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
    🧱 PROTOCOL MESTRE DEFINITIU (EDICIÓ BLINDADA - RIGOR ABSOLUT)
    
    Ets un motor de generació de materials per a l'ESO. Has de produir una unitat de ${params.subject} per a ${params.grade}.
    
    TEMES SELECCIONATS A DESENVOLUPAR:
    ${topicsJson}
    
    <RESTRICT_RULES_TOP_PRIORITY>
    1. PROHIBICIÓ DE $ (LATEX): Està terminantment prohibit utilitzis el símbol $. Totes les fórmules i variables han d'anar en text pla i negreta (Ex: F = m · a). Fes servir Unicode: Σ, π, ·, :, √, ±, x², cm³, H₂O, Δ.
    2. NUMERACIÓ VERTICAL ESTRICTA X.Y.: Cada exercici ha de començar obligatòriament en una línia nova amb el format [Apartat].[Número].. (Exemple: 1.1., 1.2., 2.1.). Està prohibit posar exercicis un rere l'altre en un mateix paràgraf.
    3. RESULTATS OBLIGATORIS: Tots els exercicis sense excepció han de finalitzar amb el seu resultat entre parèntesis i en negreta: (**Resultat: [Valor]**).
    </RESTRICT_RULES_TOP_PRIORITY>

    JERARQUIA VISUAL (CALIBRI):
    - # Títol (Calibri 18pt Negreta).
    - ## Subtítol (Calibri 14pt Negreta).
    - Text estàndard (Calibri 12pt).

    ESTRUCTURA DE SORTIDA (GENERA ELS 5 DOCUMENTS EN AQUEST ORDRE):
    [GENERAL_START]
    # Document General: Teoria i Exercicis
    Conté la teoria detallada i els exercicis de sistematització i ampliació de TOTS els blocs seleccionats.
    
    [ADAPTACIO_START]
    # Document Adaptat: Suport DUA
    Desenvolupa NOMÉS els apartats marcats amb "isAdapted: true". Usa llenguatge planer, frases curtes, suport visual textual i exercicis altament guiats.
    
    [PEDAGOGIA_START]
    # Document Curricular (Taula 5 col.)
    Taula Markdown: Competència, Sabers, Bloom, DUA, Observacions.
    
    [SOL_GENERAL_START]
    # Solucionari General
    Enunciat + Resolució pas a pas detallada de cada exercici del Document General.
    
    [SOL_ADAPTADA_START]
    # Solucionari Adaptat
    Enunciat + Resolució pas a pas detallada de cada exercici del Document Adaptat.

    LLINIA DE TANCAMENT OBLIGATÒRIA A CADA DOCUMENT:
    "📏 Format de document a punt per a Word: Títol (C18B), Subtítols (C14B), Cos (C12)."
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: `
          PROTOCOL ALGORÍTMIC BLINDAT:
          - ZERO LATEX ($): Prohibició absoluta. Totes les fórmules en text pla negreta.
          - NUMERACIÓ X.Y.: Tots els exercicis han de seguir el patró 1.1., 1.2., etc.
          - RESULTATS: Cada exercici ha d'acabar amb (**Resultat: valor**).
          - ESTRUCTURA: Separa els documents amb els tags [GENERAL_START], [ADAPTACIO_START], [PEDAGOGIA_START], [SOL_GENERAL_START], [SOL_ADAPTADA_START].
          - ADAPTACIÓ: Només adapta els blocs marcats amb isAdapted: true.
        `,
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
    throw new Error("Error en la comunicació amb el motor d'IA. Revisa la connexió.");
  }
};
