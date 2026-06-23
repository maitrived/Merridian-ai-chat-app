export const config = {
  runtime: 'edge',
};

const SYSTEM_PROMPT = `You are Merridian, a highly intelligent and thoughtful AI assistant.

Before answering, internally think:
1. What is the user *actually* asking or trying to achieve? (understand intent, not just surface words)
2. What context or background knowledge is relevant?
3. What is the most complete, accurate, and useful answer?

Then respond:
- Be direct and clear — get to the point fast
- Match the depth to the question: quick factual answers stay short, complex topics get thorough explanations
- Use markdown formatting (code blocks, bullet points, headers) when it helps readability
- If something is ambiguous, address the most likely interpretation and briefly note the alternative
- Never pad your answer with filler phrases like "Certainly!" or "Great question!"
- When writing code, always include the full working solution, not a skeleton

CRITICAL: If the user references an attached document, the system has ALREADY extracted the text and provided it to you in this prompt. You DO have access to it. Do NOT claim you cannot read or access files.
CRITICAL: When summarizing or extracting from documents, ONLY use the facts present in the text provided to you. DO NOT guess, hallucinate, or fill in the blanks with assumptions. If information is missing, state it is missing.
CRITICAL: Do not assume genders. Always use gender-neutral language (they/them/their) when referring to people unless their pronouns are explicitly specified.`;

function prepareMessages(messages) {
  // If the caller already injected a system message, prepend our system prompt to it
  // Otherwise inject it fresh at position 0
  if (messages.length > 0 && messages[0].role === 'system') {
    return [
      { role: 'system', content: SYSTEM_PROMPT + '\n\n' + messages[0].content },
      ...messages.slice(1)
    ];
  }
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages
  ];
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const { messages, model, userId, stream = true, options = {} } = await req.json();

  const authHeader = req.headers.get('Authorization');
  if (userId !== 'guest' && (!authHeader || !authHeader.startsWith('Bearer '))) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
  if (!NVIDIA_API_KEY) {
    return new Response(JSON.stringify({ error: 'NVIDIA API Key not configured' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Map our model names to NVIDIA NIM model names
  const modelMap = {
    'gemini-1.5-flash': 'meta/llama-3.1-8b-instruct',
    'gemini-1.5-pro': 'meta/llama-3.1-70b-instruct',
    'gpt-4o': 'mistralai/mistral-large-2-instruct',
  };

  const nimModel = modelMap[model] || 'meta/llama-3.1-8b-instruct';

  try {
    const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${NVIDIA_API_KEY}`,
      },
      body: JSON.stringify({
        model: nimModel,
        messages: prepareMessages(messages),
        stream: stream,
        temperature: options.temperature || 0.5,
        top_p: 1,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(JSON.stringify(errorData), { status: response.status });
    }

    if (stream) {
      return new Response(response.body, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (error) {
    console.error("API Chat Error:", error.message);
    return new Response(JSON.stringify({ error: "An internal server error occurred." }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
