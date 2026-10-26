import { z } from 'zod';

export const fareConfigSchema = z.object({
  vehicleCategory: z.enum(['bike', 'auto', 'cab']),
  baseFare: z.number().min(0, 'Base fare must be >= 0'),
  minFare: z.number().min(0, 'Min fare must be >= 0'),
  perKmRate: z.number().min(1, 'Per-km rate must be at least ₹1'),
  perMinuteRate: z.number().min(0, 'Must be >= 0'),
  bookingFee: z.number().min(0, 'Booking fee must be >= 0'),
  platformCommissionPercent: z.number().min(0).max(50, 'Max commission is 50%'),
  cancellationFee: z.number().min(0),
  effectiveDate: z.string().min(1, 'Effective date is required'),
});

export type FareConfigFormData = z.infer<typeof fareConfigSchema>;

export const driverRejectSchema = z.object({
  reason: z.string().min(5, 'Rejection reason must be at least 5 characters long'),
});

export const accountSuspendSchema = z.object({
  reason: z.string().min(5, 'Suspension reason must be at least 5 characters long'),
});

export const complaintResolutionSchema = z.object({
  status: z.enum(['resolved', 'rejected']),
  resolutionNotes: z.string().min(5, 'Resolution notes are required'),
  refundAmount: z.number().min(0).optional(),
});

export const serviceAreaSchema = z.object({
  name: z.string().min(2, 'Area name required'),
  centerLat: z.number().min(-90).max(90),
  centerLng: z.number().min(-180).max(180),
  radiusKm: z.number().min(1).max(200),
  isActive: z.boolean(),
  stateBorderRestriction: z.object({
    enabled: z.boolean(),
    state: z.string(),
  }),
});
