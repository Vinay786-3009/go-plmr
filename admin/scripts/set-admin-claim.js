/**
 * Go Plmr Admin Provisioning Script
 * 
 * Usage:
 *   1. Download Service Account JSON from Firebase Console:
 *      Project Settings -> Service Accounts -> Generate new private key
 *   2. Save as `serviceAccountKey.json` in project root.
 *   3. Run:
 *      node scripts/set-admin-claim.js <TARGET_USER_UID_OR_EMAIL>
 */

const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.resolve(__dirname, '../serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('\x1b[31m[ERROR] serviceAccountKey.json not found in project root.\x1b[0m');
  console.log('\nTo generate one:');
  console.log('1. Go to Firebase Console -> Project settings -> Service accounts');
  console.log('2. Click "Generate new private key"');
  console.log('3. Save file as "serviceAccountKey.json" in Go-Plmr/ directory\n');
  process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'go-plmr',
});

const targetIdentifier = process.argv[2];

if (!targetIdentifier) {
  console.error('\x1b[31m[ERROR] Please provide a User UID or Email as an argument.\x1b[0m');
  console.log('Example: node scripts/set-admin-claim.js user@goplmr.com');
  process.exit(1);
}

async function grantAdminClaims() {
  try {
    let userRecord;
    if (targetIdentifier.includes('@')) {
      userRecord = await admin.auth().getUserByEmail(targetIdentifier);
    } else {
      userRecord = await admin.auth().getUser(targetIdentifier);
    }

    console.log(`\nFound User: ${userRecord.email} (UID: ${userRecord.uid})`);

    // Set Custom Claims
    await admin.auth().setCustomUserClaims(userRecord.uid, {
      admin: true,
      role: 'admin',
      provisionedAt: new Date().toISOString(),
    });

    // Also register in Firestore admins collection
    const db = admin.firestore();
    await db.collection('admins').doc(userRecord.uid).set(
      {
        uid: userRecord.uid,
        email: userRecord.email,
        role: 'admin',
        isActive: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log('\x1b[32m[SUCCESS] Custom Claims { admin: true } granted successfully!\x1b[0m');
    console.log('The user must sign out and sign in again to refresh their ID token claims.\n');
    process.exit(0);
  } catch (err) {
    console.error('\x1b[31m[FAILURE] Could not grant admin claims:\x1b[0m', err.message);
    process.exit(1);
  }
}

grantAdminClaims();
