import { Dataset } from "../models/dataset/Dataset";
import { Role, ROLES } from "../models/Role";
import { Suggestion, getSuggestions } from "../draft/suggestions";
import { AnalyzeDraftConfig } from "../draft/analysis";
import { RiskLevel } from "../risk/risk-level";

export type TrainingPickPosition = 1 | 2 | 3 | 4 | 5;

export interface TrainingPick {
    index: number;
    role: Role;
    championKey: string;
}

export interface TrainingRound {
    roundId: number;
    playerRole: Role;
    playerSlotIndex: number;
    playerPickPosition: TrainingPickPosition;
    allyPicks: TrainingPick[];
    enemyPicks: TrainingPick[];
    suggestions: Suggestion[];
}

export interface TrainingResult {
    won: boolean;
    playerPick: string;
    playerPickRank: number;
    topSuggestion?: Suggestion;
}

/**
 * Default config for training mode.
 */
export function getTrainingConfig(): AnalyzeDraftConfig {
    return {
        ignoreChampionWinrates: false,
        riskLevel: "medium" as RiskLevel,
        minGames: 5,
    };
}

/**
 * Randomly shuffles an array.
 */
function shuffle<T>(arr: T[]) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

/**
 * How many enemy picks are visible before your pick.
 */
function getEnemyPicksBeforePlayer(position: TrainingPickPosition) {
    // Approximate blue-side pick flow:
    // B1 | R1 R2 | B2 B3 | R3 R4 | B4 B5 | R5
    const byPosition: Record<TrainingPickPosition, number> = {
        1: 0,
        2: 2,
        3: 2,
        4: 4,
        5: 4,
    };
    return byPosition[position];
}

/**
 * Pick a random champion that is actually played in the given role.
 */
function pickChampionForRole(
    dataset: Dataset,
    role: Role,
    excludedChampions: Set<string>,
    config: AnalyzeDraftConfig
) {
    const minGamesForRole = Math.max(300, Math.ceil((config.minGames * 30) / 7));

    const roleCandidates = Object.keys(dataset.championData).filter((key) => {
        if (excludedChampions.has(key)) return false;
        const roleStats = dataset.championData[key].statsByRole[role];
        return roleStats.games >= minGamesForRole;
    });

    if (roleCandidates.length > 0) {
        return roleCandidates[Math.floor(Math.random() * roleCandidates.length)];
    }

    const fallback = Object.keys(dataset.championData).filter(
        (key) => !excludedChampions.has(key)
    );
    if (fallback.length === 0) {
        throw new Error("No champion candidates available");
    }

    return fallback[Math.floor(Math.random() * fallback.length)];
}

/**
 * Generates a training round with one open user slot.
 */
export function generateRound(
    dataset: Dataset,
    synergyMatchupDataset: Dataset,
    config: AnalyzeDraftConfig = getTrainingConfig(),
    playerRole: Role = Role.Middle,
    playerPickPosition: TrainingPickPosition = 3
): TrainingRound {
    const playerSlotIndex = playerPickPosition - 1;
    const allyPicksBeforePlayer = playerPickPosition - 1;
    const enemyPicksBeforePlayer = getEnemyPicksBeforePlayer(playerPickPosition);

    const excludedChampions = new Set<string>();

    const allyRolesPool = shuffle(ROLES.filter((r) => r !== playerRole));
    const enemyRolesPool = shuffle([...ROLES]);

    const allyPicks: TrainingPick[] = [];
    const enemyPicks: TrainingPick[] = [];

    for (let i = 0; i < allyPicksBeforePlayer; i++) {
        const role = allyRolesPool[i];
        const championKey = pickChampionForRole(
            dataset,
            role,
            excludedChampions,
            config
        );
        excludedChampions.add(championKey);
        allyPicks.push({ index: i, role, championKey });
    }

    for (let i = 0; i < enemyPicksBeforePlayer; i++) {
        const role = enemyRolesPool[i];
        const championKey = pickChampionForRole(
            dataset,
            role,
            excludedChampions,
            config
        );
        excludedChampions.add(championKey);
        enemyPicks.push({ index: i, role, championKey });
    }

    const allyTeam = new Map<Role, string>();
    const enemyTeam = new Map<Role, string>();

    for (const pick of allyPicks) {
        allyTeam.set(pick.role, pick.championKey);
    }
    for (const pick of enemyPicks) {
        enemyTeam.set(pick.role, pick.championKey);
    }

    const suggestions = getSuggestions(
        dataset,
        synergyMatchupDataset,
        allyTeam,
        enemyTeam,
        config
    );

    // Sort by total rating (descending)
    suggestions.sort(
        (a, b) => b.draftResult.totalRating - a.draftResult.totalRating
    );

    return {
        roundId: Date.now() + Math.floor(Math.random() * 1000),
        playerRole,
        playerSlotIndex,
        playerPickPosition,
        allyPicks,
        enemyPicks,
        suggestions,
    };
}

/**
 * Checks if the player's pick is in the top 10 suggestions for the role.
 */
export function checkWin(
    playerPick: string,
    playerPickRole: Role,
    suggestions: Suggestion[]
): { won: boolean; rank: number } {
    const roleSuggestions = suggestions.filter((s) => s.role === playerPickRole);
    const top10 = roleSuggestions.slice(0, 10);
    const rank = roleSuggestions.findIndex((s) => s.championKey === playerPick);

    const won = top10.some((s) => s.championKey === playerPick);
    return { won, rank: rank >= 0 ? rank + 1 : roleSuggestions.length + 1 };
}

/**
 * Evaluates a player's pick in the given round.
 */
export function evaluatePick(
    playerPick: string,
    playerPickRole: Role,
    round: TrainingRound
): TrainingResult {
    const { won, rank } = checkWin(playerPick, playerPickRole, round.suggestions);
    const topSuggestion = round.suggestions[0];

    return {
        won,
        playerPick,
        playerPickRank: rank,
        topSuggestion,
    };
}
