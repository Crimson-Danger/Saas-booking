import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6),
  company: z.string().min(2),
});

export const ServiceCreateSchema = z.object({
  name: z.string().min(2),
  durationMinutes: z.number().int().positive().max(24 * 60),
  priceCents: z.number().int().nonnegative().optional(),
});

export const CustomerCreateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

export const AppointmentCreatePublicSchema = z.object({
  serviceId: z.string().uuid(),
  dateTimeISO: z.string().datetime(),
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
});

export const AvailabilityCreateSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
});

