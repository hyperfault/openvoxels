import { NextResponse } from "next/server";
import { classifyQuery, getWorkerCount } from "@/lib/classifier";
import { runWorkers } from "@/lib/workers";
import { synthesize, hallucCheck, safetyCheck } from "@/lib/superais";

const MAX_RETRIES = 3;

export async function POST(request) {
    try {
        const { message, workerCountOverride, workerModels, superAiModels } = await request.json();

        if (!message) {
            return NextResponse.json({ error: "No message provided" }, { status: 400 });
        }

        const tier = await classifyQuery(message);
        const workerCount = getWorkerCount(tier, workerCountOverride);

        let workerResponses = await runWorkers(message, workerCount, workerModels);

        if (workerResponses.length === 0) {
            return NextResponse.json({ error: "All workers failed" }, { status: 500 });
        }

        let finalResponse = null;
        let attempts = 0;

        while (attempts < MAX_RETRIES) {
            attempts++;

            const synthesized = await synthesize(message, workerResponses, superAiModels?.synthesizer);
            const check = await hallucCheck(message, synthesized, workerResponses, superAiModels?.checker);

            if (check.clean) {
                const safe = await safetyCheck(synthesized, superAiModels?.safety);
                finalResponse = safe;
                break;
            } else {
                const badWorker = check.workerToRedo;
                if (badWorker) {
                    const redoResult = await runWorkers(message, 1, workerModels);
                    workerResponses = workerResponses.map(w =>
                    w.model === badWorker ? (redoResult[0] || w) : w
                    );
                }
                if (attempts === MAX_RETRIES) {
                    const safe = await safetyCheck(synthesized, superAiModels?.safety);
                    finalResponse = safe;
                }
            }
        }

        return NextResponse.json({ response: finalResponse, tier, workerCount });

    } catch (error) {
        console.error("Pipeline error:", error);
        return NextResponse.json({ error: "Pipeline failed" }, { status: 500 });
    }
}
