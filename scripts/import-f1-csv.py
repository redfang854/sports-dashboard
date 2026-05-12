import os, psycopg2, pandas as pd
from dotenv import load_dotenv

load_dotenv('.env.local')

conn = psycopg2.connect(os.environ['POSTGRES_URL_NON_POOLING'])
cur  = conn.cursor()

# Create tables
cur.execute("""
    CREATE TABLE IF NOT EXISTS f1_races (
        id          SERIAL PRIMARY KEY,
        race_id     INTEGER UNIQUE,
        season      INTEGER NOT NULL,
        round       INTEGER NOT NULL,
        race_name   VARCHAR(100),
        circuit     VARCHAR(100),
        country     VARCHAR(100),
        race_date   DATE
    )
""")

cur.execute("""
    CREATE TABLE IF NOT EXISTS f1_results (
        id             SERIAL PRIMARY KEY,
        race_id        INTEGER REFERENCES f1_races(id),
        driver         VARCHAR(100),
        driver_code    VARCHAR(10),
        constructor    VARCHAR(100),
        grid           INTEGER,
        position       INTEGER,
        points         NUMERIC(5,2),
        status         VARCHAR(50),
        UNIQUE(race_id, driver)
    )
""")

cur.execute("CREATE INDEX IF NOT EXISTS idx_f1_driver ON f1_results(driver)")
cur.execute("CREATE INDEX IF NOT EXISTS idx_f1_season ON f1_races(season)")
conn.commit()
print("✅ Tables created")

# Load reference CSVs
races_df       = pd.read_csv('data/f1/races.csv')
results_df     = pd.read_csv('data/f1/results.csv')
drivers_df     = pd.read_csv('data/f1/drivers.csv')
constructors_df= pd.read_csv('data/f1/constructors.csv')
circuits_df    = pd.read_csv('data/f1/circuits.csv')
status_df      = pd.read_csv('data/f1/status.csv')

# Build lookup dicts
driver_map      = dict(zip(drivers_df['driverId'], drivers_df['surname']))
driver_code_map = dict(zip(drivers_df['driverId'], drivers_df['code']))
constructor_map = dict(zip(constructors_df['constructorId'], constructors_df['name']))
circuit_map     = dict(zip(circuits_df['circuitId'], circuits_df['name']))
country_map     = dict(zip(circuits_df['circuitId'], circuits_df['country']))
status_map      = dict(zip(status_df['statusId'], status_df['status']))

print(f"Loaded {len(races_df)} races, {len(results_df)} results")

# Import races
race_id_map = {}  # kaggle raceId -> our DB id
for _, row in races_df.iterrows():
    circuit_id = row['circuitId']
    race_date  = None
    try:
        race_date = pd.to_datetime(row['date']).date()
    except:
        pass

    cur.execute("""
        INSERT INTO f1_races (race_id, season, round, race_name, circuit, country, race_date)
        VALUES (%s,%s,%s,%s,%s,%s,%s)
        ON CONFLICT (race_id) DO UPDATE SET
            season=EXCLUDED.season,
            round=EXCLUDED.round,
            race_name=EXCLUDED.race_name,
            circuit=EXCLUDED.circuit,
            country=EXCLUDED.country,
            race_date=EXCLUDED.race_date
        RETURNING id
    """, (
        int(row['raceId']),
        int(row['year']),
        int(row['round']),
        str(row['name']),
        circuit_map.get(circuit_id, ''),
        country_map.get(circuit_id, ''),
        race_date
    ))
    db_id = cur.fetchone()[0]
    race_id_map[int(row['raceId'])] = db_id

conn.commit()
print(f"✅ {len(race_id_map)} races imported")

# Import results
inserted = 0
for _, row in results_df.iterrows():
    kaggle_race_id = int(row['raceId'])
    db_race_id     = race_id_map.get(kaggle_race_id)
    if not db_race_id:
        continue

    driver      = driver_map.get(row['driverId'], '')
    driver_code = driver_code_map.get(row['driverId'], '')
    constructor = constructor_map.get(row['constructorId'], '')
    grid        = int(row['grid']) if str(row['grid']).isdigit() else 0
    pos         = str(row['positionOrder'])
    position    = int(pos) if pos.isdigit() else None
    points      = float(row['points']) if str(row['points']) not in ['\\N', ''] else 0
    status      = status_map.get(row['statusId'], '')

    try:
        cur.execute("""
            INSERT INTO f1_results (race_id, driver, driver_code, constructor, grid, position, points, status)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (race_id, driver) DO NOTHING
        """, (db_race_id, driver, driver_code, constructor, grid, position, points, status))
        inserted += cur.rowcount
    except Exception as e:
        print(f"  ROW ERROR: {e}")

conn.commit()
cur.close()
conn.close()
print(f"✅ {inserted} results imported")
print(f"\n🏆 F1 IMPORT COMPLETE: {len(race_id_map)} races, {inserted} results")
