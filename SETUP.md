# LoRa Water Level Monitoring Dashboard

A real-time monitoring dashboard for LoRa water level sensors using React, Firebase Realtime Database, and TailwindCSS.

## Features

- 📊 **Real-time Dashboard** - Live water level data from Firebase
- 🌊 **Water Level Cards** - Visual display with alert levels (Critical/Warning/Moderate/Normal)
- 📈 **History Charts** - 24-hour water level trends
- 📡 **Gateway Status** - Monitor LoRa gateway status, signal strength, and packet statistics
- 🔄 **Auto-refresh** - Real-time updates via Firebase Realtime Database
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile

## Setup Instructions

### 1. Firebase Configuration

1. Create a Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Realtime Database
3. Get your Firebase credentials from Project Settings

### 2. Environment Variables

Create a `.env.local` file in your project root with your Firebase configuration:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Database Rules

Set up these Firebase Realtime Database rules for development:

```json
{
  "rules": {
    "flood": {
      ".read": true,
      ".write": true
    }
  }
}
```

**Note**: For production, use proper authentication rules.

### 4. Install Dependencies

Dependencies are already installed. If needed:

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

## Firebase Data Structure

Your Firebase Realtime Database should have this structure:

```
flood/
├── gateway/
│   ├── gateway_id: "GW_01"
│   ├── status: "online"
│   ├── last_activity: 25
│   ├── total_received: 2
│   ├── total_failed: 0
│   └── wifi_rssi: -64
└── nodes/
    └── [NODE_NAME]/
        ├── latest/
        │   ├── gateway_id: "GW_01"
        │   ├── water_level_cm: 47.4
        │   ├── rssi_gw: -44
        │   ├── snr_gw: 12.5
        │   ├── pkt_count: 4
        │   └── timestamp: 37
        └── history/
            └── [RECORD_ID]/
                └── (same as latest)
```

## Water Level Alert Levels

- 🟢 **NORMAL**: < 100 cm
- 🟡 **MODERATE**: 100-200 cm
- 🟠 **WARNING**: 200-300 cm
- 🔴 **CRITICAL**: > 300 cm

These thresholds can be customized in `src/components/WaterLevelCard.tsx`

## Project Structure

```
src/
├── components/
│   ├── Dashboard.tsx        # Main dashboard component
│   ├── GatewayStatus.tsx    # Gateway status display
│   ├── WaterLevelCard.tsx   # Individual water level cards
│   └── HistoryChart.tsx     # Water level history chart
├── types/
│   └── index.ts             # TypeScript interfaces
├── firebase.ts              # Firebase initialization
├── App.tsx                  # App entry point
└── main.tsx                 # React entry point
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Technologies Used

- **React 19** - UI framework
- **Firebase v12** - Real-time database
- **TailwindCSS v4** - Styling
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Lucide React** - Icons

## Customization

### Change Alert Thresholds

Edit `src/components/WaterLevelCard.tsx`, function `getWaterLevelStatus()`:

```tsx
const getWaterLevelStatus = (level: number) => {
  if (level > 300)
    return { color: "text-red-600", bg: "bg-red-50", label: "CRITICAL" };
  if (level > 200)
    return { color: "text-orange-600", bg: "bg-orange-50", label: "WARNING" };
  if (level > 100)
    return { color: "text-yellow-600", bg: "bg-yellow-50", label: "MODERATE" };
  return { color: "text-green-600", bg: "bg-green-50", label: "NORMAL" };
};
```

### Add More Nodes

The dashboard automatically displays all nodes in your Firebase database under `flood/nodes/`. Just add new nodes to your database with the same structure.

## Troubleshooting

### "Failed to connect to database"

- Check Firebase configuration in `.env.local`
- Verify database URL is correct
- Check Firebase Realtime Database rules allow `.read: true`

### No data showing

- Verify data structure matches the required format
- Check browser console for error messages
- Ensure Firebase database has data under `flood/` path

### Responsive Issues

- The dashboard is built with TailwindCSS responsive grid
- Edit grid classes in components if needed (e.g., `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`)

## License

MIT

## Support

For issues or questions, check your Firebase console and browser console for error messages.
