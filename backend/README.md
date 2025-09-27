# MediChain.AI Backend

Backend API for the MediChain.AI platform, a secure medical records management system built with NestJS, MongoDB, IPFS, and Polygon blockchain.

## Technology Stack

- **Framework**: NestJS
- **Database**: MongoDB with encryption for sensitive data
- **Blockchain**: Polygon (Ethereum compatible)
- **Decentralized Storage**: IPFS with encryption
- **Authentication**: JWT + Wallet-based (Web3)
- **Encryption**: AES-256 for data security
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
## Features

- **Role-based API access** for patients, doctors, hospitals, and system admins
- **End-to-end encryption** for medical records
- **Blockchain verification** of record integrity
- **Decentralized storage** with IPFS
- **Access control** managed through smart contracts
- **Detailed audit logging** for all record access
- **Patient-controlled sharing** of medical records

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB
- IPFS node (or use an IPFS gateway)
- Polygon account with test MATIC (for Mumbai testnet)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/medichain-backend.git
cd medichain-backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration

# Start MongoDB
# Use your preferred method to start MongoDB

# Start IPFS node (or use a gateway)
# If using a local IPFS node
ipfs daemon

# Deploy smart contract (if needed)
# Use Hardhat, Truffle, or Remix to deploy
# Update the POLYGON_CONTRACT_ADDRESS in .env
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start:prod
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register with email
- `POST /api/auth/login` - Login with email
- `POST /api/auth/wallet/register` - Register with wallet
- `POST /api/auth/wallet/login` - Login with wallet signature
- `POST /api/auth/wallet/link` - Link wallet to existing account
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/refresh` - Refresh JWT token

### Users
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/:id` - Get user by ID (admin only)
- `PUT /api/users/:id` - Update user data
- `DELETE /api/users/:id/deactivate` - Deactivate user (admin only)
- `PUT /api/users/:id/activate` - Activate user (admin only)
- `GET /api/users/hospital/:hospitalId/doctors` - Get hospital doctors

### Medical Records
- `POST /api/medical-records` - Create new medical record
- `GET /api/medical-records` - Get user's medical records
- `GET /api/medical-records/:id` - Get medical record by ID
- `GET /api/medical-records/:id/file` - Download medical record file
- `POST /api/medical-records/:id/share` - Share medical record
- `DELETE /api/medical-records/:id/revoke/:userId` - Revoke access
- `GET /api/medical-records/:id/access` - View access list
- `POST /api/medical-records/:id/verify` - Verify record integrity

### Appointments
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments` - Get user's appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Hospitals
- `GET /api/hospitals` - List hospitals
- `POST /api/hospitals` - Create hospital (admin only)
- `GET /api/hospitals/:id` - Get hospital details
- `PUT /api/hospitals/:id` - Update hospital (admin only)
- `PUT /api/hospitals/:id/ai-settings` - Update hospital AI settings

### Access Logs
- `GET /api/access-logs` - Get access logs for user's records
- `GET /api/access-logs/:recordId` - Get access logs for specific record
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
