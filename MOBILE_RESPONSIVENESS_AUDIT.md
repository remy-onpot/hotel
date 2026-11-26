# Mobile Responsiveness and Usability Audit

## Scope and method

This is a source-level audit of the current Next.js App Router application. It reviews the shared shell, room discovery, room details, booking and checkout, account, contact, and admin room image management. It uses the checked-in JSX and CSS; it does not claim device/browser testing or measure rendered overflow. Findings below should be confirmed against real devices during implementation.

The app already has some responsive foundations: fluid containers, wrapping room cards, single-column checkout below desktop breakpoints, and a one-column admin upload form below 650px. The main gap is that responsive CSS is applied locally without a consistent mobile booking journey or accessibility behavior.

## Executive assessment

**Current mobile readiness: needs focused improvement before a booking-focused launch.** The most important concern is that the homepage booking form is hidden below 820px. Mobile visitors must find a separate CTA or navigate to room search, interrupting the primary conversion task. On the rooms page, a 280px minimum-width filter control is placed in a layout with 20px side gutters, creating likely horizontal overflow on narrow phones. The mobile navigation opens visually but lacks accessible state and expected keyboard dismissal behavior. Room details and checkout need a clearer, persistent booking summary/action at small widths.

### Priority summary

| Priority | Area | Main user impact |
| --- | --- | --- |
| P0 | Homepage booking entry | The primary availability form is hidden on screens below 820px. |
| P1 | Room search filters | Fixed minimum filter width can exceed the available content width on 320–375px screens. |
| P1 | Mobile navigation | Toggle has no accessible name/state; menu has no Escape handling or explicit focus behavior. |
| P1 | Room detail booking | Booking action is not persistent while reviewing room details; booking form has generous mobile padding. |
| P1 | Account navigation | Labels disappear below 714px, leaving icon-only controls without accessible names in the markup. |
| P2 | Room details / data tables | Facilities table uses wide cell padding and no small-screen adaptation. |
| P2 | Shared interaction quality | Touch target, focus, error, and reduced-motion behavior are inconsistent or absent. |

## Detailed findings

### 1. Homepage booking entry disappears on mobile — P0

`app/styles.css` sets `.bookingFormContainer { display: none; }` and only displays it at `min-width: 820px`. The hero separately shows `.heroCTA` below 820px, but the source should be checked to confirm that this CTA opens or scrolls to a usable booking form on phones. If the form is only available in the hidden container, mobile guests cannot start a booking from the hero. The global `.bookingForm` has large 48px/24px padding and dark overlay styling designed for the desktop hero, so simply un-hiding it risks crowding the small viewport.

**Upgrade:** provide a compact inline mobile search panel or a clearly labeled, accessible disclosure/sheet that includes arrival, departure, guest count (if supported), and a full-width search action. Keep the chosen dates visible when the guest proceeds to results. Avoid making the CTA open a form that is clipped by the hero or obscured by the keyboard.

**Acceptance:** at 320, 375, and 430 CSS px, a first-time visitor can discover and submit dates from the homepage without horizontal scrolling or needing to infer where to go next.

### 2. Room search filters risk horizontal overflow and are cumbersome — P1

`app/rooms/_components/FilterSection/styles.module.css` gives `.formControl` a `min-width: 280px` and `width: 100%`; `.datesContainer` wraps, but each DatePicker inherits its input sizing and the button sits alongside them. With `.roomsHolder` using 20px padding, the available width is only 280px on a 320px viewport, leaving no room for gaps or borders. The label `Filter By Date` is not programmatically associated with either date input, and `Sort Rooms` uses an empty `htmlFor`. The date controls and sort state also have no visible applied-filter summary or explicit clear action.

**Upgrade:** set mobile controls to `min-width: 0; width: 100%; min-width: 0` within a grid/flex column; provide accessible labels per arrival/departure field; allow the sort select to fill the row; keep the main search action full width. Add a clear/reset path and make the selected dates visible after search. Check the React Select menu’s placement and keyboard behavior on narrow screens.

**Acceptance:** at 320px, no document-level horizontal scroll; date controls, sort menu and search button are individually usable by touch and keyboard; labels announce purpose without relying on placeholders.

### 3. Mobile navigation needs semantic and keyboard behavior — P1

`app/_ui/Navbar.jsx` renders a button with only an icon and no `aria-label`, `aria-expanded`, or `aria-controls`. In `app/styles.css`, the open menu is absolutely positioned at `top: 64px` and `width: 100dvw`; it has no documented viewport-height/scroll handling. The component does not close on Escape or move/restore focus. On narrow screens the menu can cover content without a clear modal/disclosure model. Global list styling forces every `ul` and `li` to `inline-block`, then the nav overrides only some properties.

**Upgrade:** use a named button with state attributes and a stable menu id; use a semantic disclosure pattern, with Escape dismissal and predictable focus return. Ensure the menu itself can scroll within the available viewport, respects safe areas, and is layered below dialogs. Close on route change and ensure all account dropdown items remain reachable. Preserve a visible focus indicator.

**Acceptance:** VoiceOver/TalkBack announce the control and expanded state; keyboard users can open, traverse, dismiss and return focus; menu content remains usable in portrait landscape and when the software keyboard is open.

### 4. Room detail booking needs a persistent mobile path — P1

`app/rooms/[room_slug]/_components/RoomBookingForm/styles.module.css` places the room form controls in one column below 1000px, which is a sound base. However, the call-to-action has `padding: 40px`, and there is no sticky small-screen booking action visible while the guest reviews gallery, facilities, and policy content. Its date input picker indicator is stretched over the input, which should be checked on iOS/Android for touch behavior. `app/rooms/[room_slug]/_components/Facilities/styles.module.css` uses 32px horizontal cell padding; on narrow screens this consumes significant space.

**Upgrade:** reduce control/button vertical padding to a comfortable, consistent minimum height (at least 44 CSS px) and create a mobile bottom booking bar or compact sticky summary after the booking form scrolls away. Include price basis and selected dates if those are known, account for safe-area inset, and ensure it does not cover page content or focused controls. Adapt facility rows into stacked label/value cards or reduce cell padding at a small breakpoint.

**Acceptance:** after scrolling past the first screen, the guest can still identify the price and continue booking; the sticky action does not overlap content, browser controls, or the on-screen keyboard.

### 5. Account navigation loses its labels on phone widths — P1

`app/account/styles.module.css` uses a horizontal icon row below 780px, and hides `.sidebarLink span:last-child` until 714px. At common phone widths users therefore see only icons. The JSX in `app/account/layout.jsx` has no `aria-label` on these links/buttons, so the action names may not be announced to screen readers either. The flex row can also become crowded as labels become visible from 714px up to the desktop layout breakpoint at 780px.

**Upgrade:** retain visible concise labels on mobile (use a compact labeled tab row or stacked navigation), set accessible names for icon-only controls if icon-only is intentionally retained, and mark the current destination with `aria-current="page"`. Define breakpoint behavior as one coherent transition instead of changing label visibility at 714px and orientation at 780px.

**Acceptance:** History, Profile and Sign out are identifiable visually and by assistive technology at 320–430px, and remain easy to tap without accidental neighboring actions.

### 6. Interactive target and focus treatment is inconsistent — P2

Several controls have small padding or no explicit minimum dimensions. The navbar icon is 36px, while global button styles vary by component. Global `outline: none` is applied to multiple input/button styles (`FilterSection`, booking form and navbar); some inputs replace it without a strong consistent focus-visible treatment. Hover styles exist but are not paired consistently with keyboard focus. There is no global reduced-motion rule despite transitions on navigation, cards, buttons and the slider.

**Upgrade:** define shared focus-visible styles and minimum touch target guidance, test button and link bounds, and honor `prefers-reduced-motion` for nonessential transitions/slider changes. Avoid removing outlines unless an equally visible replacement is present. Check text zoom and contrast at 200% zoom.

### 7. Checkout responsiveness is structurally reasonable but needs end-to-end validation — P2

`app/reservations/checkout/_components/CheckoutSection/styles.module.css` stacks content below 892px using `flex-direction: column-reverse`, then changes to a two-column grid above that threshold. The fields use 17px text and 16px padding, which is a reasonable touch-oriented starting point. The reversed mobile visual order may put the booking summary before or after the form depending on DOM order, so confirm that progress, price, guest fields and submit action follow a sensible reading and focus order. The 892px breakpoint is not shared with other layout thresholds.

**Upgrade:** review the rendered order against DOM/focus order, preserve a visible total and payment/cancellation explanation near the final action, prevent the keyboard from hiding validation errors, and test Stripe’s payment element at narrow viewport widths and text zoom. Keep error messages associated with their fields.

### 8. Admin image manager is a positive responsive example, with touch refinements — P3

`app/admin/rooms/styles.module.css` changes `.uploadForm` from two columns to one below 650px and uses fluid controls with 46px minimum height. This is a good baseline. Verify long room names and multiple images do not create dense or awkward cards on phones, and ensure upload progress/errors remain visible while the page scrolls.

## Upgrade path

### Phase 1 — Remove mobile conversion blockers

1. Implement a mobile-first homepage availability entry point that exposes the full search flow below 820px.
2. Fix room filter sizing and date/sort labeling; validate at 320px before polishing larger breakpoints.
3. Make room detail booking actionable throughout the page with a safe-area-aware sticky CTA and compact booking controls.
4. Keep account navigation labels visible and identify the current page.

**Exit criteria:** core path `home → search → room detail → checkout` is possible on narrow phones without horizontal scrolling or losing booking context.

### Phase 2 — Make shared controls accessible and predictable

1. Add accessible name/state, keyboard dismissal and focus behavior to the mobile navigation and guest dropdown.
2. Standardize focus-visible styling, touch target dimensions, form labels, validation announcements and error associations.
3. Add reduced-motion behavior and verify text zoom, contrast and screen-reader landmarks.

**Exit criteria:** navigation and booking can be completed with touch, keyboard and a screen reader; focus remains visible and logical.

### Phase 3 — Refine content-heavy and transactional views

1. Adapt room facilities to narrow widths and verify the gallery’s image crop and swipe affordances.
2. Validate checkout visual order, summary visibility, Stripe form sizing, error states and keyboard behavior.
3. Review reservation history cards, edit/cancel dialogs, profile forms, sign-in/up and contact form at phone and tablet widths.
4. Check admin upload grids and progress feedback on touch devices.

**Exit criteria:** all high-use screens have a deliberate small-screen layout and preserve the information needed to decide or complete an action.

### Phase 4 — Verify real devices and prevent regressions

Use browser/device emulation and physical iOS/Android devices. Cover at least 320×568, 360×800, 390×844, 430×932, 768px tablet, and desktop. Test portrait and landscape, 200% text zoom, keyboard open, long translated/content strings (if localization is introduced), empty states, date validation, signed-in and signed-out navigation, slow image loading and checkout failure. Record screenshots and defects per route. Add automated viewport checks only after deciding the project’s browser-test tooling; none is currently declared in `package.json`.

**Exit criteria:** no unintended page-level horizontal overflow; primary controls remain visible and operable; booking state and feedback remain clear across tested viewport and interaction states.

## Route-by-route validation matrix

| Route/surface | Mobile checks |
| --- | --- |
| Home | Search is available without scrolling through unrelated content; hero copy/CTA fits over images; no clipped overlay or hidden form. |
| `/rooms` | Filters wrap within content width; sort and both dates are labeled; cards and prices are scannable; empty state offers recovery. |
| `/rooms/[room_slug]` | Gallery usable; facilities/policies readable; price and booking action persist; no CTA overlap with safe area. |
| Checkout | DOM and visual order agree; total/terms remain visible; fields and payment element fit; errors remain in view above keyboard. |
| Account/history/profile | Navigation labels and current state visible; cards and actions do not crowd; edit/cancel dialogs fit and dismiss. |
| Sign-in/sign-up/contact | Labels, autocomplete, native keyboard types, validation and submit feedback work at narrow widths. |
| Admin room image manager | Upload fields/buttons remain reachable; image grid collapses cleanly; progress and errors are perceivable. |

## Code areas to start from

- Shared shell and mobile nav: `app/layout.js`, `app/styles.css`, `app/_ui/Navbar.jsx`
- Homepage booking entry: `app/_components/HeroSection/`, `app/_components/BookingForm/`
- Search and room detail: `app/rooms/_components/FilterSection/`, `app/rooms/_components/RoomsSection/`, `app/rooms/[room_slug]/_components/RoomBookingForm/`, `Facilities/`
- Checkout and post-booking account: `app/reservations/checkout/`, `app/reservations/edit/`, `app/account/`
- Supporting forms: `app/signin/`, `app/signup/`, `app/_components/ContactForm/`

## Audit limitations

This audit did not run the app in a browser or inspect the checked-in screenshots at mobile viewport sizes. Findings about overflow, visual order, image cropping, date picker behavior, and actual hit-target dimensions are source-based risks that require viewport verification. This document is an upgrade path, not a claim that the proposed work has been implemented.
