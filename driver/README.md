# GO PLMR Driver Partner Web Application

Mobile-first driver partner web portal for **GO PLMR**, serving the **Palamaner, Andhra Pradesh** service area.

---

## 1. Quick Start (Local Run)

You can run the development server from either the project directory or the workspace root:

```bash
# Option A: From inside go-plmr-driver
cd go-plmr-driver
npm install
npm run dev

# Option B: Directly from the workspace root
npm run dev
```

The app will be available locally at `http://127.0.0.1:5173/` or `http://localhost:5173/`.

To build the production bundle:
```bash
npm run build
```

---

## 2. Technology Stack

- **Framework**: React 19 + Vite 8 (with Rolldown engine vendor code splitting)
- **Styling**: Tailwind CSS (Brand yellow, white, charcoal palette tailored for Palamaner fleet)
- **Icons**: Lucide React
- **Mapping**: Leaflet + React-Leaflet with OpenStreetMap tiles (Palamaner center: `13.2000° N, 78.7500° E`)
- **Backend / BaaS**: Firebase project `go-plmr` (Firestore, Firebase Authentication, Firebase Storage)
- **Audio Chime**: Native Web Audio API for incoming ride notifications

---

## 3. Authentication Implementation

The login interface features two distinct authentication tabs:

### Method A: Email + Password
- **Registration**: Full driver onboarding (Personal details, Vehicle category, Registration Plate, License details, Document uploads).
- **Email Verification**: Powered by Firebase Auth (`sendEmailVerification`). Unverified driver accounts are blocked at the verification gate with a resend link featuring a 60-second cooldown timer.
- **Password Reset**: Automated self-service reset via `sendPasswordResetEmail`.
- **Session Persistence**: Persistent local browser session via `browserLocalPersistence`.

### Method B: Email OTP (Passwordless Login)
- **Server-Side Security**: Numeric 6-digit OTP generated via `crypto.randomInt()`, hashed with SHA-256 before storing in Firestore `otp_verifications`.
- **5-Minute Expiry & Rate Limiting**: Cooldown of 60 seconds between resends, maximum 5 incorrect attempts, 1-hour rate limiting window.
- **Immediate Invalidation**: OTP is marked `isUsed: true` immediately upon successful verification.
- **Custom Token**: Server issues a Firebase Custom Token upon verification to authenticate the driver session securely.
- **Production Server Code**: Complete server-side code is included in `server/index.js` ready for deployment to Firebase Cloud Functions or Express server with Resend / SendGrid API credentials.
- **Zero Simulation**: When `VITE_OTP_API_URL` is unconfigured, the app displays a clear setup guide and gracefully directs drivers to Method A, never accepting arbitrary or simulated codes.

---

## 4. Shared Firebase Collections & Compatibility

The driver app connects to the **same Firebase project (`go-plmr`)** and uses the identical collections and schema as the existing Customer app (`https://go-plmr-customer.web.app`) and Admin app (`https://go-plmr.web.app`):

| Collection | Role in Driver App | Compatibility Notes |
|------------|-------------------|---------------------|
| `drivers` | Driver partner profile, approval state, live coordinates | Matches Admin portal driver management schema (`approvalStatus: 'pending'\|'approved'\|'rejected'\|'suspended'`). |
| `rides` | Real-time ride order stream, status lifecycle, fare data | Exact same schema used by Customer booking and Admin monitoring. |
| `users` | Base user record with `role: 'driver'` | Compatible with shared users collection. |
| `otp_verifications` | Server-side OTP codes and verification tracking | Protected by security rules; server-side access only. |

---

## 5. Atomic Ride Acceptance & Lifecycle

### Atomic Acceptance
To prevent race conditions where multiple drivers try to accept the same ride, acceptance runs inside a **Firestore Transaction (`runTransaction`)**:
1. Checks that the ride exists and its status is still `requested` or `searching`.
2. Checks that `driverId` is null.
3. Atomically updates the ride to `driver_assigned` with the driver's info.
4. Atomically marks `activeRideId` on the driver's profile document.

### Ride Statuses:
1. `requested` / `searching` (Open request)
2. `driver_assigned` (Accepted by driver)
3. `driver_arriving` (Driver reaching pickup)
4. `ride_started` (Passenger onboard)
5. `completed` (Trip completed, net earnings recorded)
6. `cancelled` (Cancelled with recorded reason)

---

## 6. Live GPS Location & Turn-by-Turn Navigation

- Driver GPS location is captured via `navigator.geolocation.watchPosition` only when **Online** or on an **Active Trip**.
- Throttled updates are sent to Firestore (`drivers/{uid}.location` and `rides/{rideId}.driverLocation`) so customers and admins track the driver moving in real-time.
- Tracking is stopped immediately (`clearWatch`) when the driver goes offline or completes a ride.
- Includes **Google Maps Navigation Handoff** button (`https://www.google.com/maps/dir/?api=1&destination=...`) for instant turn-by-turn driving directions.

---

## 7. Safe Deployment (Preserving Admin and Customer Apps)

> **CRITICAL**: The existing apps run on:
> - Admin App: `https://go-plmr.web.app` (default hosting site)
> - Customer App: `https://go-plmr-customer.web.app` (customer hosting site)

To deploy the Driver app **WITHOUT touching or overwriting** existing apps:

1. Create a dedicated hosting site for drivers in the Firebase console:
   ```bash
   firebase hosting:sites:create go-plmr-driver
   ```
2. Apply the target name `driver` to the site:
   ```bash
   firebase target:apply hosting driver go-plmr-driver
   ```
3. Deploy **ONLY** the driver hosting target:
   ```bash
   npm run build
   firebase deploy --only hosting:driver
   ```
This deploys the Driver app cleanly to `https://go-plmr-driver.web.app` without altering the Admin or Customer hosting deployments.
