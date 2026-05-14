export async function classifyQuery(query) {
    const q = query.toLowerCase().trim();
    const words = q.split(" ").length;

    const simplePhrases = [
        "how are you", "what's your name", "what is your name",
        "who are you", "hello", "hi", "hey", "good morning",
        "good night", "what can you do", "thanks", "thank you",
        "ok", "okay", "yes", "no", "sure", "cool"
    ];

    if (simplePhrases.some(p => q === p || q === p + "!" || q === p + ".") || words <= 3) {
        return 1;
    }

    const hardKeywords = [
        "essay", "code", "write", "build", "implement", "architect",
        "explain", "design", "algorithm", "debug", "refactor", "analyze",
        "compare", "research", "summarize", "step by step", "how does",
        "why does", "what is the difference", "pros and cons", "history of",
        "tell me about", "help me", "can you", "what are", "list", "give me",
        "show me", "create", "generate", "make", "solve", "calculate",
        "translate", "review", "improve", "suggest", "recommend"
    ];

    // Push almost everything to tier 3
    if (hardKeywords.some(k => q.includes(k)) || words >= 6) {
        return 3;
    }

    // Medium only for very specific short factual questions
    if (words >= 4) return 3;

    return 2;
}

export function getWorkerCount(tier, override = null) {
    if (override !== null && override !== "auto") return parseInt(override);
    if (tier === 1) return 1;
    if (tier === 2) return 3;
    return 5;
}
