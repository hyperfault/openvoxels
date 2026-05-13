import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
);

// Get all persistent memories as a single context string
export async function getMemories() {
    const { data, error } = await supabase
    .from("memory")
    .select("key, value")
    .order("updated_at", { ascending: false });

    if (error || !data || data.length === 0) return null;

    return data.map((m) => m.key + ": " + m.value).join("\n");
}

// Save a memory (upsert by key)
export async function saveMemory(key, value) {
    await supabase.from("memory").upsert(
        { key, value, updated_at: new Date().toISOString() },
                                         { onConflict: "key" }
    );
}

// Extract and save memories from a conversation turn
export async function extractAndSaveMemories(userMessage, aiResponse) {
    const prompt =
    "You are a memory extraction AI. Given a user message and AI response, extract any important facts worth remembering long-term about the user or their preferences. Examples: their name, job, hobbies, preferences, goals. Only extract genuinely useful persistent facts, not conversational filler. If nothing is worth remembering, return an empty array. Respond in this exact JSON format and nothing else: [{\"key\": \"short_label\", \"value\": \"what to remember\"}] User message: " +
    userMessage +
    " AI response: " +
    aiResponse;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + process.env.GROQ_API_KEY,
        },
        body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 512,
        }),
    });

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) return;

    try {
        const cleaned = text.replace(/```json|```/g, "").trim();
        const memories = JSON.parse(cleaned);
        if (!Array.isArray(memories)) return;
        for (const m of memories) {
            if (m.key && m.value) await saveMemory(m.key, m.value);
        }
    } catch {
        return;
    }
}
