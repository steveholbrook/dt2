# Focus Mode Header Integration – Technical Specification

## 1. Overview
This document describes the header-level focus control, fullscreen synchronization logic, and responsive layout updates shipped in April 2024. It supplements the primary `TECHNICAL_SPECIFICATION.md` by diving into the interactive flows that keep keyboard, pointer, and touch inputs aligned with the original `F` shortcut behaviour.

## 2. Key Components
- **Header Focus Button (`#headerFocusButton`)** – A masthead control that mirrors the existing timeline focus toggle and exposes `aria-pressed` state for assistive tech.
- **Panel Focus Toggle (`#fullscreenToggle`)** – The inline focus button that appears inside the Progress Tracking panel.
- **Progress Panel (`#progressPanel`)** – The fullscreen target container which isolates the tracking UI when focus mode is active.
- **Responsive Layout Tokens** – Media queries targeting 1280px, 900px, 768px, and 600px breakpoints that rebalance the header grid, panel padding, and table behaviour for SAPUI5 consistency on tablets and phones.

## 3. Interaction Flow
1. **Activation Sources**
   - Pointer/touch on `#headerFocusButton`.
   - Pointer/touch on `#fullscreenToggle`.
   - Keyboard activation (`Enter` or `Space`) on either focus control.
   - Keyboard shortcut `F`.
2. **Event Handling**
   - `initializeFocusToggle()` binds click, keydown, and touchend listeners to both focus buttons.
   - Each listener forwards the event to `handleFocusToggleEvent()`, which normalizes behaviour by calling `toggleFullscreenMode()`.
   - `handleFocusToggleEvent()` prevents default browser actions so touch activation does not emit duplicate click events.
3. **State Synchronization**
   - `toggleFullscreenMode()` delegates to `applyFocusState()` with `attemptFullscreen: true` so the Fullscreen API is requested when supported.
   - `applyFocusState()` toggles the `body.fullscreen-mode` class, refreshes the timeline lazily, and calls `updateFullscreenButton()` plus `updateFocusExitControl()`.
   - `updateFullscreenButton()` keeps header and panel buttons visually aligned (text, icon, and `aria-pressed`).

## 4. Responsive Behaviour
- **Header Grid** – Breaks into two columns at 1280px and stacks into a single column at 900px to maintain readable typography in compact SAPUI5 layouts.
- **Panel Density** – Panels switch to 16px padding at widths below 768px; search filters stack vertically to avoid cramped controls.
- **Runbook Table** – Wrapped in a `.table-responsive` container with touch momentum scrolling and a focus ring for keyboard users.
- **Touch Optimisation** – `touch-action: manipulation` is applied to primary buttons below 600px to reduce 300ms delays on mobile browsers.

## 5. Accessibility Considerations
- Focus wrappers expose `tabindex="0"` to allow keyboard users to pan horizontally through overflow content.
- `aria-label` on the responsive table region aids screen reader discovery when horizontal scrolling is required.
- `aria-pressed` updates on both focus buttons communicate focus mode state changes without visual cues.

## 6. Dependencies & Risks
- Fullscreen requests can be denied in embedded browsers; `handleFocusToggleEvent()` already logs soft failures and leaves CSS-only focus mode active.
- Touchend listeners are registered as non-passive to allow `preventDefault()` inside `handleFocusToggleEvent()`, ensuring duplicate clicks do not fire on mobile Safari.

## 7. Testing Notes
- Verify focus toggles via mouse, keyboard, and touch to confirm parity.
- Resize viewport to 1366px, 1024px, 768px, and 414px widths to validate layout breakpoints.
- Confirm runbook table remains horizontally scrollable and focusable on iOS Safari and Android Chrome.

## 8. May 2024 Enhancements
- **Viewer Status Banner** – `renderFocusStatusBanner()` now surfaces an always-on announcement strip for viewers while hosts keep focus enabled. The banner references `AppState.focusInitiatedBy`, `AppState.focusInitiatedAt`, and `AppState.fullscreenSince` to show who triggered focus and how long the session has been isolated. Updates run in `applyFocusState()`, `toggleFullscreenMode()`, realtime state hydration, and the shared clock tick so the timer stays fresh without polling Firestore.
- **Offline Focus Reminder** – `handleFullscreenFailure()` centralizes Fullscreen API failures. When browsers refuse fullscreen (unsupported embeds, kiosk lockdowns, or user gesture blocks) the host sees a persistent remediation card populated by `getFullscreenRemediationTips()`. Guidance covers iOS “Add to Home Screen”, Android Chrome permissions, and desktop keyboard fallbacks. The notice is dismissible (`#focusFailureDismiss`) and auto-clears on successful fullscreen entry or exit.
- **Adaptive Density Toggle** – A masthead segmented switch (`#densityToggle`) lets hosts pick compact (desktop) or cozy (tablet/gloved) density. `applyDensityPreference()` persists the choice locally, stores it in `AppState.densityMode`, and syncs through `serialize()/applyRemoteState()` so viewers adopt the same spacing. When viewers join, `updateDensityToggleAvailability()` keeps the switch read-only, while CSS tokens under `.density-compact`/`.density-cozy` adjust padding, font sizing, and table row height to mirror SAPUI5 density presets.
