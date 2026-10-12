# Football Links design-improvement sprints

## Sprint 1 — dependable first game

**Goal:** a player can always understand whether a challenge is loading, failed, or ready.

- Replace plain loading copy with an accessible game-board skeleton.
- Time-box challenge and entity requests, with human-readable recovery copy and Retry/Exit actions.
- Announce loading, errors, moves, and completion to assistive technology.
- Establish a clear target/current-node/move hierarchy and consistent keyboard focus states.

**Done when:** slow or failed challenge/entity requests recover without a dead end; all controls can be reached by keyboard; loading and errors are announced; the existing deterministic game flow still passes.

## Sprint 2 — explain and orient

**Goal:** first-time players understand the puzzle before the timer creates pressure.

- Add a dismissible three-step “How to play” introduction and an example route.
- Pause timing until the first move after the introduction.
- Label club and player moves distinctly and display a readable, non-overflow-only route trail.
- Ensure all interactive targets are at least 44 by 44 pixels on touch devices.

**Done when:** a first-time player can explain the goal and make a first valid move without assistance.

## Sprint 3 — make completion rewarding and trustworthy

**Goal:** finishing a round teaches the player something and builds confidence in the data.

- Add a performance tier, personal best comparison, route insight, and clear replay/review actions.
- Publish a Data & sources page describing league coverage, provenance, and validation policy.
- Offer source/validation status in entity details without disrupting play.
- Verify WCAG AA contrast, 200% zoom, keyboard-only operation, and reduced motion.

**Done when:** every result has an actionable next step and every displayed game relationship has understandable provenance.

## Sprint 4 — earn repeat play

**Goal:** turn isolated rounds into a lightweight football ritual.

- Ship deterministic daily challenges, difficulty selection, and local personal records.
- Add optional streaks and shareable text results after the core flow is stable.
- Instrument game-start, first-move, completion, replay, and return behaviour.

**Done when:** daily puzzles are repeatable, results are comparable, and retention improvements can be measured.

## Sprint 5 — privacy-first progression

**Goal:** give players a reason to return without requiring an account or passive behavioural tracking.

- Store daily-completion dates locally and show a consecutive-day streak.
- Offer an explicit copy/share result action containing no personal data.
- Explain that records and streaks remain on the player’s device.
- Defer product analytics until a consent, retention, and privacy policy are agreed.

**Done when:** a completed daily challenge updates a local streak, a result can be copied deliberately, and no game data is sent to a third party.
