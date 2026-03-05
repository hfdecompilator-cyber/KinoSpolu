# 🎨 StreamHub Premium Theme Documentation

**Your app uses a complete premium design system!**

---

## ✨ Premium Libraries Included

### 1. **Tailwind CSS** (Premium Framework)
- Full customization
- Dark mode support
- Responsive design system
- Utility-first CSS

### 2. **shadcn/ui** (50+ Premium Components)
- Dialog, Modal, Sheet
- Forms, Inputs, Select
- Dropdown, Navigation
- Accordion, Tabs
- Cards, Buttons
- And 40+ more...

### 3. **Radix UI** (Unstyled Component Library)
- Accessible primitives
- Customizable behavior
- Full keyboard support
- ARIA compliant

### 4. **Framer Motion** (Premium Animations)
- Smooth animations
- Gesture support
- Transition controls
- Professional polish

### 5. **Lucide React** (500+ Icons)
- Consistent icon set
- Customizable size/color
- Professional appearance

---

## 🎨 Premium Color Palette

### Primary (Purple)
- **Default:** `#7c3aed`
- **Dark:** `#6d28d9`
- **Light:** `#a78bfa`
- **Gradients:** 50-900 color scale

### Secondary (Dark Gray)
- **Default:** `#1f2937`
- **Light:** `#374151`
- **Lighter:** `#4b5563`
- **Dark:** `#111827`

### Status Colors
- **Success:** `#10b981` (Green)
- **Warning:** `#f59e0b` (Amber)
- **Danger:** `#ef4444` (Red)
- **Accent:** `#06b6d4` (Cyan)

### Semantic Colors
- **Background:** `#111827`
- **Surface:** `#1f2937`
- **Border:** `#374151`
- **Muted:** `#6b7280`

---

## ✨ Premium Typography

### Fonts
- **Sans:** Inter (professional, readable)
- **Mono:** JetBrains Mono (code)
- **Display:** Space Grotesk (headers)

### Font Sizes
- **xs:** 0.75rem (12px)
- **sm:** 0.875rem (14px)
- **base:** 1rem (16px)
- **lg:** 1.125rem (18px)
- **xl:** 1.25rem (20px)
- **2xl:** 1.5rem (24px)
- **3xl:** 1.875rem (30px)
- **4xl:** 2.25rem (36px)
- **5xl:** 3rem (48px)

---

## 🎬 Premium Animations

### Built-in Animations
- `fade-in` - Smooth opacity transition
- `fade-out` - Reverse fade
- `slide-up` - Enters from bottom
- `slide-down` - Enters from top
- `slide-left` - Enters from right
- `slide-right` - Enters from left
- `scale-in` - Zoom in effect
- `bounce-slow` - Gentle bounce
- `pulse-slow` - Breathing effect
- `glow` - Glowing shadow

### Usage
```jsx
<div className="animate-fade-in">
  Fades in smoothly
</div>

<div className="animate-slide-up">
  Slides up from bottom
</div>
```

---

## 🌟 Premium Components

### Components Using Theme

#### Buttons
```jsx
<button className="btn-gradient">Primary</button>
<button className="btn-primary">Primary Action</button>
<button className="btn-secondary">Secondary Action</button>
<button className="btn-outline">Outline Button</button>
```

#### Cards
```jsx
<div className="card">Standard Card</div>
<div className="card-hover">Hover Card</div>
<div className="card-glass">Glassmorphic Card</div>
```

#### Forms
```jsx
<input className="input-field" />
<textarea className="textarea-field"></textarea>
<select className="select-field"></select>
```

#### Badges
```jsx
<span className="badge-primary">Primary</span>
<span className="badge-success">Success</span>
<span className="badge-warning">Warning</span>
<span className="badge-danger">Danger</span>
```

#### Effects
```jsx
<div className="glass-effect">Frosted glass</div>
<div className="glass-dark">Dark glass</div>
<div className="gradient-text">Gradient text</div>
<div className="shadow-primary">Primary shadow</div>
```

---

## 🎯 Premium Spacing System

- **1:** 0.25rem (4px)
- **2:** 0.5rem (8px)
- **3:** 0.75rem (12px)
- **4:** 1rem (16px)
- **5:** 1.25rem (20px)
- **6:** 1.5rem (24px)
- **8:** 2rem (32px)
- **10:** 2.5rem (40px)

**Usage:**
```jsx
<div className="p-4 m-6 gap-3">
  Padding, margin, gap using theme
</div>
```

---

## 🎨 Premium Border Radius

- **xs:** 0.25rem
- **sm:** 0.375rem
- **base:** 0.5rem
- **md:** 0.75rem
- **lg:** 1rem (commonly used)
- **xl:** 1.25rem
- **2xl:** 1.5rem
- **full:** 9999px (pills)

---

## 🌐 Premium Shadows

### Standard Shadows
- `shadow-sm` - Subtle
- `shadow-base` - Default
- `shadow-md` - Medium
- `shadow-lg` - Large
- `shadow-xl` - Extra large
- `shadow-2xl` - Huge

### Premium Shadows
- `shadow-primary` - Purple glow
- `shadow-primary-glow` - Bright purple
- `shadow-glass` - Glass effect

---

## 🎭 Premium Transitions

### Duration
- 75ms, 100ms, 150ms, 200ms
- 300ms (default), 500ms, 700ms
- 1000ms (slow)

### Usage
```jsx
<div className="transition-all duration-300">
  Smooth transition
</div>
```

---

## 🔥 Premium Utilities

### Text
- `.text-primary` - Primary color
- `.text-secondary` - Secondary color
- `.text-muted` - Muted text
- `.gradient-text` - Gradient effect

### Layout
- `.flex-center` - Center flex
- `.container-custom` - Responsive container
- `.grid-responsive` - Responsive grid

### Visibility
- `.visible-mobile` - Show on mobile
- `.hidden-mobile` - Hide on mobile

### Z-Index
- `.z-tooltip` - Tooltips (40)
- `.z-modal` - Modals (50)

---

## 🎨 Used Throughout App

### HomePage
✅ Gradient backgrounds
✅ Glass effect cards
✅ Hover animations
✅ Primary buttons
✅ Responsive grid

### CreatePartyPage
✅ Step indicators with animations
✅ Form inputs with theme styling
✅ Gradient buttons
✅ Card components
✅ Smooth transitions

### WatchPage
✅ Video player styling
✅ Chat interface
✅ Glass cards
✅ Badge status indicators
✅ Shadow effects

### JoinPartyPage
✅ Form styling
✅ Party preview cards
✅ Button gradients
✅ Input fields
✅ Animations

---

## 🚀 Theme Files

### Configuration Files
- `tailwind.config.ts` - Theme config (colors, animations, spacing)
- `src/index.css` - Global styles (components, utilities)
- `postcss.config.js` - PostCSS processing

### Usage in Components
```jsx
// Colors
className="text-primary bg-primary hover:bg-primary-dark"

// Spacing
className="p-6 m-4 gap-3"

// Animations
className="animate-fade-in"

// Components
className="card card-hover"
className="btn-gradient"
className="input-field"

// Glass effect
className="glass-effect rounded-xl"

// Responsive
className="px-4 sm:px-6 lg:px-8"
```

---

## 💎 Premium Features Used

✅ **50+ shadcn/ui Components**
✅ **Custom color palette**
✅ **Smooth animations**
✅ **Glassmorphic design**
✅ **Dark mode**
✅ **Responsive breakpoints**
✅ **Professional typography**
✅ **Icon library**
✅ **Premium effects**
✅ **Accessible components**

---

## 🎯 Summary

Your StreamHub app uses a **complete premium design system** with:
- Professional color palette
- Smooth animations
- Beautiful components
- Responsive design
- Accessible patterns
- Modern glassmorphic effects
- Enterprise-grade styling

**The theme is fully implemented and used throughout the entire app!** ✨

All components automatically use the premium theme colors, spacing, animations, and effects.
