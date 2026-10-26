import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Helper to verify caller is an authorized admin
function verifyAdminCaller(authContext?: functions.https.CallableRequest['auth']) {
  if (!authContext) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Authentication is required to perform this administrative action.'
    );
  }
  if (!authContext.token.admin && authContext.token.role !== 'admin') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Caller is not authorized with Administrator Custom Claims.'
    );
  }
}

// 1. Authoritative Fare Calculator
export const calculateAuthoritativeFare = functions.https.onCall(
  { region: 'asia-south1' },
  async (request: functions.https.CallableRequest<any>) => {
    const { vehicleCategory, distanceKm, durationMinutes } = request.data || {};

    if (!vehicleCategory || distanceKm === undefined) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing category or distance.');
    }

    const fareSnap = await db
      .collection('fareConfigurations')
      .where('vehicleCategory', '==', vehicleCategory)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (fareSnap.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        `No active fare configuration found for ${vehicleCategory}.`
      );
    }

    const config = fareSnap.docs[0].data();
    const distanceFare = Math.max(0, Number(distanceKm) * Number(config.perKmRate || 0));
    const timeFare = Math.max(0, Number(durationMinutes || 0) * Number(config.perMinuteRate || 0));
    const rawFare = Number(config.baseFare || 0) + distanceFare + timeFare + Number(config.bookingFee || 0);
    const totalFare = Math.max(Number(config.minFare || 0), Math.round(rawFare));

    const commissionPercent = Number(config.platformCommissionPercent || 15);
    const platformCommission = Math.round(
      ((totalFare - Number(config.bookingFee || 0)) * commissionPercent) / 100 + Number(config.bookingFee || 0)
    );
    const driverEarnings = Math.max(0, totalFare - platformCommission);

    return {
      baseFare: config.baseFare,
      distanceFare,
      timeFare,
      bookingFee: config.bookingFee,
      totalFare,
      platformCommission,
      driverEarnings,
    };
  }
);

// 2. Privileged Driver Approval
export const approveDriverApplication = functions.https.onCall(
  { region: 'asia-south1' },
  async (request: functions.https.CallableRequest<any>) => {
    verifyAdminCaller(request.auth);

    const { driverId } = request.data || {};
    if (!driverId) {
      throw new functions.https.HttpsError('invalid-argument', 'driverId is required');
    }

    const driverRef = db.collection('drivers').doc(driverId);
    await driverRef.update({
      approvalStatus: 'approved',
      'documents.verifiedAt': new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Record in immutable audit log
    await db.collection('auditLogs').add({
      adminUid: request.auth?.uid,
      adminEmail: request.auth?.token.email || 'unknown',
      action: 'APPROVE_DRIVER',
      category: 'driver',
      targetId: driverId,
      timestamp: new Date().toISOString(),
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: `Driver ${driverId} approved.` };
  }
);

// 3. Process Driver Settlement
export const processDriverSettlement = functions.https.onCall(
  { region: 'asia-south1' },
  async (request: functions.https.CallableRequest<any>) => {
    verifyAdminCaller(request.auth);

    const { settlementId, transactionReference, notes } = request.data || {};
    if (!settlementId || !transactionReference) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'settlementId and transactionReference are required.'
      );
    }

    const settlementRef = db.collection('settlements').doc(settlementId);
    const now = new Date().toISOString();

    await settlementRef.update({
      status: 'settled',
      settledAt: now,
      settledByUid: request.auth?.uid,
      settledByEmail: request.auth?.token.email || 'unknown',
      transactionReference,
      notes: notes || null,
      updatedAt: now,
    });

    await db.collection('auditLogs').add({
      adminUid: request.auth?.uid,
      adminEmail: request.auth?.token.email || 'unknown',
      action: 'SETTLE_DRIVER_PAYOUT',
      category: 'settlement',
      targetId: settlementId,
      details: { transactionReference, notes },
      timestamp: now,
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, message: `Settlement ${settlementId} settled.` };
  }
);
