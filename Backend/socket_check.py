import socket

host = "aws-0-sa-east-1.pooler.supabase.com"
port = 6543
timeout = 5

print(f"Checking connection to {host}:{port} with timeout {timeout}s...")
try:
    with socket.create_connection((host, port), timeout=timeout) as s:
        print("SUCCESS: Port is OPEN! Reachable.")
except socket.timeout:
    print("FAILED: Connection timed out.")
except Exception as e:
    print(f"FAILED: Connection error: {e}")
