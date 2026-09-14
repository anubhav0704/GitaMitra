---
name: stitch
description: >-
  Stitch UI Design System — Guidelines for crafting premium modern component
  hierarchies, spiritual glassmorphism, harmonious palette tokens, fluid
  micro-interactions, and responsive typography across GitaMitra.
---

# Stitch UI Design System

The **Stitch UI Design System** defines the aesthetic, architectural, and interactive standards for GitaMitra. It marries cutting-edge, ultra-clean web application design (ChatGPT/Gemini minimalism) with sacred, warm Indian spiritual motifs (Bhagavad Gita saffron, gold, and deep slate).

---

## 1. Core Visual Principles

### 1.1 Tactile Depth & Glassmorphism
* **Surface Layers**:
  * **Canvas (Base)**: Light `#ffffff`, Dark `#212121`.
  * **Secondary / Sidebar**: Light `#f9f9f9`, Dark `#171717`.
  * **Interactive Surfaces (Cards / Pills)**: Light `#f3f4f6`, Dark `#282828`.
  * **Hover / Active State**: Light `#edeef1`, Dark `#2f2f2f`.
* **Subtle Borders**: All panels and cards use razor-thin, high-contrast borders:
  * Light mode: `border-gray-200/80` or `border-black/5`.
  * Dark mode: `border-white/10` with optional `ring-1 ring-white/5`.
* **Glassmorphic Overlays**: Headers, floating toolbars, and popovers use `backdrop-blur-md` with `85%-90%` opacity to reveal subtle context underneath.

### 1.2 Spiritual Color Palette
* **Primary Sacred Accent**:
  * Amber / Saffron: `amber-500` (`#f59e0b`) & `amber-600` (`#d97706`).
  * Warm Gold Gradient: `from-amber-600 to-amber-500` for logos, badges, and primary action triggers.
  * Dark Accent Text: `text-amber-300` or `text-amber-400`.
  * Light Accent Text: `text-amber-800` or `text-amber-900`.
* **Neutral Scales**:
  * Light: Gray 50 to 900.
  * Dark: `#212121` (canvas), `#171717` (panels), `#282828` (cards), `#2f2f2f` (hover).
* **Semantic Accents**:
  * Emerald (`emerald-500` / `emerald-600`) for verified citations, copy confirmation, and positive feedback.
  * Rose (`rose-500` / `rose-600`) for error states and reported feedback.

### 1.3 Typography Hierarchy
* **Sacred & Titles**: High-contrast, elegant Serif (`font-serif`, Georgia / Merriweather / Noto Serif). Used for Sanskrit shlokas, chapter titles, and GitaMitra brand mark.
* **UI & Body**: Clean modern sans-serif (`font-sans`, Geist / Inter / system-ui). Used for navigation, chat bubbles, metadata, and controls.
* **Tracking & Casing**:
  * Badges and category headers: `text-[10px]` or `text-[11px]`, `font-semibold`, `uppercase`, `tracking-wider`.
  * Body text: `text-[15px]`, `leading-relaxed`, line length capped at `65-75ch`.

---

## 2. Component Design Patterns

### 2.1 The Floating Pinned Composer (Chat)
* Pinned at viewport bottom via absolute positioning with gradient fade-out background (`from-white dark:from-[#212121] via-white/95 dark:via-[#212121]/95 to-transparent`).
* Outer wrapper: `rounded-[28px]`, `p-3`, `bg-gray-100 dark:bg-[#2f2f2f]`, `border border-gray-200/80 dark:border-white/10`.
* Focus ring: `focus-within:border-gray-400 dark:focus-within:border-white/30 focus-within:shadow-md`.
* Send button: Circular `w-8 h-8 rounded-full bg-black dark:bg-white text-white dark:text-black hover:opacity-85 disabled:opacity-20`.

### 2.2 Fluid Sidebar (Navigation & History)
* Full-height `100vh` without interfering with top navbars.
* Width: `w-64` when expanded; smoothly collapses to `w-0` on command.
* Profile trigger at bottom-left: Always opens menu **upwards** (`bottom-full mb-2 left-0 right-0`) with subtle drop shadow and clean partition dividers.

### 2.3 Sacred Verse Cards (Gita Explorer)
* Devanagari Sanskrit text prominently centered in large serif (`text-2xl` to `text-4xl`), surrounded by a warm top-to-bottom amber gradient sheen.
* Quick-action buttons: Copy Sanskrit, Copy Translation, Reflect in Chat.
* Next/Previous navigation with responsive arrow controls and keyboard shortcut indicators (`←` / `→`).

---

## 3. Micro-Interactions & Polish

* **Hover Lift**: Cards elevate slightly on hover (`hover:-translate-y-0.5 hover:shadow-md transition-all duration-200`).
* **Active Press**: Buttons gently scale down on press (`active:scale-95 transition-transform duration-100`).
* **Tooltips & Transitions**: All icon buttons include accessible `title` and `aria-label` tags with smooth color transitions (`transition-colors duration-150`).
* **Scrollbars**: Thin, rounded custom scrollbars (`w-1.5`, `rounded-full`, low-opacity thumb).

---

## 4. Implementation Checklist

1. **Dark/Light Symmetry**: Every component must look intentional in both light and dark mode.
2. **Zero Outer Scrollbar**: Web app screens (`/chat`) must prevent body scrolling.
3. **No Blue/Cold Clashes**: Replace cold generic blues with the curated warm amber/saffron and deep slate palette.
