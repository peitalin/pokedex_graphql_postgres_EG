
import pandas as pd
import sqlalchemy as sa
import itertools as it
import json
import os

DBHOST = os.environ['AWS_RDS_HOST']
DBPASS = os.environ['AWS_RDS_PASSWORD']

with open("./pokedex.json") as f:
	dat = json.loads(f.read())['pokemon']

df = pd.read_csv("./pokedex.csv")

## locally hosted postgresql database:
con = sa.create_engine('postgresql://localhost/pokedex')
## AWS RDS hosted database:
# con = sa.create_engine('postgresql://peitalin:{}@{}:5432/pokedex'.format(DBPASS, DBHOST))


df['id'] = df['id'] + 1
df.set_index("id", inplace=True)
df['id'] = df.index
df['height'] = [round((float(x.split(' ')[0]) * 100)) for x in df.height]
df['weight'] = [(float(x.split(' ')[0])) for x in df.weight]
df['weaknesses'] = [x.replace("'",'').replace('[','').replace(']','').replace(', ','|') for x in df.weaknesses]
df['type'] = [x.replace("'",'').replace('[','').replace(']','').replace(', ','|') for x in df.type]


df_id = df[['name', 'img', 'height', 'weight']]
df_type = df[['name', 'type']]
df_weaknesses = df[['name', 'weaknesses']]
df_evolution =


def get_evolution(evolutionType='prev_evolution'):
	table = []
	for pokeJson in dat:
		if evolutionType in pokeJson.keys():
			rowValues = it.cycle( [pokeJson['name']] )
			colValues = [evo['name'] for evo in pokeJson[evolutionType]]
			table += list(zip(rowValues, colValues))
	return pd.DataFrame(table, columns=['name', evolutionType])

df_prevEvo = get_evolution(evolutionType='prev_evolution')
df_nextEvo = get_evolution(evolutionType='next_evolution')


def melt_pokemon_table(df, key='name', splitBy='type'):
	table = []
	for i in range(1, len(df)+1):
		rowValues = it.cycle( [df[key][i]] )
		# pokemon name in row index
		colValues = df[splitBy][i].split('|')
		# pokemon attribute with multiple values, e.g. elemental type
		table += list(zip(rowValues, colValues))

	return pd.DataFrame(table, columns=[key, splitBy])

df_type = melt_pokemon_table(df=df[['name', 'type']], key='name', splitBy='type')
df_weaknesses = melt_pokemon_table(df=df[['name', 'weaknesses']], key='name', splitBy='weaknesses')


df_id.to_sql('pokemon', con=con, if_exists="replace")
df_type.to_sql('pokemon_type', con=con, if_exists="replace")
df_weaknesses.to_sql('pokemon_weaknesses', con=con, if_exists="replace")

df_prevEvo.to_sql('prev_evolution', con=con, if_exists='replace')
df_nextEvo.to_sql('next_evolution', con=con, if_exists='replace')


# localhost => peitalin
# pokedex => database name
# ::pokemon => table name
# from odo import odo, discover
# odo(df, 'postgresql://localhost/pokedex::pokemon', dshape=discover(df))

