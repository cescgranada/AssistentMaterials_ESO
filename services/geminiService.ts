
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
 * Genera el material complet seguint el protocol mestre V.2025.
 */
export const generateMaterialStream = async (
  params: MaterialParams,
  onUpdate: (material: GeneratedMaterial) => void
): Promise<void> => {
  const selectedTopics = params.topics.filter(t => t.isIncluded);
  
  // Preparem la descripció dels blocs per al prompt
  const topicsSummary = selectedTopics.map(t => {
    return `- BLOC: ${t.title} (Teoria: ${t.theory.toUpperCase()}, Exercicis Base: ${t.systematizationCount}, Ampliació: ${t.extensionCount}, DUA: ${t.isAdapted ? 'SÍ' : 'NO'})`;
  }).join('\n');

  const systemInstruction = `
📥 SYSTEM INSTRUCTIONS: PROTOCOL MESTRE DEFINITIU (V. TOTAL BLINDADA 2025)

Ets un motor de generació de materials per a l'ESO. Ets un Expert Pedagògic i DUA.

<AI_ENGINE_CONFIGURATION>
NO_LATEX_POLICY:
- Prohibició total del símbol $ i de qualsevol sintaxi LaTeX.
- Usa Text Pla i Negreta.
- Símbols permesos: Σ, π, ·, :, √, ±, x², cm³, H₂O, Δ.
</AI_ENGINE_CONFIGURATION>

<LOGICA_TEORIA_BOTONS>
- CAP: Salta directament als exercicis. Prohibida qualsevol teoria.
- BREU RESUM: Màxim 2-3 paràgrafs concisos.
- ESQUEMÀTIC: Esquema visual amb llistes niades Markdown.
- DETALLAT: Explicació extensa. OBLIGATORI: 1 taula, 2 esquemes de text ASCII/flux i 2 etiquetes d'imatge amb descripció [Imatge de: ...].
</LOGICA_TEORIA_BOTONS>

<RESTRICT_RULES_TOP_PRIORITY>
1. NUMERACIÓ X.Y.: Cada exercici comença en línia nova amb prefix [Apartat].[Número]. (Ex: 1.1., 1.2.).
2. LLISTA GARANTIDA: Cada exercici ha de començar EXACTAMENT amb "- " (guionet + espai) dins d'una llista Markdown.
3. RESULTATS: Tots els exercicis acaben amb (**Resultat: [Valor]**).
</RESTRICT_RULES_TOP_PRIORITY>
  `;

  const prompt = `
    ETAPA_I_CURS: ${params.grade} d'ESO
    MATERIA: ${params.subject}
    UNITAT_TEMA: ${params.manualDescription || "Basat en els blocs següents"}
    
    TEMES SELECCIONATS A DESENVOLUPAR:
    ${topicsSummary}

    Genera els documents seguint aquest ordre i estructura:

    [GENERAL_START]
    # ${params.subject} - Material Alumnat
    Desenvolupa la teoria segons el nivell indicat per a cada bloc i els exercicis en format llista "- X.Y.".
    
    [ADAPTACIO_START]
    # ${params.subject} - Suport DUA
    Desenvolupa NOMÉS els blocs marcats amb DUA: SÍ. Aplica frases curtes, passos guiats i accessibilitat lectora.
    
    [PEDAGOGIA_START]
    # Programació Curricular
    Taula Markdown 5 columnes exactes: Competència, Sabers, Bloom, DUA, Exercicis corresponents.
    
    [SOL_GENERAL_START]
    # Solucionari General
    Enunciat complet + resolució pas a pas de cada exercici del Document General. Tanca amb (**Resultat: ...**).
    
    [SOL_ADAPTADA_START]
    # Solucionari Adaptat
    Enunciat complet + resolució pas a pas de cada exercici del Document Adaptat. Tanca amb (**Resultat: ...**).
    
    REGLA FINAL: No afegeixis notes meta ni explicacions. Segueix la numeració vertical estricta i la llista amb guionets.
  `;

  try {
    const responseStream = await ai.models.generateContentStream({
      model: params.settings.model || 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
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
    throw new Error("Error en la comunicació amb el motor d'IA. Verifica la teva clau API o la connexió.");
  }
};
