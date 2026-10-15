/**
 * Client-Side AI Assistance Service
 * 
 * Safely communicates with the Hostinger server-side PHP endpoint (/api/gemini.php).
 * No API key is ever stored in or exposed by the client browser.
 */

export interface AiPromptRequest {
  prompt: string;
  systemInstruction?: string;
  model?: string;
}

export interface AiPromptResponse {
  success: boolean;
  text: string;
  error?: string;
}

export async function askSolarAiAssistant(request: AiPromptRequest): Promise<AiPromptResponse> {
  const apiEndpoint = import.meta.env.VITE_AI_API_URL || '/api/gemini';

  try {
    const response = await fetch(apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        text: '',
        error: errData.error || `Server returned error status ${response.status}`
      };
    }

    const data = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text || data.text || '';

    return {
      success: true,
      text: candidateText
    };
  } catch (err: any) {
    return {
      success: false,
      text: '',
      error: err?.message || 'Network error communicating with AI API endpoint.'
    };
  }
}
