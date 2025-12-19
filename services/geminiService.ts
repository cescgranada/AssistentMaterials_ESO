
import { GoogleGenAI, Type } from "@google/genai";
import { MaterialParams, GeneratedMaterial } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMaterialStream = async (
  params: MaterialParams,
  onUpdate: (material: GeneratedMaterial) => void
): Promise<void> => {
  const charactersStr = params.characters.map((c, i) => `Personatge ${i+1}: ${c.name} - ${c.description}`).join('\n');
  
  const prompt = `
    🧱 PROTOCOL MESTRE DEFINITIU: GENERACIÓ DIDÀCTICA I FEEDBACK IMMEDIAT
    
    Ets un Expert en Disseny Pedagògic d'ESO. Has de generar una unitat didàctica completa de ${params.subject} per a ${params.grade} d'ESO basada en els següents elements:
    
    ELEMENTS NARRATIUS:
    ${charactersStr}
    ESCENARI: ${params.scenario}
    
    INSTRUCCIONS DE FORMAT I RIGOR:
    1. REGLA D'OR: Tots els exercicis han d'acabar amb el resultat final escrit entre parèntesis i en negreta. 
       FORMAT: [Enunciat...] (**Resultat: [Valor/Unitat]**)
    2. ELIMINACIÓ TOTAL DE LATEX: No usis '$'. Usa Unicode: Σ, π, ·, :, √, x², cm³, H₂O.
    3. JERARQUIA VISUAL (CALIBRI):
       - # Títol (Markdown #, equivalent a Calibri 18pt Negreta).
       - ## Subtítol (Markdown ##, equivalent a Calibri 14pt Negreta).
       - Text estàndard (Calibri 12pt).
    4. ESTRUCTURA DELS 5 DOCUMENTS (Genera'ls tots en ordre):
       [GENERAL_START]
       # Material de l'Alumnat: ${params.subject}
       Teoria detallada sobre narrativa/anàlisi usant els personatges + Exercicis.
       [ADAPTACIO_START]
       # Material Adaptat DUA: ${params.subject}
       Teoria simplificada, suport visual textual i exercicis guiats.
       [PEDAGOGIA_START]
       # Taula de Programació Curricular
       Taula 5 columnes: Competència, Sabers, Bloom, DUA, Observacions.
       [SOL_GENERAL_START]
       # Solucionari Document General
       Resolució pas a pas de cada exercici.
       [SOL_ADAPTADA_START]
       # Solucionari Document Adaptat
       Resolució pas a pas detallada.
       
    REGLA DE CONSISTÈNCIA: Afegeix al final de cada document la nota: 
    "📏 Format de document a punt per a Word: Títol (C18B), Subtítols (C14B), Cos (C12)."
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: params.settings.model || 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "Ets un motor de generació ESO. Títols # (18pt), ## (14pt), text (12pt). Exercicis amb (Resultat: **valor**) obligatori. No LaTeX.",
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
          hasAdaptedVersion: true
        });
      }
    }
  } catch (error) {
    throw new Error("Error en la generació. Revisa la teva clau API.");
  }
};
