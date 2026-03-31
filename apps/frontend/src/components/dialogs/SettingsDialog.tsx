import { Icon } from "solid-heroicons";
import { questionMarkCircle } from "solid-heroicons/solid-mini";
import { Show } from "solid-js";
import { ButtonGroup, ButtonGroupOption } from "../common/ButtonGroup";
import { Switch } from "../common/Switch";
import {
    RiskLevel,
    displayNameByRiskLevel,
} from "@draftgap/core/src/risk/risk-level";
import { useUser } from "../../contexts/UserContext";
import { useMedia } from "../../hooks/useMedia";
import {
    DraftTablePlacement,
    StatsSite,
} from "@draftgap/core/src/models/user/Config";
import { Role, displayNameByRole } from "@draftgap/core/src/models/Role";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../common/Dialog";
import { FAQDialog } from "./FAQDialog";
import { useTraining } from "../../contexts/TrainingContext";

export default function SettingsDialog() {
    const { isDesktop } = useMedia();
    const { config, setConfig } = useUser();
    const {
        isTrainingMode,
        playerRole,
        setPlayerRole,
        pickPosition,
        setPickPosition,
        totalWins,
        totalLosses,
        roundsPlayed,
        winRate,
        avgPlacement,
        startTraining,
        stopTraining,
        resetStats,
    } = useTraining();

    const riskLevelOptions: ButtonGroupOption<RiskLevel>[] = RiskLevel.map(
        (level) => ({
            value: level,
            label: displayNameByRiskLevel[level],
        })
    );

    const draftTablePlacementOptions = [
        {
            value: DraftTablePlacement.Bottom,
            label: "Bottom",
        },
        {
            value: DraftTablePlacement.InPlace,
            label: "In Place",
        },
        {
            value: DraftTablePlacement.Hidden,
            label: "Hidden",
        },
    ];

    const statsSiteOptions = [
        {
            value: "lolalytics",
            label: "lolalytics",
        },
        {
            value: "u.gg",
            label: "u.gg",
        },
        {
            value: "op.gg",
            label: "op.gg",
        },
        {
            value: "coachless",
            label: "coachless",
        },
    ] as const;

    const roleOptions: ButtonGroupOption<Role>[] = [0, 1, 2, 3, 4].map(
        (role) => ({
            value: role as Role,
            label: displayNameByRole[role as Role],
        })
    );

    const pickOptions: ButtonGroupOption<0 | 1 | 2 | 3 | 4 | 5>[] = [
        { value: 0, label: "Random" },
        { value: 1, label: "1" },
        { value: 2, label: "2" },
        { value: 3, label: "3" },
        { value: 4, label: "4" },
        { value: 5, label: "5" },
    ];

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Settings</DialogTitle>
            </DialogHeader>
            <div>
                <h3 class="text-3xl uppercase">Draft</h3>
                <div class="flex space-x-16 items-center justify-between mt-2">
                    <span class="text-lg uppercase">
                        Ignore individual champion winrates
                    </span>
                    <Switch
                        checked={config.ignoreChampionWinrates}
                        onChange={() =>
                            setConfig({
                                ignoreChampionWinrates:
                                    !config.ignoreChampionWinrates,
                            })
                        }
                    />
                </div>
                <div class="flex items-center mt-1 mb-1 gap-1">
                    <span class="text-lg uppercase block">Risk level</span>
                    <Dialog>
                        <DialogTrigger>
                            <Icon
                                path={questionMarkCircle}
                                class="w-5 inline text-neutral-400 -mt-1"
                            />
                        </DialogTrigger>
                        <FAQDialog />
                    </Dialog>
                </div>
                <ButtonGroup
                    options={riskLevelOptions}
                    selected={config.riskLevel}
                    size="sm"
                    onChange={(value: RiskLevel) =>
                        setConfig({
                            riskLevel: value,
                        })
                    }
                />
            </div>
            <div>
                <h3 class="text-3xl uppercase">UI</h3>
                <div class="flex space-x-8 items-center justify-between mt-2">
                    <span class="text-lg uppercase">
                        Place favourites at top of suggestions
                    </span>
                    <Switch
                        checked={config.showFavouritesAtTop}
                        onChange={() =>
                            setConfig({
                                showFavouritesAtTop:
                                    !config.showFavouritesAtTop,
                            })
                        }
                    />
                </div>

                <Show when={isDesktop}>
                    <div class="flex flex-col gap-1 mt-2">
                        <span class="text-lg uppercase">
                            Place banned champion suggestions at
                        </span>
                        <ButtonGroup
                            options={draftTablePlacementOptions}
                            selected={config.banPlacement}
                            size="sm"
                            onChange={(v) =>
                                setConfig({
                                    banPlacement: v,
                                })
                            }
                        />
                    </div>
                    <div class="flex flex-col gap-1 mt-2">
                        <span class="text-lg uppercase">
                            Place unowned champion suggestions at
                        </span>
                        <ButtonGroup
                            options={[
                                {
                                    value: DraftTablePlacement.Bottom,
                                    label: "Bottom",
                                },
                                {
                                    value: DraftTablePlacement.InPlace,
                                    label: "In Place",
                                },
                                {
                                    value: DraftTablePlacement.Hidden,
                                    label: "Hidden",
                                },
                            ]}
                            size="sm"
                            selected={config.unownedPlacement}
                            onChange={(v) =>
                                setConfig({
                                    unownedPlacement: v,
                                })
                            }
                        />
                    </div>
                </Show>

                <div class="flex space-x-8 items-center justify-between mt-2">
                    <span class="text-lg uppercase">
                        Show advanced winrates
                    </span>
                    <Switch
                        checked={config.showAdvancedWinrates}
                        onChange={() =>
                            setConfig({
                                showAdvancedWinrates:
                                    !config.showAdvancedWinrates,
                            })
                        }
                    />
                </div>
            </div>

            <Show when={isDesktop}>
                <div>
                    <h3 class="text-3xl uppercase">League Client</h3>
                    <div class="flex space-x-16 items-center justify-between mt-2">
                        <span class="text-lg uppercase">
                            Disable league client integration
                        </span>
                        <Switch
                            checked={config.disableLeagueClientIntegration}
                            onChange={() =>
                                setConfig({
                                    disableLeagueClientIntegration:
                                        !config.disableLeagueClientIntegration,
                                })
                            }
                        />
                    </div>
                </div>
            </Show>

            <div>
                <h3 class="text-3xl uppercase">Misc</h3>
                <div class="flex flex-col gap-1 mt-2">
                    <span class="text-lg uppercase">Favourite builds site</span>
                    <ButtonGroup
                        options={statsSiteOptions}
                        selected={config.defaultStatsSite}
                        size="sm"
                        onChange={(value: StatsSite) =>
                            setConfig({
                                defaultStatsSite: value,
                            })
                        }
                    />
                </div>
            </div>

            <div>
                <h3 class="text-3xl uppercase">Training</h3>
                <div class="flex flex-col gap-1 mt-2">
                    <span class="text-lg uppercase">Lane</span>
                    <ButtonGroup
                        options={roleOptions}
                        selected={playerRole()}
                        size="sm"
                        onChange={(value) => setPlayerRole(value)}
                    />
                </div>
                <div class="flex flex-col gap-1 mt-2">
                    <span class="text-lg uppercase">Pick order</span>
                    <ButtonGroup
                        options={pickOptions}
                        selected={pickPosition()}
                        size="sm"
                        onChange={(value) => setPickPosition(value)}
                    />
                </div>
                <div class="text-sm text-neutral-300 mt-3 space-y-1">
                    <div>
                        Record: {totalWins()}W {totalLosses()}L ({(winRate() * 100).toFixed(1)}%)
                    </div>
                    <div>Rounds: {roundsPlayed()}</div>
                    <div>
                        Avg placement: {roundsPlayed() === 0 ? "-" : avgPlacement().toFixed(2)}
                    </div>
                </div>
                <div class="flex gap-2 mt-3">
                    <button
                        onClick={() => (isTrainingMode() ? stopTraining() : startTraining())}
                        class="px-4 py-2 rounded bg-neutral-700 hover:bg-neutral-600 text-white font-semibold"
                    >
                        {isTrainingMode() ? "Stop Training" : "Start Training"}
                    </button>
                    <button
                        onClick={resetStats}
                        class="px-4 py-2 rounded bg-neutral-800 hover:bg-neutral-700 text-white"
                    >
                        Reset Results
                    </button>
                </div>
                <div class="text-xs text-neutral-400 mt-2">
                    Training uses your Draft settings for Ignore Individual Winrates and Risk Level.
                </div>
            </div>
        </DialogContent>
    );
}
