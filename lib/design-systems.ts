// export const DESIGN_SYSTEMS={
//  servicenow:{
//   label:'ServiceNow Horizon',
//   guidance:'Use a practical enterprise workspace: restrained neutrals, clear information hierarchy, compact but readable data tables, purposeful color for status and actions, and obvious navigation.'
//  },
//  servicenow_lit:{
//   label:'ServiceNow Lit (AIUX)',
//   guidance:'Prototype an Employee Slate AIUX widget with Horizon-aligned design tokens and Lit-style web component structure. Use compact enterprise layouts, accessible controls, clear status and action hierarchy, and realistic sample data. Keep the preview self-contained; it is a visual prototype, not a deployable ServiceNow widget.'
//  },
//  material:{
//   label:'Material Design 3',
//   guidance:'Use Material 3 visual patterns: tonal color surfaces, clear type scale, adaptive layout, rounded containers and controls, visible interaction states, and strong accessibility contrast.'
//  },
//  shadcn:{
//   label:'shadcn/ui',
//   guidance:'Use a shadcn/ui-inspired look: semantic foreground and background colors, clean borders, restrained radii, crisp cards and dialogs, clear focus rings, and balanced spacing.'
//  },
//  apple:{
//   label:'Apple Human Interface',
//   guidance:'Use an Apple-inspired interface: generous space, legible system typography, clear content versus controls, subtle separators and materials, familiar toolbar patterns, and responsive layouts.'
//  },
//  neutral:{
//   label:'Modern neutral',
//   guidance:'Use a polished neutral style with clear hierarchy, accessible contrast, restrained colors, responsive layout, and practical interactions.'
//  },
// } as const;

export const DESIGN_SYSTEMS = {
  servicenow: {
    label: 'ServiceNow Horizon',
    guidance: `
Use a ServiceNow Horizon-inspired enterprise workspace.

Layout:
- Prefer structured workspace layouts with clear page regions.
- Use compact information density without feeling cramped.
- Favor tables, lists, side panels, tabs, and contextual actions for enterprise workflows.
- Keep navigation obvious and persistent.

Components:
- Use enterprise-style buttons, inputs, status badges, cards, tables, tabs, and drawers.
- Prefer inline status and contextual actions over decorative UI.

Visual language:
- Restrained neutral surfaces.
- Purposeful accent colors for actions, status, and exceptions.
- Subtle borders and elevation.
- Moderate corner radius; avoid overly playful styling.

Interaction:
- Make primary, secondary, and destructive actions visually distinct.
- Show loading, empty, success, warning, and error states when relevant.
- Prioritize scanability and task completion.

Accessibility:
- Maintain strong contrast, visible focus states, readable type, and clear labels.

Do not invent proprietary ServiceNow components or exact internal tokens unless they are explicitly provided.
`
  },

  servicenow_lit: {
    label: 'ServiceNow Lit (AIUX)',
    guidance: `
Prototype an Employee Slate / AIUX-style ServiceNow experience.

Structure:
- Think in reusable Lit-style web components.
- Use a compact enterprise workspace rather than a consumer landing page.
- Organize content into clearly defined component regions.

UI patterns:
- Horizon-aligned cards, form controls, status indicators, lists, tables, tabs, and contextual actions.
- Prefer workflow-oriented layouts and realistic enterprise data.
- Use clear status hierarchy and action hierarchy.

AIUX behavior:
- Make AI assistance contextual rather than decorative.
- Surface recommendations, summaries, next actions, or generated insights near the workflow they support.
- Clearly distinguish AI-generated content from system-of-record data.

Visual language:
- Restrained neutrals with purposeful accent colors.
- Compact spacing, readable typography, accessible controls.
- Avoid excessive gradients, oversized hero sections, or consumer-SaaS styling.

Output:
- Produce a self-contained visual prototype.
- Follow Lit-style component decomposition when generating code.
- Do not claim the output is a production-deployable ServiceNow widget unless platform-specific APIs and components are actually available.
`
  },

  material: {
    label: 'Material Design 3',
    guidance: `
Use Material Design 3 principles.

Layout:
- Adaptive responsive layout with clear grouping and hierarchy.
- Use Material spacing and container patterns.

Components:
- Filled/outlined text fields, Material buttons, cards, navigation, dialogs, chips, lists, and data components where appropriate.

Visual language:
- Tonal surfaces and color roles.
- Rounded containers and controls.
- Clear typography scale.
- Strong state differentiation.

Interaction:
- Visible hover, focus, pressed, disabled, loading, success, and error states.
- Use familiar Material interaction patterns.

Accessibility:
- Strong contrast, touch-friendly targets, semantic hierarchy, and keyboard-friendly controls.
`
  },

  shadcn: {
    label: 'shadcn/ui',
    guidance: `
Use a shadcn/ui-inspired application style.

Layout:
- Clean application layouts with strong spacing discipline.
- Prefer cards, tables, dialogs, sheets, dropdowns, and command-style interactions.

Visual language:
- Semantic foreground/background colors.
- Thin borders and subtle shadows.
- Restrained corner radii.
- Minimal visual decoration.
- Crisp typography and generous whitespace.

Components:
- Use familiar shadcn-style patterns for buttons, inputs, cards, dialogs, tabs, tables, badges, and dropdown menus.

Interaction:
- Clear focus rings and keyboard-friendly controls.
- Keep states subtle but obvious.
`
  },

  apple: {
    label: 'Apple Human Interface',
    guidance: `
Use Apple Human Interface principles.

Layout:
- Content-first hierarchy with generous whitespace.
- Prefer simple navigation and progressive disclosure.
- Avoid excessive UI chrome.

Visual language:
- Legible system-style typography.
- Subtle separators, materials, translucency, and depth.
- Refined spacing and restrained color usage.

Components:
- Familiar toolbar, sidebar, sheet, list, form, segmented-control, and navigation patterns.
- Controls should feel lightweight and direct.

Interaction:
- Prioritize clarity, immediacy, feedback, and smooth state transitions.
- Keep destructive and irreversible actions explicit.
`
  },

  neutral: {
    label: 'Modern neutral',
    guidance: `
Use a polished contemporary application style.

Layout:
- Clear information hierarchy and responsive structure.
- Balanced density and whitespace.

Visual language:
- Neutral surfaces, subtle borders, restrained color palette.
- Moderate radii and minimal shadows.
- Avoid strong stylistic signatures from any specific design system.

Interaction:
- Clear primary and secondary actions.
- Accessible form controls.
- Visible loading, success, warning, empty, and error states.

Prioritize usability and practical application design over decoration.
`
  }
} as const;

export type DesignSystemId=keyof typeof DESIGN_SYSTEMS;

export function isDesignSystemId(value:unknown):value is DesignSystemId {
 return typeof value==='string'&&Object.prototype.hasOwnProperty.call(DESIGN_SYSTEMS,value);
}
