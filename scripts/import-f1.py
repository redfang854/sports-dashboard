import os, time, requests, psycopg2
from dotenv import load_dotenv

load_dotenv(".env.local")
conn = psycopg2.connect(os.environ["POSTGRES_URL_NON_POOLING"])
cur = conn.cursor()
cur.execute("""CREATE TABLE IF NOT EXISTS f1_races (id SERIAL PRIMARY KEY, season INTEGER NOT NULL, round INTEGER NOT NULL, race_name VARCHAR(100), circuit VARCHAR(100), country VARCHAR(100), race_date DATE, UNIQUE(season, round))""")
cur.execute("""CREATE TABLE IF NOT EXISTS f1_results (id SERIAL PRIMARY KEY, race_id INTEGER REFERENCES f1_races(id), driver VARCHAR(100), driver_code VARCHAR(10), constructor VARCHAR(100), grid INTEGER, position INTEGER, points NUMERIC(5,2), status VARCHAR(50), UNIQUE(race_id, driver))""")
cur.execute("CREATE INDEX IF NOT EXISTS idx_f1_driver ON f1_results(driver)")
cur.execute("CREATE INDEX IF NOT EXISTS idx_f1_season ON f1_races(season)")
conn.commit()
print("Tables created")
BASE = "http://api.jolpi.ca/ergast/f1"
total_races = 0
total_results = 0
for season in range(1950, 2026):
    time.sleep(0.4)
    try:
        r = requests.get(f"{BASE}/{season}/results.json?limit=1000", timeout=15)
        data = r.json()
        races = data["MRData"]["RaceTable"]["Races"]
    except Exception as e:
        print(f"ERROR {season}: {e}")
        continue
    for race in races:
        rnd = int(race["round"])
        race_name = race.get("raceName","")
        circuit = race.get("Circuit",{}).get("circuitName","")
        country = race.get("Circuit",{}).get("Location",{}).get("country","")
        race_date = race.get("date",None)
        cur.execute("INSERT INTO f1_races (season,round,race_name,circuit,country,race_date) VALUES (%s,%s,%s,%s,%s,%s) ON CONFLICT (season,round) DO UPDATE SET race_name=EXCLUDED.race_name,circuit=EXCLUDED.circuit,country=EXCLUDED.country,race_date=EXCLUDED.race_date RETURNING id", (season,rnd,race_name,circuit,country,race_date))
        race_id = cur.fetchone()[0]
        total_races += 1
        for res in race.get("Results",[]):
            driver = res["Driver"].get("familyName","")
            driver_code = res["Driver"].get("code","")
            constructor = res["Constructor"].get("name","")
            grid = int(res.get("grid",0) or 0)
            pos = res.get("position")
            position = int(pos) if pos and str(pos).isdigit() else None
            points = float(res.get("points",0) or 0)
            status = res.get("status","")
            cur.execute("INSERT INTO f1_results (race_id,driver,driver_code,constructor,grid,position,points,status) VALUES (%s,%s,%s,%s,%s,%s,%s,%s) ON CONFLICT (race_id,driver) DO NOTHING", (race_id,driver,driver_code,constructor,grid,position,points,status))
            total_results += cur.rowcount
    conn.commit()
    print(f"{season} -> {len(races)} races")
cur.close()
conn.close()
print(f"F1 TOTAL: {total_races} races, {total_results} results")
