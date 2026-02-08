# Cloudflare Tunnel Setup Guide

This guide explains how to set up and use Cloudflare Tunnel to expose your local LiquidityScan application to the internet.

## What is Cloudflare Tunnel?

Cloudflare Tunnel (formerly Argo Tunnel) allows you to expose your local development server to the internet without opening ports on your router or firewall. It creates a secure connection through Cloudflare's network.

## Prerequisites

- Cloudflare account (free tier works)
- `cloudflared` CLI tool installed

## Installation

### Windows

1. **Using winget (recommended):**
   ```powershell
   winget install --id Cloudflare.cloudflared
   ```

2. **Using Chocolatey:**
   ```powershell
   choco install cloudflared
   ```

3. **Manual installation:**
   - Download from: https://github.com/cloudflare/cloudflared/releases
   - Extract and add to PATH

4. **Verify installation:**
   ```powershell
   cloudflared --version
   ```

## Quick Start (Temporary Tunnel)

The easiest way to get started is using a quick tunnel (no login required):

```powershell
# Start frontend first (in one terminal)
cd frontend
npm run dev

# Start backend (in another terminal)
cd backend
npm run start:dev

# Start tunnel (in a third terminal)
cd liquidityscan-web
.\start-cloudflare-tunnel.ps1
```

Or manually:
```powershell
# Expose frontend only
cloudflared tunnel --url http://localhost:5173

# Or expose both (requires configuration)
cloudflared tunnel --url http://localhost:5173 --url http://localhost:3000
```

The tunnel will display a URL like:
```
https://random-name.trycloudflare.com
```

**Note:** Quick tunnels are temporary and the URL changes each time you restart.

## Named Tunnel (Permanent URL)

For a permanent URL, you need to create a named tunnel:

### 1. Login to Cloudflare

```powershell
cloudflared tunnel login
```

This will open your browser to authorize the tunnel.

### 2. Create a Tunnel

```powershell
cloudflared tunnel create liquidityscan-dev
```

### 3. Configure the Tunnel

The configuration file is already created at `.cloudflared/config.yml`. It includes:

- Frontend service on port 5173
- Backend API on port 3000
- Catch-all rule for 404 errors

### 4. Run the Tunnel

```powershell
cloudflared tunnel run liquidityscan-dev
```

### 5. Create DNS Records (Optional)

To use a custom domain:

```powershell
# Create DNS record for frontend
cloudflared tunnel route dns liquidityscan-dev frontend.yourdomain.com

# Create DNS record for backend API
cloudflared tunnel route dns liquidityscan-dev api.yourdomain.com
```

## Using the Script

We've provided a PowerShell script for easy tunnel management:

```powershell
.\start-cloudflare-tunnel.ps1
```

The script will:
- Check if `cloudflared` is installed
- Verify that frontend/backend services are running
- Start the tunnel and display the URL

## Configuration

The tunnel configuration is in `.cloudflared/config.yml`:

```yaml
tunnel: liquidityscan-dev
credentials-file: .cloudflared/tunnel-credentials.json

ingress:
  # Frontend
  - hostname: liquidityscan-dev.trycloudflare.com
    service: http://localhost:5173
  
  # Backend API
  - hostname: liquidityscan-api-dev.trycloudflare.com
    service: http://localhost:3000
  
  # Catch-all
  - service: http_status:404
```

## Troubleshooting

### Tunnel won't start

1. **Check if services are running:**
   ```powershell
   # Check frontend
   Test-NetConnection -ComputerName localhost -Port 5173
   
   # Check backend
   Test-NetConnection -ComputerName localhost -Port 3000
   ```

2. **Check cloudflared logs:**
   ```powershell
   cloudflared tunnel info liquidityscan-dev
   ```

### Connection refused

- Make sure your frontend/backend services are running
- Verify the ports in `config.yml` match your service ports
- Check firewall settings (though tunnel should bypass firewall)

### URL not accessible

- Quick tunnels expire when you close the terminal
- Named tunnels persist but require login
- Check Cloudflare dashboard for tunnel status

## Security Notes

- Quick tunnels are public - anyone with the URL can access
- Use named tunnels with authentication for production
- Consider adding Cloudflare Access for additional security
- Never commit `tunnel-credentials.json` to version control

## Advanced: Multiple Services

To expose multiple services with different paths:

```yaml
ingress:
  - hostname: app.yourdomain.com
    service: http://localhost:5173
  - hostname: api.yourdomain.com
    service: http://localhost:3000
  - path: /api/*
    service: http://localhost:3000
  - service: http_status:404
```

## Resources

- [Cloudflare Tunnel Documentation](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)
- [cloudflared GitHub](https://github.com/cloudflare/cloudflared)
- [Cloudflare Dashboard](https://dash.cloudflare.com/)
