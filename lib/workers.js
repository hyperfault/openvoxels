// ── Mistral Small ────────────────────────────────────────────
async function callMistralSmall(prompt) {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.MISTRAL_API_KEY,
        },
        body: JSON.stringify({
            model: "mistral-small-latest",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1024,
        }),
    });
    const data = await res.json();
    return data.choices[0].message.content;
}

// ── Llama 3.3 via Groq ───────────────────────────────────────
async function callLlama(prompt) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.GROQ_API_KEY,
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1024,
        }),
    });
    const data = await res.json();
    return data.choices[0].message.content;
}

// ── GPT-OSS 120B via Groq ────────────────────────────────────
async function callGptOss(prompt) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.GROQ_API_KEY,
        },
        body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1024,
        }),
    });
    const data = await res.json();
    return data.choices[0].message.content;
}

// ── Qwen 2.5 72B via HuggingFace ────────────────────────────
async function callQwen(prompt) {
    const res = await fetch(
        "https://api-inference.huggingface.co/models/Qwen/Qwen2.5-72B-Instruct/v1/chat/completions",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + process.env.HUGGINGFACE_API_KEY,
            },
            body: JSON.stringify({
                model: "Qwen/Qwen2.5-72B-Instruct",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 1024,
            }),
        }
    );
    const data = await res.json();
    return data.choices[0].message.content;
}

// ── Mistral Large ────────────────────────────────────────────
async function callMistralLarge(prompt) {
    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.MISTRAL_API_KEY,
        },
        body: JSON.stringify({
            model: "mistral-large-latest",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1024,
        }),
    });
    const data = await res.json();
    return data.choices[0].message.content;
}

// ── Run workers in parallel ──────────────────────────────────
export async function runWorkers(prompt, workerCount) {
    const allWorkers = [
        { model: "mistral-small", fn: callMistralSmall },
        { model: "llama", fn: callLlama },
        { model: "gpt-oss-120b", fn: callGptOss },
        { model: "qwen", fn: callQwen },
        { model: "mistral-large", fn: callMistralLarge },
    ];

    const selected = allWorkers.slice(0, workerCount);

    const results = await Promise.allSettled(
        selected.map(async (w) => ({
            model: w.model,
            response: await w.fn(prompt),
        }))
    );

    return results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);
}
