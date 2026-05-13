import { NextResponse } from "next/server";
import { classifyQuery, getWorkerCount } from "@/lib/classifier";
import { runWorkers } from "@/lib/workers";
import { synthesize, hallucCheck, safetyCheck } from "@/lib/superais";
import { getMemories, extractAndSaveMemories } from "@/lib/memory";

const MAX_RETRIES = 3;

export async function POST(request) {
    try {
        const { message, history } = await request.json();

        if (!message) {
            return NextResponse.json({ error: "No message provided" }, { status: 400 });
        }

        // Build conversation context from history
        const conversationContext = history && history.length > 0
        ? history.map((m) => m.role + ": " + m.content).join("\n")
        : null;

        // Pull persistent memories from Supabase
        const persistentMemory = await getMemories();

        // Build enriched prompt with memory + conversation context
        let enrichedPrompt = "";
        if (persistentMemory) {
            enrichedPrompt += "Things you know about the user:\n" + persistentMemory + "\n\n";
        }
        if (conversationContext) {
            enrichedPrompt += "Conversation so far:\n" + conversationContext + "\n\n";
        }
        enrichedPrompt += "User: " + message;

        // Classify and get worker count
        const tier = await classifyQuery(message);
        const workerCount = getWorkerCount(tier);

        // Run workers
        let workerResponses = await runWorkers(enrichedPrompt, workerCount);

        if (workerResponses.length === 0) {
            return NextResponse.json({ error: "All workers failed" }, { status: 500 });
        }

        let finalResponse = null;
        let attempts = 0;

        while (attempts < MAX_RETRIES) {
            attempts++;

            const synthesized = await synthesize(message, workerResponses);
            const check = await hallucCheck(message, synthesized, workerResponses);

            if (check.clean) {
                const safe = await safetyCheck(synthesized);
                finalResponse = safe;
                break;
            } else {
                const badWorker = check.workerToRedo;
                if (badWorker) {
                    const redoResult = await runWorkers(enrichedPrompt, 1);
                    workerResponses = workerResponses.map((w) =>
                    w.model === badWorker ? (redoResult[0] || w) : w
                    );
                }
                if (attempts === MAX_RETRIES) {
                    const safe = await safetyCheck(synthesized);
                    finalResponse = safe;
                }
            }
        }

        // Extract and save memories in the background (don't await, don't block response)
        extractAndSaveMemories(message, finalResponse).catch(() => {});

        return NextResponse.json({
            response: finalResponse,
            tier,
            workerCount,
        });

    } catch (error) {
        console.error("Pipeline error:", error);
        return NextResponse.json({ error: "Pipeline failed" }, { status: 500 });
    }
}
