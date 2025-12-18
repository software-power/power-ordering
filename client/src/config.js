// Detect if we are in development (port 5173) or production (server serving app)
const isDev = window.location.port === '5173';

// If dev, talk to port 4000. If production, talk to the same host/port serving the app.
export const API_URL = isDev
    ? `${window.location.protocol}//${window.location.hostname}:4000`
    : `${window.location.origin}`;