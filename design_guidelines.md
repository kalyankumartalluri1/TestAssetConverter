# Design Guidelines: Test Asset Conversion Web Application

## Design Approach
**Selected System**: Linear + VS Code inspired design system - optimized for developer productivity tools with emphasis on clarity, information hierarchy, and functional efficiency.

**Design Principles**:
- Workflow-first: Every element supports the conversion pipeline
- Information density without clutter
- Clear visual hierarchy for multi-step processes
- Functional over decorative

## Typography System

**Font Families**:
- Primary: Inter (UI elements, labels, body text)
- Monospace: JetBrains Mono (code preview, file content, technical data)

**Hierarchy**:
- Page Title: text-2xl, font-semibold
- Section Headers: text-lg, font-medium
- Card Titles: text-base, font-medium
- Body/Labels: text-sm, font-normal
- Code/Technical: text-sm, font-mono
- Helper Text: text-xs, font-normal

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8 for consistent rhythm
- Component padding: p-6 or p-8
- Section gaps: gap-6 or gap-8
- Card spacing: p-4 or p-6
- Button padding: px-4 py-2 or px-6 py-3
- Input fields: px-4 py-2.5

**Container Structure**:
- Main container: max-w-7xl mx-auto px-6 py-8
- Full-width application canvas with sidebar + main area split (optional left nav for steps)
- Alternatively: Single column centered workflow with max-w-6xl

## Application Layout

**Primary Layout**: Vertical stepper/wizard workflow

**Header Section** (sticky):
- Application logo/title (left)
- Status indicator showing current step (center)
- Settings/help icon (right)
- Border bottom separator

**Main Workflow Area** (5-step vertical progression):

1. **Step 1 - Configuration Card**:
   - AI Provider selection (radio buttons: OpenAI / Perplexity)
   - API Key input field with show/hide toggle, validation indicator
   - Agent/Mode dropdown selector
   - Compact, single card layout

2. **Step 2 - File Upload Zone**:
   - Large drag-and-drop area with dashed border
   - Upload icon, instructional text, file type indicators (.xlsx, .xls)
   - File size limit display
   - Browse button as alternative upload method

3. **Step 3 - Input Preview Panel**:
   - Data table with fixed header, scrollable body
   - Columns: Test ID | Test Name | Steps | Expected Results
   - Row hover states for readability
   - Compact row height for data density
   - Show item count and summary stats above table

4. **Step 4 - Conversion Processing**:
   - Progress indicator with percentage
   - Status messages (processing, analyzing, converting)
   - Animated loader element
   - Processing time estimate

5. **Step 5 - Output Preview & Download**:
   - Split view: File tree (left, 30%) | Code preview (right, 70%)
   - Syntax-highlighted code display using monospace font
   - Line numbers in preview
   - Download ZIP button (prominent, primary action)
   - Re-convert button (secondary action)

## Component Library

**Buttons**:
- Primary: Solid style, medium size (px-6 py-3)
- Secondary: Outline style with border
- Icon buttons: Square, p-2
- All buttons include hover and active states

**Form Inputs**:
- Text inputs: Full-width within container, rounded corners, border treatment
- Dropdowns: Custom styled select with chevron icon
- Radio buttons: Larger touch targets with label spacing
- Validation states: Success/error indicators with helper text

**Cards**:
- Rounded corners (rounded-lg)
- Subtle border treatment
- Padding: p-6
- Elevation through border, not shadow

**Tables**:
- Bordered style with row separators
- Fixed header with slightly elevated treatment
- Alternating row backgrounds for readability
- Compact cell padding (px-4 py-2)

**Progress Indicators**:
- Linear progress bar for conversion
- Spinner for loading states
- Step indicators showing completed/current/upcoming

**Code Preview**:
- Monospace font throughout
- Line numbers in gutter
- Scrollable container with max height
- Copy-to-clipboard button in top-right corner

## Interaction Patterns

**File Upload**:
- Drag-over state changes border style
- File validation with immediate feedback
- Uploaded file shows name, size, remove option

**Form Validation**:
- Inline validation on blur
- Clear error messaging below fields
- Disabled state for submit until valid

**Step Progression**:
- Auto-advance on completion OR manual "Continue" buttons
- Visual indication of completed steps
- Ability to go back to previous steps

**Preview Interactions**:
- Table sorting on column headers
- Horizontal scroll for wide tables
- Code preview with full-screen expansion option

## Spacing & Rhythm

**Vertical Flow**:
- Section spacing: space-y-8 between major sections
- Card spacing: space-y-6 within sections
- Form fields: space-y-4
- Tight groupings: space-y-2

**Page Margins**:
- Desktop: px-8 py-8
- Tablet/Mobile: px-6 py-6

## Responsive Behavior

- Desktop (primary): Full multi-column layouts, side-by-side previews
- Tablet: Single column, stack preview panels vertically
- Mobile: Stack all elements, collapsible sections for preview data

## Accessibility

- All form inputs have associated labels
- Keyboard navigation for entire workflow
- Focus indicators on all interactive elements
- ARIA labels for icon-only buttons
- Screen reader announcements for status changes

## Images

No hero images or marketing visuals needed. This is a pure productivity application focused on data and workflow.

**Icon Usage**: 
- Upload icon for file drop zone
- Provider logos (OpenAI/Perplexity) next to radio selections
- Status icons (checkmark, error, processing spinner)
- File type icons in file tree preview
- Use Heroicons for all UI icons via CDN