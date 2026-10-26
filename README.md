# Go PLMR — Two Friends, One Idea, One Platform

> **A modern, hyper-local ride-booking and mobility platform built from the ground up for Palamaner, Andhra Pradesh, India.**

[![Live Admin](https://img.shields.io/badge/Admin%20Panel-go--plmr.web.app-blue?style=flat-square&logo=firebase)](https://go-plmr.web.app)
[![Live Customer](https://img.shields.io/badge/Customer%20App-go--plmr--customer.web.app-green?style=flat-square&logo=firebase)](https://go-plmr-customer.web.app)
[![Live Driver](https://img.shields.io/badge/Driver%20App-go--plmr--driver.web.app-orange?style=flat-square&logo=firebase)](https://go-plmr-driver.web.app)

---

## 1. Project Overview & Story

The **Go PLMR** platform originated as a shared vision between two close friends, **B. Vinay** and **A. Ajith**. Growing up in and around Palamaner (Chittoor district, Andhra Pradesh), we observed firsthand that while metropolitan cities enjoy frictionless digital ride-hailing services, regional towns and semi-urban communities remain underserved. Passengers routinely faced unstandardized pricing and prolonged wait times, while local auto and cab drivers lacked a unified digital channel to discover rides efficiently.

Rather than waiting for external solutions, we teamed up to build **Go PLMR** — an integrated three-tier digital mobility platform specifically engineered to handle local town logistics, flexible vehicle tiers (Autos, Bikes, and Cabs), transparent distance-based pricing, and real-time ride tracking, all operating on an open-source, cost-efficient technology stack.

---

## 2. Our Achievement: Three Deployed Web Applications

We designed, engineered, and successfully deployed all three interconnected applications to production on Firebase Hosting:

| Application | Role & Purpose | Live Production URL |
| :--- | :--- | :--- |
| **Admin Panel** | Central operations dashboard for ride dispatch, driver KYC verification, geofencing, dynamic fare configuration, analytics, and dispute handling. | [https://go-plmr.web.app](https://go-plmr.web.app/) |
| **Customer App** | Mobile-first ride booking experience for riders to select pickup/dropoff, view upfront fare estimates, track assigned drivers in real time, and verify rides via OTP. | [https://go-plmr-customer.web.app](https://go-plmr-customer.web.app/) |
| **Driver App** | Dedicated driver partner web app featuring online/offline duty toggle, real-time ride dispatch audio alerts, Leaflet turn-by-turn guidance, OTP ride verification, and digital payment collection. | [https://go-plmr-driver.web.app](https://go-plmr-driver.web.app/) |

---

## 3. Technology Stack

Both frontend and backend architectures were selected to guarantee fast load times, zero-cost mapping constraints, and real-time synchronization:

### Frontend
- **Framework & Core**: [React 19](https://react.dev/) (React 19 with Vite 8 / Vite 6 bundlers)
- **Language**: TypeScript (Admin Panel) & Modern JavaScript ESM (Customer and Driver applications)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 3.4 with custom Emerald & Slate color palettes, PostCSS, Autoprefixer
- **Icons**: [Lucide React](https://lucide.dev/)
- **Routing**: [React Router v7](https://reactrouter.com/)
- **Forms & Validation**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)
- **Analytics & Data Visualization**: [Recharts](https://recharts.org/) (Admin metrics, earnings, and trip distributions)
- **Mapping & Geospatial**: [Leaflet 1.9](https://leafletjs.com/) and [React-Leaflet 5](https://react-leaflet.js.org/) utilizing [OpenStreetMap](https://www.openstreetmap.org/) tiles for 100% open, zero-cost, high-performance geospatial rendering without third-party API billing caps.

### Backend & Cloud Infrastructure (Firebase)
- **Authentication**: Firebase Authentication (Email/Password with email verification links and role-based claim protection)
- **Primary Database**: Cloud Firestore (NoSQL document store with live snapshot listeners for trips, drivers, and user records)
- **Realtime Streaming**: Firebase Realtime Database (RTDB) for high-frequency driver geolocation broadcast
- **Cloud Storage**: Firebase Cloud Storage for driver KYC documentation (Driver Licenses, RC books, vehicle photos, and helmet compliance checks)
- **Serverless Automation**: Firebase Cloud Functions (Node.js TypeScript triggers for automated platform accounting and audit tracking)
- **Hosting**: Firebase Hosting with custom rewrites, HTTP caching policies, and global CDN delivery

---

## 4. Key Features Verified from Codebase

### Admin Panel (`admin/`)
- **Operations Dashboard**: Live counters for total completed trips, active riders, onboarded drivers, daily revenue, and commission metrics.
- **Driver KYC & Lifecycle Management**: Review driver submissions, inspect uploaded driver licenses and RC books, approve/suspend driver profiles, and assign vehicle categories (`bike`, `auto`, `cab`).
- **Live Ride Dispatch & Monitoring**: Real-time table of all ongoing, searching, and completed rides with live status filtering and override capabilities.
- **Service Area Geofencing**: Configurable geospatial service boundary polygon centered on Palamaner coordinates (`~13.2000° N, 78.7500° E`) to prevent out-of-boundary requests.
- **Dynamic Fare Engine**: Granular control over base fare, per-kilometer rate, per-minute time fare, booking fees, minimum fare, and platform commission percentage per vehicle class.
- **Customer Directory**: Central customer registry displaying ride counts, status, and contact details.
- **Dispute Resolution & Audit Logs**: System-wide audit log tracking administrative updates and customer/driver grievance ticket management.
- **Data Export**: Built-in CSV export for accounting and operational reporting.

### Customer Web App (`customer/`)
- **Mobile-First Responsive Layout**: App-like UI with bottom navigation, sliding sheets, and toast notifications.
- **Interactive Pin & Place Selection**: Interactive Leaflet map picker and search bar for quick origin/destination selection.
- **Category & Fare Estimation**: Dynamic comparison between Bike, Auto, and Cab options with itemized breakdowns (base fare, distance rate, platform fee).
- **Live Ride Lifecycle Tracking**: Real-time Firestore `onSnapshot` subscriptions tracking trip state transitions:
  `requested` &rarr; `searching` &rarr; `driver_assigned` &rarr; `driver_arriving` &rarr; `ride_started` &rarr; `completed`.
- **Safety & Verification**: 4-digit pickup OTP verification to guarantee rider safety before any ride commences.
- **Saved Places & History**: Fast one-tap access to Home, Work, and Saved Locations; detailed ride history with digital receipts.
- **Emergency SOS & Support**: Quick-dial emergency contacts and integrated support request flows.

### Driver Partner Web App (`driver/`)
- **Driver Onboarding**: Guided multi-step registration with vehicle categorization and license document upload.
- **Duty Toggle**: Instant Online/Offline state switcher with background geolocation streaming.
- **Interactive Dispatch Dispatcher**: High-contrast incoming trip popup featuring pickup address, distance, estimated earnings, and a countdown timer.
- **Turn-by-Turn Route Display**: Integrated Leaflet navigation displaying driver position, pickup point, and dropoff destination.
- **Ride Verification Flow**: In-app OTP prompt to validate customer identity before starting the trip.
- **Payment Collection**: Cash and dynamic digital UPI QR code display upon trip completion.
- **Earnings & Performance**: Daily and weekly trip summaries, total fare calculations, and platform commission breakdown.
- **Safety Compliance**: Built-in helmet check selfie verification step for two-wheeler drivers.

---

## 5. Project Folder Structure

The repository maintains clean separation between all three applications with shared root-level configurations:

```text
go-plmr/
├── admin/                        # Go PLMR Admin Panel (React 19 + TypeScript + Vite 8)
│   ├── functions/                # Firebase Cloud Functions (TypeScript serverless backend)
│   ├── public/                   # Static assets, SVG icons, and web manifest
│   ├── scripts/                  # Administrative setup and seed scripts
│   ├── src/                      # Admin source code
│   │   ├── components/           # UI components, modals, tables, and charts
│   │   ├── context/              # Authentication and operational context providers
│   │   ├── pages/                # Admin views (Dashboard, Drivers, Rides, Fares, Service Area)
│   │   ├── routes/               # Protected route management
│   │   ├── services/             # Firebase Firestore, RTDB, and Audit service layer
│   │   ├── types/                # TypeScript interface definitions
│   │   └── utils/                # CSV export, date formatters, and class utilities
│   ├── .env.example              # Admin environment configuration template
│   ├── database.rules.json       # Realtime Database security rules
│   ├── firebase.json             # Firebase Hosting and Functions configuration
│   ├── firestore.indexes.json    # Firestore composite index definitions
│   ├── firestore.rules           # Admin-level Firestore security rules
│   ├── index.html                # Single-page HTML entry point
│   ├── package.json              # Admin dependencies and build scripts
│   ├── storage.rules             # Storage bucket security rules
│   ├── tailwind.config.js        # Admin Tailwind CSS design configuration
│   ├── tsconfig.json             # TypeScript compiler settings
│   └── vite.config.ts            # Vite build configuration
│
├── customer/                     # Go PLMR Customer Application (React 19 + Vite 6)
│   ├── src/                      # Customer source code
│   │   ├── components/           # Mobile UI components (CategorySelector, BottomSheet, MapView)
│   │   ├── context/              # Rider Auth and Ride lifecycle state providers
│   │   ├── layouts/              # AppLayout with bottom navigation
│   │   ├── pages/                # Views (Home, Booking, ActiveRide, RideHistory, Profile, Safety)
│   │   ├── routes/               # Customer protected routing
│   │   ├── services/             # Customer Firebase Auth, Firestore, and Fare services
│   │   └── utils/                # Geo-calculation and pricing utility helpers
│   ├── .env.example              # Customer environment configuration template
│   ├── firebase.json             # Customer Firebase Hosting configuration
│   ├── firestore.rules           # Customer-side Firestore security rules
│   ├── index.html                # Mobile-viewport optimized HTML entry point
│   ├── package.json              # Customer dependencies and build scripts
│   ├── tailwind.config.js        # Emerald/Slate customer theme configuration
│   └── vite.config.js            # Vite build configuration
│
├── driver/                       # Go PLMR Driver Partner Application (React 19 + Vite 8)
│   ├── public/                   # Driver icons, sound alerts, and assets
│   ├── server/                   # Optional local helper server
│   ├── src/                      # Driver source code
│   │   ├── assets/               # Vehicle illustrations and helmet icons
│   │   ├── components/           # Driver UI (IncomingRequestModal, RouteMap, PaymentModal, SosModal)
│   │   ├── context/              # Driver authentication and live location tracking providers
│   │   ├── firebase/             # Driver Firebase client initialization
│   │   ├── services/             # Driver geolocation, status, and earnings service layer
│   │   ├── App.jsx               # Main Driver application component
│   │   ├── index.css             # Driver mobile CSS theme
│   │   └── main.jsx              # React DOM driver bootstrap
│   ├── .env.example              # Driver environment configuration template
│   ├── firebase.json             # Driver Firebase Hosting configuration
│   ├── firestore.rules           # Driver-level Firestore security rules
│   ├── index.html                # Driver HTML entry point
│   ├── package.json              # Driver dependencies and build scripts
│   ├── storage.rules             # Driver document upload storage rules
│   ├── tailwind.config.js        # Driver Tailwind CSS styling configuration
│   └── vite.config.js            # Vite build configuration
│
├── .gitignore                    # Root ignore configuration for node_modules, dist, and secrets
└── README.md                     # Comprehensive project documentation
```

---

## 6. Installation & Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (version `18.x` or higher recommended)
- [npm](https://www.npmjs.com/) (version `9.x` or higher)
- A Firebase project configured in the Firebase Console (default: `go-plmr`)

### 1. Clone the Repository
```bash
git clone https://github.com/Vinay786-3009/go-plmr.git
cd go-plmr
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` inside each project folder and populate your Firebase client keys:

```bash
# Admin
cp admin/.env.example admin/.env

# Customer
cp customer/.env.example customer/.env

# Driver
cp driver/.env.example driver/.env
```

### 3. Install Dependencies & Run Applications

#### Admin Panel
```bash
cd admin
npm install
npm run dev
# Running on http://localhost:5173
```

#### Customer App
```bash
cd customer
npm install
npm run dev
# Running on http://localhost:5174
```

#### Driver App
```bash
cd driver
npm install
npm run dev
# Running on http://localhost:5175
```

---

## 7. Firebase Configuration & Security Guidance

### Security Checklist
1. **Never Commit Secret Keys**:
   - Private environment files (`.env`, `.env.local`) are strictly excluded via `.gitignore`.
   - Never commit Firebase service account private keys (`*serviceAccountKey*.json`).
2. **Client Config Transparency**:
   - Standard Firebase Web SDK configuration keys (`apiKey`, `projectId`, `appId`) are meant for client authentication and are safely templated in `.env.example`.
3. **Database Security Rules**:
   - Both Firestore and RTDB enforce strict role-based access rules. Only authenticated drivers may update their real-time location.
   - Customers may only read and write their own ride documents.
   - Administrative configurations (`/fares`, `/serviceArea`, `/auditLogs`) are locked down to admin users.

### Deploying to Firebase
To deploy any of the applications independently, install the Firebase CLI and target the designated hosting site:

```bash
# Deploy Admin Panel
cd admin
npm run build
npx firebase-tools deploy --only hosting --project go-plmr

# Deploy Customer Application
cd customer
npm run build
npx firebase-tools deploy --only hosting:go-plmr-customer --project go-plmr

# Deploy Driver Application
cd driver
npm run build
npx firebase-tools deploy --only hosting:go-plmr-driver --project go-plmr
```

---

## 8. Contributors

This platform is co-founded and built with pride by two friends:

- **B. Vinay** — [GitHub Profile (@Vinay786-3009)](https://github.com/Vinay786-3009)
- **A. Ajith** — [GitHub Profile (@Ajith219)](https://github.com/Ajith219)

---

## 9. Development Journey, Lessons Learned & Future Vision

### The Journey
Building Go PLMR from a whiteboard conversation between two friends into three production-deployed web applications was an exhilarating engineering exercise. Working across three interconnected applications forced us to think deeply about system architecture, state transitions, and real-world edge cases like low network bandwidth, driver location latency, and dispute handling.

### Key Lessons
1. **Real-time State Synchronization**: Managing ride lifecycle states across three independent applications simultaneously required resilient listeners (`onSnapshot`) with strict idempotent state guards.
2. **Open-Source Mapping Without Cost Bottlenecks**: By adopting Leaflet and OpenStreetMap, we achieved zero-cost, high-performance location selection and route tracking without falling prey to commercial API billing limits.
3. **Mobile-First Web Over Native Complexity**: Leveraging modern mobile-first web technologies (Tailwind CSS, responsive touch targets, PWA features) allowed us to deploy fast, lightweight experiences accessible on any mobile browser without requiring large app downloads.

### Future Vision
- **FCM Push Notifications**: Adding Web Push notifications and sound alerts for incoming ride requests on mobile devices.
- **Native Android Wrappers**: Packaging the Customer and Driver web applications into lightweight Android APKs via Capacitor or Trusted Web Activities (TWA).
- **Automated Payout Reconciliation**: Integration with UPI auto-split payment gateways to automate commission deduction and driver daily settlements.
- **Regional Expansion**: Expanding the service area boundary beyond Palamaner to neighboring regional hubs across Chittoor district.

---

<p align="center">
  <b>Go PLMR — Empowering Local Communities with Seamless Mobility.</b><br>
  Built with passion by <b>B. Vinay</b> and <b>A. Ajith</b>.
</p>
