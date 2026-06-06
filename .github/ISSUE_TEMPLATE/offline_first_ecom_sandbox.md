name: "Offline-First E-Commerce Sandbox System"
description: "Implementation spec for a robust, resilient offline-first local e-commerce sandbox with cross-tab sync and live degradation."
title: "[FEAT] Implement Resilient Offline-First E-Commerce Sandbox"
labels: ["architecture", "offline-first", "local-database", "dx"]
assignees: []

## Specification Overview

We require a resilient, enterprise-grade, **offline-first e-commerce sandbox framework**. The system must seamlessly abstract the browser's local state storage, providing a complete emulation of server-authoritative databases (like Supabase) when they are misconfigured, unprovisioned, or disconnected. The client-side application must suffer **zero loss of UX fidelity, zero runtime exceptions, and fully preserve user checkout and admin logistics pipelines**.

---

### 1. Core System Architecture
Implement an internal client-side virtual database adapter layer to intercept other operations when Supabase or dynamic network servers are unreachable.
- [ ] **Dual-Path Data Controller**: Define a central abstraction flag (`isSupabaseConfigured`) that instantly determines execution channels dynamically.
- [ ] **Self-Healing Schema Versioning**: Write a schema migrator that compares active client structures with version milestones (`0` to `1` onwards).
- [ ] **Dynamic Sandboxed Entities**:
  - `solo_sandbox_session`: Tracks current authentication profile, likes array, and wishlists.
  - `solo_sandbox_users`: Holds persistent registered credential maps for local auth matching.
  - `solo_sandbox_orders`: Multi-element array representing customer purchases and tracking states.
- [ ] **Automatic Recovery Setup**: Verify that parsing corrupted storage payloads performs automatic backups and fallback schema reconstruction instead of causing boot failures.

---

### 2. Cross-Tab Synchronization
Ensure states do not diverge when a customer or administrator interacts with the platform across multiple concurrent open browser tabs.
- [ ] **Event Broadcast Channel**: Integrate `BroadcastChannel` with fallback custom window events to propagate changes uniformly.
- [ ] **Shared State Reactivity**: Wire listeners inside context hooks to re-hydrate memory maps dynamically on events.
- [ ] **Instant Client Propagation**:
  - Favor local triggers so that liking a product on Tab A renders instant active visual fills on Tab B.
  - Synchronize admin logistics state transitions instantly to patient tracking screens.

---

### 3. Order & Tracking System
Maintain complete fulfillment simulation without dynamic server roundtrips.
- [ ] **Deterministic Receipt Generation**: Produce a customized invoice pattern based on key transaction states (e.g. `SL-YYYY-MMDD-[Entropy]`).
- [ ] **Structured Milestones Log**: Ensure every mock checkout populates an accompanying tracking history block:
  - `status`: Transitioning through `pending` -> `processing` -> `shipped` -> `delivered`.
  - `message`: Verbose, customized timeline action status reports.
- [ ] **Admin Transition Integration**: Wire the staff portal controls to append tracking logs directly, reflecting on public client checkup cards immediately.

---

### 4. Offline Sync Framework
Define a transparent migration pathway for when a cloud endpoint is established.
- [ ] **Local Mutation Queue**: Temporarily shelf actions taken during offline states.
- [ ] **Sync Execution Pipeline**: Establish a helper (`syncSandboxDataToRemote`) that automatically maps local profile vectors and queue lists to remote PostgreSQL relations upon authentication.
- [ ] **Conflict Reconciliation Strategy**: Merge local wishlist and favorite nodes cleanly via deduplicating `Set` arrays to prevent overwriting cloud records.

---

### 5. UI/UX Requirements
Provide uniform styling characteristics across normal and sandbox runtimes.
- [ ] **Status Continuity**: Refrain from annoying telemetry lines, "Offline Error" modals, or persistent debug signals.
- [ ] **Polished Dark Theme Integration**: Render all layouts inside the Cosmic Slate color configuration, backed by responsive container bounds.
- [ ] **Logistics Visualizer Styling**: Layout shipping statuses inside clean progress timelines utilizing crisp vector assets and smooth scale adjustments.

---

### 6. System Reliability
- [ ] **Isolated Execution Contexts**: Encapsulate all database writes inside robust local wrappers (`safeGetLocalStorage`, `safeSetLocalStorage`) to prevent filesystem exceptions under strict browser sandbox policies.
- [ ] **Deterministic Boot Hydration**: Safely mount initial view elements before triggering secondary state queries to minimize layout shifting.
- [ ] **Silent Errors Principle**: Absorb and recover from standard file IO / quota limit violations silently.

---

### 7. Acceptance Criteria
- [ ] System operates fully with mock items, favorites, logins, and checkouts without a dynamic database configuration.
- [ ] Data persists reliably through client reboots and browser updates.
- [ ] Changes on separate browser screens synchronize instantly without Manual Reload commands.
- [ ] Tracking references generate correctly and can be verified on user tracking pages.
- [ ] Transnational sync works reliably when backend connectivity transitions back to online mode.
