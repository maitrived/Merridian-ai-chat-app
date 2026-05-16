export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const { messages, model, userId } = await req.json();

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
    'gemini-1.5-pro': 'nvidia/llama-3.1-nemotron-70b-instruct',
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
        messages: messages,
        stream: true,
        temperature: 0.5,
        top_p: 1,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(JSON.stringify(errorData), { status: response.status });
    }

    // Return the stream directly to the client
    return new Response(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error("API Chat Error:", error.message);
    return new Response(JSON.stringify({ error: "An internal server error occurred." }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
