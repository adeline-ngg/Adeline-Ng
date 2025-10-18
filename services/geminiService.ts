import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { GeminiStoryResponse } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set");
}

const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

const storyResponseSchema = {
    type: Type.OBJECT,
    properties: {
        narrative: {
            type: Type.STRING,
            description: "The next part of the story's narrative. This should be engaging and descriptive, continuing from the previous context.",
        },
        imagePrompt: {
            type: Type.STRING,
            description: "A detailed, descriptive prompt for a short video generation model. It should capture the current scene vividly, focusing on photo-realism, historical accuracy, and cinematic lighting."
        },
        choices: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of 2-3 short, compelling choices for the user to make that will influence the story. Must not be empty."
        },
        lesson: {
            type: Type.STRING,
            nullable: true,
            description: "A concise biblical lesson or moral that can be drawn from the current story segment. Null if no lesson is immediately apparent."
        },
    },
    required: ["narrative", "imagePrompt", "choices", "lesson"],
};

export const generateStorySegment = async (prompt: string): Promise<GeminiStoryResponse> => {
    const ai = getAI();
    try {
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: storyResponseSchema,
                temperature: 0.8,
            },
        });
        
        const jsonText = response.text.trim();
        const parsedResponse = JSON.parse(jsonText) as GeminiStoryResponse;

        // Ensure choices are never empty
        if (!parsedResponse.choices || parsedResponse.choices.length === 0) {
            parsedResponse.choices = ["Continue the story."];
        }

        return parsedResponse;
    } catch (error) {
        console.error("Error generating story segment:", error);
        // Fallback in case of API error
        return {
            narrative: "An unexpected silence falls upon the land. It seems the path forward is unclear. Let's try to proceed.",
            imagePrompt: "A serene, empty landscape under a cloudy sky, historically accurate.",
            choices: ["Continue...", "Try a different path"],
            lesson: "Even in moments of confusion, faith provides a guiding light."
        };
    }
};

export const generateClarification = async (context: string, question: string): Promise<string> => {
    const ai = getAI();
    try {
        const prompt = `You are an AI assistant in an interactive biblical story. The user has a question about the current situation.
        Here is the story so far:
        ---
        ${context}
        ---
        Here is the user's question: "${question}"

        Please provide a concise and helpful answer based ONLY on the provided story context. Do not advance the story, create plot points, or offer choices. Your role is simply to clarify.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        return response.text.trim();
    } catch (error) {
        console.error("Error generating clarification:", error);
        return "I'm sorry, I couldn't process that question right now. Please continue with the story.";
    }
};

export const generateSceneVideo = async (prompt: string): Promise<{ url: string; type: 'video' | 'image' }> => {
    const ai = getAI();
    try {
        const fullPrompt = `${prompt}, short video, 4k, photo-realistic, historically accurate, cinematic lighting, dramatic, high-detail`;
        
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: fullPrompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: '16:9'
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (downloadLink) {
             const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
             if (!response.ok) {
                 throw new Error(`Failed to fetch video: ${response.statusText}`);
             }
             const videoBlob = await response.blob();
             const videoUrl = URL.createObjectURL(videoBlob);
             return { url: videoUrl, type: 'video' };
        }
        
        throw new Error("No video generated");
    } catch (error) {
        console.error("Error generating scene video:", error);
        // Fallback image
        return { url: 'https://picsum.photos/seed/error/1280/720', type: 'image' };
    }
};

export const generateAvatarImage = async (prompt: string): Promise<string> => {
    const ai = getAI();
    try {
        const fullPrompt = `centered portrait of a biblical-era person from the Middle East, ${prompt}, photo-realistic, historically accurate, natural lighting, high-detail, face, 4k`;
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        throw new Error("No image generated for avatar");
    } catch (error) {
        console.error("Error generating avatar image:", error);
        // Fallback avatar
        return 'https://i.pravatar.cc/200?u=error';
    }
};