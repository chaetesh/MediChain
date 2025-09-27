# MediChain.AI

![MediChain.AI Logo](public/vercel.svg)

MediChain.AI revolutionizes healthcare data management by combining blockchain security, AI-powered insights, and patient-controlled access. This Next.js application provides a comprehensive platform for patients, doctors, hospital administrators, and system administrators to securely manage and share healthcare data.

## Table of Contents
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Role-Based Interfaces](#role-based-interfaces)
- [Key Components](#key-components)
- [Getting Started](#getting-started)
- [Web3 Integration](#web3-integration)
- [Documentation](#documentation)

## Features

- **Blockchain Security**: Medical records secured with Polygon blockchain technology
- **AI-Powered Insights**: Intelligent summaries and predictive analysis of medical records
- **Patient-Controlled Access**: Full ownership and sharing control for patients
- **Multi-Role System**: Custom interfaces for patients, doctors, hospitals, and admins
- **Secure Authentication**: Email, wallet, and OTP/QR code verification
- **Real-time Analytics**: Usage statistics and access tracking
- **Responsive Design**: Modern UI that works on all devices

## Technology Stack

- **Framework**: Next.js 15.4.2
- **UI Library**: React 19.1.0
- **Styling**: TailwindCSS 4
- **State Management**: Zustand 5.0.6
- **Icons**: Lucide React
- **Web3 Integration**: Wagmi 2.16.0, Viem 2.32.1
- **Form Handling**: React Hook Form 7.60.0, Zod 3.25.76
- **Data Visualization**: Recharts 3.1.0
- **QR Code Generation**: QRCode.react 4.2.0

## Project Structure

```
src/
  app/ - Next.js pages using App Router
    page.tsx - Landing page
    layout.tsx - Root layout
    auth/ - Authentication pages
    dashboard/ - Main dashboard
    patient/ - Patient-specific pages
    doctor/ - Doctor-specific pages
    hospital/ - Hospital admin pages
    admin/ - System admin pages
  components/ - Reusable UI components
  lib/ - Utility functions and type definitions
  store/ - Zustand state management
```

## Role-Based Interfaces

### Patient Interface
- Upload and manage medical records
- Control sharing permissions
- View access logs of who viewed records
- Manage wallet and security settings
- Schedule appointments
- Review record access history

### Doctor Interface
- Search for patients
- Access patient records via QR/OTP
- Upload patient records
- View appointments
- Update profile information

### Hospital Admin Interface
- Manage doctors and patients
- Configure AI settings for the hospital
- View access logs and analytics
- Handle billing and appointments
- Access support features

### System Admin Interface
- Manage user accounts
- Oversee hospital management
- Review audit logs
- Monitor blockchain status
- Configure AI system settings
- Handle support tickets

## Key Components

### Authentication System
The application uses Zustand for state management with role-based authentication:
- `useAuthStore`: Manages user authentication state and profiles
- `ProtectedRoute`: Component that handles role-based access control

### UI Components
- `Sidebar`: Dynamic navigation based on user role
- `Card & StatCard`: UI components for displaying data
- `Button`: Styled button component with variants
- `PageHeader`: Consistent page header component

### Data Models
Key TypeScript interfaces include:
- `MedicalRecord`: Patient medical records with blockchain verification
- `Patient`: Patient information including wallet address
- `Doctor`: Doctor information with specialization
- `Hospital`: Hospital details with subscription plan
- `AccessLog`: Record access tracking
- `AIConfiguration`: AI feature settings

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Web3 Integration

MediChain.AI integrates with Web3 technologies for enhanced security and decentralization:

- **Wallet Authentication**: Connect wallet for secure sign-in
- **Blockchain Verification**: Records are hashed and stored on blockchain
- **Decentralized Identity**: Patients can use wallet addresses as identifiers

## Documentation

### State Management
The application uses Zustand for state management with persisted authentication:

```typescript
// Example from useAuthStore.ts
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      // Other state properties and methods...
    }),
    {
      name: 'medichain-auth',
    }
  )
);
```

### Utility Functions
Helper functions for common operations:

```typescript
// Example from utils.ts
export function formatDate(date: Date | string) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function generateQRData(patientId: string, accessToken: string) {
  return JSON.stringify({
    patientId,
    accessToken,
    timestamp: Date.now(),
    platform: 'MediChain.AI'
  });
}
```

---

This project is designed to showcase how blockchain technology and AI can revolutionize healthcare data management while keeping patients in control of their information.
