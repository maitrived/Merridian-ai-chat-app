---
name: Studio Precision
colors:
  surface: '#fcf8fb'
  surface-dim: '#dcd9dc'
  surface-bright: '#fcf8fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7ea'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#414753'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#727784'
  outline-variant: '#c1c6d5'
  surface-tint: '#005cba'
  primary: '#004e9f'
  on-primary: '#ffffff'
  primary-container: '#0066cc'
  on-primary-container: '#dfe8ff'
  inverse-primary: '#aac7ff'
  secondary: '#5d5e60'
  on-secondary: '#ffffff'
  secondary-container: '#dfdfe1'
  on-secondary-container: '#616365'
  tertiary: '#4e5051'
  on-tertiary: '#ffffff'
  tertiary-container: '#676868'
  on-tertiary-container: '#e8e8e8'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d7e3ff'
  primary-fixed-dim: '#aac7ff'
  on-primary-fixed: '#001b3e'
  on-primary-fixed-variant: '#00458e'
  secondary-fixed: '#e2e2e4'
  secondary-fixed-dim: '#c6c6c8'
  on-secondary-fixed: '#1a1c1d'
  on-secondary-fixed-variant: '#454749'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#fcf8fb'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: '1.1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 40px
  xl: 64px
  container-max: 1200px
  gutter: 20px
---

## Brand & Style

This design system is built upon the principles of clarity, precision, and effortless sophistication. It targets a professional audience that values high-performance tools wrapped in an understated, premium aesthetic. The user experience is defined by an airy atmosphere, where every element has a functional purpose and "breathing room" is treated as a core design component.

The visual style is a hybrid of **Minimalism** and **Glassmorphism**. It utilizes a light, ethereal architecture where depth is communicated through translucent layers and subtle backdrop blurs rather than heavy shadows. The interface should feel like a physical object made of polished glass and aluminum—cool to the touch, precise in its construction, and incredibly responsive.

## Colors

The palette is strictly monochromatic with a singular functional accent. 

- **Primary (#0066CC):** Reserved exclusively for high-priority actions, active states, and links. It provides a sharp, professional contrast against the neutral base.
- **Secondary (#F5F5F7):** The "Off-White" used for subtle structural containment, such as message bubbles or background regions, providing a soft separation from the pure white base.
- **Neutral (#1D1D1F):** The ink color for all primary text and iconography, ensuring maximum legibility and a high-end editorial feel.
- **Translucency:** Use an alpha-adjusted version of #FFFFFF (at 80-90% opacity) with a 20px-40px backdrop blur to create the signature "Glassmorphism" effect for floating headers and sidebars.

## Typography

The system utilizes **Inter** to emulate the systematic and utilitarian nature of San Francisco. 

Typography is used to create a clear hierarchy through weight and scale rather than color. Large headlines use tighter letter spacing and semi-bold weights for a "Display" feel, while body copy maintains a generous line height (1.5) to ensure comfort during long reading sessions. Labels should be used sparingly for metadata (timestamps, status indicators) and may occasionally use uppercase styling to differentiate from interactive text.

## Layout & Spacing

This design system uses a **fixed-width centered grid** for desktop environments and a **fluid safe-area margin** for mobile. The spacing rhythm is strictly based on 4px or 8px increments.

- **The Chat Canvas:** Centered at a maximum width of 800px to maintain optimal line lengths for readability.
- **Margins:** A standard 40px (lg) margin is applied to the main container to provide the "airy" feel requested.
- **Dynamic Padding:** Message clusters use tight spacing (8px) between bubbles from the same sender, and larger spacing (24px) between different speakers to visually group the conversation.

## Elevation & Depth

Depth is achieved through **Backdrop Blurs** and **Tonal Layering** rather than traditional drop shadows.

1.  **Base Layer:** Solid #FFFFFF.
2.  **Middle Layer (Messages/Cards):** #F5F5F7 with no border, or a subtle 1px border of #E5E5E7.
3.  **Floating Layer (Navigation/Input):** Translucent White (#FFFFFF at 85%) with a `backdrop-filter: blur(30px)`. 
4.  **Shadows:** When necessary for floating modals, use a "San Francisco Shadow": an extremely diffused, low-opacity (10-15%) neutral shadow with 0px offset and a large blur radius (30px-50px).

## Shapes

The shape language is "Squircle-inspired," favoring smooth, continuous corner transitions. 

- **Standard Elements:** Buttons and small cards use a 0.5rem (8px) radius.
- **Large Elements:** Main chat containers or image attachments use a 1rem (16px) or 1.5rem (24px) radius to feel more approachable and modern.
- **Input Fields:** Search bars and chat inputs should use fully rounded (pill-shaped) ends to differentiate them from the structural content blocks.

## Components

- **Buttons:** Primary buttons use a solid #0066CC background with white text. Secondary buttons use #F5F5F7 with #1D1D1F text. All buttons have a subtle hover state: a slight opacity reduction (90%) rather than a color shift.
- **Chat Bubbles:** User messages are pure #0066CC (blue) with white text, or #1D1D1F (black) for a more neutral tone. AI responses use the #F5F5F7 (light grey) bubble with #1D1D1F text.
- **Input Fields:** The main chat input is a "floating pill" design. It features a translucent white background with a subtle light grey stroke. The "Send" icon is active only when text is present.
- **Chips/Filters:** Small, pill-shaped tags used for suggested prompts. They feature a white background with a 1px #E5E5E7 border and #1D1D1F text.
- **Progress Indicators:** Use thin, 2px horizontal indeterminate loaders or the classic subtle spinning "blades" for a high-end feel. Avoid heavy or chunky loading bars.
- **Cards:** Used for rich media or link previews, cards should have a 1px border and very soft internal padding (16px) to maintain the clean aesthetic.