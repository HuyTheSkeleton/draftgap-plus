import {
    JSXElement,
    createContext,
    createEffect,
    createSignal,
    useContext,
    batch,
} from "solid-js";
import {
    TrainingPickPosition,
    TrainingRound,
    evaluatePick,
    generateRound,
} from "@draftgap/core/src/training/TrainingGame";
import { Suggestion } from "@draftgap/core/src/draft/suggestions";
import { Role } from "@draftgap/core/src/models/Role";
import { useDataset } from "./DatasetContext";
import { useDraft } from "./DraftContext";
import { useUser } from "./UserContext";
import { useDraftFilters } from "./DraftFiltersContext";
import { createTrainingResultToast } from "../utils/toast";
import { useDraftView } from "./DraftViewContext";
import toast from "solid-toast";

interface TrainingContextType {
    isTrainingMode: () => boolean;
    playerRole: () => Role;
    setPlayerRole: (role: Role) => void;
    pickPosition: () => 0 | TrainingPickPosition;
    setPickPosition: (position: 0 | TrainingPickPosition) => void;
    trainingInsightIndex: () => number | undefined;
    setTrainingInsightIndex: (index: number | undefined) => void;
    totalWins: () => number;
    totalLosses: () => number;
    roundsPlayed: () => number;
    winRate: () => number;
    avgPlacement: () => number;
    trainingSuggestions: () => Suggestion[];
    trainingFeedbackPending: () => boolean;
    pickedChampionKey: () => string | undefined;
    pickedChampionRank: () => number | undefined;
    continueTrainingRound: () => void;
    startTraining: () => void;
    stopTraining: () => void;
    resetStats: () => void;
}

const TrainingContext = createContext<TrainingContextType>();

export function createTrainingContext() {
    const { dataset, dataset30Days, isLoaded } = useDataset();
    const { pickChampion, allyTeam, resetAll, select } = useDraft();
    const { config } = useUser();
    const { setRoleFilter } = useDraftFilters();
    const { setCurrentDraftView } = useDraftView();

    const [isTrainingMode, setIsTrainingMode] = createSignal(false);
    const [playerRole, setPlayerRole] = createSignal<Role>(Role.Middle);
    const [pickPosition, setPickPosition] = createSignal<0 | TrainingPickPosition>(0);

    const [totalWins, setTotalWins] = createSignal(0);
    const [totalLosses, setTotalLosses] = createSignal(0);
    const [placementSum, setPlacementSum] = createSignal(0);
    const [roundsPlayed, setRoundsPlayed] = createSignal(0);
    const [currentRound, setCurrentRound] = createSignal<TrainingRound>();
    const [resolvedRoundId, setResolvedRoundId] = createSignal<number>();
    const [trainingFeedbackPending, setTrainingFeedbackPending] =
        createSignal(false);
    const [trainingInsightIndex, setTrainingInsightIndex] = createSignal<
        number | undefined
    >(undefined);
    const [pickedChampionKey, setPickedChampionKey] = createSignal<string>();
    const [pickedChampionRank, setPickedChampionRank] = createSignal<number>();
    const [trainingResultToastId, setTrainingResultToastId] =
        createSignal<string>();

    const config_ = () => ({
        ignoreChampionWinrates: config.ignoreChampionWinrates,
        riskLevel: config.riskLevel,
        minGames: config.minGames,
    });

    function loadTrainingStats() {
        try {
            const raw = localStorage.getItem("draftgap_training_stats");
            if (!raw) return;

            const parsed = JSON.parse(raw) as {
                wins?: number;
                losses?: number;
                placementSum?: number;
                roundsPlayed?: number;
            };
            setTotalWins(parsed.wins ?? 0);
            setTotalLosses(parsed.losses ?? 0);
            setPlacementSum(parsed.placementSum ?? 0);
            setRoundsPlayed(parsed.roundsPlayed ?? 0);
        } catch {
            setTotalWins(0);
            setTotalLosses(0);
            setPlacementSum(0);
            setRoundsPlayed(0);
        }
    }

    function saveTrainingStats(
        nextWins: number,
        nextLosses: number,
        nextPlacementSum: number,
        nextRoundsPlayed: number
    ) {
        localStorage.setItem(
            "draftgap_training_stats",
            JSON.stringify({
                wins: nextWins,
                losses: nextLosses,
                placementSum: nextPlacementSum,
                roundsPlayed: nextRoundsPlayed,
            })
        );
    }

    function getEffectivePickPosition(): TrainingPickPosition {
        const configured = pickPosition();
        if (configured !== 0) return configured;
        return (Math.floor(Math.random() * 4) + 2) as TrainingPickPosition;
    }

    function prepareNextRound() {
        if (!isLoaded() || !dataset() || !dataset30Days()) return;

        const nextRound = generateRound(
            dataset()!,
            dataset30Days()!,
            config_(),
            playerRole(),
            getEffectivePickPosition()
        );

        batch(() => {
            resetAll();

            for (const pick of nextRound.allyPicks) {
                pickChampion("ally", pick.index, pick.championKey, pick.role, {
                    updateSelection: false,
                    resetFilters: false,
                    reportEvent: false,
                    updateView: false,
                });
            }

            for (const pick of nextRound.enemyPicks) {
                pickChampion("opponent", pick.index, pick.championKey, pick.role, {
                    updateSelection: false,
                    resetFilters: false,
                    reportEvent: false,
                    updateView: false,
                });
            }

            pickChampion(
                "ally",
                nextRound.playerSlotIndex,
                undefined,
                nextRound.playerRole,
                {
                    updateSelection: false,
                    resetFilters: false,
                    reportEvent: false,
                    updateView: false,
                }
            );

            select("ally", nextRound.playerSlotIndex, false);
            setRoleFilter(nextRound.playerRole);

            if (trainingResultToastId() !== undefined) {
                toast.dismiss(trainingResultToastId());
                setTrainingResultToastId(undefined);
            }

            setResolvedRoundId(undefined);
            setTrainingFeedbackPending(false);
            setTrainingInsightIndex(undefined);
            setPickedChampionKey(undefined);
            setPickedChampionRank(undefined);
            setCurrentRound(nextRound);
        });
    }

    function continueTrainingRound() {
        if (!isTrainingMode() || !trainingFeedbackPending()) {
            return;
        }

        prepareNextRound();
    }

    function startTraining() {
        if (!isLoaded() || !dataset() || !dataset30Days()) {
            console.error("Dataset not loaded");
            return;
        }

        setCurrentDraftView({
            type: "draft",
            subType: "draft",
        });
        setIsTrainingMode(true);
        prepareNextRound();
    }

    function stopTraining() {
        if (trainingResultToastId() !== undefined) {
            toast.dismiss(trainingResultToastId());
            setTrainingResultToastId(undefined);
        }

        setIsTrainingMode(false);
        resetAll();
        setCurrentRound(undefined);
        setResolvedRoundId(undefined);
        setTrainingFeedbackPending(false);
        setTrainingInsightIndex(undefined);
        setPickedChampionKey(undefined);
        setPickedChampionRank(undefined);
    }

    function resetStats() {
        setTotalWins(0);
        setTotalLosses(0);
        setPlacementSum(0);
        setRoundsPlayed(0);
        saveTrainingStats(0, 0, 0, 0);
    }

    createEffect(() => {
        if (!isLoaded()) return;
        loadTrainingStats();
    });

    createEffect(() => {
        if (!isTrainingMode()) return;

        const round = currentRound();
        if (!round) return;

        const pickedChampion = allyTeam[round.playerSlotIndex]?.championKey;
        if (!pickedChampion) return;
        if (resolvedRoundId() === round.roundId) return;

        const result = evaluatePick(pickedChampion, round.playerRole, round);

        const nextWins = totalWins() + (result.won ? 1 : 0);
        const nextLosses = totalLosses() + (result.won ? 0 : 1);
        const nextPlacementSum = placementSum() + result.playerPickRank;
        const nextRoundsPlayed = roundsPlayed() + 1;

        setTotalWins(nextWins);
        setTotalLosses(nextLosses);
        setPlacementSum(nextPlacementSum);
        setRoundsPlayed(nextRoundsPlayed);
        saveTrainingStats(
            nextWins,
            nextLosses,
            nextPlacementSum,
            nextRoundsPlayed
        );
        if (trainingResultToastId() !== undefined) {
            toast.dismiss(trainingResultToastId());
        }
        setTrainingResultToastId(
            String(createTrainingResultToast(result.won, result.playerPickRank))
        );

        setResolvedRoundId(round.roundId);
        setPickedChampionKey(pickedChampion);
        setPickedChampionRank(result.playerPickRank);
        setTrainingFeedbackPending(true);
    });

    const winRate = () => {
        const total = totalWins() + totalLosses();
        return total === 0 ? 0 : totalWins() / total;
    };

    const avgPlacement = () => {
        return roundsPlayed() === 0 ? 0 : placementSum() / roundsPlayed();
    };

    const trainingSuggestions = () => {
        const round = currentRound();
        if (!round) {
            return [];
        }

        return round.suggestions.filter((s) => s.role === round.playerRole);
    };

    return {
        isTrainingMode,
        playerRole,
        setPlayerRole,
        pickPosition,
        setPickPosition,
        trainingInsightIndex,
        setTrainingInsightIndex,
        totalWins,
        totalLosses,
        roundsPlayed,
        winRate,
        avgPlacement,
        trainingSuggestions,
        trainingFeedbackPending,
        pickedChampionKey,
        pickedChampionRank,
        continueTrainingRound,
        startTraining,
        stopTraining,
        resetStats,
    };
}

export function TrainingProvider(props: { children: JSXElement }) {
    const state = createTrainingContext();

    return (
        <TrainingContext.Provider value={state}>
            {props.children}
        </TrainingContext.Provider>
    );
}

export function useTraining(): TrainingContextType {
    const context = useContext(TrainingContext);
    if (!context) {
        throw new Error("useTraining must be used within <TrainingProvider>");
    }
    return context;
}
