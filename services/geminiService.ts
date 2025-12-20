
import { GoogleGenAI, Type } from "@google/genai";
import { StoryConfig } from "../types";

export const generateStory = async (config: StoryConfig): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = "gemini-3-flash-preview";

  const prompt = `
    Ets un escriptor de contes professionals. 
    Crea una història captivadora que inclogui exactament aquests elements:
    - Personatge 1: ${config.name1}
    - Personatge 2: ${config.name2}
    - Personatge 3: ${config.name3}
    - Descripció base: ${config.description}
    - Escenari: ${config.setting}

    Instruccions de format:
    - Utilitza Markdown (títols, negretes, etc.).
    - Divideix la història en Capítols o seccions.
    - La història ha de ser en català.
    - No incloguis notes d'autor.
  `;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text || "No s'ha pogut generar la història.";
  } catch (error) {
    console.error("Error Gemini:", error);
    throw new Error("Error connectant amb el motor d'històries.");
  }
};

/**
 * Analitza el contingut proporcionat i el divideix en temes o apartats lògics per a una unitat didàctica.
 * @param fileContent Contingut extret del fitxer pujat.
 * @param manualDescription Descripció manual del tema.
 */
export const analyzeContentParts = async (fileContent: string, manualDescription: string): Promise<{ title: string, snippet: string }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';

  const prompt = `
    Analitza la següent informació sobre una unitat didàctica i divideix-la en els 3-5 temes o apartats més importants.
    Per a cada apartat, proporciona un títol i un breu resum (snippet) d'unes 15-20 paraules.
    
    Contingut del document: ${fileContent}
    Descripció del tema: ${manualDescription}
  `;

  try {
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
              title: {
                type: Type.STRING,
                description: 'El títol del tema o bloc didàctic.',
              },
              snippet: {
                type: Type.STRING,
                description: 'Un resum concís del contingut del tema.',
              },
            },
            required: ['title', 'snippet'],
            propertyOrdering: ["title", "snippet"],
          },
        },
      },
    });

    const jsonStr = response.text || "[]";
    return JSON.parse(jsonStr.trim());
  } catch (error) {
    console.error("Error analitzant contingut:", error);
    throw new Error("No s'ha pogut analitzar el contingut de la unitat.");
  }
};
