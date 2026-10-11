import os
import sys
import time
import threading
import webbrowser
from app import app

def open_browser():
    """Wait for server to start and automatically launch default browser."""
    time.sleep(1.5)
    url = "http://127.0.0.1:5000"
    print(f"\n[+] Automatically opening dashboard in browser: {url}")
    webbrowser.open_new_tab(url)

if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
        
    print("=" * 70)
    print("  TALENTPULSE AI - HIRING ANALYTICS & MACHINE LEARNING PLATFORM")
    print("=" * 70)
    print("  Starting local dashboard server...")
    print("  Local URL: http://127.0.0.1:5000")
    print("  Press Ctrl+C in this terminal to stop the server.")
    print("=" * 70)

    # Launch browser in separate thread
    threading.Thread(target=open_browser, daemon=True).start()

    # Run Flask server
    app.run(host="127.0.0.1", port=5000, debug=False)
