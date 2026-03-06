import { createSignal, Show, createEffect } from "solid-js";
import { ratingToWinrate } from "@draftgap/core/src/rating/ratings";
import { ButtonGroup } from "../../common/ButtonGroup";
import { DuoResultTable } from "./DuoResultTable";
import { IndividualChampionsResultTable } from "./IndividualChampionsResultTable";
import { MatchupResultTable } from "./MatchupResultTable";
import { DraftSummaryCards } from "./SummaryCards";
import { TotalChampionContributionTable } from "./TotalChampionContributionTable";
import { tooltip } from "../../../directives/tooltip";
import { Team } from "@draftgap/core/src/models/Team";
import { useUser } from "../../../contexts/UserContext";
import { useDraftAnalysis } from "../../../contexts/DraftAnalysisContext";
import { ScalingChart } from "./ScalingChart";
import { Role } from "@draftgap/core/src/models/Role";
import { useExtraDraftAnalysis } from "../../../contexts/ExtraDraftAnalysisContext";
import { useDataset } from "../../../contexts/DatasetContext";
declare module "solid-js" {
    namespace JSX {
        interface Directives {
            tooltip: any;
        }
    }
}
tooltip;

export default function AnalysisView() {
    const { config } = useUser();
    const { dataset } = useDataset();
    const { 
        setAnalysisPick, 
        allyDraftAnalysis, 
        opponentDraftAnalysis,
        allyDamageDistribution,
        opponentDamageDistribution,
        allyTeamComp,
        opponentTeamComp
    } = useDraftAnalysis();
    const { allyDraftExtraAnalysis, opponentDraftExtraAnalysis } = useExtraDraftAnalysis();
    const [showAllMatchups, setShowAllMatchups] = createSignal(false);

    const getDodgeStatus = () => {
        const analysis = allyDraftAnalysis();
        if (!analysis) return { state: "none", message: "" };

        const totalWinrate = ratingToWinrate(analysis.totalRating) * 100;
        const matchupResults = analysis.matchupRating?.matchupResults || [];

        const topMatchup = matchupResults.find(m => m.roleA === 0 && m.roleB === 0);
        const midMatchup = matchupResults.find(m => m.roleA === 2 && m.roleB === 2);
        
        const topWr = topMatchup ? ratingToWinrate(topMatchup.rating) * 100 : 50;
        const midWr = midMatchup ? ratingToWinrate(midMatchup.rating) * 100 : 50;

        const isTopLosing = topMatchup !== undefined && topWr < 47;
        const isMidLosing = midMatchup !== undefined && midWr < 47;

        if (totalWinrate <= 42 || (isTopLosing && isMidLosing)) {
            const msg = totalWinrate <= 42 
                ? `DODGE: Critical winrate (${totalWinrate.toFixed(2)}%)`
                : `DODGE: Solo lanes countered (${topWr.toFixed(2)}% / ${midWr.toFixed(2)}%)`;
            return { state: "dodge", message: msg };
        }

        if (isTopLosing || isMidLosing || (totalWinrate < 50)) {
            return { state: "warning", message: "Difficult but winnable. Play to your win conditions." };
        }

        return { state: "none", message: "" };
    };

    // --- INSIGHT LOGIC ---
    const getInsights = () => {
        const insights: { message: string; type: "advantage" | "neutral" | "disadvantage" }[] = [];
        
        const allyDmg = allyDamageDistribution();
        const oppDmg = opponentDamageDistribution();

        const checkDamage = (dmgProfile: any, isAlly: boolean) => {
            if (!dmgProfile) return;

            const totalDamage = dmgProfile.physical + dmgProfile.magic + dmgProfile.true;
            if (totalDamage === 0) return; 

            const adRatio = dmgProfile.physical / totalDamage;
            const apRatio = dmgProfile.magic / totalDamage;

            if (adRatio >= 0.60) {
                insights.push({
                    message: `${isAlly ? "Ally" : "Enemy"} team is heavily Physical (${(adRatio * 100).toFixed(0)}%)`,
                    type: isAlly ? "disadvantage" : "advantage"
                });
            } else if (apRatio >= 0.60) {
                insights.push({
                    message: `${isAlly ? "Ally" : "Enemy"} team is heavily Magic (${(apRatio * 100).toFixed(0)}%)`,
                    type: isAlly ? "disadvantage" : "advantage"
                });
            }
        };

        const checkScaling = (scalingData: any, isAlly: boolean) => {
            if (!scalingData || scalingData.length < 5) return;

            const earlyWr = ratingToWinrate(scalingData[0].totalRating) * 100;
            const lateWr = ratingToWinrate(scalingData[4].totalRating) * 100;
            const diff = lateWr - earlyWr;

            if (diff <= -8) {
                insights.push({
                    message: `${isAlly ? "Ally" : "Enemy"} team is an Early Game comp`,
                    type: "neutral" 
                });
            } else if (diff >= 8) {
                insights.push({
                    message: `${isAlly ? "Ally" : "Enemy"} team is a Late Game comp`,
                    type: "neutral"
                });
            }
        };

        const checkBotSynergy = (analysis: any, isAlly: boolean) => {
            if (!analysis?.allyDuoRating?.duoResults) return;

            const botSuppDuo = analysis.allyDuoRating.duoResults.find(
                (d: any) => (d.roleA === 3 && d.roleB === 4) || (d.roleA === 4 && d.roleB === 3)
            );

            if (botSuppDuo) {
                const synergyWr = ratingToWinrate(botSuppDuo.rating) * 100;
                
                if (synergyWr >= 51) {
                    insights.push({
                        message: `${isAlly ? "Ally" : "Enemy"} Bot Lane has strong synergy (${synergyWr.toFixed(1)}%)`,
                        type: isAlly ? "advantage" : "disadvantage"
                    });
                } else if (synergyWr <= 49) {
                    insights.push({
                        message: `${isAlly ? "Ally" : "Enemy"} Bot Lane lacks synergy (${synergyWr.toFixed(1)}%)`,
                        type: isAlly ? "disadvantage" : "advantage"
                    });
                }
            }
        };

        // --- NEW MATCHUP LOGIC ---
        const checkSoloMatchups = () => {
            const analysis = allyDraftAnalysis();
            const ds = dataset();
            if (!analysis?.matchupRating?.matchupResults || !ds) return;
            
            const allyComp = allyTeamComp();
            const oppComp = opponentTeamComp();
            
            const checkLane = (roleId: number) => {
                const matchup = analysis.matchupRating.matchupResults.find(
                    (m: any) => m.roleA === roleId && m.roleB === roleId
                );
                
                if (!matchup) return;
                
                // Bulletproof way to find the champion keys regardless of Map key types
                let allyKey, oppKey;
                for (const [r, key] of allyComp.entries()) {
                    if (Number(r) === roleId) allyKey = key;
                }
                for (const [r, key] of oppComp.entries()) {
                    if (Number(r) === roleId) oppKey = key;
                }
                
                if (allyKey && oppKey) {
                    const allyName = ds.championData[allyKey]?.name;
                    const oppName = ds.championData[oppKey]?.name;
                    
                    if (!allyName || !oppName) return;

                    const wr = ratingToWinrate(matchup.rating) * 100;

                    // 2% threshold from 50%
                    if (wr >= 51) {
                        insights.push({
                            message: `${allyName} holds a ${wr.toFixed(2)}% winrate against ${oppName}`,
                            type: "advantage"
                        });
                    } else if (wr <= 49) {
                        insights.push({
                            message: `${allyName} holds a ${wr.toFixed(2)}% winrate against ${oppName}`,
                            type: "disadvantage"
                        });
                    }
                }
            };

            checkLane(0); // Top
            checkLane(2); // Mid
        };

        checkDamage(allyDmg, true);
        checkDamage(oppDmg, false);
        checkScaling(allyDraftExtraAnalysis()?.ratingByTime, true);
        checkScaling(opponentDraftExtraAnalysis()?.ratingByTime, false);
        checkBotSynergy(allyDraftAnalysis(), true);
        checkBotSynergy(opponentDraftAnalysis(), false);
        
        // Check the new solo lane matchups
        checkSoloMatchups();

        const typeOrder = { advantage: 1, neutral: 2, disadvantage: 3 };
        insights.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

        return insights;
    };

    const openChampionDraftAnalysisModal = (
        team: Team,
        championKey: string
    ) => {
        setAnalysisPick({ team, championKey });
    };

    return (
        <div>
            <Show when={getDodgeStatus().state !== "none"}>
                <div 
                    class="p-5 mx-4 mt-6 mb-4 rounded-lg font-black text-center border-4 transition-all duration-300 uppercase italic shadow-lg"
                    classList={{
                        "bg-red-900/40 border-red-400 text-red-300 text-3xl drop-shadow-[0_0_12px_rgba(239,68,68,0.6)]": getDodgeStatus().state === "dodge",
                        "bg-[#a7dbe9]/10 border-[#8bc28b] text-[#8bc28b] text-3xl": getDodgeStatus().state === "warning",
                    }}
                >
                    {getDodgeStatus().message}
                </div>
            </Show>

            {/* --- INSIGHTS SECTION --- */}
            <Show when={getInsights().length > 0}>
                <div class="mb-8" id="insights">
                    <h3 
                        class="text-3xl uppercase ml-4 mb-4 w-fit"
                        use:tooltip={{
                            content: (
                                <>
                                    Quick, actionable takeaways based on the draft's composition.
                                    <br />
                                    <br />
                                    <strong>DAMAGE:</strong> Flags if a team is heavily skewed toward Physical or Magic damage.
                                    <br />
                                    <strong>SCALING:</strong> Identifies comps that heavily spike in the early game or outscale late.
                                    <br />
                                    <strong>SYNERGY:</strong> Highlights particularly strong or weak bot lane (ADC + Support) pairings.
                                    <br />
                                    <strong>MATCHUPS:</strong> Flags highly favored or heavily countered Top and Mid lane matchups.
                                </>
                            ),
                        }}
                    >
                        Insights
                    </h3>
                    <div class="flex flex-col gap-3 mx-4">
                        {getInsights().map((insight) => (
                            <div 
                                class="p-4 rounded-md font-black text-xl bg-[#191919] uppercase italic"
                                classList={{
                                    "text-[#8bc28b] border-l-4 border-[#8bc28b]": insight.type === "advantage",
                                    "text-neutral-400 border-l-4 border-neutral-500": insight.type === "neutral",
                                    "text-red-400 border-l-4 border-red-500": insight.type === "disadvantage",
                                }}
                            >
                                {insight.message}
                            </div>
                        ))}
                    </div>
                </div>
            </Show>

            <DraftSummaryCards team="ally" />
            <DraftSummaryCards team="opponent" class="mb-12 mt-6" />

            <div
                class="flex-col md:flex-row flex gap-4 mb-8 overflow-hidden"
                id="total-result"
            >
                <div class="md:w-1/2">
                    <h3
                        class="text-3xl mb-1 uppercase ml-4"
                        use:tooltip={{
                            content: (
                                <>
                                    How much does every champion contribute to
                                    the draft in which aspect?
                                    <br />
                                    <br />
                                    <strong>BASE</strong>: Champion base winrate
                                    <br />
                                    <strong>MATCHUP</strong>: Total winrate of
                                    all champion matchups
                                    <br />
                                    <strong>DUO</strong>: Total winrate of all
                                    champion duos
                                    <br />
                                    <strong>TOTAL</strong>: Total contribution
                                    of champion (BASE + MATCHUP + DUO)
                                </>
                            ),
                        }}
                    >
                        Ally overview
                    </h3>
                    <TotalChampionContributionTable
                        team="ally"
                        onClickChampion={(key) =>
                            openChampionDraftAnalysisModal("ally", key)
                        }
                    />
                </div>
                <div class="md:w-1/2">
                    <h3
                        class="text-3xl mb-1 uppercase ml-4"
                        use:tooltip={{
                            content: (
                                <>
                                    How much does every champion contribute to
                                    the draft in which aspect?
                                    <br />
                                    <br />
                                    <strong>BASE</strong>: Champion base winrate
                                    <br />
                                    <strong>MATCHUP</strong>: Total winrate of
                                    all champion matchups
                                    <br />
                                    <strong>DUO</strong>: Total winrate of all
                                    champion duos
                                    <br />
                                    <strong>TOTAL</strong>: Total contribution
                                    of champion (BASE + MATCHUP + DUO)
                                </>
                            ),
                        }}
                    >
                        Opponent overview
                    </h3>
                    <TotalChampionContributionTable
                        team="opponent"
                        onClickChampion={(key) =>
                            openChampionDraftAnalysisModal("opponent", key)
                        }
                    />
                </div>
            </div>

            <Show when={!config.ignoreChampionWinrates}>
                <div
                    class="flex-col flex sm:flex-row gap-4 mb-8"
                    id="champions-result"
                >
                    <div class="sm:w-1/2">
                        <h3
                            class="text-3xl uppercase mb-1 ml-4"
                            use:tooltip={{
                                content: (
                                    <>Base winrates of individual champions</>
                                ),
                            }}
                        >
                            Ally champions
                        </h3>
                        <IndividualChampionsResultTable
                            team="ally"
                            onClickChampion={(championKey) =>
                                openChampionDraftAnalysisModal(
                                    "ally",
                                    championKey
                                )
                            }
                        />
                    </div>
                    <div class="sm:w-1/2">
                        <h3
                            class="text-3xl uppercase mb-1 ml-4"
                            use:tooltip={{
                                content: (
                                    <>Base winrates of individual champions</>
                                ),
                            }}
                        >
                            Opponent champions
                        </h3>
                        <IndividualChampionsResultTable
                            team="opponent"
                            onClickChampion={(championKey) =>
                                openChampionDraftAnalysisModal(
                                    "opponent",
                                    championKey
                                )
                            }
                        />
                    </div>
                </div>
            </Show>

            <div
                class="flex-col flex md:flex-row justify-between gap-2 md:items-end mb-2 items-end"
                id="matchup-result"
            >
                <div>
                    <h3
                        class="text-3xl uppercase ml-4"
                        use:tooltip={{
                            content: (
                                <>
                                    Winrates of all matchups between ally and
                                    opponent champions
                                </>
                            ),
                        }}
                    >
                        Matchups
                    </h3>
                    <p
                        class="text-neutral-500 uppercase ml-4"
                        use:tooltip={{
                            content: (
                                <>
                                    The individual champion winrates have been
                                    normalized (removed) before calculating the
                                    matchup winrates to remove the current meta
                                    bias of the matchup.
                                </>
                            ),
                        }}
                    >
                        Champion winrates normalized
                    </p>
                </div>
                <ButtonGroup
                    options={[
                        { label: "HEAD 2 HEAD", value: false },
                        { label: "ALL", value: true },
                    ]}
                    size="sm"
                    selected={showAllMatchups()}
                    onChange={setShowAllMatchups}
                />
            </div>
            <MatchupResultTable
                class="w-full mb-8"
                showAll={showAllMatchups()}
                onClickChampion={(team, championKey) =>
                    openChampionDraftAnalysisModal(team, championKey)
                }
            />

            <div class="flex-col md:flex-row flex gap-4 mb-8" id="duo-result">
                <div class="md:w-1/2">
                    <h3
                        class="text-3xl uppercase ml-4"
                        use:tooltip={{
                            content: (
                                <>Winrates of all duos in the ally draft</>
                            ),
                        }}
                    >
                        Ally duos
                    </h3>
                    <p
                        class="text-neutral-500 uppercase ml-4 mb-2"
                        use:tooltip={{
                            content: (
                                <>
                                    The individual champion winrates have been
                                    normalized (removed) before calculating the
                                    duo winrates.
                                </>
                            ),
                        }}
                    >
                        Champion winrates normalized
                    </p>
                    <DuoResultTable
                        team="ally"
                        onClickChampion={(key) =>
                            openChampionDraftAnalysisModal("ally", key)
                        }
                    />
                </div>
                <div class="md:w-1/2">
                    <h3
                        class="text-3xl uppercase ml-4"
                        use:tooltip={{
                            content: (
                                <>Winrates of all duos in the opponent draft</>
                            ),
                        }}
                    >
                        Opponent duos
                    </h3>
                    <p
                        class="text-neutral-500 uppercase ml-4 mb-2"
                        use:tooltip={{
                            content: (
                                <>
                                    The individual champion winrates have been
                                    normalized (removed) before calculating the
                                    duo winrates.
                                </>
                            ),
                        }}
                    >
                        Champion winrates normalized
                    </p>
                    <DuoResultTable
                        team="opponent"
                        onClickChampion={(key) =>
                            openChampionDraftAnalysisModal("opponent", key)
                        }
                    />
                </div>
            </div>

            <div>
                <h3 class="text-3xl uppercase ml-4">Scaling</h3>
                <span
                    class="text-neutral-500 uppercase ml-4 mb-2"
                    use:tooltip={{
                        content: (
                            <>
                                The overall team winrate has been normalized
                                (removed) before calculating the team winrate
                                over time.
                            </>
                        ),
                    }}
                >
                    Team winrate normalized
                </span>
                <div class="p-4 rounded-md bg-[#191919] w-1/2 max-w-2xl h-64">
                    <ScalingChart />    
                </div>
            </div>
        </div>
    );
}