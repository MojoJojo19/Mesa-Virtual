import sys
from sqlalchemy import create_engine, text

DATABASE_URL = "postgresql://postgres.jrgsoswdicpbrdnwyqem:Gammasan170204*@aws-1-us-east-1.pooler.supabase.com:6543/postgres"

print("Connecting to DATABASE_URL...")
try:
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("SUCCESSFULLY connected to the Supabase PostgreSQL database!")
        # Check tables
        result = conn.execute(text("SELECT table_name FROM information_schema.tables WHERE table_schema='public'"))
        tables = [row[0] for row in result]
        print("Tables in public schema:", tables)
        
        if 'mesas' in tables:
            res_mesas = conn.execute(text("SELECT id_mesa, id_restaurante, numero, estado, pin FROM mesas")).all()
            print("\nContent of 'mesas' table:")
            for m in res_mesas:
                print(f"ID Mesa: {m[0]}, Restaurante ID: {m[1]}, Numero: {m[2]}, Estado: {m[3]}, PIN: {m[4]}")
        else:
            print("\nTable 'mesas' does NOT exist.")
except Exception as e:
    print("Database connection failed!")
    print(e)
