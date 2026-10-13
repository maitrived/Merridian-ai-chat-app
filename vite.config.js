import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'
import { isAdminRequest, errorMessage } from './server/errorMessages.js'

dotenv.config({ override: true })

const apiProxyPlugin = () => ({
  name: 'api-proxy',
  configureServer(server) {
    server.middlewares.use('/api/chat', async (req, res, next) => {
      if (req.method !== 'POST') return next()

      let body = ''
      req.on('data', chunk => { body += chunk.toString() })
      req.on('end', async () => {
        try {
          const { messages, model, stream = true, options = {} } = JSON.parse(body)
          
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

          let finalMessages = messages;
          if (messages.length > 0 && messages[0].role === 'system') {
            finalMessages = [
              { role: 'system', content: SYSTEM_PROMPT + '\n\n' + messages[0].content },
              ...messages.slice(1)
            ];
          } else {
            finalMessages = [
              { role: 'system', content: SYSTEM_PROMPT },
              ...messages
            ];
          }
          
          const modelMap = {
            'gemini-1.5-flash': 'gemini-3.6-flash',
            'gemini-1.5-pro': 'gemini-3.6-flash',
            'gpt-4o': 'gemini-3.6-flash',
          };
          const geminiModel = modelMap[model] || 'gemini-3.6-flash';

          const apiKey = process.env.GEMINI_API_KEY;
          console.log('[Merridian] GEMINI_API_KEY loaded:', apiKey ? `${apiKey.substring(0,8)}...` : 'MISSING!');
          console.log('[Merridian] Using model:', geminiModel);

          const nvidiaRes = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: geminiModel,
              messages: finalMessages,
              stream: stream,
              temperature: options.temperature || 0.5,
              max_tokens: 1024,
            }),
          });

          if (!nvidiaRes.ok) {
            const errText = await nvidiaRes.text();
            console.error('[Merridian] Gemini API ERROR:', nvidiaRes.status, errText);
            const admin = await isAdminRequest(req.headers.authorization);
            res.statusCode = nvidiaRes.status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ message: errorMessage(nvidiaRes.status, admin) }));
            return;
          }

          if (stream) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            if (nvidiaRes.body) {
              const reader = nvidiaRes.body.getReader();
              const streamFunc = async () => {
                try {
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    res.write(value);
                  }
                } finally {
                  res.end();
                }
              };
              streamFunc();
            } else {
              res.end();
            }
          } else {
            const data = await nvidiaRes.json();
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(data));
          }

        } catch (err) {
          console.error("Vite Proxy Internal Error:", err);
          const admin = await isAdminRequest(req.headers.authorization);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ message: errorMessage(500, admin) }));
        }
      })
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiProxyPlugin()],
})

