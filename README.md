# YBA Frontend Application

A mobile-first frontend application built with React and Zalo Mini App SDK for YBA (Young Business Association) operations.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v20)
- Zalo Mini App CLI
- npm or yarn package manager

## Tech Stack

- Framework: React 18
- UI Framework: ZMP UI
- State Management: Recoil
- Styling:
  - Tailwind CSS
  - SCSS
- Router: React Router DOM
- Additional Libraries:
  - Swiper
  - React QR Scanner
  - React Hot Toast

## Project Structure

```
jam-yba-frontend/
├── src/
│   ├── components/     # Reusable components
│   ├── pages/         # Page components
│   ├── services/      # API services
│   ├── state/         # Recoil state management
│   ├── utils/         # Utility functions
│   ├── css/           # Stylesheets
│   └── app.js         # App entry point
├── public/            # Static assets
└── zmp-cli.json       # Zalo Mini App configuration
```

## Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd jam-yba-frontend
```

2. Install dependencies:

```bash
npm install --force
# or
yarn install --force
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Required environment variables:

- `APP_ID`: Your Zalo Mini App ID (Get this from Zalo Developer Portal)
- `ZMP_TOKEN`: Your Zalo Mini App authentication token

Example .env file:

```bash
APP_ID=123456789
ZMP_TOKEN=your_zmp_token_here
```

## Development

Start the development server:

```bash
npm start
# or
yarn start
```

The app will start in development mode using the Zalo Mini App simulator.

## Building for Production

Build the app for production:

```bash
npm run deploy
# or
yarn deploy
```

## Features

- User Authentication & Profile Management
- Event Management
  - Event Listing
  - Event Details
  - Ticket Management
- News & Posts
  - News Feed
  - Post Details
- QR Code Scanning & Generation
- Member Registration & Verification
- Responsive Design
- Real-time Notifications

## Key Components

### Pages

- Home Page: Event listings and news feed
- User Profile: Member information and settings
- Event Details: Comprehensive event information
- Ticket Management: Digital ticket handling
- News Feed: Latest updates and announcements

### Core Features

- Zalo Mini App Integration
- QR Code Generation & Scanning
- Real-time State Management
- Responsive Image Handling
- Smooth Page Transitions

## Styling

The project uses a combination of:

- Tailwind CSS for utility-first styling
- SCSS for custom components
- ZMP UI components for Zalo Mini App native look and feel

## Best Practices

- Component-based architecture
- Reusable UI components
- State management with Recoil
- Progressive loading
- Mobile-first design
- Performance optimization

## Integration

This frontend application integrates with:

- YBA Backend Service
- Zalo Mini App Platform
- Payment Gateways
- Image Storage Services

## Troubleshooting

Common issues and solutions:

### Build Issues

- Clear node_modules and reinstall dependencies
- Check Zalo Mini App CLI version compatibility
- Verify zmp-cli.json configuration

### Development Environment

- Ensure correct Node.js version
- Verify Zalo Mini App simulator setup
- Check development server port availability

## Support

For support and questions, please contact the development team.

## License

This project is private and proprietary. All rights reserved.
