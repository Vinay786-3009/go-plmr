import type { RideStatus, DriverApprovalStatus, ComplaintStatus, SettlementStatus, VehicleCategoryType } from '@/types';

// Format Indian Rupee currency (₹)
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

// Format date and time
export function formatDateTime(isoString: string | undefined | null): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(date);
  } catch {
    return '—';
  }
}

// Format date only
export function formatDateOnly(isoString: string | undefined | null): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return '—';
  }
}

// Format phone number
export function formatPhone(phone: string | undefined | null): string {
  if (!phone) return '—';
  const clean = phone.replace(/[^\d+]/g, '');
  if (clean.length === 10) {
    return `+91 ${clean.slice(0, 5)} ${clean.slice(5)}`;
  }
  return clean;
}

// Ride status badge styling
export function getRideStatusBadge(status: RideStatus): { text: string; className: string } {
  switch (status) {
    case 'requested':
      return { text: 'Requested', className: 'badge-info' };
    case 'searching':
      return { text: 'Searching Driver', className: 'badge-warning' };
    case 'driver_assigned':
      return { text: 'Driver Assigned', className: 'badge-info' };
    case 'driver_arriving':
      return { text: 'Driver Arriving', className: 'badge-info' };
    case 'ride_started':
      return { text: 'In Progress', className: 'badge-success' };
    case 'completed':
      return { text: 'Completed', className: 'badge-success' };
    case 'cancelled':
      return { text: 'Cancelled', className: 'badge-danger' };
    default:
      return { text: status, className: 'badge-neutral' };
  }
}

// Driver approval badge
export function getDriverApprovalBadge(status: DriverApprovalStatus): { text: string; className: string } {
  switch (status) {
    case 'pending':
      return { text: 'Pending Review', className: 'badge-warning' };
    case 'approved':
      return { text: 'Approved', className: 'badge-success' };
    case 'rejected':
      return { text: 'Rejected', className: 'badge-danger' };
    case 'suspended':
      return { text: 'Suspended', className: 'badge-danger' };
    default:
      return { text: status, className: 'badge-neutral' };
  }
}

// Complaint status badge
export function getComplaintStatusBadge(status: ComplaintStatus): { text: string; className: string } {
  switch (status) {
    case 'open':
      return { text: 'Open', className: 'badge-danger' };
    case 'under_review':
      return { text: 'Under Review', className: 'badge-warning' };
    case 'resolved':
      return { text: 'Resolved', className: 'badge-success' };
    case 'rejected':
      return { text: 'Rejected', className: 'badge-neutral' };
    default:
      return { text: status, className: 'badge-neutral' };
  }
}

// Settlement status badge
export function getSettlementStatusBadge(status: SettlementStatus): { text: string; className: string } {
  switch (status) {
    case 'pending':
      return { text: 'Pending', className: 'badge-warning' };
    case 'processing':
      return { text: 'Processing', className: 'badge-info' };
    case 'settled':
      return { text: 'Settled', className: 'badge-success' };
    case 'rejected':
      return { text: 'Rejected', className: 'badge-danger' };
    default:
      return { text: status, className: 'badge-neutral' };
  }
}

// Vehicle category label
export function getVehicleCategoryLabel(cat: VehicleCategoryType): string {
  switch (cat) {
    case 'bike':
      return 'Bike (2-Wheeler)';
    case 'auto':
      return 'Auto Rickshaw';
    case 'cab':
      return 'Cab / Taxi';
    default:
      return cat;
  }
}
