# GO PLMR — Customer Mobile Web Application

Professional, mobile-first ride-booking customer web application for **GO PLMR**, serving Palamaner, Andhra Pradesh, India. Fully integrated with the existing **GO PLMR Admin Panel** and Cloud Firestore database under project `go-plmr`.

---

## 1. Key Technologies

- **Frontend**: React 19, Vite 6, JavaScript (ESM)
- **Styling**: Tailwind CSS (mobile-first layout system with GO PLMR emerald/teal branding & dark slate contrast)
- **Routing**: React Router v7
- **Authentication**: Firebase Auth (Email/Password with mandatory Email Verification Link)
- **Database**: Cloud Firestore (real-time `onSnapshot` listeners for active trip tracking)
- **Mapping**: Leaflet + OpenStreetMap (100% free, reliable, Android WebView friendly, with no billing constraints)
- **Icons**: Lucide React
- **Hosting**: Firebase Hosting (`https://go-plmr-customer.web.app`)

---

## 2. Shared Firestore Architecture & Admin Integration

The customer application shares the production database with the GO PLMR Admin Web App:

### Customer Profiles: `/users/{userId}`
- `uid`: Firebase Auth User ID
- `fullName`: Customer full name
- `phoneNumber`: Contact number for ride coordination
- `email`: Verified customer email address
- `role`: `'customer'` (Strictly enforced; customers cannot claim admin rights)
- `status`: `'active'` (or `'suspended'`)
- `totalRidesAsCustomer`: Integer counter (synced with admin metrics)
- `savedPlaces`: Array of user-saved locations `[{ id, label, type, address, latitude, longitude }]`
- `createdAt`: ISO timestamp
- `updatedAt`: ISO timestamp

*Admin Impact*: Customers registered through this app immediately show in the Admin **Customers** directory and reflect on the Admin **Dashboard** total customer counts.

### Ride Records: `/rides/{rideId}`
- `id`: Auto-generated Firestore document ID
- `customerId`: UID of authenticated customer
- `customerName`: Rider display name
- `customerPhone`: Rider phone number
- `driverId`: Reference to assigned driver (set by Admin or future Worker app)
- `driverName`: Assigned driver name
- `driverPhone`: Assigned driver contact
- `vehicleCategory`: `'bike' | 'auto' | 'cab'`
- `status`: Lifecycle status:
  - `'requested'` (Initial state)
  - `'searching'`
  - `'driver_assigned'`
  - `'driver_arriving'`
  - `'ride_started'`
  - `'completed'`
  - `'cancelled'`
- `pickup`: `{ address, latitude, longitude }`
- `dropoff`: `{ address, latitude, longitude }`
- `fare`: `{ baseFare, distanceFare, timeFare, bookingFee, platformCommission, driverEarnings, totalFare, distanceKm, durationMinutes }`
- `paymentMethod`: `'cash' | 'upi'`
- `paymentStatus`: `'pending' | 'completed' | 'failed'`
- `otpVerified`: `false`
- `timestamps`:
  - `requestedAt`: ISO timestamp
  - `assignedAt`: ISO timestamp (when driver accepts)
  - `arrivingAt`: ISO timestamp
  - `startedAt`: ISO timestamp
  - `completedAt`: ISO timestamp
  - `cancelledAt`: ISO timestamp (if cancelled)
- `cancelledBy`: `'customer' | 'driver' | 'admin' | 'system'`
- `cancellationReason`: String reason provided by user

*Admin Impact*: Rides requested by customers appear in real-time in the Admin **Rides** management page and update active ride counters on the Admin **Dashboard**. When an administrator or assigned driver updates the ride status, the customer's live tracking view updates immediately.

### Customer Support Tickets: `/complaints/{complaintId}`
- `ticketNumber`: `TKT-XXXXXX`
- `rideId`: Associated ride document ID (if trip-related)
- `raisedByUid`: Customer UID
- `raisedByName`: Customer full name
- `raisedByPhone`: Customer phone number
- `raisedByRole`: `'customer'`
- `category`: `'fare' | 'driver_behavior' | 'vehicle_condition' | 'safety' | 'lost_item' | 'cancellation' | 'other'`
- `priority`: `'low' | 'medium' | 'high' | 'urgent'`
- `subject`: Summary text
- `description`: Detailed description
- `status`: `'open' | 'under_review' | 'resolved' | 'rejected'`
- `createdAt`: ISO timestamp

*Admin Impact*: Tickets appear directly in the Admin **Complaints & Grievances** page for review and resolution.

---

## 3. Local Development

```bash
# Navigate to project folder
cd go-plmr-customer

# Install dependencies
npm install

# Start development server
npm run dev
```

App will be available at `http://localhost:5174/`.

---

## 4. Production Build & Deployment

The Customer app is configured to deploy to its own isolated Firebase Hosting site: **`go-plmr-customer`**. It will **NEVER** overwrite or touch the existing Admin application at `https://go-plmr.web.app`.

```bash
# Build the production bundle
npm run build

# Preview production build locally
npm run preview

# Deploy only to the Customer Hosting site
npm run deploy
# OR:
npx firebase-tools deploy --only hosting --project go-plmr
```

---

## 5. Live Production URLs

- **Customer App**: [https://go-plmr-customer.web.app](https://go-plmr-customer.web.app)
- **Admin App**: [https://go-plmr.web.app](https://go-plmr.web.app)
- **Firebase Project ID**: `go-plmr`
