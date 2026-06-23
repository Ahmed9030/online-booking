# UI Context — Design System
# Booking SaaS — Barbershop Appointment Platform

## Design Language: Neumorphism (Soft UI)

This project uses **Neumorphism** (Soft UI) as its primary design language.
Every UI element must feel extruded from or pressed into the background surface —
achieved through paired light/dark box shadows rather than borders or flat colors.

---

## Core Neumorphism Rules

### The Three Shadow States
Every interactive element must implement these three states using CSS box-shadow:

```css
/* RAISED — element sits above the surface (default / resting state) */
box-shadow:
  6px 6px 12px var(--shadow-dark),
  -6px -6px 12px var(--shadow-light);

/* PRESSED — element is pushed into the surface (active / selected state) */
box-shadow:
  inset 4px 4px 8px var(--shadow-dark),
  inset -4px -4px 8px var(--shadow-light);

/* FLAT — element is flush with surface (hover state or inactive card) */
box-shadow:
  3px 3px 6px var(--shadow-dark),
  -3px -3px 6px var(--shadow-light);
```

### Neumorphism Cardinal Rules
- **Never use hard borders** — if a boundary is needed, use shadow contrast only.
- **Background and element surfaces must be the same color** — the illusion only works
  when the element and the page share the exact same background.
- **Avoid pure black or pure white** — shadows must be colored (slightly warm or cool)
  relative to the base surface color.
- **Low contrast is intentional** — text and icons must still meet WCAG AA contrast
  against the surface, but decorative UI elements are intentionally subtle.
- **Depth hierarchy:** raised cards > flat cards > pressed buttons (deeper = more interaction).

---

## Color Palette

### Light Mode (Primary — Default)

```css
:root {
  /* Base surfaces */
  --color-bg:           #E8EDF2;   /* main page background */
  --color-surface:      #E8EDF2;   /* card/element surface (same as bg — critical) */
  --color-surface-alt:  #F0F4F8;   /* slightly lighter surface variant */

  /* Shadows (paired — one dark, one light) */
  --shadow-dark:        #C8CDD3;   /* darker shadow (bottom-right) */
  --shadow-light:       #FFFFFF;   /* lighter highlight (top-left) */

  /* Brand / Primary */
  --color-primary:      #4A7FA5;   /* muted steel blue */
  --color-primary-hover:#3A6F95;
  --color-primary-soft: rgba(74, 127, 165, 0.12); /* ghost tint */

  /* Accent */
  --color-accent:       #6C9E78;   /* muted sage green — success/confirm states */
  --color-accent-soft:  rgba(108, 158, 120, 0.12);

  /* Semantic */
  --color-danger:       #C0616A;   /* muted red — cancel/error */
  --color-warning:      #C9935A;   /* muted amber — no-show/pending */
  --color-info:         #5A89B0;   /* light blue — info states */

  /* Text */
  --color-text-primary:   #2D3748; /* main text */
  --color-text-secondary: #718096; /* labels, metadata */
  --color-text-muted:     #A0AEC0; /* placeholders, hints */
  --color-text-inverse:   #FFFFFF; /* text on dark/primary backgrounds */

  /* Status badges */
  --color-confirmed:    #5A89B0;
  --color-completed:    #6C9E78;
  --color-no-show:      #C9935A;
  --color-cancelled:    #C0616A;
}
```

### Dark Mode

```css
[data-theme="dark"] {
  --color-bg:           #1E2328;
  --color-surface:      #1E2328;
  --color-surface-alt:  #252B32;

  --shadow-dark:        #161A1F;
  --shadow-light:       #262D35;

  --color-primary:      #5A9EC8;
  --color-primary-hover:#4A8EBB;
  --color-primary-soft: rgba(90, 158, 200, 0.15);

  --color-accent:       #7AB887;
  --color-accent-soft:  rgba(122, 184, 135, 0.15);

  --color-danger:       #D4737C;
  --color-warning:      #D4A86A;
  --color-info:         #6A9EC8;

  --color-text-primary:   #E2E8F0;
  --color-text-secondary: #A0AEC0;
  --color-text-muted:     #718096;
  --color-text-inverse:   #1E2328;
}
```

---

## Typography

```css
/* Font stack — Arabic-first, system fallback */
--font-primary: 'Cairo', 'Tajawal', system-ui, sans-serif;
/* Cairo: professional, highly legible in Arabic and Latin */
/* Tajawal: fallback, excellent for shorter Arabic labels */

/* Scale */
--text-xs:   0.75rem;   /* 12px — badges, hints */
--text-sm:   0.875rem;  /* 14px — table cells, metadata */
--text-base: 1rem;      /* 16px — body */
--text-lg:   1.125rem;  /* 18px — card titles */
--text-xl:   1.25rem;   /* 20px — section headings */
--text-2xl:  1.5rem;    /* 24px — page titles */
--text-3xl:  1.875rem;  /* 30px — hero headings */

/* Weight */
--font-normal:    400;
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;

/* Line height */
--leading-tight:  1.25;
--leading-normal: 1.6;   /* Arabic needs slightly looser line height */
--leading-loose:  2;
```

### Font Loading (globals.css)
```css
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&family=Tajawal:wght@400;500;700&display=swap');

html {
  font-family: var(--font-primary);
  font-size: 16px;
}

/* RTL root */
html[dir="rtl"] {
  font-feature-settings: "kern" 1;
  letter-spacing: 0; /* Arabic doesn't use letter spacing */
}
```

---

## Spacing Scale

```css
--space-1:   0.25rem;   /* 4px */
--space-2:   0.5rem;    /* 8px */
--space-3:   0.75rem;   /* 12px */
--space-4:   1rem;      /* 16px */
--space-5:   1.25rem;   /* 20px */
--space-6:   1.5rem;    /* 24px */
--space-8:   2rem;      /* 32px */
--space-10:  2.5rem;    /* 40px */
--space-12:  3rem;      /* 48px */
--space-16:  4rem;      /* 64px */
```

---

## Border Radius

```css
--radius-sm:   8px;    /* inputs, small badges */
--radius-md:   12px;   /* buttons, small cards */
--radius-lg:   16px;   /* cards, modals */
--radius-xl:   24px;   /* hero cards, large panels */
--radius-full: 9999px; /* pills, avatars */
```

---

## Core Component Styles

### Neumorphic Card
```css
.neu-card {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  box-shadow:
    6px 6px 12px var(--shadow-dark),
    -6px -6px 12px var(--shadow-light);
}

.neu-card--flat {
  box-shadow:
    3px 3px 6px var(--shadow-dark),
    -3px -3px 6px var(--shadow-light);
}
```

### Neumorphic Button — Primary
```css
.neu-btn-primary {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  border: none;
  cursor: pointer;
  box-shadow:
    4px 4px 8px var(--shadow-dark),
    -2px -2px 6px var(--shadow-light);
  transition: box-shadow 0.15s ease, transform 0.1s ease;
}

.neu-btn-primary:hover {
  box-shadow:
    6px 6px 12px var(--shadow-dark),
    -4px -4px 10px var(--shadow-light);
}

.neu-btn-primary:active {
  box-shadow:
    inset 3px 3px 6px rgba(0,0,0,0.2),
    inset -2px -2px 4px rgba(255,255,255,0.1);
  transform: scale(0.98);
}
```

### Neumorphic Button — Ghost (secondary)
```css
.neu-btn-ghost {
  background: var(--color-surface);
  color: var(--color-primary);
  border-radius: var(--radius-md);
  padding: var(--space-3) var(--space-6);
  font-weight: var(--font-medium);
  border: none;
  cursor: pointer;
  box-shadow:
    4px 4px 8px var(--shadow-dark),
    -4px -4px 8px var(--shadow-light);
  transition: box-shadow 0.15s ease;
}

.neu-btn-ghost:active {
  box-shadow:
    inset 4px 4px 8px var(--shadow-dark),
    inset -4px -4px 8px var(--shadow-light);
}
```

### Neumorphic Input
```css
.neu-input {
  background: var(--color-surface);
  border: none;
  border-radius: var(--radius-sm);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  width: 100%;
  box-shadow:
    inset 3px 3px 6px var(--shadow-dark),
    inset -3px -3px 6px var(--shadow-light);
  transition: box-shadow 0.15s ease;
  outline: none;
}

.neu-input:focus {
  box-shadow:
    inset 4px 4px 8px var(--shadow-dark),
    inset -4px -4px 8px var(--shadow-light),
    0 0 0 2px var(--color-primary-soft);
}

.neu-input::placeholder {
  color: var(--color-text-muted);
}
```

### Neumorphic Toggle / Chip (booking slot)
```css
/* Available slot */
.neu-slot {
  background: var(--color-surface);
  border-radius: var(--radius-md);
  padding: var(--space-2) var(--space-4);
  box-shadow:
    4px 4px 8px var(--shadow-dark),
    -4px -4px 8px var(--shadow-light);
  cursor: pointer;
  transition: box-shadow 0.15s ease;
  font-size: var(--text-sm);
  color: var(--color-text-primary);
}

/* Selected slot */
.neu-slot--selected {
  box-shadow:
    inset 3px 3px 6px var(--shadow-dark),
    inset -3px -3px 6px var(--shadow-light);
  color: var(--color-primary);
  font-weight: var(--font-semibold);
}
```

### Status Badge
```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  font-weight: var(--font-semibold);
}

.badge--confirmed { background: var(--color-primary-soft); color: var(--color-confirmed); }
.badge--completed { background: var(--color-accent-soft); color: var(--color-completed); }
.badge--no-show   { background: rgba(201,147,90,0.12);    color: var(--color-no-show); }
.badge--cancelled { background: rgba(192,97,106,0.12);    color: var(--color-cancelled); }
```

---

## RTL Rules

- **Always** set `dir="rtl"` on the root `<html>` element for Arabic locale.
- Use **logical CSS properties** instead of directional ones:
  - `margin-inline-start` not `margin-left`
  - `padding-inline-end` not `padding-right`
  - `border-inline-start` not `border-left`
- Use Tailwind's `rtl:` variants for directional overrides.
- Icons that imply direction (arrows, chevrons) must be mirrored via `scale-x-[-1]` under `rtl:`.
- Sidebar: positioned on the **right** in RTL, left in LTR.
- Form labels: right-aligned in RTL.
- Calendar weekdays: start from **Saturday** (Arabic convention), not Monday/Sunday.

---

## Tailwind Config Additions

```js
// tailwind.config.ts
module.exports = {
  theme: {
    extend: {
      colors: {
        bg:      '#E8EDF2',
        surface: '#E8EDF2',
        primary: '#4A7FA5',
        accent:  '#6C9E78',
        danger:  '#C0616A',
        warning: '#C9935A',
      },
      boxShadow: {
        'neu':         '6px 6px 12px #C8CDD3, -6px -6px 12px #FFFFFF',
        'neu-flat':    '3px 3px 6px #C8CDD3, -3px -3px 6px #FFFFFF',
        'neu-inset':   'inset 4px 4px 8px #C8CDD3, inset -4px -4px 8px #FFFFFF',
        'neu-sm':      '4px 4px 8px #C8CDD3, -4px -4px 8px #FFFFFF',
      },
      fontFamily: {
        sans: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'neu': '16px',
        'neu-lg': '24px',
      }
    },
  },
  plugins: [],
}
```

---

## Component Usage in Shadcn/UI

Override shadcn/ui default styles to match Neumorphism:
- **Card:** replace default border/bg with `shadow-neu` and `bg-surface`.
- **Button:** replace ring-based focus with `shadow-neu-inset` on active.
- **Input:** replace border-based style with `shadow-neu-inset`.
- **Dialog/Modal:** use `shadow-neu-lg` with slightly elevated `border-radius: var(--radius-xl)`.
- Never use shadcn's default `ring` focus style — replace with the soft glow pattern
  (`0 0 0 2px var(--color-primary-soft)`).

---

## Animation & Transitions

```css
/* Standard */
--transition-fast:   0.1s ease;
--transition-base:   0.2s ease;
--transition-slow:   0.35s ease;

/* Neumorphism-appropriate transitions */
/* Only animate box-shadow and transform — never background-color on neu elements */

.neu-interactive {
  transition:
    box-shadow var(--transition-base),
    transform var(--transition-fast);
}
```

---

## Do's and Don'ts

### ✅ Do
- Use same background color for surface and page root.
- Use CSS variables for every shadow value.
- Apply raised shadow to resting cards and flat/inset shadow to pressed/active states.
- Use soft, muted brand colors — Neumorphism breaks with saturated palettes.
- Test every component in both light and dark mode (shadows invert, not just colors).

### ❌ Don't
- Don't add visible borders to Neumorphic elements.
- Don't use pure white (#FFF) or pure black (#000) as surface colors.
- Don't mix flat/material design shadows with Neumorphic shadows in the same component.
- Don't use heavy drop shadows (>16px spread) — it breaks the soft illusion.
- Don't apply Neumorphism to text — only to containers, buttons, and inputs.
