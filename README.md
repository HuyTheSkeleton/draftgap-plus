# DraftGap+ (Unofficial Mod)

**DraftGap+** is a modified version of the original [DraftGap](https://github.com/vigovlugt/draftgap) application. It retains all the powerful statistical tools of the original software while introducing new features to provide deeper insight during the drafting phase.

## ⚠️ Attribution & Disclaimer
This project is a personal fork and is **not** affiliated with the original DraftGap developers.
* **Original Project:** [DraftGap](https://github.com/vigovlugt/draftgap)
* **Original Creator:** [vigovlugt](https://github.com/vigovlugt)

Full credit belongs to the original creator for the core architecture and logic. I have modified this version to suit my personal drafting preferences and am sharing it for educational purposes.

---

## 🆕 What's New in DraftGap+?

The primary goal of this modification is to make winrate data easier to interpret at a glance.

### The "Delta" Column
In the original app, champion suggestions showed the *total* resulting team winrate. I found it difficult to quickly see how much a single champion actually impacted the team.

**DraftGap+ introduces a specialized "Delta" column:**
* **What it does:** It calculates the difference between your team's *current* winrate and the *projected* winrate with the selected champion.
* **Visual Indicators:**
    * **Positive Delta (+):** Shown in **green**. This champion statistically improves your team's chances of winning.
    * **Negative Delta (-):** Shown in **red**. This champion statistically hurts your team composition.
* **Why it helps:** It allows you to instantly identify high-impact picks without doing mental math during the stressful countdown of champ select.

---

## 🛡️ Core Features (Inherited from DraftGap)

DraftGap+ keeps all the excellent features that make the original tool great:

* **Unopinionated Suggestions:** Recommendations are based purely on statistics (meta, matchups, and duos), not subjective tier lists.
* **Live Sync:** Integrates directly with the League of Legends client to automatically detect your lobby, roles, and bans.
* **Matchup Analysis:** Suggests champions based on how well they perform against the specific enemies you are facing.
* **Ally Synergy:** Accounts for how well a champion pairs with your existing teammates.

## 📥 Installation

1.  Go to the **[Releases](../../releases)** tab on this repository.
2.  Download the latest `.msi` installer.
3.  Run the installer (Windows may ask for permission as this is a custom build).
4.  Open the app and start your League of Legends client.

---

*DraftGap+ isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.*
