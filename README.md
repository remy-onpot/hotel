# Hotel Booking System

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Screenshots](#screenshots)
4. [Technologies Used](#technologies-used)
5. [Installation](#installation)
6. [Important Notes](#important-notes)
7. [Paystack Payments](#paystack-payments)
8. [Back Office](#back-office)
9. [Contributing](#contributing)
10. [License](#license)

## Overview

Hotel Booking System is a full-stack web application designed to streamline the process of reserving hotel rooms. This project represents the **front office** of a hotel reservation management system, offering users an intuitive and user-friendly interface to search, filter, and book available rooms.

This app is built using **Next.js** for the front-end and **Supabase** for the database. It integrates several key libraries such as **bcrypt** for password security, **Auth.js** for authentication, and **Zod** for form validation. The system is designed to provide a smooth booking experience with features such as date filtering, sorting by guests and price, and user profile management.

## Features

- **Homepage with Offers**: A dynamic homepage showcasing available offers, the hotel description, and a location card with directions to The Winford Boutique Hotel Achimota in Accra.
- **Booking Form**: Users can select a date range, and the system will display available rooms for that period.
- **Room Sorting**: Sorting functionality based on the number of guests and price.
- **Detailed Room Pages**: Each room has a dedicated page with a detailed description, booking form, and disabled dates for already reserved periods.
- **Authentication**: Guest accounts use email and password through **Auth.js**. Hotel administrators use their configured staff credentials.
- **Checkout Process**: Users are forwarded to a checkout page after selecting a room. If not authenticated, they are redirected to the login/signup page.
- **Profile Management**: Users can update their profile, check their reservation history, cancel unconfirmed reservations, and delete past ones.
- **Reservation Status**: Online reservations are confirmed after Paystack verification; walk-in reservations are recorded as confirmed by staff.
- **Front Desk**: Allowlisted staff can record walk-in bookings, review guest enquiries, and track payment exceptions that need refund follow-up.
- **Compound Components**: Reusable and flexible components are implemented for forms, modals, and inputs to ensure better code organization and scalability.

## Screenshots

1. **Homepage**  
   ![Homepage Screenshot](https://raw.githubusercontent.com/OthmaneNissoukin/nextjs-hotel-booking/main/screenshots/homepage.png)

2. **Room Listing**  
   ![Room Listing Screenshot](https://raw.githubusercontent.com/OthmaneNissoukin/nextjs-hotel-booking/main/screenshots/rooms.png)

3. **Room Details**  
   ![Room Details Screenshot](https://raw.githubusercontent.com/OthmaneNissoukin/nextjs-hotel-booking/main/screenshots/details.png)

4. **Checkout Page**  
   ![Checkout Screenshot](https://raw.githubusercontent.com/OthmaneNissoukin/nextjs-hotel-booking/main/screenshots/checkout.png)

5. **Reservation Update Page**  
   ![Reservation Update Screenshot](https://raw.githubusercontent.com/OthmaneNissoukin/nextjs-hotel-booking/main/screenshots/reservation-update.png)

6. **Sign In Page**  
   ![Sign In Screenshot](https://raw.githubusercontent.com/OthmaneNissoukin/nextjs-hotel-booking/main/screenshots/login.png)

7. **Booking Overview**  
   ![Booking Overview Screenshot](https://raw.githubusercontent.com/OthmaneNissoukin/nextjs-hotel-booking/main/screenshots/booking-overview.png)

8. **Supabase Schema**  
   ![Supabase Schema Screenshot](https://raw.githubusercontent.com/OthmaneNissoukin/nextjs-hotel-booking/main/screenshots/supabase-schema.png)

## Technologies Used

### Front-end

- **Next.js**: Server-Side Rendering (SSR), Client-Side Rendering (CSR), and API routes.
- **CSS**: Fully customized styling using pure CSS.
- **DayPicker**: For friendly date selection.
- **date-fns**: For handling date manipulation.
- **Zod**: For form validation.
- **React Hot Toast**: Showing user-friendly feedback for errors, success, and other statuses.
- **Memoization**: Applied to prevent unnecessary re-renders.
- **Compound Components**: Utilized to create cohesive and reusable UI components.

### Back-end

- **Supabase**: Used as the database for storing and retrieving reservation and user data.
- **bcrypt**: For secure password hashing and comparison.
- **Auth.js**: For credentials-based guest and administrator authentication.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/OthmaneNissoukin/nextjs-hotel-booking.git
   cd nextjs-hotel-booking
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Set up your environment variables:

   - Create a `.env.local` file in the root directory and include the following:

   ```env
   # SUPABASE
   # Your supabase schema in case you want to use a custom one, default is `public`
   # In case if you are going to use a custom schema, make sure to expose it to API access in your project settings
   NEXT_PUBLIC_SUPABASE_SCHEMA_ENV=public

   NEXT_PUBLIC_SUPABASE_URL=YOUR-SUPABASE-URL
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR-SUPABASE-PUBLISHABLE-KEY
   NEXT_PUBLIC_SUPABASE_IMGS_URL=YOUR-SUPABASE-IMGS-BUCKET-URL
   SUPABASE_SECRET_KEY=YOUR-SUPABASE-SECRET-KEY

   # NEXTAUTH
   NEXTAUTH_URL=http://localhost:3000/
   AUTH_SECRET=YOUR-AUTH-SECRET

   AUTH_TRUST_HOST=http://localhost:3000

   # PAYSTACK PAYMENTS (GHS)
   PAYSTACK_SECRET_KEY=YOUR-PAYSTACK-SECRET-KEY
   PAYSTACK_WEBHOOK_SECRET=YOUR-PAYSTACK-WEBHOOK-SECRET

   # PRODUCTION URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

5. Visit [http://localhost:3000](http://localhost:3000) to view the app in your browser.

## IMPORTANT NOTES

- **Authentication**: OAuth sign-in is disabled. Guest credentials are stored in the `guests` table with bcrypt password hashes. Administrators authenticate against Supabase Auth and must have the trusted `app_metadata.role` value set to `admin`.

- **Image Storage (Buckets)**:  
   This project stores room images in the Supabase Storage bucket configured by `NEXT_PUBLIC_SUPABASE_IMGS_URL` (the current project uses `images`). The bucket must allow public reads so the app and Next.js image optimizer can display them.

  - If the bucket is not properly configured, your application **won’t be able to retrieve images**.

  - You can configure your policies through the buttom link, and make sure to select the **For full customization** option:

  ```
  https://supabase.com/dashboard/project/PROJECT_ID/storage/policies
  ```

  - You can access images using the following URL structure:

  ```
  https://YOUR_PROJECT_ID.supabase.co/storage/v1/object/public/images/IMAGE_NAME
  ```

  - Replace `YOUR_PROJECT_ID` with your actual Supabase project ID and `IMAGE_NAME` with the specific image filename.

- **Admin Access**: Create staff accounts in Supabase Auth. Grant administrator access by setting `app_metadata.role` to `admin` using a trusted Supabase Admin API client or the Supabase SQL Editor; never use user-editable `user_metadata` for authorization. For example, with the Auth Admin API use `supabase.auth.admin.updateUserById(userId, { app_metadata: { role: "admin" } })`. Staff sign in through the normal sign-in page and are routed to `/admin`; after changing a role, have the staff member sign out and back in. The server uses `SUPABASE_SECRET_KEY` for privileged operations; never expose this key as a `NEXT_PUBLIC_` variable.

- **Room Admin**: Run the Supabase migrations before using `/admin/rooms`. Administrators can set a GHS nightly price and a separate optional USD display price for each room type. GHS remains the booking and payment amount. Administrators can also set inventory, edit room details and features, and upload or delete room images. A room with reservations cannot be deleted.

- **Reservation Security Migration**: Apply every migration in `supabase/migrations/` before deploying. In particular, apply `20261126000000_booking_and_operations_hardening.sql` to revoke direct guest reservation writes and create the staff contact and payment exception queues. The app change alone does not update permissions in an existing Supabase project.

- **Guest Enquiries and Payment Exceptions**: Staff with the Supabase admin role can review contact form submissions at `/admin/inbox` and payments that could not confirm a room hold at `/admin/payment-exceptions`. Contact submissions are limited to three per email address per hour. The payment queue records staff refund follow-up but does not initiate refunds through Paystack.

- **Room Image Uploads**: Each room card supports selecting up to 10 images in one upload. Admin uploads are decoded and normalized to WebP before being stored in the public image bucket; the first successfully uploaded image can be set as the room cover.

- **Payment Integration**: Direct bookings are charged in Ghana cedis through Paystack. Configure `PAYSTACK_SECRET_KEY`, then register `https://YOUR_DOMAIN/api/paystack-webhook` as the Paystack webhook URL. The webhook verifies Paystack's signature and transaction details before recording a reservation. Existing Stripe reservations remain stored with their original USD currency.
  - More details: [Paystack Transactions API](https://paystack.com/docs/api/transaction/) and [Paystack webhooks](https://paystack.com/docs/payments/webhooks/).
- **Guests Data**: Since this project is using a table `guests` to save users data including the password, it was necessary to create a `table view (guests_view)` in order to restrict access to all the fields and prevent exposing the password in the API response when that field is not needed. When authenticating a user, the API call reads directly from the original `guests` table to get the user password for verification and this Supabase call will need to be provided with `SUPABASE_SECRET_KEY` to bypass Row Level Security (RLS) since authenticating doesn't have any authenticated user to empower it with his own token itself.
- **View Creation**: Run the following query in your Supabase SQL Editor to create the `guests` view:
  <code>
  CREATE VIEW public.guests_view
  WITH (security_invoker=on)
  AS
  SELECT id, email, "nationalID", nationality, "countryFlag", fullname, phone, created_at, avatar
  FROM public.guests;
  </code>

## Paystack Payments

Use Paystack test keys and test payment methods while developing. Set the hotel's live secret key and webhook URL only for production after a successful end-to-end test in Paystack test mode.

## Back Office

- **Live Version**: [https://nextjs-hotel-booking-back-office.vercel.app/](https://nextjs-hotel-booking-back-office.vercel.app/)
- **Repo**: [https://github.com/OthmaneNissoukin/nextjs-hotel-booking-back-office](https://github.com/OthmaneNissoukin/nextjs-hotel-booking-back-office)

## Contributing

Feel free to submit issues or pull requests. Contributions, suggestions, and improvements are always welcome!

## License

This project is licensed under the MIT License. See the [LICENSE](./blob/main/Licence.txt) file for details.
