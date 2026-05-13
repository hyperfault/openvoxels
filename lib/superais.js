// ── Super AI 1: Mistral Small — Synthesis & Formatting ───────
export async function synthesize(originalQuery, workerResponses) {
    const combinedResponses = workerResponses
    .map((w, i) => "[Response " + (i + 1) + " from " + w.model + "]:\n" + w.response)
    .join("\n\n---\n\n");

    const synthesisPrompt = "You are a synthesis AI. You have received multiple AI responses to the same question. Your job is to: 1. Read all responses carefully. 2. Extract the best, most accurate, most insightful parts from each. 3. Remove redundancy and contradictions. 4. Combine them into one single, well-formatted, coherent response. 5. Do NOT add your own opinions. Only synthesize what is given. Original question: " + originalQuery + " Responses to synthesize: " + combinedResponses + " Produce the final synthesized response now:";

    const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.MISTRAL_API_KEY,
        },
        body: JSON.stringify({
            model: "mistral-small-latest",
            messages: [{ role: "user", content: synthesisPrompt }],
            max_tokens: 2048,
        }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Synthesis failed.";
}

// ── Super AI 2: GPT-OSS 120B via Groq — Hallucination Check ──
export async function hallucCheck(originalQuery, synthesizedResponse, workerResponses) {
    const workerSummary = workerResponses.map((w) => "[" + w.model + "]: " + w.response).join("\n\n");

    const hallucPrompt = "You are a hallucination detection AI. Your ONLY job is to find factual errors, made-up information, or logical inconsistencies in the response below. Original question: " + originalQuery + " Synthesized response to check: " + synthesizedResponse + " Individual worker responses for reference: " + workerSummary + " Respond in this exact JSON format and nothing else: { \"clean\": true or false, \"issues\": [\"list of specific issues found, or empty array if clean\"], \"workerToRedo\": \"name of the worker model most responsible for any hallucination, or null if clean\" }";

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.GROQ_API_KEY,
        },
        body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: hallucPrompt }],
            max_tokens: 512,
        }),
    });

    const data = await res.json();
    console.log("hallucCheck response:", JSON.stringify(data));
    const text = data.choices?.[0]?.message?.content;
    if (!text) return { clean: true, issues: [], workerToRedo: null };

    try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleaned);
    } catch {
        return { clean: true, issues: [], workerToRedo: null };
    }
}

// ── Super AI 3: Llama 3.3 via Groq — Safety Layer ────────────
export async function safetyCheck(response) {
    const safetyPrompt = "You are a safety review AI. Your job is to review the response below and make light edits ONLY if needed to remove harmful, dangerous, or inappropriate content. STRICT RULES: Do NOT change facts. Do NOT change the structure or conclusions. Do NOT rewrite things that are fine. ONLY remove or soften genuinely harmful content. If nothing needs changing, return the response exactly as-is. Response to review: " + response + " Return the final safe response now, nothing else.";

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.GROQ_API_KEY,
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: safetyPrompt }],
            max_tokens: 2048,
        }),
    });

    const data = await res.json();
    return data.choices?.[0]?.message?.content || response;
}
