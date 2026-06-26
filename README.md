# DraftGap+ (Unofficial Mod)

**DraftGap+** is a modified version of the original **DraftGap** application. It retains all the powerful statistical tools of the original software while introducing new features to provide deeper insight during the drafting phase.

## ⚠️ Attribution & Disclaimer

This project is a personal fork and is **not** affiliated with the original DraftGap developers.

* **Original Project:** [DraftGap](https://github.com/vigovlugt/draftgap)
* **Original Creator:** vigovlugt

Full credit belongs to the original creator for the core architecture and logic. I have modified this version to suit my personal drafting preferences and am sharing it for educational purposes.

## 🆕 What's New in DraftGap+?

### 1. Dynamic Smart Tiers
Most drafting tools use "static" tier lists (e.g., "Jinx is always S tier this patch"). DraftGap+ is different. **It calculates a custom tier list for every single lobby** based on your specific allies and enemies.

* **Live Calculation:** A champion might be "B Tier" generally, but if they perfectly counter the enemy team and fit your synergy, they will be promoted to **S Tier** instantly.
* **Relative Power:** The tiers aren't fixed. They are ranked relative to the best options available *right now*.
* **The "S+" Badge:** This is a special, rare tier programmed to only appear when a single champion is statistically "miles ahead" of every other option. It signals a "Game Changer" pick that you shouldn't ignore.

### 2. The "Delta" Column
In the original app, suggestions showed the *total* resulting winrate. It was hard to see exactly how much value a specific champion added.

* **What it does:** Calculates the exact difference between your team's *current* winrate and the *projected* winrate with the selected champion.
* **Visual Indicators:**
    * **Positive Delta (+):** Shown in **green**.
    * **Negative Delta (-):** Shown in **red**.
* **Why it helps:** Instantly spot the difference between a "good pick" and a "winning pick" without doing mental math.

### 3. Hover Insight
When you hover over a suggested champion, the UI shows a tooltip with matchup breakdowns, synergy score, and delta components, letting you understand *why* a recommendation was made without leaving the draft screen.

### 4. Analysis Tab Insight
The Analysis tab provides quick, aggregated context about each champion in the lobby. Rather than live matchup math, it shows general popularity and strength indicators:

* **Popularity:** how frequently a champion is picked in the dataset (useful for understanding meta relevance).
* **General power level:** a simple strong/weak rating derived from overall winrates.
* **Who counters who:** if the champion is statistically weak or strong against your current picks.

### 5. Draft Training Mode
DraftGap+ now includes a focused training loop for practicing draft decisions directly inside the app. Build a realistic draft state, review ranked recommendations.

* **Set up the scenario:** choose your lane and pick order, then start a training round from Settings.
* **Stay keyboard-only:** search a champion, press `Enter` to continue the round, and use `Tab` to move through ranked insight rows.

## 🛡️ Core Features (Inherited from DraftGap)

DraftGap+ keeps all the excellent features that make the original tool great:

* **Unopinionated Suggestions:** Recommendations are based purely on statistics (meta, matchups, and duos), not subjective opinions.
* **Live Sync:** Integrates directly with the League of Legends client to automatically detect your lobby, roles, and bans.
* **Matchup Analysis:** Suggests champions based on how well they perform against the specific enemies you are facing.
* **Ally Synergy:** Accounts for how well a champion pairs with your existing teammates.

## 📥 Installation

1.  Go to the **Releases** tab on this repository.
2.  Download the latest **.msi** installer.
3.  Run the installer (Windows may ask for permission as this is a custom build).
4.  Open the app and start your League of Legends client.

## 📜 Changelog
* **v4.3.0** – 2026-06-26
  - fixed minor bugs
  - updated stat site opening behavior to reuse the current tab instead of opening a new one
* **v4.2.0** – 2026-05-10
  - fixed account switching so the app refreshes the current summoner when the League client changes accounts, preventing self-hover from being treated as an external hover
  - improved random training pick order by excluding pick 1 from random mode
  - added a keyboard-first training loop: `Enter` continues the round from search, `Tab` cycles ranked insight rows, and the active insight stays visible
  - fixed no focus effect on hover in post-training mode
  - stopping training now clears both ally and opponent teams so returning to normal draft mode starts on a clean board

* **v4.1.1** – 2026-04-19
  - training feedback now pauses on the picked champion, shows ranked best options after the pick, keeps the feedback toast visible until the next round

* **v4.0.1** – 2026-03-31
  - added a full draft training mode workflow integrated into Settings (lane selection, pick order, start/stop)
  - training now auto-generates realistic drafts with one open player slot and role-appropriate champion pools
  - locked role filtering to the selected training lane and hid recommendation hints during training (alphabetical list, hidden tiers, hidden hover insights)
  - added instant correct/wrong pick feedback, persisted training stats, average placement tracking, and a reset results action
  - training feedback now pauses on the picked champion, shows ranked best options after the pick, keeps the feedback toast visible until the next round, clears search, scrolls to the top, and reveals hover insight during review

* **v3.2.0** – 2026-03-25
  - replaced text-based champion names with direct image icons in the hover insights tooltip for a cleaner visual experience
  - integrated champion icons into the Analysis tab's solo matchup insights to improve visual clarity

* **v3.1.1** – 2026-03-25
  - fixed a text rendering bug in hover insights where strong champion counters were incorrectly labeled as "Weak against"
  

---

*DraftGap+ isn't endorsed by Riot Games and doesn't reflect the views or opinions of Riot Games or anyone officially involved in producing or managing League of Legends. League of Legends and Riot Games are trademarks or registered trademarks of Riot Games, Inc. League of Legends © Riot Games, Inc.*