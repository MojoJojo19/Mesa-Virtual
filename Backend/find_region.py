import socket
import psycopg2

regions = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "ca-central-1", "sa-east-1", "eu-west-1", "eu-west-2",
    "eu-west-3", "eu-central-1", "eu-central-2", "eu-north-1",
    "ap-northeast-1", "ap-northeast-2", "ap-northeast-3",
    "ap-southeast-1", "ap-southeast-2", "ap-south-1", "me-central-1"
]

tenant = "jrgsoswdicpbrdnwyqem"
user = f"postgres.{tenant}"
password = "Gammasan170204*"
port = 6543

print(f"Scanning regions for tenant '{tenant}'...")

for r in regions:
    host = f"aws-0-{r}.pooler.supabase.com"
    print(f"Checking region {r} ({host})...")
    
    # Quick port check first
    try:
        with socket.create_connection((host, port), timeout=2):
            pass
    except Exception:
        # Port not open or host not resolving, skip
        continue
        
    # Attempt psycopg2 connection
    try:
        conn = psycopg2.connect(
            dbname="postgres",
            user=user,
            password=password,
            host=host,
            port=port,
            connect_timeout=3
        )
        print(f"\nSUCCESS! Found correct region: {r}")
        print(f"Connection string: postgresql://{user}:[PASSWORD]@{host}:{port}/postgres")
        conn.close()
        break
    except psycopg2.OperationalError as e:
        err_msg = str(e)
        if "tenant/user" in err_msg and "not found" in err_msg:
            # Tenant not found in this region
            continue
        elif "password authentication failed" in err_msg:
            print(f"\nFOUND REGION: {r} (but password authentication failed!)")
            print(f"Connection string: postgresql://{user}:[PASSWORD]@{host}:{port}/postgres")
            break
        else:
            print(f"Other connection error in {r}: {err_msg.strip()}")
else:
    print("\nScanning complete. Tenant not found in any standard region.")
