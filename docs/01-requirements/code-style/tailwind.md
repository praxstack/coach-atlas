# Tailwind CSS Style Guide - Coach Atlas

## Overview

This guide defines Tailwind CSS conventions for Coach Atlas. We use **Tailwind CSS 3.4** with **shadcn/ui** components and custom design tokens.

---

## Configuration

### tailwind.config.ts
```typescript
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Design tokens
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        // ... other semantic colors
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
```

---

## Class Organization

### Recommended Order
Organize classes in this order for consistency:

```tsx
<div
  className={cn(
    // 1. Layout (position, display, flex/grid)
    "relative flex flex-col",
    // 2. Sizing (width, height, padding, margin)
    "w-full h-screen p-4 m-2",
    // 3. Visual (background, border, shadow)
    "bg-gray-900 border border-gray-700 rounded-lg shadow-md",
    // 4. Typography (font, text, color)
    "font-medium text-sm text-white",
    // 5. Interactive (hover, focus, cursor)
    "hover:bg-gray-800 focus:ring-2 cursor-pointer",
    // 6. Transitions/Animations
    "transition-colors duration-200",
    // 7. Responsive variants
    "md:flex-row lg:p-6",
    // 8. Conditional/dynamic classes
    isActive && "bg-blue-600",
  )}
>
```

---

## The `cn()` Utility

### Always Use for Dynamic Classes
```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Usage Patterns
```tsx
// ✅ Good - Use cn() for conditional classes
<button
  className={cn(
    "px-4 py-2 rounded-md",
    variant === "primary" && "bg-blue-600 text-white",
    variant === "secondary" && "bg-gray-600 text-white",
    disabled && "opacity-50 cursor-not-allowed"
  )}
>

// ✅ Good - Merge with passed className
interface ButtonProps {
  className?: string;
}

function Button({ className }: ButtonProps) {
  return (
    <button className={cn("px-4 py-2 bg-blue-600", className)}>
      Click me
    </button>
  );
}

// ❌ Avoid - String concatenation
<button className={`px-4 py-2 ${isActive ? 'bg-blue-600' : 'bg-gray-600'}`}>

// ❌ Avoid - Multiple className attributes
<button className="px-4" className={isActive ? "bg-blue-600" : ""}>
```

---

## Color Conventions

### Use Semantic Colors
```tsx
// ✅ Good - Semantic color tokens
<div className="bg-background text-foreground">
<div className="bg-primary text-primary-foreground">
<div className="border-border">
<div className="text-muted-foreground">

// ❌ Avoid - Hard-coded colors (breaks theming)
<div className="bg-slate-900 text-white">
```

### Project Color Palette
```
Background: bg-gray-950, bg-gray-900, bg-gray-800
Text:       text-gray-50, text-gray-400, text-gray-500
Accent:     bg-blue-600 (user), bg-green-600 (AI)
Status:     text-green-500 (success), text-red-500 (error)
```

---

## Spacing Conventions

### Consistent Scale
```
Tight:   gap-1, p-1, m-1  (4px)
Small:   gap-2, p-2, m-2  (8px)
Default: gap-4, p-4, m-4  (16px) ← Most common
Medium:  gap-6, p-6, m-6  (24px)
Large:   gap-8, p-8, m-8  (32px)
```

### Container Patterns
```tsx
// Page container
<div className="min-h-screen bg-gray-950 p-6">

// Card container
<div className="bg-gray-900 border border-gray-700 rounded-lg p-4">

// Section spacing
<section className="space-y-6">
```

---

## Typography

### Font Sizes
```tsx
// Headings
<h1 className="text-2xl font-bold">Page Title</h1>
<h2 className="text-xl font-semibold">Section</h2>
<h3 className="text-lg font-medium">Subsection</h3>

// Body
<p className="text-base text-gray-100">Normal text</p>
<p className="text-sm text-gray-400">Secondary text</p>
<span className="text-xs text-gray-500">Muted text</span>
```

### Prose Content (Markdown)
```tsx
// Use @tailwindcss/typography for rich content
<div className="prose prose-invert prose-sm max-w-none">
  <MarkdownRenderer content={content} />
</div>
```

---

## Component Patterns

### Button Variants
```tsx
// Primary
<button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">

// Secondary
<button className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">

// Ghost
<button className="hover:bg-gray-800 text-gray-300 px-4 py-2 rounded-lg">

// Destructive
<button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
```

### Input Fields
```tsx
<input
  className={cn(
    "w-full px-4 py-3 rounded-xl",
    "bg-gray-800 border border-gray-700",
    "text-sm text-white placeholder-gray-500",
    "focus:outline-none focus:ring-2 focus:ring-blue-500",
    "disabled:opacity-50 disabled:cursor-not-allowed"
  )}
/>
```

### Cards
```tsx
<div className="bg-gray-900 border border-gray-700 rounded-lg p-4 shadow-lg">
  <h3 className="text-lg font-semibold text-white mb-2">Title</h3>
  <p className="text-sm text-gray-400">Content</p>
</div>
```

### Chat Bubbles
```tsx
// User message
<div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-3">

// AI message
<div className="bg-gray-800 text-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
```

---

## Responsive Design

### Breakpoint Usage
```tsx
// Mobile-first approach
<div className="flex flex-col md:flex-row">
<div className="p-4 md:p-6 lg:p-8">
<div className="text-sm md:text-base">
<div className="hidden md:block">
<div className="md:hidden">
```

### Breakpoint Reference
```
sm:  640px   (Small tablets)
md:  768px   (Tablets)
lg:  1024px  (Laptops)
xl:  1280px  (Desktops)
2xl: 1536px  (Large screens)
```

### Common Responsive Patterns
```tsx
// Stack on mobile, row on desktop
<div className="flex flex-col md:flex-row gap-4">

// Full width on mobile, constrained on desktop
<div className="w-full max-w-md mx-auto">

// Hide sidebar on mobile
<aside className="hidden lg:block w-64">

// Different spacing
<div className="p-4 md:p-6 lg:p-8">
```

---

## Flexbox & Grid

### Flexbox Patterns
```tsx
// Center content
<div className="flex items-center justify-center">

// Space between
<div className="flex items-center justify-between">

// Vertical stack with gap
<div className="flex flex-col gap-4">

// Horizontal with wrap
<div className="flex flex-wrap gap-2">
```

### Grid Patterns
```tsx
// Auto-fit grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Sidebar layout
<div className="grid grid-cols-[256px_1fr]">

// Equal columns
<div className="grid grid-cols-2 gap-4">
```

---

## Hover & Focus States

### Interactive Elements
```tsx
// ✅ Good - Consistent hover/focus
<button
  className={cn(
    "px-4 py-2 rounded-lg",
    "bg-blue-600 text-white",
    "hover:bg-blue-700",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
    "active:scale-95",
    "transition-all duration-150"
  )}
>

// ✅ Good - Focus-visible for keyboard users
<button className="focus-visible:ring-2 focus-visible:ring-blue-500">
```

### Group Hover
```tsx
// Parent triggers child style
<div className="group hover:bg-gray-800 p-4 rounded-lg">
  <h3 className="group-hover:text-blue-400">Title</h3>
  <p className="opacity-50 group-hover:opacity-100">Description</p>
</div>
```

---

## Animations

### Transitions
```tsx
// ✅ Good - Smooth transitions
<div className="transition-colors duration-200 ease-out">
<div className="transition-transform duration-150">
<div className="transition-opacity duration-300">
<div className="transition-all duration-200">
```

### Tailwind Animate Plugin
```tsx
// Fade in
<div className="animate-in fade-in duration-300">

// Slide in
<div className="animate-in slide-in-from-bottom-2 duration-200">

// Spin (loading)
<Loader2 className="animate-spin" />
```

### Avoid Excessive Animation
```tsx
// ❌ Avoid - Too many animations
<div className="animate-bounce hover:animate-pulse transition-all">

// ✅ Good - Purposeful, subtle
<div className="transition-colors duration-150">
```

---

## Dark Mode

### Class-Based Dark Mode
```tsx
// Configuration
darkMode: ["class"]

// Usage - we default to dark, so invert logic if adding light mode
<div className="bg-white dark:bg-gray-900">
<p className="text-gray-900 dark:text-gray-100">
```

### Current Approach
Coach Atlas uses dark mode by default. No light mode toggle currently exists.

```tsx
// ✅ Current - Dark mode styles directly
<div className="bg-gray-900 text-gray-100">

// 🔮 Future - If adding light mode
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
```

---

## Accessibility

### Color Contrast
```tsx
// ✅ Good - Sufficient contrast
<p className="text-gray-100 bg-gray-900">   // High contrast
<p className="text-gray-400 bg-gray-900">   // Acceptable for secondary

// ❌ Avoid - Low contrast
<p className="text-gray-600 bg-gray-800">   // Hard to read
```

### Focus Indicators
```tsx
// ✅ Good - Visible focus
<button className="focus:ring-2 focus:ring-blue-500 focus:outline-none">

// ❌ Avoid - Removing focus outline without replacement
<button className="outline-none">
```

---

## Anti-Patterns

```tsx
// ❌ Inline styles
<div style={{ backgroundColor: '#1a1a1a' }}>

// ❌ Duplicate utilities
<div className="p-4 px-4 py-4">  // p-4 already sets both

// ❌ Conflicting utilities
<div className="flex block">    // Can't be both

// ❌ Very long className strings without cn()
<div className="relative flex flex-col items-center justify-center w-full h-screen p-4 bg-gray-900 border border-gray-700 rounded-lg shadow-lg text-white hover:bg-gray-800">

// ✅ Better - Use cn() and break into logical groups
<div
  className={cn(
    "relative flex flex-col items-center justify-center",
    "w-full h-screen p-4",
    "bg-gray-900 border border-gray-700 rounded-lg shadow-lg",
    "text-white hover:bg-gray-800"
  )}
>
```

---

## Customization

### Extending Theme
```typescript
// tailwind.config.ts
theme: {
  extend: {
    // Custom spacing
    spacing: {
      '18': '4.5rem',
    },
    // Custom colors
    colors: {
      brand: {
        50: '#eff6ff',
        500: '#3b82f6',
        900: '#1e3a8a',
      },
    },
    // Custom animations
    animation: {
      'fade-in': 'fadeIn 0.3s ease-out',
    },
    keyframes: {
      fadeIn: {
        from: { opacity: '0' },
        to: { opacity: '1' },
      },
    },
  },
},
```

### Custom Utilities (Rare)
```css
/* src/app/index.css */
@layer utilities {
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

---

## Performance

### Purging Unused CSS
Vite + Tailwind automatically purges unused classes in production. Ensure:
- All template files are in `content` array
- Don't construct class names dynamically from variables

```tsx
// ❌ Won't be purged correctly
const color = "blue";
<div className={`bg-${color}-500`}>

// ✅ Purges correctly
<div className={cn(
  color === "blue" && "bg-blue-500",
  color === "red" && "bg-red-500"
)}>
```

### Avoid Arbitrary Values in Production
```tsx
// ⚠️ Use sparingly - adds to CSS bundle
<div className="w-[347px] h-[89px]">

// ✅ Prefer standard utilities
<div className="w-80 h-24">
