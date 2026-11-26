# Premium Hotel Web App Upgrade Plan

## Audit snapshot

This repository is a Next.js App Router hotel booking application. The stack is being moved to Next.js 16.4, React 19.3, and the matching Next ESLint config, with current Auth.js, date picker, and select packages. It has room search and detail pages, date based availability filtering, guest sign in and profiles, reservation history and edits, a Paystack checkout and webhook path for GHS payments, Supabase data access, and a contact page. The contact page originally embedded an OpenStreetMap view via Leaflet; that dependency has been removed in favor of a lightweight location card and directions link.

The original experience read as a starter template rather than a specific hotel brand. The checked-in screenshots showed a generic logo, a red-and-black template palette, dense layouts, repeated room imagery, placeholder copy, and a long homepage made from loosely connected sections. Source code confirmed Lorem Ipsum and generic "Hotel Booking App" metadata in several places. The homepage hero uses the same local image four times, and the blog cards repeat that image. The header hid desktop navigation until a breakpoint and had no visible brand identity beyond the word "LOGO". The target property is now The Winford Boutique Hotel Achimota in Accra, Ghana. The user selected GHS and the current stored room prices as the direct-booking amounts. Official contact details and cancellation/refund policies remain to be confirmed.

The Paystack flow now verifies transaction status, reference, amount, currency, and webhook signatures and records payments idempotently. Live payments still require the hotel's Paystack secret/webhook credentials and a Supabase migration. Reservation inventory races and the full payment lifecycle still need a focused production review. These are code review findings, not a full penetration test.

The worktree was already modified when this audit began (`README.md`, `auth.js`, `next.config.mjs`, `package-lock.json`, several Supabase helpers, and `.env.example` are changed; `env.local.sample` is deleted). Keep those changes intact while implementing this plan.

## Product direction

Build a polished, trustworthy direct-booking experience for The Winford Boutique Hotel Achimota in Tantra, New Achimota, Accra, Ghana. The hotel identity, location, standard check-in/check-out times, GHS currency, and current stored room amounts are now reflected in the app. Confirm the target guest profile, languages, cancellation/refund policies, official contact details, approved photography, and any amenity details not confirmed by the property before launch. Preserve the existing booking capabilities while making discovery, room comparison, checkout, and post-booking account management feel coherent and intentional.

## Prioritized delivery plan

### Phase 0 — Define the offer and brand

- Confirm guest profile, languages, time zone, cancellation/refund terms, and official contact details.
- Gather approved logo, property photography, room photography, amenity list, policies, and real guest proof (ratings/reviews only if verifiable).
- Agree on a visual direction and design tokens: typography, color, spacing, layout width, image treatment, buttons, forms, and responsive behavior.
- Establish the launch scope: direct booking only, or also offers, experiences, multilingual pages, and loyalty features.

**Exit:** approved source content and a reusable visual direction; no invented hotel claims remain in launch copy.

### Phase 1 — Secure and stabilize booking

- Keep Paystack webhook signature verification on the raw request body and verify successful transactions server-side before creating reservations.
- Keep guest access tokens out of gateway metadata; use server-side reservation persistence.
- Preserve webhook idempotency and validate payment status, reference, amount, and currency before confirming a reservation.
- Enforce availability and date/guest/price validation on the server at checkout time. Handle concurrent bookings so one room/date range cannot be sold twice.
- Review reservation ownership checks for edit, cancel, and delete operations; ensure the server recomputes totals from trusted room and policy data.
- Review Supabase service-role usage and RLS boundaries, redact sensitive values from logs, and make API errors safe for production.
- Confirm the hotel's cancellation/refund policy and ensure guest-facing payment language matches the Paystack confirmation flow.

**Exit:** payment and reservation state transitions are trustworthy, replay-safe, and documented; booking rules match what the guest sees.

### Phase 2 — Create the premium shared shell

- Replace the generic logo/header/footer with the approved brand, clear primary navigation, a prominent booking action, and a responsive accessible mobile menu.
- Define global design tokens and reset styles; replace scattered one-off visual decisions with consistent type, spacing, color, borders, and focus states.
- Establish image conventions (approved sources, crop/aspect ratios, alt text, responsive sizes, placeholders, and loading behavior) and remove repeated/template imagery.
- Improve global metadata, page titles/descriptions, favicon, social sharing metadata, and semantic landmarks.
- Audit keyboard navigation, contrast, form labels, button names, reduced motion, and screen-reader announcements across shared components.

**Exit:** a consistent brand shell works at mobile, tablet, and desktop sizes and provides accessible navigation and booking entry points.

### Phase 3 — Rebuild the discovery and conversion path

- Homepage: lead with the property, location, a distinctive promise, strong photography, and a clear availability search; follow with a concise set of real reasons to stay, featured rooms, experiences/location, guest proof, and practical policies.
- Search/results: make dates and guest count persistent, show useful filters and sorting, display capacity/amenities/real starting prices, and explain empty/loading/error states.
- Room detail: provide a useful image gallery, room facts, amenities, occupancy, bed configuration, policies, availability, transparent price breakdown, and a persistent booking action on small screens.
- Checkout: show a clear step and booking summary, guest details, taxes/fees/currency, cancellation/payment terms, validation, and reliable recovery paths for payment failure or expiry.
- Confirmation/account: provide a reassuring confirmation and self-service itinerary with reservation status and clear change/cancel rules.

**Exit:** the complete guest journey can be understood and completed without relying on placeholder text, ambiguous payment promises, or hidden booking context.

### Phase 4 — Complete supporting pages and content

- Replace placeholder About, Blog, Gallery, and Contact content with accurate hotel information; remove sections that do not have real content or a clear conversion purpose.
- Make contact details, location copy, directions, opening hours, and form feedback accurate and actionable.
- Review sign-in/sign-up and guest account pages for consistent branding, clear validation, recovery flows, and accessible feedback.
- Add only substantiated SEO content and structured data for the property and rooms.

**Exit:** every public page has complete, approved content and a clear role in the guest journey.

### Phase 5 — Quality, operations, and launch readiness

- Review image delivery, font loading, client-side JavaScript, third-party services, and server rendering for speed and resilience.
- Add production-safe logging and monitoring for search, checkout, payment webhooks, and reservation failures without exposing guest data or tokens.
- Verify `PAYSTACK_SECRET_KEY` and webhook configuration, apply the Supabase payment migration, and document backup/recovery and operational ownership.
- Run a focused release review across supported viewports and core guest flows, including empty/error states, authentication, checkout success/failure, and repeated webhook delivery.

**Exit:** the app is supportable in production with observable booking operations and a verified release checklist.

## Suggested implementation order

1. Confirm hotel/brand inputs and payment semantics.
2. Secure webhook and reservation integrity before live payment traffic.
3. Establish shared design tokens, shell, and approved image handling.
4. Implement homepage, room results, room detail, checkout, and confirmation as one connected conversion journey.
5. Finish account/supporting content, accessibility, metadata, performance, and operational readiness.

## Code areas to start from

- Shared shell and global styles: `app/layout.js`, `app/styles.css`, `app/_ui/Navbar.jsx`, `app/_components/Footer/`
- Homepage sections: `app/page.js`, `app/_components/HeroSection/`, `About/`, `Rooms/`, `Gallery/`, `Blog/`, and `ContactSection/`
- Room discovery and booking: `app/rooms/`, `app/_components/RoomCard/`, `app/_components/BookingForm/`
- Payment and reservation lifecycle: `app/_lib/paystack.js`, `app/api/paystack-webhook/route.js`, `app/reservations/`, `app/payment/`, and `app/_lib/supabase/reservations.js`
- Guest accounts: `app/signin/`, `app/signup/`, and `app/account/`

## Out of scope until separately prioritized

Do not assume a new framework, a new database, loyalty program, booking-engine replacement, or a content-management system is required. First determine whether the existing Next.js, Supabase, and Paystack foundation meets the confirmed product and operational needs.
