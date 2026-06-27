import os from 'os';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

const ip = getLocalIp();
const envContent = `VITE_API_URL=http://${ip}:5001\n`;

try {
    fs.writeFileSync(envPath, envContent);
    console.log(`✅ Success: Updated .env with LAN IP: ${ip}`);
    console.log(`📱 Mobile Access: http://${ip}:5173`);
} catch (err) {
    console.error('❌ Error writing .env file:', err);
}
