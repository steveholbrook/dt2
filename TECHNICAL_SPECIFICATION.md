# Downtime Tracking Application Technical Specification

## 1. Scope
This document enumerates the functional features that currently ship with the downtime tracking web application. Each feature entry includes a short description, key UI touchpoints, and major implementation anchors inside `index.html`. Use the identifiers (F1, F2, …) when requesting enhancements or clarifications so discussions stay focused.

## 2. Feature Catalog
1. **F1 – Session Context & URL Routing**  
   *Description:* Customer name, transformation cycle, and viewer flag are encoded into the page URL and cached in local storage so new tabs, refreshes, and shareable links retain context.  
   *Key Implementation:* `initializeSessionContext()`, `updateSessionUrlParams()`, and the top-level `sessionContext` object manage query parameters and local persistence.

2. **F2 – Role Detection & Viewer Mode Toggle**  
   *Description:* The app inspects the `viewer` query parameter, recent session roster, and Firebase state to determine whether the current client is a host or viewer. Forced viewers have their editing controls disabled.  
   *Key Implementation:* `detectMode()`, `applyViewerMode()`, and `applyHostMode()` update DOM classes and button interactivity.

3. **F3 – Single Host Enforcement**  
   *Description:* Only one host can control a session at a time. Additional tabs that attempt to enter host mode see an alert, are switched into viewer mode, and their Firestore permissions are scoped to read-only.  
   *Key Implementation:* `claimHostController()`, `handleControllerConflict()`, and `hostBlockReason` logic inside `initializeRealtime()`.

4. **F4 – Presence Tracking & Viewer Count**
   *Description:* Each tab writes a presence document containing its role. Active entries (45-second heartbeat) are tallied to surface the number of viewers and total participants in the header and share overlay. A local `LocalRealtimeBridge` fallback mirrors presence updates across browser tabs when Firestore is slow or unreachable, so the viewer count never drops to zero during transient outages.
   *Key Implementation:* `bindPresenceListeners()`, `updatePresence()`, `LocalRealtimeBridge.emitPresenceEntry()`, and DOM nodes `viewerCountHeader`, `viewerCountMeta`, and `rt-online`.

5. **F5 – Host Authentication Bootstrap**  
   *Description:* The application auto-initializes authenticated flows on load—no password prompt—while waiting for Firebase anonymous sign-in to complete before binding realtime listeners.  
   *Key Implementation:* `runAuthenticatedStartup()` and the `DOMContentLoaded` listener that immediately triggers it.

6. **F6 – Downtime Session Lifecycle**  
   *Description:* Hosts can start, pause, resume, and stop downtime sessions. Elapsed duration, start timestamps, and reset state synchronize to viewers and persist in Firestore.  
   *Key Implementation:* `startDowntime()`, `pauseDowntime()`, `resumeDowntime()`, `stopDowntime()`, and supporting helpers `computeDowntimeDuration()` plus `updateDowntimeStatus()`.

7. **F7 – Pause Reason Capture & Display**  
   *Description:* When pausing, hosts provide a reason that propagates to viewer overlays and timeline tooltips so stakeholders understand stoppages.  
   *Key Implementation:* `promptPauseReason()`, `pauseDowntime()` reason handling, and viewer panel nodes `rt-pause-reason` & `rt-pause-reason-row`.

8. **F8 – Reset & Historical Timestamp Tracking**  
   *Description:* Resetting a downtime session clears timers, pause metadata, and viewer focus flags while storing the last-reset timestamp for historical context in the realtime status card.  
   *Key Implementation:* `resetDowntimeSession()`, `applyResetState()`, and UI element `rt-last-reset`.

9. **F9 – KPI Progress & Timeline Preview**  
   *Description:* A KPI ribbon summarizes elapsed vs. planned duration, progress percentages, and highlights upcoming tasks in a lightweight preview list for viewers.  
   *Key Implementation:* `updateViewerPanel()`, KPI banner markup near `#kpiBanner`, and timeline preview renderer `renderTimelinePreview()`.

10. **F10 – Runbook Timeline Management**  
    *Description:* Hosts manage detailed runbooks with drag-and-drop ordering, filtering, inline editing, and duplication. Timeline blocks update in realtime and support search, critical markers, and planned/actual durations.  
    *Key Implementation:* `addRunbookRow()`, `renderRunbookTable()`, `enableDragAndDrop()`, and timeline drawing helpers such as `renderTimeline()`.

11. **F11 – Template Library**  
    *Description:* Runbook configurations can be saved to and loaded from Firestore templates, supporting shareable playbooks with message toggles defaulted to off during load.  
    *Key Implementation:* `saveTemplate()`, `loadTemplate()`, `refreshTemplates()`, and template list container `#templateList`.

12. **F12 – Message Timeline Toggle**  
    *Description:* Timeline messages can be enabled or suppressed globally. Template loads default to disabled, and the toggle button keeps the UI state synchronized across host and viewer sessions.  
    *Key Implementation:* `setMessagesEnabled()`, `bindMessageToggleButton()`, and control `#messageToggleBtn`.

13. **F13 – Focus Mode & Fullscreen Sync**
   *Description:* The focus button triggers the Fullscreen API, collapses every panel except the timeline, and shares focus status with viewers, including start timestamps and exit controls. Offline queueing and the realtime bridge ensure focus transitions initiated while disconnected replay locally and propagate once connectivity returns.
   *Key Implementation:* `toggleFullscreenMode()`, `applyFocusState()`, focus CSS rules (`body.fullscreen-mode #progressPanel > :not(#focusExitControl):not(.timeline-container)`), `updateFocusExitControl()`, `schedulePush('focus-toggle')`, and viewer field `rt-focus-time`.

14. **F14 – Dark Mode Synchronization**
   *Description:* Dark mode is a shared session preference—toggling it updates Firestore, re-applies palette tokens locally, and informs viewers so the UI stays consistent. The resilient offline queue plus `LocalRealtimeBridge.emitState()` record toggles made without a network connection and replay them instantly across tabs.
   *Key Implementation:* `toggleDarkMode()`, shared state serialization, Firestore field `darkMode`, DOM class `body.dark-mode`, and the realtime bridge state channel.

15. **F15 – Audio & Toast Notifications**  
    *Description:* Pause/resume events trigger toast notifications and optional audio cues to alert distributed teams. Viewers receive mirrored alerts.  
    *Key Implementation:* `playSound()`, `showToast()`, and event hooks in `pauseDowntime()`/`resumeDowntime()`.

16. **F16 – Presence-Aware Share Overlay**  
    *Description:* Hosts can open a realtime overlay that surfaces copyable viewer links, online counts, and reset controls while mirroring session context.  
    *Key Implementation:* `createRealtimeOverlay()`, overlay node IDs `rt-copy`, `rt-status`, `rt-online`, and `rt-reset`.

17. **F17 – Bookmarking & Recent Sessions**  
    *Description:* Frequently used customer/transform combinations can be bookmarked for quick selection. Recent session dropdowns accelerate setup and populate the share sheet.  
    *Key Implementation:* `bookmarkCurrentSession()`, `updateRecentCustomersDropdown()`, and storage helpers `persistRecentCustomers()`.

18. **F18 – Host Identity & Control Requests**
   *Description:* The Host Control panel surfaces the active controller, automatically deriving the display name from the stored operator profile or realtime presence roster. Viewers request control from the same panel, and hosts receive takeover prompts before claims execute. Local presence mirroring keeps the host display name visible to viewers even if Firestore briefly drops offline.
   *Key Implementation:* `renderHostStatus()`, `renderControlRequestBanner()`, Host Control markup `host-control-panel`, Firestore field `requestedController`, and `LocalRealtimeBridge` presence snapshots.

19. **F19 – Messaging & Announcement Framework**
    *Description:* Hosts can craft structured messages that appear in the timeline with validation, scheduling, and default muted states until explicitly enabled. Use the Messages toggle beside the runbook grid to enable announcements only after validation. The diagnostics drawer (`Diagnostics` button in the realtime overlay) surfaces step-by-step guidance and the command palette (`Ctrl+K`) exposes “Messaging framework instructions” for quick reference. Local realtime mirroring keeps message visibility synchronized even when offline.
    *Key Implementation:* `createMessageRow()`, message validation helpers, timeline rendering in `renderTimelineMessages()`, messaging controls `setMessagesEnabled()`, support content wired through `showMessagingInstructions()`, and `LocalRealtimeBridge.emitState()`.

20. **F20 – Testing & Mocking Harness**  
    *Description:* A Node-based mock harness (`tests/host_viewer_mock.test.js`) simulates Firebase interactions, verifying pause/resume math, host enforcement, and template toggles without live services.  
    *Key Implementation:* Test suite definitions and exported utilities under `tests/host_viewer_mock.test.js`.

## 3. Data & Realtime Dependencies
- **Firebase Firestore & Auth:** Anonymous authentication is used to persist sessions, runbooks, templates, and presence records. Collections include `sessions`, nested `presence`, `runbooks`, and `templates` paths.  
- **Local Storage:** Persists recent customer selections, dark-mode defaults, focus preferences, and host acknowledgement flags for faster reloads.  
- **Clipboard & Fullscreen APIs:** Provide sharing capabilities and presentation mode across desktop and mobile browsers.  
- **Audio Assets:** Embedded base64 snippets support toast sounds without requiring separate asset downloads.

## 4. Operational Considerations
- **Initialization Flow:** `runAuthenticatedStartup()` guards all UI bindings to ensure Firebase auth and DOM are ready before listeners attach.  
- **Concurrency Guardrails:** `sessionContext.sessionKey` ensures customer/transform pairs map to unique Firestore documents, keeping hosts segregated.  
- **Performance Practices:** Focus mode delays heavy timeline rendering, and viewer panels reuse cached DOM fragments to reduce layout thrash.

## 5. Proposed Enhancements
1. **P1 – Adaptive Timeline Density:** Automatically collapse low-priority tasks when screen width is constrained to improve mobile usability.  
2. **P2 – SLA Threshold Alerts:** Allow configuration of warning thresholds that trigger color-coded KPIs and notifications as downtime nears contractual limits.  
3. **P3 – Integrated Chat Dock:** Embed a lightweight chat sidebar (with presence awareness) so hosts and viewers can coordinate without leaving the app.  
4. **P4 – Multi-Language UI Packs:** Externalize UI strings and support live language switching for international teams.  
5. **P5 – Pause Reason Analytics Dashboard:** Aggregate pause reasons over time and visualize trends within a historical analytics tab.  
6. **P6 – Automated Runbook Importers:** Parse SAP transport logs or CSV exports directly into runbooks to reduce manual data entry.  
7. **P7 – Smart Pause Suggestions:** Use task metadata to recommend likely pause reasons or next actions when downtime exceeds expected durations.  
8. **P8 – Collaborative Commenting:** Allow inline comments on timeline tasks with mention notifications for responsible owners.  
9. **P9 – Incident Postmortem Export:** Generate a one-click postmortem document summarizing downtime timeline, reasons, and KPI deltas.  
10. **P10 – Role-Based Access Controls:** Integrate optional identity providers so organizations can assign granular permissions beyond the current host/viewer split.

## 6. Production Hardening Enhancements
1. **N1 – Resilient Offline Queueing:** Host mutations are queued via `OfflineQueue` whenever `navigator.onLine` is false. Once connectivity returns, `flushOfflineQueue()` replays serialized session snapshots, while `LocalRealtimeBridge.emitState()` keeps co-located viewers updated immediately and the diagnostics drawer queue view shows pending replays.
2. **N2 – Dependency-Aware Timeline Planning:** The existing predecessor column now drives `calculateBlockPositions()` so downstream tasks automatically shift when upstream sequences move.
3. **N3 – Viewer Engagement Metrics:** Presence snapshots hydrate `ViewerEngagement`, updating peak counts, active durations, and overlay fields `rt-peak-viewers`, `rt-avg-session`, and `rt-current-viewers` for real-time staffing visibility.
4. **N4 – Guided Onboarding Tours:** `OnboardingTour` highlights key controls for first-time hosts, triggered automatically when a user becomes the controlling host and available on demand from the diagnostics drawer.
5. **N5 – Template Version Governance:** `TemplateGovernance` assigns semantic versions and maintains per-template changelogs. The template list shows `vX.Y.Z` metadata, and `showTemplateChangelog()` surfaces history before loading.
6. **N6 – External Notification Hooks:** The diagnostics drawer exposes a webhook form wired to `NotificationHooks.notify()`, broadcasting downtime lifecycle, focus, dark-mode, and KPI threshold events to Slack/Teams URLs.
7. **N7 – KPI Threshold Automation:** `KpiAutomation` persists variance thresholds; `handleKpiAutomation()` triggers toasts and notification hooks when planned vs. actual variance exceeds configured limits.
8. **N8 – Mobile Offline Snapshot:** `generateMobileSnapshot()` captures a condensed JSON summary of the current timeline for mobile consumption, stored under `dt2-mobile-snapshot` and accessible via diagnostics controls or the command palette.
9. **N9 – Command Palette Shortcuts:** The `CommandPalette` overlay (`Ctrl+K`) exposes quick actions (focus toggle, dark mode, downtime controls, diagnostics, messaging help, template save, snapshot generation).
10. **N10 – Health Diagnostics Panel:** `ensureDiagnosticsDrawer()` introduces a persistent diagnostics drawer that surfaces connection state, auth identifiers, presence counts, offline queue depth, automation thresholds, messaging tips, and onboarding controls.

## 7. Focus Header & Responsive Layout (April 2024 Update)
1. **FH1 – Header Focus Control Wiring**
   *Description:* The dedicated "Focus" button in the masthead now routes directly into the fullscreen workflow used by the `F` keyboard shortcut. Desktop clicks, keyboard activation, and touch interactions all call `handleFocusToggleEvent()`, guaranteeing parity across input modes.
   *Key Implementation:* `initializeFocusToggle()` binds listeners to `#headerFocusButton` and `#fullscreenToggle`, while `handleFocusToggleEvent()` drives `toggleFullscreenMode()`.

2. **FH2 – Fullscreen State Synchronization**
   *Description:* `updateFullscreenButton()` keeps header and panel buttons synchronized, ensuring `aria-pressed` attributes match the underlying `AppState.fullscreenMode`. Focus entry also auto-requests the Fullscreen API on the `#progressPanel` container with graceful fallbacks.
   *Key Implementation:* `applyFocusState()` toggles `body.fullscreen-mode`, triggers timeline refreshes, and coordinates the exit control via `updateFocusExitControl()`.

3. **FH3 – Mobile-Friendly Header Grid**
   *Description:* Responsive breakpoints at 1280px, 900px, and 768px progressively collapse the four-column header into SAP Fiori-style stacks so customer metadata, completion metrics, and the focus control remain readable on phones.
   *Key Implementation:* CSS media queries in `index.html` adjust `.app-header` grid templates, align `.header-status` left, and widen `.header-focus-button` for thumb reach.

4. **FH4 – Adaptive Runbook Table Region**
   *Description:* A focusable `.table-responsive` wrapper introduces horizontal scrolling with touch momentum, keeping the full runbook grid accessible on narrow screens without truncating columns.
   *Key Implementation:* The wrapper surrounds `#runbookTable` and applies `min-width` thresholds plus `tabindex="0"` to support keyboard panning.

5. **FH5 – Compact Panel Layout**
   *Description:* Tablet and phone breakpoints reduce panel padding, stack search filters vertically, and normalize button touch targets so workflows comply with SAPUI5 compact density guidelines.
   *Key Implementation:* Media queries tune `.content`, `.panel`, `.search-filter-container`, and `.filter-controls` spacing tokens.

