// lib/classifier.js
// Classifies a query into tier 1 (simple), 2 (medium), or 3 (hard)

export async function classifyQuery(query) {
    const q = query.toLowerCase().trim();

    // Tier 1 — simple greetings, identity questions, one-liners
    const simplePhrases = [
        "how are you", "what's your name", "what is your name",
        "who are you", "hello", "hi", "hey", "good morning",
        "good night", "what can you do", "help", "thanks", "thank you"
    ];

    if (simplePhrases.some(p => q.includes(p)) || q.split(" ").length < 6) {
        return 1;
    }

    // Tier 3 — hard tasks
    const hardKeywords = [
        "essay", "code", "write a", "build", "implement", "architecture",
        "explain in detail", "design", "algorithm", "debug", "refactor",
        "analyze", "compare", "research", "summarize this", "step by step"
    ];

    if (hardKeywords.some(k => q.includes(k)) || q.split(" ").length > 40) {
        return 3;
    }

    // Everything else is tier 2
    return 2;
}

// How many workers per tier
export function getWorkerCount(tier) {
    if (tier === 1) return 1;
    if (tier === 2) return 3; // uses workers 0, 1, 2
    return 5;
}
