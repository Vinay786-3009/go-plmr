import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  limit,
} from 'firebase/firestore';
import { db } from './firebase/firebase';
import type {
  AdminDashboardMetrics,
  RideRecord,
  DriverProfile,
  RideStatus,
} from '@/types';

export interface DashboardData {
  metrics: AdminDashboardMetrics;
  statusDistribution: Array<{ name: string; value: number; color: string }>;
  activityTrend: Array<{ date: string; rides: number; completed: number; revenue: number }>;
  recentRides: RideRecord[];
  recentDrivers: DriverProfile[];
  pendingDrivers: DriverProfile[];
}

export const statsService = {
  async getDashboardData(dateRange: 'all' | 'today' | '7d' | '30d' = 'all'): Promise<DashboardData> {
    const metrics: AdminDashboardMetrics = {
      totalCustomers: 0,
      totalDrivers: 0,
      pendingDriverApplications: 0,
      approvedDrivers: 0,
      activeRides: 0,
      completedRides: 0,
      cancelledRides: 0,
      totalFareRecorded: 0,
      totalCommissionEarned: 0,
      totalDriverEarnings: 0,
      pendingComplaints: 0,
      pendingSettlements: 0,
    };

    let recentRides: RideRecord[] = [];
    let recentDrivers: DriverProfile[] = [];
    let pendingDrivers: DriverProfile[] = [];
    const statusCounts: Record<RideStatus, number> = {
      requested: 0,
      searching: 0,
      driver_assigned: 0,
      driver_arriving: 0,
      ride_started: 0,
      completed: 0,
      cancelled: 0,
    };

    // Calculate cutoff timestamp for dateRange
    const now = new Date();
    let cutoffIso: string | null = null;
    if (dateRange === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      cutoffIso = todayStart.toISOString();
    } else if (dateRange === '7d') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      cutoffIso = sevenDaysAgo.toISOString();
    } else if (dateRange === '30d') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      cutoffIso = thirtyDaysAgo.toISOString();
    }

    // 1. Fetch Users (Customers)
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const customers = usersSnap.docs.filter((d) => d.data().role !== 'driver');
      metrics.totalCustomers = customers.length;
    } catch (err) {
      console.warn('Dashboard: could not load users:', err);
    }

    // 2. Fetch Drivers
    try {
      const driversQuery = query(collection(db, 'drivers'), orderBy('createdAt', 'desc'));
      const driversSnap = await getDocs(driversQuery);
      const allDrivers = driversSnap.docs.map((d) => ({
        id: d.id,
        uid: d.id,
        ...d.data(),
      })) as DriverProfile[];

      metrics.totalDrivers = allDrivers.length;
      metrics.pendingDriverApplications = allDrivers.filter((d) => d.approvalStatus === 'pending').length;
      metrics.approvedDrivers = allDrivers.filter((d) => d.approvalStatus === 'approved').length;
      recentDrivers = allDrivers.slice(0, 5);
      pendingDrivers = allDrivers.filter((d) => d.approvalStatus === 'pending').slice(0, 5);
    } catch (err) {
      console.warn('Dashboard: could not load drivers:', err);
    }

    // 3. Fetch Rides
    try {
      const ridesQuery = query(collection(db, 'rides'), orderBy('timestamps.requestedAt', 'desc'), limit(300));
      const ridesSnap = await getDocs(ridesQuery);
      let allRides = ridesSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as RideRecord[];

      recentRides = allRides.slice(0, 5);

      // If date range is active, filter rides for metrics and charts
      const ridesForMetrics = cutoffIso
        ? allRides.filter((r) => (r.timestamps?.requestedAt || '') >= cutoffIso)
        : allRides;

      ridesForMetrics.forEach((ride) => {
        if (statusCounts[ride.status] !== undefined) {
          statusCounts[ride.status]++;
        }

        if (['requested', 'searching', 'driver_assigned', 'driver_arriving', 'ride_started'].includes(ride.status)) {
          metrics.activeRides++;
        } else if (ride.status === 'completed') {
          metrics.completedRides++;
          const fare = Number(ride.fare?.totalFare || 0);
          const commission = Number(ride.fare?.platformCommission || 0);
          const driverNet = Number(ride.fare?.driverEarnings || Math.max(0, fare - commission));
          metrics.totalFareRecorded += fare;
          metrics.totalCommissionEarned += commission;
          metrics.totalDriverEarnings += driverNet;
        } else if (ride.status === 'cancelled') {
          metrics.cancelledRides++;
        }
      });
    } catch (err) {
      console.warn('Dashboard: could not load rides:', err);
    }

    // 4. Fetch Pending Complaints
    try {
      const complaintsSnap = await getDocs(
        query(collection(db, 'complaints'), where('status', 'in', ['open', 'under_review']))
      );
      metrics.pendingComplaints = complaintsSnap.size;
    } catch (err) {
      console.warn('Dashboard: could not load complaints:', err);
    }

    // 5. Fetch Pending Settlements
    try {
      const settlementsSnap = await getDocs(
        query(collection(db, 'settlements'), where('status', '==', 'pending'))
      );
      metrics.pendingSettlements = settlementsSnap.size;
    } catch (err) {
      console.warn('Dashboard: could not load settlements:', err);
    }

    // Chart distribution colors matching theme
    const statusDistribution = [
      { name: 'Completed', value: statusCounts.completed, color: '#10b981' },
      { name: 'In Progress', value: statusCounts.ride_started, color: '#065f46' },
      { name: 'Active / Searching', value: statusCounts.requested + statusCounts.searching + statusCounts.driver_assigned + statusCounts.driver_arriving, color: '#3b82f6' },
      { name: 'Cancelled', value: statusCounts.cancelled, color: '#f43f5e' },
    ].filter((item) => item.value > 0);

    // If no rides, empty distribution
    const finalDistribution = statusDistribution.length > 0 ? statusDistribution : [
      { name: 'No Ride Data Yet', value: 1, color: '#e2e8f0' }
    ];

    // Activity trend calculation from real timestamps
    const activityTrend: Array<{ date: string; rides: number; completed: number; revenue: number }> = [];
    const dateMap: Record<string, { rides: number; completed: number; revenue: number }> = {};

    recentRides.forEach((r) => {
      const dateKey = r.timestamps?.requestedAt ? r.timestamps.requestedAt.slice(0, 10) : 'Recent';
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = { rides: 0, completed: 0, revenue: 0 };
      }
      dateMap[dateKey].rides++;
      if (r.status === 'completed') {
        dateMap[dateKey].completed++;
        dateMap[dateKey].revenue += r.fare?.totalFare || 0;
      }
    });

    Object.keys(dateMap).slice(0, 7).forEach((date) => {
      activityTrend.push({
        date,
        rides: dateMap[date].rides,
        completed: dateMap[date].completed,
        revenue: dateMap[date].revenue,
      });
    });

    return {
      metrics,
      statusDistribution: finalDistribution,
      activityTrend,
      recentRides,
      recentDrivers,
      pendingDrivers,
    };
  },
};

