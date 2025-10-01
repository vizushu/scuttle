#!/usr/bin/env python3
"""
main.py

Usage:
  python main.py --webhook https://discord.com/api/webhooks/.... 
  or set env var DISCORD_WEBHOOK and run `python main.py`

What it does:
- starts: uvicorn backend.server:app --host 0.0.0.0
- starts: cloudflared tunnel --url http://localhost:8000 (uses .\\cloudflared.exe on Windows if present)
- parses cloudflared stdout for a public https:// URL and sends it to the Discord webhook
- restarts both if either dies. Posts status messages to the webhook.
"""

import os
import time
from datetime import datetime, timedelta
from dotenv import load_dotenv

from boot.awake import prevent_sleep, allow_sleep
from boot.utils import terminate_process

from boot.notify import post_webhook_json
from boot.tunnel import start_cloudflared, get_cloudflared_url
from boot.uvicorn import start_uvicorn, wait_for_uvicorn

#load in environment variables
load_dotenv()
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")

if not DISCORD_WEBHOOK_URL:
    raise ValueError("DISCORD_WEBHOOK_URL not found in environment")


verbose=False

def main():

    #------------------------------- Keep system awake -------------------------------#
    #keep_awake_proc = prevent_sleep()

    num_restarts = 0
    last_restart = datetime.now()

    try:
        while True:
            #------------------------------- Start server -------------------------------#
            print("🚀 Starting Uvicorn server...")
            server_proc, server_queue = start_uvicorn(verbose=verbose)
            wait_for_uvicorn(verbose=verbose)


            #------------------------------- Start tunnel -------------------------------#
            print("🌐 Starting Cloudflared tunnel...")
            tunnel_proc, tunnel_queue = start_cloudflared()

            #extract tunnel url
            print("⏳ Waiting for tunnel URL...")
            tunnel_url = get_cloudflared_url(tunnel_queue, timeout=60, verbose=verbose)
        
            if tunnel_url:
                print(f"✅ Tunnel URL: {tunnel_url}")
                post_webhook_json(DISCORD_WEBHOOK_URL, {"content": f"Tunnel started: {tunnel_url}"})
                print("📨 Discord webhook sent!")
            else:
                print("❌ Failed to get tunnel URL in time.")

        
            #------------------------------- Monitor loop -------------------------------#
            while True:
                time.sleep(5)

                #periodically restart
                if datetime.now() - last_restart > timedelta(hours=2): #magic number 2 here!
                    print("⏳ Restarting both processes after 2h refresh...")
                    break
            
                if server_proc.poll() is not None:
                    print("❌ Server crashed, restarting both...")
                    break

                if tunnel_proc.poll() is not None:
                    print("⚠️ Tunnel crashed, restarting tunnel only...")

                    #kill and restart tunnel
                    terminate_process(tunnel_proc)
                    
                    tunnel_proc, tunnel_queue = start_cloudflared()
                    tunnel_url = get_cloudflared_url(tunnel_queue, timeout=60, verbose=verbose)

                    if tunnel_url:
                        print(f"✅ Tunnel URL restarted: {tunnel_url}")
                        post_webhook_json(DISCORD_WEBHOOK_URL, {"content": f"Tunnel restarted: {tunnel_url}"})
                    continue


            #------------------------------- Cleanup before restart -------------------------------#
            terminate_process(tunnel_proc, "Tunnel")
            terminate_process(server_proc, "Server")

            num_restarts += 1
            last_restart = datetime.now()

            print(f"\n🔄 {num_restarts} Restart cycle complete\n")
            post_webhook_json(DISCORD_WEBHOOK_URL, payload={"content": f"Restart {num_restarts}"})
    
    except KeyboardInterrupt:
        print("\n⏹ KeyboardInterrupt received, shutting down supervisor...")
     
    finally:
        # cleanup keep-awake process
        #allow_sleep(keep_awake_proc)
        print("💤 System allowed to sleep again.")

if __name__ == "__main__":
    main()