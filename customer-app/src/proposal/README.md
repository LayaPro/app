# Proposal Module

A luxury wedding photography quotation proposal interface with premium animations and component-based architecture.

## Structure

```
src/proposal/
├── components/          # React components
│   ├── Proposal.tsx    # Main container component
│   ├── PageTransition.tsx  # Curtain transition animation
│   ├── ScrollProgress.tsx  # Film reel scroll progress indicator
│   ├── Hero.tsx        # Hero section with focus brackets
│   ├── FocusBrackets.tsx   # Focus bracket animation component
│   ├── About.tsx       # About section with portfolio grid
│   ├── Deliverables.tsx    # Package deliverables section
│   └── [component].css # Co-located component styles
└── styles/             # Global styles
    ├── variables.css   # Design tokens (colors, fonts)
    └── global.css      # Base styles and animations
```

## Features

### Animation Sequence
1. **Curtain Transition** (0-2s): Full-screen "LAYA PRODUCTIONS" logo reveal
2. **Ripple Effect** (2-3.2s): Hero ornament circle and focus brackets expand
3. **Content Reveal** (3-3.8s): Staggered entrance of hero content
4. **Continuous Effects**: Focus bracket pulse, recording dot blink

### Components

#### Proposal
Main container that:
- Manages scroll reveal animations with IntersectionObserver
- Imports all child components and global styles
- Provides the animated background

#### PageTransition
Curtain animation that plays on page load with logo reveal.

#### ScrollProgress
Film reel-style progress bar at the top that fills as you scroll.

#### Hero
- Focus brackets (top-left, bottom-right) with recording dot
- Ornament circle background with ripple animation
- Hero content: logo, title, customer name, divider

#### FocusBrackets
Corner brackets with pulse animation and recording indicator.

#### About
- Company description
- Portfolio grid (3 images) with hover effects and overlays

#### Deliverables
6-card grid showing package offerings with icons and hover effects.

## Design Tokens

### Colors
- **Background**: #FAF8F5 (primary), #F5F0E8, #EDE6DB (secondary/tertiary)
- **Gold**: #C9A961 (primary accent)
- **Rose**: #D4A373 (secondary accent)
- **Text**: #2C2416 (primary), #5C4A37 (secondary), #8B7355 (tertiary)

### Typography
- **Display**: Playfair Display (headings, elegant text)
- **Body**: Raleway (paragraphs, descriptions)
- **Cursive**: Dancing Script, Alex Brush (decorative elements)

## Usage

Import the Proposal component in your App:

```tsx
import { Proposal } from './proposal/components/Proposal';

function App() {
  return <Proposal />;
}
```

## Future Additions

This module is designed to be part of a larger application. When proposals are accepted, additional features can be added:
- Pricing and payment sections
- Event coverage tables
- Client customization options
- Signature and acceptance forms
- PDF export functionality

## Animation Timing

- Curtain: 2s duration
- Circle ripple: 1.2s starting at 2s
- Bracket ripple: 1.2s starting at 2s  
- Logo entrance: 1.2s starting at 3s
- Title entrance: 1.4s starting at 3.2s
- Couple name: 1.2s starting at 3.6s
- Divider: 1.5s starting at 3.8s
- Continuous pulse: 3-6s infinite

All animations use `cubic-bezier(0.16, 1, 0.3, 1)` easing for smooth, natural motion.
