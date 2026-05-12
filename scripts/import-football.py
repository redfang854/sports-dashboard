import os, glob, pandas as pd, psycopg2
from dotenv import load_dotenv

load_dotenv('.env.local')

def get_conn():
    return psycopg2.connect(os.environ['POSTGRES_URL_NON_POOLING'])

conn = get_conn()
cur  = conn.cursor()

cur.execute("""
    CREATE TABLE IF NOT EXISTS football_matches (
        id         SERIAL PRIMARY KEY,
        league     VARCHAR(20)  NOT NULL,
        season     VARCHAR(10)  NOT NULL,
        match_date DATE,
        home_team  VARCHAR(100) NOT NULL,
        away_team  VARCHAR(100) NOT NULL,
        home_score INTEGER,
        away_score INTEGER,
        result     CHAR(1),
        UNIQUE(league, season, match_date, home_team, away_team)
    )
""")
cur.execute("CREATE INDEX IF NOT EXISTS idx_home ON football_matches(home_team)")
cur.execute("CREATE INDEX IF NOT EXISTS idx_away ON football_matches(away_team)")
conn.commit()
print("✅ Table ready")

def season_from_filename(fname):
    code = fname.split('_')[1].replace('.csv','')
    y1 = int(code[:2])
    y2 = int(code[2:])
    y1 = y1 + 1900 if y1 >= 93 else y1 + 2000
    return f"{y1}-{str(y2).zfill(2)}"

total = 0
for filepath in sorted(glob.glob('data/football/*.csv')):
    fname  = os.path.basename(filepath)
    league = fname.split('_')[0]
    season = season_from_filename(fname)

    try:
        df = pd.read_csv(filepath, encoding='utf-8', on_bad_lines='skip')
    except:
        df = pd.read_csv(filepath, encoding='latin-1', on_bad_lines='skip')

    df.columns = df.columns.str.strip()
    needed = {'HomeTeam','AwayTeam','FTHG','FTAG','FTR'}
    if not needed.issubset(df.columns):
        print(f"  SKIP {fname}: missing columns")
        continue

    df = df.dropna(subset=['HomeTeam','AwayTeam','FTHG','FTAG','FTR'])

    rows = []
    for _, row in df.iterrows():
        date = None
        for col in ['Date','date']:
            if col in df.columns and pd.notna(row.get(col)):
                try: date = pd.to_datetime(row[col], dayfirst=True).date()
                except: pass
                break
        rows.append((
            league, season, date,
            str(row['HomeTeam']).strip(), str(row['AwayTeam']).strip(),
            int(row['FTHG']), int(row['FTAG']), str(row['FTR']).strip()
        ))

    inserted = 0
    for i in range(0, len(rows), 500):
        batch = rows[i:i+500]
        try:
            cur.executemany("""
                INSERT INTO football_matches
                  (league,season,match_date,home_team,away_team,home_score,away_score,result)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT DO NOTHING
            """, batch)
            inserted += cur.rowcount
            conn.commit()
        except psycopg2.InterfaceError:
            conn = get_conn()
            cur  = conn.cursor()
            cur.executemany("""
                INSERT INTO football_matches
                  (league,season,match_date,home_team,away_team,home_score,away_score,result)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                ON CONFLICT DO NOTHING
            """, batch)
            inserted += cur.rowcount
            conn.commit()

    total += inserted
    print(f"✅ {fname} → {inserted} matches ({season})")

cur.close()
conn.close()
print(f"\n🏆 TOTAL: {total} matches imported into Neon")
