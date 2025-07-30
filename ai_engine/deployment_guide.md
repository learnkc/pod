# Deployment Guide: 1-Click Podcast Guest Tracker

This guide will help you deploy the 1-Click Podcast Guest Tracker on your college server where LLaMA 3.1 models are already running.

## Prerequisites

- Access to a server with LLaMA 3.1 models (70B and 8B) already deployed
- Python 3.8+ installed on the server
- Git installed on the server
- Basic knowledge of Linux commands

## Step 1: Clone the Repository

```bash
# Clone the repository to your server
git clone https://github.com/yourusername/podcast-guest-tracker.git
cd podcast-guest-tracker
```

## Step 2: Install Dependencies

```bash
# Make the installation script executable
chmod +x install_deps.sh

# Run the installation script
./install_deps.sh
```

## Step 3: Configure Environment Variables

Create or edit the `.env` file to point to your LLaMA 3.1 models:

```bash
# Create .env file
cat > .env << EOL
# 1-Click Podcast Guest Tracker Configuration

# LLM URLs (adjust based on your setup)
MIXTRAL_URL=http://localhost:8080  # URL for your LLaMA 3.1 70B model
LLAMA_8B_URL=http://localhost:8081  # URL for your LLaMA 3.1 8B model
LLAMA_70B_URL=http://localhost:8080  # URL for your LLaMA 3.1 70B model

# Optional API Keys
YOUTUBE_API_KEY=your_youtube_api_key_here
TWITTER_BEARER_TOKEN=your_twitter_bearer_token_here
LINKEDIN_CLIENT_ID=your_linkedin_client_id_here

# Analysis Settings
MAX_VIDEOS_TO_ANALYZE=50
CACHE_DURATION_HOURS=24
EOL
```

## Step 4: Test the Connection to LLaMA Models

```bash
# Test connection to your LLaMA 3.1 models
python test_remote_llm.py http://localhost:8080
```

## Step 5: Start the System

```bash
# Make the startup script executable
chmod +x start_system.sh

# Start the system
./start_system.sh
```

## Step 6: Access the Web Interface

The web interface will be available at:

```
http://your-server-ip:12000
```

You may need to configure your server's firewall to allow access to port 12000.

## Step 7: Set Up as a Service (Optional)

To ensure the system runs continuously and starts automatically on server reboot, you can set it up as a systemd service:

```bash
# Create a systemd service file
sudo cat > /etc/systemd/system/podcast-tracker.service << EOL
[Unit]
Description=1-Click Podcast Guest Tracker
After=network.target

[Service]
User=your_username
WorkingDirectory=/path/to/podcast-guest-tracker
ExecStart=/path/to/podcast-guest-tracker/start_system.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOL

# Reload systemd, enable and start the service
sudo systemctl daemon-reload
sudo systemctl enable podcast-tracker
sudo systemctl start podcast-tracker
```

## Troubleshooting

### LLM Connection Issues

If you're having trouble connecting to your LLaMA 3.1 models:

1. Verify the models are running and accessible:
   ```bash
   curl http://localhost:8080/health
   ```

2. Check if the API format matches what the system expects (see `remote_llm_setup.md`)

3. Update the LLM client code if necessary to match your API format

### Web Interface Not Accessible

If you can't access the web interface:

1. Check if the web app is running:
   ```bash
   ps aux | grep web_app.py
   ```

2. Verify the port is open in your firewall:
   ```bash
   sudo ufw status
   ```

3. If needed, allow the port:
   ```bash
   sudo ufw allow 12000
   ```

## Using the CLI Version

If you prefer to use the command-line interface:

```bash
python run_analyzer.py "Guest Name" "Guest URL" "Host Channel URL"
```

Example:
```bash
python run_analyzer.py "Elon Musk" "https://twitter.com/elonmusk" "https://youtube.com/@lexfridman"
```
