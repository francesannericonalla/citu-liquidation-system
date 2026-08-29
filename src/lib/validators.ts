import { z } from "zod";

const citEmail = z
  .string()
  .email("Enter a valid email address.")
  .endsWith("@cit.edu", "Only @cit.edu email addresses are allowed.");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.");

export const SignUpSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters.").max(100),
    email: citEmail,
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const LoginSchema = z.object({
  email: citEmail,
  password: z.string().min(1, "Password is required."),
});

export const SelectOfficeSchema = z.object({
  officeId: z.string().uuid("Select a valid office."),
});

export const ForgotPasswordSchema = z.object({
  email: citEmail,
});

export const ResetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password,
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
