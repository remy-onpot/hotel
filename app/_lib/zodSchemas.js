import { z } from "zod";

export const profileSchema = z.object({
  fullname: z
    .string()
    .trim()
    .min(3, { message: "Fullname must contains at least 3 characters" })
    .max(64, { message: "Fullname cannot exceed 64 characters" }),

  nationality: z.string(),
  phone: z
    .string()
    .regex(
      /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
      "Invalid phone number."
    ),
  email: z.string().email("invalid email format."),
});

export const signInSchema = z.object({
  email: z.string().email("invalid email format."),
  password: z.string().min(1, "the password is required.").max(64),
});

export const bookingSchema = z.object({
  guests_count: z.number({ error: "guests number is invalid" }).gt(0),
  start_date: z
    .string({ error: "date is invalid" })
    .date({ error: "date is invalid" }),
  end_date: z
    .string({ error: "date is invalid" })
    .date({ error: "date is invalid" }),
});

export const reservationSchema = z.object({
  fullname: z
    .string()
    .trim()
    .min(3, { message: "Fullname must contains at least 3 characters" })
    .max(64, { message: "Fullname cannot exceed 64 characters" }),
  nationality: z.string({ message: "Nationality is required" }),
  phone: z
    .string()
    .regex(
      /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
      "Invalid phone number."
    ),
  email: z.string().email("invalid email format."),
  nationalID: z
    .string()
    .regex(/^[a-zA-Z0-9]{6,12}$/, "Invalid national ID format"),
  message: z
    .string()
    .max(255, { message: "Message cannot exceed 255 characters" })
    .optional(),
});

export const signupSchema = z
  .object({
    fullname: z
      .string({ error: (issue) => issue.input === undefined ? "Required" : "Full name is invalid" })
      .min(3, { message: "Name must be at least 3 characters" })
      .max(64, "Name cannot exceed 64 charcters"),
    email: z.string().email(),
    password: z.string().min(6, { message: "Password is required" }),
    confirm_password: z
      .string()
      .min(6, { message: "Password confirmation is required" }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Password doesn't match confirmation",
    path: ["confirm_password"],
  });

export const contactSchema = z.object({
  fullname: z
    .string({ error: (issue) => issue.input === undefined ? "Fullname is required" : "Fullname is invalid" })
    .min(3, { message: "Name must be at least 3 characters" })
    .max(64, "Name cannot exceed 64 charcters"),
  email: z.string().email(),
  phone: z
    .string()
    .min(7)
    .max(32)
    .regex(/^\+?[0-9()\-\.\s]+$/, {
      message: "Invalid phone number",
    }),
  message: z
    .string()
    .min(20, { message: "Message must contain at least 20 characters" })
    .max(500, { message: "Message cannot exceed 500 characters" }),
});
