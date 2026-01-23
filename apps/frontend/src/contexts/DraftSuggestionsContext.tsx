import { JSXElement, createContext, createMemo, useContext } from "solid-js";
import { getSuggestions, Suggestion } from "@draftgap/core/src/draft/suggestions";
import { useDraftAnalysis } from "./DraftAnalysisContext";
import { useDataset } from "./DatasetContext";
import { ratingToWinrate } from "@draftgap/core/src/rating/ratings";

export type TierLabel = 'S+' | 'S' | 'A' | 'B' | 'C' | 'D';

export interface TieredSuggestion extends Suggestion {
    tier?: TierLabel;
    tierColor?: string;
}

const TIER_CONFIG: Record<TierLabel, string> = {
    'S+': "text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.8)]",
    'S': "text-red-500",
    'A': "text-orange-400",
    'B': "text-yellow-400",
    'C': "text-green-400",
    'D': "text-neutral-500"
};

const TIER_ORDER: TierLabel[] = ['S+', 'S', 'A', 'B', 'C', 'D'];

// NEW LOGIC CONSTANTS:
// 1. Dominance Threshold: #1 must be 1.75% better than #2 to get S+
const DOMINANCE_GAP_THRESHOLD = 0.0175;

// 2. Standard Drop: Between normal tiers, 1.25% gap drops a level
const TIER_DROP_THRESHOLD = 0.0125; 

function assignTiers(suggestions: Suggestion[]): TieredSuggestion[] {
    if (suggestions.length === 0) return [];
    if (suggestions.length === 1) {
        // Only one suggestion? It's automatically S+
        return [{...suggestions[0], tier: 'S+', tierColor: TIER_CONFIG['S+']}];
    }

    // 1. Calculate the "Dominance Gap" (Distance between #1 and #2)
    const firstWinrate = ratingToWinrate(suggestions[0].draftResult.totalRating);
    const secondWinrate = ratingToWinrate(suggestions[1].draftResult.totalRating);
    const dominanceGap = firstWinrate - secondWinrate;

    // 2. Decide if #1 deserves S+
    // If the gap is huge (> 1.75%), #1 is S+. Otherwise, #1 starts at S.
    let currentTierIndex = (dominanceGap >= DOMINANCE_GAP_THRESHOLD) ? 0 : 1;
    
    // Set the "Leader" to track gaps from
    let currentTierLeaderWinrate = firstWinrate;

    return suggestions.map((s, index) => {
        const currentWinrate = ratingToWinrate(s.draftResult.totalRating);
        const gapToLeader = currentTierLeaderWinrate - currentWinrate;

        // Special handling for the #1 spot
        if (index === 0) {
            const tierLabel = TIER_ORDER[currentTierIndex];
            return { ...s, tier: tierLabel, tierColor: TIER_CONFIG[tierLabel] };
        }

        // For everyone else (#2, #3...), check gaps normally
        if (gapToLeader >= TIER_DROP_THRESHOLD) {
            // Drop a tier
            if (currentTierIndex < TIER_ORDER.length - 1) {
                currentTierIndex++;
                currentTierLeaderWinrate = currentWinrate;
            }
        }

        const tierLabel = TIER_ORDER[currentTierIndex];
        return {
            ...s,
            tier: tierLabel,
            tierColor: TIER_CONFIG[tierLabel]
        };
    });
}

export function createDraftSuggestionsContext() {
    const { isLoaded, dataset, dataset30Days } = useDataset();
    const { 
        draftAnalysisConfig, 
        allyTeamComp, 
        opponentTeamComp
    } = useDraftAnalysis();

    const allySuggestions = createMemo(() => {
        if (!isLoaded()) return [];
        const raw = getSuggestions(
            dataset()!,
            dataset30Days()!,
            allyTeamComp(),
            opponentTeamComp(),
            draftAnalysisConfig()
        );
        return assignTiers(raw);
    });

    const opponentSuggestions = createMemo(() => {
        if (!isLoaded()) return [];
        const raw = getSuggestions(
            dataset()!,
            dataset30Days()!,
            opponentTeamComp(),
            allyTeamComp(),
            draftAnalysisConfig()
        );
        return assignTiers(raw);
    });

    return { allySuggestions, opponentSuggestions };
}

export const DraftSuggestionsContext =
    createContext<ReturnType<typeof createDraftSuggestionsContext>>();

export function DraftSuggestionsProvider(props: { children: JSXElement }) {
    return (
        <DraftSuggestionsContext.Provider value={createDraftSuggestionsContext()}>
            {props.children}
        </DraftSuggestionsContext.Provider>
    );
}

export function useDraftSuggestions() {
    const useCtx = useContext(DraftSuggestionsContext);
    if (!useCtx) throw new Error("No DraftSuggestionsContext found");
    return useCtx;
}