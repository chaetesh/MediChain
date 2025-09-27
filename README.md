# MediChain Web3 Healthcare Platform

A secure, blockchain-based healthcare platform for managing medical records, appointments, and administrative tasks.

## Project Structure

This repository contains both the frontend and backend code:

- `/frontend`: Next.js-based frontend application
- `/backend`: NestJS-based backend API server

## Getting Started

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run start:dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

## Features

- Medical records management with blockchain verification
- Appointment scheduling system
- Role-based access control (Patients, Doctors, Hospital Admins, System Admins)
- Secure document sharing with encryption
- Blockchain integration for data integrity
- IPFS integration for decentralized storage

## Technology Stack

- Frontend: Next.js, React, TypeScript
- Backend: NestJS, TypeScript, MongoDB
- Blockchain: Polygon (Ethereum-compatible)
- Storage: IPFS / Lighthouse
- Authentication: JWT, Web3 wallet authentication
