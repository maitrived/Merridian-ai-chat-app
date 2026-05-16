import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import dotenv from 'dotenv'

dotenv.config()

const apiProxyPlugin = () => ({
  name: 'api-proxy',
  configureServer(server) {
    server.middlewares.use('/api/chat', async (req, res, next) => {
      if (req.method !== 'POST') return next()

      let body = ''
      req.on('data', chunk => { body += chunk.toString() })
      req.on('end', async () => {
        try {
          const { messages, model } = JSON.parse(body)
          
          const modelMap = {
            'gemini-1.5-flash': 'meta/llama-3.1-8b-instruct',
            'gemini-1.5-pro': 'nvidia/llama-3.1-nemotron-70b-instruct',
            'gpt-4o': 'mistralai/mistral-large-2407',
          };
          const nimModel = modelMap[model] || 'meta/llama-3.1-8b-instruct';

          const nvidiaRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
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

          if (!nvidiaRes.ok) {
            const errText = await nvidiaRes.text();
            console.error("NVIDIA API ERROR:", nvidiaRes.status, errText);
            res.statusCode = nvidiaRes.status;
            res.end(errText);
            return;
          }

          res.setHeader('Content-Type', 'text/event-stream');
          res.setHeader('Cache-Control', 'no-cache');
          res.setHeader('Connection', 'keep-alive');

          if (nvidiaRes.body) {
            const reader = nvidiaRes.body.getReader();
            
            const stream = async () => {
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
            stream();
          } else {
            res.end();
          }

        } catch (err) {
          console.error("Vite Proxy Internal Error:", err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      })
    })
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiProxyPlugin()],
})

