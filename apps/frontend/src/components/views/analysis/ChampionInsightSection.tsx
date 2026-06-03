import { createMemo, For, Show } from "solid-js";
import { Team } from "@draftgap/core/src/models/Team";
import { Role } from "@draftgap/core/src/models/Role";
import { DraftResult } from "@draftgap/core/src/draft/analysis";
import { getStats } from "@draftgap/core/src/draft/utils";
import { ratingToWinrate } from "@draftgap/core/src/rating/ratings";
import { ChampionIcon } from "../../icons/ChampionIcon";
import { useDataset } from "../../../contexts/DatasetContext";
import { useDraftAnalysis } from "../../../contexts/DraftAnalysisContext";
import { useUser } from "../../../contexts/UserContext";
import { championName } from "../../../utils/i18n";

type Props = {
    team: Team;
    championKey: string;
    role: Role | undefined;
};

type InsightRow = {
    title: string;
    details: { key: string; delta: string }[];
};

export function ChampionInsightSection(props: Props) {
    const { dataset } = useDataset();
    const { config } = useUser();
    const {
        allyDraftAnalysis: allyDraftResult,
        opponentDraftAnalysis: opponentDraftResult,
    } = useDraftAnalysis();

    const analysis = createMemo<DraftResult | undefined>(() =>
        props.team === "ally" ? allyDraftResult() : opponentDraftResult()
    );

    const nameFor = (championKey: string) =>
        championName(dataset()!.championData[championKey], config);

    const insights = createMemo(() => {
        const draft = analysis();
        const ds = dataset();
        const role = props.role;

        if (!draft || !ds || role === undefined) {
            return { positive: [] as InsightRow[], negative: [] as InsightRow[] };
        }

        const positive: InsightRow[] = [];
        const negative: InsightRow[] = [];
        const stats = getStats(ds, props.championKey, role);

        if (!config.ignoreChampionWinrates) {
            const championResult = draft.allyChampionRating.championResults.find(
                (result) => result.championKey === props.championKey
            );
            const strengthRating = championResult?.rating ?? 0;
            const strengthPercent = ratingToWinrate(strengthRating) * 100;
            let strengthPhrase = "Average overall";
            if (strengthPercent >= 51) strengthPhrase = "Strong overall";
            else if (strengthPercent <= 49) strengthPhrase = "Weak overall";

            const strengthLine = `${strengthPhrase} (${strengthPercent.toFixed(1)}%)`;
            if (strengthPercent >= 50) {
                positive.push({ title: strengthLine, details: [] });
            } else {
                negative.push({ title: strengthLine, details: [] });
            }
        }

        if (stats.games >= 75000) {
            positive.push({
                title: `Popular pick (${stats.games.toLocaleString()} games)`,
                details: [],
            });
        } else if (stats.games <= 10000) {
            negative.push({
                title: `Unpopular pick (${stats.games.toLocaleString()} games)`,
                details: [],
            });
        }

        const synergies = draft.allyDuoRating.duoResults
            .filter(
                (duo) =>
                    duo.championKeyA === props.championKey ||
                    duo.championKeyB === props.championKey
            )
            .map((duo) => ({
                key:
                    duo.championKeyA === props.championKey
                        ? duo.championKeyB
                        : duo.championKeyA,
                rating: duo.rating,
            }))
            .sort((left, right) => right.rating - left.rating);

        const counters = draft.matchupRating.matchupResults
            .filter((matchup) => matchup.championKeyA === props.championKey)
            .map((matchup) => ({
                key: matchup.championKeyB,
                rating: matchup.rating,
            }))
            .sort((left, right) => right.rating - left.rating);

        const threshold = 1;

        const strongSynergies = synergies
            .filter((synergy) => ratingToWinrate(synergy.rating) * 100 - 50 >= threshold)
            .slice(0, 3)
            .map((synergy) => ({
                key: synergy.key,
                delta: `+${(ratingToWinrate(synergy.rating) * 100 - 50).toFixed(1)}%`,
            }));

        const weakSynergies = synergies
            .filter((synergy) => ratingToWinrate(synergy.rating) * 100 - 50 <= -threshold)
            .sort((left, right) => left.rating - right.rating)
            .slice(0, 3)
            .map((synergy) => ({
                key: synergy.key,
                delta: `${(ratingToWinrate(synergy.rating) * 100 - 50).toFixed(1)}%`,
            }));

        const strongCounters = counters
            .filter((counter) => ratingToWinrate(counter.rating) * 100 - 50 >= threshold)
            .slice(0, 3)
            .map((counter) => ({
                key: counter.key,
                delta: `+${(ratingToWinrate(counter.rating) * 100 - 50).toFixed(1)}%`,
            }));

        const weakCounters = counters
            .filter((counter) => ratingToWinrate(counter.rating) * 100 - 50 <= -threshold)
            .sort((left, right) => left.rating - right.rating)
            .slice(0, 3)
            .map((counter) => ({
                key: counter.key,
                delta: `${(ratingToWinrate(counter.rating) * 100 - 50).toFixed(1)}%`,
            }));

        if (strongSynergies.length > 0) positive.push({ title: "Strong with", details: strongSynergies });
        if (weakSynergies.length > 0) negative.push({ title: "Weak with", details: weakSynergies });
        if (strongCounters.length > 0) positive.push({ title: "Strong against", details: strongCounters });
        if (weakCounters.length > 0) negative.push({ title: "Weak against", details: weakCounters });

        return { positive, negative };
    });

    return (
        <Show when={insights().positive.length + insights().negative.length > 0}>
            <div class="mt-6 mb-8">
                <h3 class="text-3xl uppercase ml-4 mb-2">Insights</h3>
                <div class="ml-4 grid gap-3 text-lg md:grid-cols-2">
                    <div class="space-y-2">
                        <For each={insights().positive}>
                            {(item) => (
                                <div class="rounded-md border-l-4 border-emerald-400 bg-[#191919] px-4 py-3 text-emerald-300 uppercase italic">
                                    <div class="text-lg">{item.title}</div>
                                    <Show when={item.details.length > 0}>
                                        <div class="mt-2 flex flex-wrap gap-2 not-italic">
                                            <For each={item.details}>
                                                {(detail) => (
                                                    <div class="inline-flex items-center gap-2 rounded bg-black/20 px-2 py-1 normal-case text-emerald-200">
                                                        <ChampionIcon
                                                            championKey={detail.key}
                                                            size={18}
                                                            class="shrink-0"
                                                        />
                                                        <span class="text-sm">
                                                            {nameFor(detail.key)} {detail.delta}
                                                        </span>
                                                    </div>
                                                )}
                                            </For>
                                        </div>
                                    </Show>
                                </div>
                            )}
                        </For>
                    </div>
                    <div class="space-y-2">
                        <For each={insights().negative}>
                            {(item) => (
                                <div class="rounded-md border-l-4 border-red-500 bg-[#191919] px-4 py-3 text-red-300 uppercase italic">
                                    <div class="text-lg">{item.title}</div>
                                    <Show when={item.details.length > 0}>
                                        <div class="mt-2 flex flex-wrap gap-2 not-italic">
                                            <For each={item.details}>
                                                {(detail) => (
                                                    <div class="inline-flex items-center gap-2 rounded bg-black/20 px-2 py-1 normal-case text-red-200">
                                                        <ChampionIcon
                                                            championKey={detail.key}
                                                            size={18}
                                                            class="shrink-0"
                                                        />
                                                        <span class="text-sm">
                                                            {nameFor(detail.key)} {detail.delta}
                                                        </span>
                                                    </div>
                                                )}
                                            </For>
                                        </div>
                                    </Show>
                                </div>
                            )}
                        </For>
                    </div>
                </div>
            </div>
        </Show>
    );
}