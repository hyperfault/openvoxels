export const AVAILABLE_WORKERS = [
  { id: "llama-3.3-70b-versatile",            label: "Llama 3.3 70B",      provider: "groq" },
  { id: "openai/gpt-oss-120b",                label: "GPT-OSS 120B",       provider: "groq" },
  { id: "deepseek-r1-distill-llama-70b",      label: "Deepseek R1 70B",    provider: "groq" },
  { id: "qwen-qwq-32b",                       label: "Qwen QwQ 32B",       provider: "groq" },
  { id: "mistral-saba-latest",                label: "Mistral Saba",       provider: "groq" },
  { id: "gemma2-9b-it",                       label: "Gemma 2 9B",         provider: "groq" },
  { id: "compound-beta",                      label: "Compound Beta",      provider: "groq" },
  { id: "llama-3.1-8b-instant",               label: "Llama 3.1 8B",       provider: "groq" },
  { id: "mistral-small-latest",               label: "Mistral Small",      provider: "mistral" },
  { id: "mistral-large-latest",               label: "Mistral Large",      provider: "mistral" },
  { id: "codestral-latest",                   label: "Codestral",          provider: "mistral" },
  { id: "Qwen/Qwen2.5-72B-Instruct",          label: "Qwen 2.5 72B",       provider: "qwen" },
  { id: "meta-llama/Llama-3.3-70B-Instruct",  label: "Llama 3.3 HF",      provider: "qwen" },
  { id: "mistralai/Mistral-7B-Instruct-v0.3", label: "Mistral 7B HF",     provider: "qwen" },
];

// Default workers — all Groq so it works even without Mistral key
export const DEFAULT_WORKERS = [
  "llama-3.3-70b-versatile",
  "openai/gpt-oss-120b",
  "deepseek-r1-distill-llama-70b",
  "qwen-qwq-32b",
  "gemma2-9b-it",
];

async function callGroq(modelId, prompt) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.GROQ_API_KEY,
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
    }),
  });
  const data = await res.json();
  if (!data.choices?.[0]?.message?.content) throw new Error(`Groq ${modelId} failed`);
  return data.choices[0].message.content;
}

async function callMistral(modelId, prompt) {
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.MISTRAL_API_KEY,
    },
    body: JSON.stringify({
      model: modelId,
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1024,
    }),
  });
  const data = await res.json();
  if (!data.choices?.[0]?.message?.content) throw new Error(`Mistral ${modelId} failed`);
  return data.choices[0].message.content;
}

async function callQwen(modelId, prompt) {
  const res = await fetch(
    `https://api-inference.huggingface.co/models/${modelId}/v1/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.QWEN_API_KEY,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
      }),
    }
  );
  const data = await res.json();
  if (!data.choices?.[0]?.message?.content) throw new Error(`HuggingFace ${modelId} failed`);
  return data.choices[0].message.content;
}

async function callWorker(modelId, prompt) {
  const worker = AVAILABLE_WORKERS.find(w => w.id === modelId);
  if (!worker) throw new Error(`Unknown model: ${modelId}`);
  if (worker.provider === "groq") return callGroq(modelId, prompt);
  if (worker.provider === "mistral") return callMistral(modelId, prompt);
  if (worker.provider === "qwen") return callQwen(modelId, prompt);
  throw new Error(`Unknown provider for ${modelId}`);
}

export async function runWorkers(prompt, workerCount, customModels = null) {
  const modelIds = (customModels && customModels.length > 0)
    ? customModels.slice(0, workerCount)
    : DEFAULT_WORKERS.slice(0, workerCount);

  const results = await Promise.allSettled(
    modelIds.map(async (modelId) => ({
      model: modelId,
      response: await callWorker(modelId, prompt),
    }))
  );

  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`Worker ${modelIds[i]} failed:`, r.reason);
  });

  const successful = results.filter(r => r.status === "fulfilled").map(r => r.value);

  // If all selected workers failed and they include non-groq models, fallback to pure groq
  if (successful.length === 0) {
    console.log("All workers failed, falling back to Groq-only workers");
    const fallbackResults = await Promise.allSettled(
      DEFAULT_WORKERS.slice(0, workerCount).map(async (modelId) => ({
        model: modelId,
        response: await callGroq(modelId, prompt),
      }))
    );
    return fallbackResults.filter(r => r.status === "fulfilled").map(r => r.value);
  }

  return successful;
}
