import { compareSync } from "bcryptjs";
import { createClient } from "@supabase/supabase-js";
import { getFullGuestByEmail } from "../supabase/guests";

async function authorizeAdmin(email, password) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const supabaseAuth = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
  const { data, error } = await supabaseAuth.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user?.email || data.user.app_metadata?.role !== "admin") return null;

  return {
    id: data.user.id,
    email: data.user.email,
    name: data.user.user_metadata?.full_name ?? data.user.email,
    role: "admin",
  };
}

export const credentials = {
  // You can specify which fields should be submitted, by adding keys to the `credentials` object.
  // e.g. domain, username, password, 2FA token, etc.

  credentials: {
    email: {},
    password: {},
  },
  authorize: async (credentials) => {
    const email = credentials.email?.trim();
    const password = credentials.password;
    if (!email || !password) return null;

    // Administrators authenticate against Supabase Auth and do not need a guests row.
    const admin = await authorizeAdmin(email, password);
    if (admin) return admin;

    let user;
    try {
      user = await getFullGuestByEmail(email);
    } catch {
      return null;
    }

    if (!user) {
      // No user found, so this is their first attempt to login
      // meaning this is also the place you could do registration
      throw new Error("User not found.");
    }

    // Verifying user password
    const isValidPwd = compareSync(password, user.password);

    if (!isValidPwd) {
      throw new Error("Wrong email or password");
    }

    // return user object with their profile data
    return user;
  },
};
