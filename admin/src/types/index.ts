export type UserRole = 'customer' | 'driver' | 'admin';
export type AccountStatus = 'active' | 'suspended' | 'pending';
export type VehicleCategoryType = 'bike' | 'auto' | 'cab';

export interface UserProfile {
  uid: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  role: UserRole;
  status: AccountStatus;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt?: string;
  suspensionReason?: string;
  totalRidesAsCustomer?: number;
}

export type DriverApprovalStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface DriverVehicleDetails {
  category: VehicleCategoryType;
  makeModel: string;
  plateNumber: string;
  color?: string;
  year?: number;
}

export interface DriverDocuments {
  dlNumber: string;
  dlUrl?: string;
  rcUrl?: string;
  insuranceUrl?: string;
  photoUrl?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface DriverBankDetails {
  accountHolder?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
}

export interface DriverProfile {
  id: string; // matches Firebase UID
  uid: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  vehicleCategory: VehicleCategoryType;
  vehicleDetails: DriverVehicleDetails;
  documents: DriverDocuments;
  bankDetails: DriverBankDetails;
  approvalStatus: DriverApprovalStatus;
  rejectionReason?: string;
  suspensionReason?: string;
  isOnline: boolean;
  currentRideId?: string;
  ratings: {
    average: number;
    count: number;
  };
  totalRides: number;
  helmetStrikes: number;
  createdAt: string;
  updatedAt?: string;
  lastActiveAt?: string;
}

export type RideStatus =
  | 'requested'
  | 'searching'
  | 'driver_assigned'
  | 'driver_arriving'
  | 'ride_started'
  | 'completed'
  | 'cancelled';

export interface LocationPoint {
  address: string;
  latitude: number;
  longitude: number;
}

export interface RideFareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare?: number;
  bookingFee: number;
  platformCommission: number;
  driverEarnings: number;
  totalFare: number;
  distanceKm: number;
  durationMinutes?: number;
}

export interface RideRecord {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  vehicleCategory: VehicleCategoryType;
  status: RideStatus;
  pickup: LocationPoint;
  dropoff: LocationPoint;
  fare: RideFareBreakdown;
  paymentMethod: 'cash' | 'upi';
  paymentStatus: 'pending' | 'completed' | 'failed';
  otpVerified: boolean;
  cancellationReason?: string;
  cancelledBy?: 'customer' | 'driver' | 'admin' | 'system';
  timestamps: {
    requestedAt: string;
    assignedAt?: string;
    arrivingAt?: string;
    startedAt?: string;
    completedAt?: string;
    cancelledAt?: string;
  };
  helmetVerified?: boolean;
}

export interface DriverLocationRTDB {
  driverId: string;
  driverName?: string;
  vehicleCategory: VehicleCategoryType;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  isOnline: boolean;
  status: 'available' | 'on_trip' | 'offline';
  currentRideId?: string;
  lastUpdated: number; // Unix timestamp
}

export interface FareConfiguration {
  id: string;
  vehicleCategory: VehicleCategoryType;
  baseFare: number;
  minFare: number;
  perKmRate: number;
  perMinuteRate: number;
  bookingFee: number;
  platformCommissionPercent: number;
  cancellationFee: number;
  effectiveDate: string;
  isActive: boolean;
  version: number;
  updatedByUid: string;
  updatedByEmail: string;
  createdAt: string;
}

export type SettlementStatus = 'pending' | 'processing' | 'settled' | 'rejected';

export interface DriverSettlement {
  id: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  upiId?: string;
  bankAccount?: string;
  periodStart: string;
  periodEnd: string;
  totalRides: number;
  totalCollectedCash: number;
  totalDirectUPI: number;
  grossEarnings: number;
  platformCommissionDeducted: number;
  netPayoutAmount: number; // Positive = payout to driver, Negative = driver owes commission to platform
  status: SettlementStatus;
  settledAt?: string;
  settledByUid?: string;
  settledByEmail?: string;
  transactionReference?: string;
  notes?: string;
  createdAt: string;
}

export type ComplaintCategory =
  | 'fare'
  | 'driver_behavior'
  | 'vehicle_condition'
  | 'safety'
  | 'lost_item'
  | 'cancellation'
  | 'other';

export type ComplaintPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ComplaintStatus = 'open' | 'under_review' | 'resolved' | 'rejected';

export interface ComplaintInternalNote {
  id: string;
  adminUid: string;
  adminEmail: string;
  note: string;
  createdAt: string;
}

export interface ComplaintRecord {
  id: string;
  ticketNumber: string;
  rideId?: string;
  raisedByUid: string;
  raisedByName: string;
  raisedByPhone?: string;
  raisedByRole: 'customer' | 'driver';
  targetUid?: string;
  targetName?: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  subject: string;
  description: string;
  status: ComplaintStatus;
  assignedToUid?: string;
  assignedToEmail?: string;
  resolutionNotes?: string;
  refundAmount?: number;
  internalNotes: ComplaintInternalNote[];
  createdAt: string;
  resolvedAt?: string;
}

export type HelmetReviewStatus = 'pending' | 'approved' | 'warning_issued' | 'strike_applied' | 'rejected';

export interface HelmetVerificationRecord {
  id: string;
  rideId: string;
  driverId: string;
  driverName: string;
  vehiclePlate: string;
  photoUrl: string;
  status: HelmetReviewStatus;
  reviewingAdminUid?: string;
  reviewingAdminEmail?: string;
  reviewNotes?: string;
  strikeAdded: boolean;
  timestamp: string;
  reviewedAt?: string;
}

export interface ServiceAreaConfig {
  id: string;
  name: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  isActive: boolean;
  stateBorderRestriction: {
    enabled: boolean;
    state: string;
  };
  blockedZones: Array<{
    id: string;
    name: string;
    description?: string;
    points: Array<{ lat: number; lng: number }>;
  }>;
  updatedByUid: string;
  updatedByEmail: string;
  updatedAt: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: 'driver_application' | 'ride_incident' | 'complaint' | 'settlement' | 'system';
  read: boolean;
  targetUrl?: string;
  createdAt: string;
}

export interface AuditLogRecord {
  id: string;
  adminUid: string;
  adminEmail: string;
  action: string;
  category: 'driver' | 'customer' | 'ride' | 'fare' | 'settlement' | 'complaint' | 'service_area' | 'auth' | 'system';
  targetId?: string;
  targetType?: string;
  details?: Record<string, any>;
  reason?: string;
  timestamp: string;
}

export interface DriverViolationRecord {
  id: string;
  driverId: string;
  driverName: string;
  reason: string;
  strikeCount: number;
  adminUid: string;
  adminEmail: string;
  createdAt: string;
}

export interface RidePaymentRecord {
  id: string;
  rideId: string;
  customerId: string;
  customerName: string;
  driverId?: string;
  driverName?: string;
  vehicleCategory: VehicleCategoryType;
  totalFare: number;
  platformCommission: number;
  driverEarnings: number;
  paymentMethod: 'cash' | 'upi';
  paymentStatus: 'pending' | 'completed' | 'failed';
  timestamp: string;
}

export interface AdminDashboardMetrics {
  totalCustomers: number;
  totalDrivers: number;
  pendingDriverApplications: number;
  approvedDrivers: number;
  activeRides: number;
  completedRides: number;
  cancelledRides: number;
  totalFareRecorded: number;
  totalCommissionEarned: number;
  totalDriverEarnings: number;
  pendingComplaints: number;
  pendingSettlements: number;
}

