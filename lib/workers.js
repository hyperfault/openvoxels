import { GoogleGenerativeAI } from "@google/generative-ai";

// ── All available worker models ───────────────────────────────
export const AVAILABLE_WORKERS = [
    // Groq-hosted
    { id: "llama-3.3-70b-versatile",        label: "Llama 3.3 70B",        provider: "groq" },
{ id: "deepseek-r1-distill-llama-70b",  label: "Deepseek R1 70B",      provider: "groq" },
{ id: "openai/gpt-oss-120b",            label: "GPT-OSS 120B",         provider: "groq" },
{ id: "mistral-saba-latest",            label: "Mistral Saba",         provider: "groq" },
{ id: "qwen-qwq-32b",                   label: "Qwen QwQ 32B",         provider: "groq" },
{ id: "gemma2-9b-it",                   label: "Gemma 2 9B",           provider: "groq" },
{ id: "compound-beta",                  label: "Compound Beta",        provider: "groq" },
// Mistral
{ id: "mistral-small-latest",           label: "Mistral Small",        provider: "mistral" },
{ id: "mistral-large-latest",           label: "Mistral Large",        provider: "mistral" },
{ id: "codestral-latest",               label: "Codestral",            provider: "mistral" },
// Deepseek
{ id: "deepseek-chat",                  label: "Deepseek Chat",        provider: "deepseek" },
{ id: "deepseek-reasoner",              label: "Deepseek Reasoner",    provider: "deepseek" },
// Gemini
{ id: "gemini-2.5-pro",                 label: "Gemini 2.5 Pro",       provider: "gemini" },
{ id: "gemini-2.0-flash",               label: "Gemini 2.0 Flash",     provider: "gemini" },
// HuggingFace
{ id: "Qwen/Qwen2.5-72B-Instruct",      label: "Qwen 2.5 72B",         provider: "huggingface" },
{ id: "meta-llama/Llama-3.3-70B-Instruct", label: "Llama 3.3 HF",     provider: "huggingface" },
{ id: "mistralai/Mistral-7B-Instruct-v0.3", label: "Mistral 7B HF",   provider: "huggingface" },
];

export const DEFAULT_WORKERS = [
    "mistral-small-latest",
"llama-3.3-70b-versatile",
"openai/gpt-oss-120b",
"Qwen/Qwen2.5-72B-Instruct",
"mistral-large-latest",
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

async function callDeeepseek(modelId, prompt) {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.DEEPSEEK_API_KEY,
        },
        body: JSON.stringify({
            model: modelId,
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1024,
        }),
    });
    const data = await res.json();
    if (!data.choices?.[0]?.message?.content) throw new Error(`Deepseek ${modelId} failed`);
    return data.choices[0].message.content;
}

async function callGemini(modelId, prompt) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: modelId });
    const result = await model.generateContent(prompt);
    return result.response.text();
}

async function callHuggingFace(modelId, prompt) {
    const res = await fetch(
        `https://api-inference.huggingface.co/models/${modelId}/v1/chat/completions`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + process.env.HUGGINGFACE_API_KEY,
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
    if (worker.provider === "deepseek") return callDeeepseek(modelId, prompt);
    if (worker.provider === "gemini") return callG
