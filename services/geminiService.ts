import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { GeminiStoryResponse } from '../types';

const getAI = () => {
    const apiKey = import.meta.env.VITE_GEMINI_KEY || import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_API_KEY;
    if (!apiKey) {
        console.error("⚠️ VITE_GEMINI_API_KEY not found in environment variables!");
        console.error("Please create a .env file with: VITE_GEMINI_API_KEY=your_api_key_here");
        throw new Error("VITE_GEMINI_API_KEY environment variable is not set. Please add VITE_GEMINI_API_KEY to your .env file.");
    }
    return new GoogleGenAI({ apiKey });
};

// FIX: `nullable: true` is not a valid schema property. The `lesson` property is made optional by removing it from the `required` array.
const storyResponseSchema = {
    type: Type.OBJECT,
    properties: {
        narrative: {
            type: Type.STRING,
            description: "The next part of the story's narrative. This should be engaging and descriptive, continuing from the previous context.",
        },
        imagePrompt: {
            type: Type.STRING,
            description: "A detailed, descriptive prompt for an image generation model. It should capture the current scene vividly, focusing on photo-realism, historical accuracy, and cinematic lighting."
        },
        choices: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of 2-3 short, compelling choices for the user to make that will influence the story. Must not be empty."
        },
        lessons: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of 0-3 detailed biblical lessons or morals that can be drawn from the current story segment. Each lesson should be comprehensive, including theological context, biblical connections, and practical spiritual applications. Lessons should be multi-paragraph when appropriate and connect specifically to the events in this segment. Return empty array if no lessons are immediately apparent."
        },
        isComplete: {
            type: Type.BOOLEAN,
            description: "True if the core biblical narrative has reached its natural conclusion. For example: Daniel saved from lions and justice served, Moses crossed the Red Sea, David defeated Goliath, etc. Set to true when the main biblical event concludes, regardless of how many user choices have been made."
        },
        location: {
            type: Type.STRING,
            description: "The current location or setting where this scene takes place. This helps maintain visual consistency across images. Examples: 'palace', 'lions den', 'valley of elah', 'red sea shore', etc."
        },
    },
    required: ["narrative", "imagePrompt", "choices"],
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
        // FIX: Safely construct the response object and handle potentially missing `lesson`.
        const parsed = JSON.parse(jsonText);
        const parsedResponse: GeminiStoryResponse = {
            narrative: parsed.narrative,
            imagePrompt: parsed.imagePrompt,
            choices: parsed.choices,
            lessons: parsed.lessons ?? [],
            isComplete: parsed.isComplete ?? false,
            location: parsed.location ?? null,
        };

        // Ensure choices are never empty
        if (!parsedResponse.choices || parsedResponse.choices.length === 0) {
            parsedResponse.choices = ["Continue the story."];
        }

        return parsedResponse;
    } catch (error) {
        console.error("Error generating story segment:", error);
        
        let narrative = "An unexpected silence falls upon the land. It seems the path forward is unclear. Let's try to proceed.";
        if (error instanceof Error && (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota'))) {
            narrative = "The storyteller pauses, catching their breath. It seems the request limit has been reached for now. Please check your API key's plan and billing details, or try again in a little while.";
        }

        return {
            narrative: narrative,
            imagePrompt: "A serene, empty landscape under a cloudy sky, historically accurate.",
            choices: ["Try again..."],
            lessons: ["Patience is a virtue, especially when the path is unclear."],
            isComplete: false,
            isFallback: true  // Add flag to identify fallback responses
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
        if (error instanceof Error && (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota'))) {
             return "I am unable to answer at this moment due to a high volume of requests. Please try asking again later.";
        }
        return "I'm sorry, I couldn't process that question right now. Please continue with the story.";
    }
};

export const generateSceneImage = async (prompt: string): Promise<string> => {
    const ai = getAI();
    try {
        const fullPrompt = `${prompt}, 4k, photo-realistic, historically accurate, cinematic lighting, dramatic, high-detail`;
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: fullPrompt,
            config: {
                numberOfImages: 1,
                outputMimeType: 'image/jpeg',
                aspectRatio: '16:9',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        throw new Error("No image generated for scene");
    } catch (error) {
        console.error("Error generating scene image:", error);
        if (error instanceof Error && (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota'))) {
            throw new Error("Image generation limit reached. The story will continue without a new image for this scene.");
        }
        throw new Error("An unexpected error occurred while generating the scene image.");
    }
};

/**
 * Generate a single static scene image with character consistency
 * Accepts character descriptions and environment descriptions to ensure consistent appearance
 */
export const generateSceneImageWithCharacters = async (
    prompt: string, 
    characterDescriptions?: string,
    environmentDescription?: string
): Promise<string> => {
    const ai = getAI();
    
    // Reduced timeout to 60 seconds - fail faster for better UX
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Image generation timeout after 60 seconds')), 60000);
    });

    try {
        console.log('Starting image generation for prompt:', prompt.substring(0, 100) + '...');
        const startTime = Date.now();
        
        // Enhance prompt with character and environment descriptions if provided
        let enhancedPrompt = prompt;
        
        if (characterDescriptions) {
            enhancedPrompt = `Characters: ${characterDescriptions}. ${enhancedPrompt}`;
        }
        
        if (environmentDescription) {
            enhancedPrompt = `Environment and setting: ${environmentDescription}. ${enhancedPrompt}`;
        }
        
        enhancedPrompt += ', 4k, photo-realistic, historically accurate, cinematic lighting, dramatic, high-detail';
        
        console.log('Calling Imagen API...');
        
        const response = await Promise.race([
            ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: enhancedPrompt,
                config: {
                    numberOfImages: 1,
                    outputMimeType: 'image/jpeg',
                    aspectRatio: '16:9',
                },
            }),
            timeoutPromise
        ]);

        const endTime = Date.now();
        console.log(`Image generation completed in ${(endTime - startTime) / 1000} seconds`);

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("No image generated for scene");
        }

        return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
        
    } catch (error) {
        console.error("Error generating scene image:", error);
        if (error instanceof Error) {
            if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota')) {
                throw new Error("Image generation limit reached. The story will continue without an image for this scene.");
            }
            if (error.message.includes('timeout')) {
                throw new Error("Image generation timed out. The story will continue with a placeholder image.");
            }
        }
        throw new Error("An unexpected error occurred while generating the scene image.");
    }
};

export const generateLessonTitle = async (lessonText: string): Promise<string> => {
    const ai = getAI();
    try {
        const prompt = `Generate a concise, descriptive title for this biblical lesson. The title should be 6-10 words and capture the main spiritual principle or moral being taught.

Lesson text: "${lessonText}"

Return only the title, no quotes or additional text.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.3, // Lower temperature for more consistent, focused titles
            },
        });

        const title = response.text.trim().replace(/^["']|["']$/g, ''); // Remove any surrounding quotes
        return title || lessonText.split('.')[0].substring(0, 50) + '...'; // Fallback to first sentence
    } catch (error) {
        console.error("Error generating lesson title:", error);
        // Fallback to first sentence or first 50 characters
        const firstSentence = lessonText.split('.')[0];
        return firstSentence.length > 50 ? firstSentence.substring(0, 50) + '...' : firstSentence;
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
        
        // Log response structure for debugging
        console.error("No images in response:", JSON.stringify(response, null, 2));
        console.error("Response structure:", {
            hasGeneratedImages: !!response.generatedImages,
            generatedImagesLength: response.generatedImages?.length || 0,
            responseKeys: Object.keys(response || {})
        });
        
        throw new Error("No image generated for avatar");
    } catch (error) {
        console.error("Error generating avatar image:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        
        if (error instanceof Error) {
            // Log the full error message for debugging
            console.error("Error message:", error.message);
            console.error("Error stack:", error.stack);
            
            // Check for specific error types
            if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota')) {
                throw new Error("You have exceeded your request limit for image generation. Please check your API key's plan and billing details, or try again later.");
            } else if (error.message.includes('PERMISSION_DENIED') || error.message.includes('403')) {
                throw new Error("Image generation API access denied. Please check your API key permissions and billing.");
            } else if (error.message.includes('INVALID_ARGUMENT') || error.message.includes('400')) {
                throw new Error("Invalid request parameters for image generation. Please try with a different description.");
            } else if (error.message.includes('UNAUTHENTICATED') || error.message.includes('401')) {
                throw new Error("Invalid API key for image generation. Please check your Gemini API key configuration.");
            } else if (error.message.includes('timeout')) {
                throw new Error("Image generation timed out. Please try again.");
            }
            
            // Re-throw with original error message for better debugging
            throw new Error(`Gemini image generation error: ${error.message}`);
        }
        
        throw new Error("An unexpected error occurred while generating the avatar. Please try again.");
    }
};