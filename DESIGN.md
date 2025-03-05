# Ethereum Gas Tracker Design Document

## Design Philosophy
The application follows a modern, sophisticated design language that combines minimalism with futuristic elements:
- Glass morphism effects for depth and modern feel
- Strategic neon accents for emphasis and visual hierarchy
- Dark theme base for reduced eye strain
- Responsive and fluid animations

## Color Palette

### Base Colors
- Background: `rgba(0, 0, 0, 0.95)` (Near Black)
- Glass Effect Base: `rgba(255, 255, 255, 0.1)` (Translucent White)
- Glass Border: `rgba(255, 255, 255, 0.2)` (Subtle White Border)
- Text Primary: `#FFFFFF` (Pure White)
- Text Secondary: `rgba(255, 255, 255, 0.7)` (Soft White)

### Neon Accents
- Primary Neon: `#00fff2` (Cyan)
- Secondary Neon: `#ff00ea` (Magenta)
- Highlight Neon: `#7000ff` (Purple)

### Status Colors
- Low Gas: `#4dff91` (Neon Green)
- Average Gas: `#fff94d` (Neon Yellow)
- High Gas: `#ff4d4d` (Neon Red)

## Typography
- Headers: 'Space Grotesk', sans-serif
- Body: 'Inter', sans-serif
- Monospace: 'JetBrains Mono', monospace

## Components

### Container Styling
```css
.glass-container {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

### Card Effects
- Hover transitions with subtle scaling
- Neon glow effects on interaction
- Smooth backdrop-filter transitions

### Interactive Elements
- Buttons with neon borders
- Pulsing effects for important data
- Gradient transitions on hover

## Layout Structure
- Fluid grid system
- Responsive breakpoints at 480px, 768px, 1024px, and 1440px
- Generous whitespace for readability
- Strategic use of glass containers for content grouping

## Animation Guidelines
- Transition duration: 0.3s for UI elements
- Easing: cubic-bezier(0.4, 0, 0.2, 1)
- Subtle hover animations
- Loading states with pulsing neon effects

## Accessibility
- Maintain WCAG 2.1 AA standards
- High contrast between text and backgrounds
- Clear visual hierarchy
- Readable font sizes (minimum 14px)

## Responsive Design
- Mobile-first approach
- Fluid typography scaling
- Adaptive layouts for different screen sizes
- Touch-friendly interaction areas
