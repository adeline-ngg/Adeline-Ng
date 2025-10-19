import { fal } from "@fal-ai/client";
import { getCachedMediaBlob, cacheMediaBlob, clearMediaCache, getMediaCacheStats } from '../utils/mediaCache';
import { retryWithExponentialBackoff, FAL_RETRY_CONFIG } from '../utils/retryWithBackoff';

// Custom error types for better error handling
export class QuotaExceededError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'QuotaExceededError';
    }
}

export class TimeoutError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TimeoutError';
    }
}

export class FalConfigurationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'FalConfigurationError';
    }
}

const getFalClient = () => {
    const apiKey = import.meta.env.VITE_FAL_API_KEY;
    if (!apiKey) {
        throw new FalConfigurationError("VITE_FAL_API_KEY not found in environment variables!");
    }
    
    // Validate API key format (FAL keys typically start with specific patterns)
    if (!apiKey.includes('-') || apiKey.length < 20) {
        throw new FalConfigurationError("Invalid FAL API key format. Please check your VITE_FAL_API_KEY.");
    }
    
    try {
        // Configure the FAL client with the API key
        fal.config({
            credentials: apiKey,
        });
        
        return fal;
    } catch (error) {
        throw new FalConfigurationError(`Failed to configure FAL client: ${error instanceof Error ? error.message : String(error)}`);
    }
};

export const isConfigured = (): boolean => {
    return !!import.meta.env.VITE_FAL_API_KEY;
};

/**
 * Test API key authentication with a simple, fast model
 * @returns Promise<boolean> - true if authentication works, false otherwise
 */
export const testApiKey = async (): Promise<boolean> => {
    if (!isConfigured()) {
        console.error('FAL.ai: API key not configured');
        return false;
    }

    try {
        const client = getFalClient();
        console.log('FAL.ai: Testing API key with fast-sdxl model...');
        
        // Use a simple, fast image generation model for testing
        const result = await client.subscribe("fal-ai/fast-sdxl", {
            input: {
                prompt: "a simple test image",
                image_size: "square_hd"
            },
            logs: true,
            onQueueUpdate: (update) => {
                console.log(`FAL.ai: Test request status:`, update.status);
            }
        });

        console.log('FAL.ai: API key test successful!');
        return true;
    } catch (error) {
        console.error('FAL.ai: API key test failed:', error);
        
        // Enhanced error logging for auth test
        if (error && typeof error === 'object') {
            if ('detail' in error && Array.isArray(error.detail)) {
                error.detail.forEach((errDetail: any) => {
                    console.error(`FAL.ai: Auth test error detail:`, {
                        location: errDetail.loc,
                        message: errDetail.msg,
                        type: errDetail.type
                    });
                });
            }
            
            if (error.status === 401) {
                console.error('FAL.ai: Authentication failed - check your API key');
            } else if (error.status === 403) {
                console.error('FAL.ai: Access forbidden - check API key permissions');
            } else if (error.status === 429) {
                console.error('FAL.ai: Rate limited - too many requests');
            }
        }
        
        return false;
    }
};

/**
 * Generate a short animated GIF/video for important story scenes
 * @param prompt - The image prompt for the scene
 * @param duration - Duration in seconds (capped at 5 seconds maximum)
 * @returns Promise<string> - Base64 data URL of the generated GIF/video
 */
export const generateGIF = async (prompt: string, duration: number = 5): Promise<string> => {
    if (!isConfigured()) {
        throw new FalConfigurationError("FAL.ai is not configured. Please set VITE_FAL_API_KEY in your environment variables.");
    }

    // Enhanced prompt for better video generation
    const enhancedPrompt = `${prompt}, cinematic, dramatic, high quality, historically accurate, biblical era, photo-realistic`;
    
    // Check cache first
    console.log('Checking cache for GIF...');
    const cachedBlob = await getCachedMediaBlob(enhancedPrompt, 'fal-ai/stable-video', duration, 'gif');
    if (cachedBlob) {
        console.log('Found cached GIF, returning immediately');
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject(new Error('Failed to convert cached video to base64'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read cached video blob'));
            reader.readAsDataURL(cachedBlob);
        });
    }

    console.log('No cached GIF found, generating new one...');
    const startTime = Date.now();

    // Wrap the FAL API call with retry logic
    const result = await retryWithExponentialBackoff(async () => {
        const client = getFalClient();
        
        // Timeout promise to fail after 45 seconds (reduced for better UX)
        const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new TimeoutError('GIF generation timeout after 45 seconds')), 45000);
        });
        
        // Progress logging every 10 seconds
        const progressInterval = setInterval(() => {
            console.log('FAL.ai GIF generation still in progress...');
        }, 10000);

        console.log('FAL.ai: Starting 2-step video generation process...');
        
        // Step 1: Generate base image using fal-ai/flux/dev
        console.log('FAL.ai: Step 1 - Generating base image...');
        let imageUrl: string;
        try {
            const imageResult = await client.subscribe("fal-ai/flux/dev", {
                input: {
                    prompt: enhancedPrompt,
                    image_size: "landscape_16_9",
                    num_inference_steps: 20,
                },
            });

            if (!imageResult.data || !imageResult.data.images || imageResult.data.images.length === 0) {
                throw new Error("No image generated by FAL.ai");
            }

            imageUrl = imageResult.data.images[0].url;
            console.log('FAL.ai: Base image generated successfully:', imageUrl);
        } catch (imageError) {
            console.error('FAL.ai: Image generation failed:', imageError);
            throw new Error(`FAL.ai: Failed to generate base image: ${imageError instanceof Error ? imageError.message : String(imageError)}`);
        }

        // Step 2: Animate the image using image-to-video models
        console.log('FAL.ai: Step 2 - Converting image to video...');
        let result;
        const models = [
            {
                name: "fal-ai/kling-video/v1/standard",
                input: {
                    prompt: enhancedPrompt,
                    image_url: imageUrl,
                }
            },
            {
                name: "fal-ai/minimax-video/image-to-video",
                input: {
                    prompt: enhancedPrompt,
                    image_url: imageUrl,
                }
            },
            {
                name: "fal-ai/luma-dream-machine",
                input: {
                    prompt: enhancedPrompt,
                    image_url: imageUrl,
                }
            }
        ];

        let lastError;
        for (const model of models) {
            try {
                console.log(`FAL.ai: Trying image-to-video model: ${model.name}`);
                console.log(`FAL.ai: Model input:`, JSON.stringify(model.input, null, 2));
                
                result = await Promise.race([
                    client.subscribe(model.name, {
                        input: model.input,
                        logs: true,
                        onQueueUpdate: (update) => {
                            console.log(`FAL.ai: Queue update for ${model.name}:`, {
                                status: update.status,
                                logs: update.logs?.map(log => log.message)
                            });
                            if (update.status === "IN_PROGRESS") {
                                console.log(`FAL.ai: Video generation in progress with ${model.name}...`);
                                update.logs?.map((log) => log.message).forEach(msg => console.log(`FAL.ai: ${msg}`));
                            }
                        },
                    }),
                    timeoutPromise
                ]);
                
                // Clear progress interval on success
                clearInterval(progressInterval);
                console.log(`FAL.ai: Successfully generated video with ${model.name}`);
                console.log(`FAL.ai: Result data:`, JSON.stringify(result.data, null, 2));
                break;
            } catch (error) {
                const errorDetails = {
                    model: model.name,
                    message: error instanceof Error ? error.message : String(error),
                    name: error instanceof Error ? error.name : 'Unknown',
                    stack: error instanceof Error ? error.stack : undefined
                };
                console.error(`FAL.ai: Model ${model.name} failed:`, errorDetails);
                console.error(`FAL.ai: Raw error object:`, error);
                
                // Enhanced error parsing for FAL.ai structured errors
                if (error && typeof error === 'object') {
                    console.error(`FAL.ai: Error object keys:`, Object.keys(error));
                    console.error(`FAL.ai: Error toString:`, error.toString());
                    
                    // Check for FAL.ai structured error format
                    if ('detail' in error && Array.isArray(error.detail)) {
                        console.error(`FAL.ai: Structured error details found:`);
                        error.detail.forEach((errDetail: any, index: number) => {
                            console.error(`FAL.ai: Error detail [${index}]:`, {
                                location: errDetail.loc,
                                message: errDetail.msg,
                                type: errDetail.type,
                                context: errDetail.ctx,
                                url: errDetail.url
                            });
                        });
                    }
                    
                    // Check for HTTP response errors
                    if (error.response) {
                        console.error(`FAL.ai: Error response:`, error.response);
                        if (error.response.data) {
                            console.error(`FAL.ai: Error response data:`, error.response.data);
                        }
                    }
                    
                    // Check for status codes
                    if (error.status) {
                        console.error(`FAL.ai: Error status:`, error.status);
                    }
                    if (error.statusText) {
                        console.error(`FAL.ai: Error statusText:`, error.statusText);
                    }
                    
                    // Check for FAL.ai specific error properties
                    if (error.body) {
                        console.error(`FAL.ai: Error body:`, error.body);
                    }
                    if (error.requestId) {
                        console.error(`FAL.ai: Request ID:`, error.requestId);
                    }
                }
                
                // Check for specific error types with enhanced detection
                if (error instanceof Error) {
                    if (error.message.includes('quota') || error.message.includes('credit')) {
                        console.error('FAL.ai: Credit/quota issue detected');
                    } else if (error.message.includes('authentication') || error.message.includes('API key')) {
                        console.error('FAL.ai: Authentication issue detected');
                    } else if (error.message.includes('timeout')) {
                        console.error('FAL.ai: Timeout issue detected');
                    } else if (error.message.includes('network') || error.message.includes('fetch')) {
                        console.error('FAL.ai: Network issue detected');
                    } else if (error.message.includes('rate limit') || error.message.includes('too many requests')) {
                        console.error('FAL.ai: Rate limit issue detected - FAL.ai allows 10 concurrent tasks');
                    } else {
                        console.error('FAL.ai: Unknown error type detected');
                    }
                } else {
                    // Check for HTTP status codes in non-Error objects
                    if (error && typeof error === 'object') {
                        if (error.status === 401) {
                            console.error('FAL.ai: HTTP 401 - Authentication failed - check your API key');
                        } else if (error.status === 403) {
                            console.error('FAL.ai: HTTP 403 - Forbidden (possibly quota exceeded or insufficient permissions)');
                        } else if (error.status === 422) {
                            console.error('FAL.ai: HTTP 422 - Validation error - check input parameters');
                        } else if (error.status === 429) {
                            console.error('FAL.ai: HTTP 429 - Rate limited - FAL.ai allows 10 concurrent tasks per user');
                        } else if (error.status === 500) {
                            console.error('FAL.ai: HTTP 500 - Internal server error');
                        } else if (error.status === 504) {
                            console.error('FAL.ai: HTTP 504 - Generation timeout');
                        } else if (error.status >= 500) {
                            console.error('FAL.ai: HTTP 5xx - Server error');
                        }
                    }
                }
                
                // Check for FAL.ai specific error types from structured errors
                if (error && typeof error === 'object' && 'detail' in error && Array.isArray(error.detail)) {
                    error.detail.forEach((errDetail: any) => {
                        if (errDetail.type === 'authentication_error') {
                            console.error('FAL.ai: Authentication error - invalid or expired API key');
                        } else if (errDetail.type === 'quota_exceeded') {
                            console.error('FAL.ai: Quota exceeded - insufficient credits');
                        } else if (errDetail.type === 'generation_timeout') {
                            console.error('FAL.ai: Generation timeout - request took too long');
                        } else if (errDetail.type === 'downstream_service_error') {
                            console.error('FAL.ai: Downstream service error - external service issue');
                        } else if (errDetail.type === 'value_error') {
                            console.error('FAL.ai: Validation error - check input parameters:', errDetail.msg);
                        }
                    });
                }
                
                lastError = error;
                continue;
            }
        }
        
        // Clear progress interval if we exit the loop
        clearInterval(progressInterval);

        if (!result) {
            const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
            const errorName = lastError instanceof Error ? lastError.name : 'Unknown';
            console.error('FAL.ai: All image-to-video models failed, trying direct text-to-video fallback...');
            console.error('FAL.ai: Last error details:', {
                name: errorName,
                message: errorMessage,
                stack: lastError instanceof Error ? lastError.stack : undefined
            });
            
            // Try direct text-to-video model as fallback
            try {
                console.log('FAL.ai: Trying direct text-to-video model as fallback...');
                result = await Promise.race([
                    client.subscribe("fal-ai/minimax-video", {
                        input: {
                            prompt: enhancedPrompt,
                        },
                        logs: true,
                        onQueueUpdate: (update) => {
                            console.log(`FAL.ai: Text-to-video queue update:`, {
                                status: update.status,
                                logs: update.logs?.map(log => log.message)
                            });
                        },
                    }),
                    timeoutPromise
                ]);
                console.log('FAL.ai: Successfully generated video with text-to-video fallback');
            } catch (fallbackError) {
                console.error('FAL.ai: Text-to-video fallback also failed:', fallbackError);
                const fallbackErrorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
                throw new Error(`FAL.ai: All video generation models failed. Image-to-video error: ${errorName}: ${errorMessage}. Text-to-video fallback error: ${fallbackErrorMsg}`);
            }
        }

        return result;
    }, FAL_RETRY_CONFIG);

    const endTime = Date.now();
    console.log(`GIF generation completed in ${(endTime - startTime) / 1000} seconds`);

    // Handle flexible response structure from FAL.ai video models
    let videoUrl: string;
    console.log('FAL.ai: Processing result data structure:', JSON.stringify(result.data, null, 2));
    
    if (result.data?.video?.url) {
        videoUrl = result.data.video.url;
        console.log('FAL.ai: Using video.url from result.data.video');
    } else if (result.data?.videos && result.data.videos.length > 0) {
        videoUrl = result.data.videos[0].url;
        console.log('FAL.ai: Using videos[0].url from result.data.videos');
    } else if (result.data?.output_video) {
        videoUrl = result.data.output_video;
        console.log('FAL.ai: Using output_video from result.data');
    } else {
        console.error('FAL.ai: Unexpected response structure:', result.data);
        throw new Error("FAL.ai: No video generated - unexpected response structure. Check console for response details.");
    }

    console.log('FAL.ai: Video URL extracted:', videoUrl);
    
    // Convert the video URL to base64 data URL
    console.log('FAL.ai: Fetching video from URL...');
    const response = await fetch(videoUrl);
    
    if (!response.ok) {
        console.error('FAL.ai: Failed to fetch video:', {
            status: response.status,
            statusText: response.statusText,
            url: videoUrl
        });
        throw new Error(`FAL.ai: Failed to fetch generated video: ${response.status} ${response.statusText}`);
    }
    
    console.log('FAL.ai: Video fetch successful, converting to blob...');
    const videoBlob = await response.blob();
    console.log('FAL.ai: Video blob created, size:', videoBlob.size, 'bytes');
    
    // Cache the generated video for future use
    try {
        await cacheMediaBlob(enhancedPrompt, videoBlob, 'fal-ai/stable-video', duration, 'gif');
        console.log('Cached generated GIF for future use');
    } catch (cacheError) {
        console.warn('Failed to cache GIF:', cacheError);
        // Don't fail the whole operation if caching fails
    }
    
    // Convert blob to base64 data URL
    console.log('FAL.ai: Converting video blob to base64 data URL...');
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                console.log('FAL.ai: Successfully converted video to base64 data URL');
                resolve(reader.result);
            } else {
                console.error('FAL.ai: FileReader result is not a string:', typeof reader.result);
                reject(new Error('FAL.ai: Failed to convert video to base64 - unexpected FileReader result type'));
            }
        };
        reader.onerror = (error) => {
            console.error('FAL.ai: FileReader error:', error);
            reject(new Error('FAL.ai: Failed to read video blob - FileReader error'));
        };
        reader.readAsDataURL(videoBlob);
    });
};

/**
 * Generate an avatar image using FAL.ai's image generation
 * Specifically designed for portrait-style avatars with 1:1 aspect ratio
 */
export const generateAvatarImage = async (prompt: string): Promise<string> => {
    if (!isConfigured()) {
        throw new FalConfigurationError("FAL.ai is not configured. Please set VITE_FAL_API_KEY in your environment variables.");
    }

    // Enhanced prompt for portrait-style avatar generation
    const enhancedPrompt = `centered portrait of a biblical-era person from the Middle East, ${prompt}, photo-realistic, historically accurate, natural lighting, high-detail, face focus, 4k`;
    const imageSize = "square_hd";
    
    // Check cache first
    console.log('Checking cache for avatar image...');
    const cachedBlob = await getCachedMediaBlob(enhancedPrompt, 'fal-ai/flux/dev-avatar', 0, 'image');
    if (cachedBlob) {
        console.log('Found cached avatar image, returning immediately');
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject(new Error('Failed to convert cached avatar to base64'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read cached avatar blob'));
            reader.readAsDataURL(cachedBlob);
        });
    }

    console.log('No cached avatar found, generating new one...');

    // Wrap the FAL API call with retry logic
    const result = await retryWithExponentialBackoff(async () => {
        const client = getFalClient();
        
        console.log('Generating avatar image with FAL.ai...');
        
        const result = await client.subscribe("fal-ai/flux/dev", {
            input: {
                prompt: enhancedPrompt,
                image_size: imageSize,
                num_inference_steps: 20,
            },
        });

        if (!result.data || !result.data.images || result.data.images.length === 0) {
            throw new Error("No avatar image generated by FAL.ai");
        }

        return result;
    }, FAL_RETRY_CONFIG);

    const imageUrl = result.data.images[0].url;
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch generated avatar: ${response.statusText}`);
    }
    
    const imageBlob = await response.blob();
    
    // Cache the generated avatar for future use
    try {
        await cacheMediaBlob(enhancedPrompt, imageBlob, 'fal-ai/flux/dev-avatar', 0, 'image');
        console.log('Cached generated avatar for future use');
    } catch (cacheError) {
        console.warn('Failed to cache avatar:', cacheError);
        // Don't fail the whole operation if caching fails
    }
    
    // Convert blob to base64 data URL
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to convert avatar to base64'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read avatar blob'));
        reader.readAsDataURL(imageBlob);
    });
};

/**
 * Generate a fallback static image using FAL.ai's image generation
 * This can be used as a backup when video generation fails
 */
export const generateFallbackImage = async (prompt: string): Promise<string> => {
    if (!isConfigured()) {
        throw new FalConfigurationError("FAL.ai is not configured. Please set VITE_FAL_API_KEY in your environment variables.");
    }

    // Enhanced prompt for better image generation
    const enhancedPrompt = `${prompt}, cinematic, dramatic, high quality, 4k, historically accurate, biblical era, photo-realistic`;
    const imageSize = "landscape_16_9";
    
    // Check cache first
    console.log('Checking cache for fallback image...');
    const cachedBlob = await getCachedMediaBlob(enhancedPrompt, 'fal-ai/flux/dev', 0, 'image');
    if (cachedBlob) {
        console.log('Found cached fallback image, returning immediately');
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result);
                } else {
                    reject(new Error('Failed to convert cached image to base64'));
                }
            };
            reader.onerror = () => reject(new Error('Failed to read cached image blob'));
            reader.readAsDataURL(cachedBlob);
        });
    }

    console.log('No cached image found, generating new one...');

    // Wrap the FAL API call with retry logic
    const result = await retryWithExponentialBackoff(async () => {
        const client = getFalClient();
        
        console.log('Generating fallback image with FAL.ai...');
        
        const result = await client.subscribe("fal-ai/flux/dev", {
            input: {
                prompt: enhancedPrompt,
                image_size: imageSize,
                num_inference_steps: 20,
            },
        });

        if (!result.data || !result.data.images || result.data.images.length === 0) {
            throw new Error("No image generated by FAL.ai");
        }

        return result;
    }, FAL_RETRY_CONFIG);

    const imageUrl = result.data.images[0].url;
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
        throw new Error(`Failed to fetch generated image: ${response.statusText}`);
    }
    
    const imageBlob = await response.blob();
    
    // Cache the generated image for future use
    try {
        await cacheMediaBlob(enhancedPrompt, imageBlob, 'fal-ai/flux/dev', 0, 'image');
        console.log('Cached generated fallback image for future use');
    } catch (cacheError) {
        console.warn('Failed to cache fallback image:', cacheError);
        // Don't fail the whole operation if caching fails
    }
    
    // Convert blob to base64 data URL
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to convert image to base64'));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read image blob'));
        reader.readAsDataURL(imageBlob);
    });
};

// Export the service object for easy access
export const falService = {
    generateGIF,
    generateAvatarImage,
    generateFallbackImage,
    isConfigured,
    testApiKey,
    clearMediaCache,
    getMediaCacheStats,
};
