


# Pokedex GraphQL api with PostgresQL backend

This template sets up a minimal graphql-express server with a Postgresql database on AWS.

Steps:
1) Setup PostgresQL databse on AWS RDS.
2) Launch graphql-express server.
3) Write resolver functions to connect graphql with Postgresql database.
4) Navigate to localhost:4000/graphql and experiment with graphql queries.



## Postgresql backend on AWS RDS
Setup a AWS RDS postgresql database with username "peitalin" and database name "pokedex":
[AWS RDS Postgresql Instructions]( http://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.PostgreSQL.html )

You should go through `server.js` and `postgres_odo_example.py` and replace the username, password and database details as needed.

Then use this script to get pokedex data into postgres database:

`pokedex_postgres_data/postgres_odo_example.py`

Requires:
```
pip3 install pandas
pip3 install sqlalchemy
```

## GraphQl-express server to query AWS postgresql database

Start GraphiQL:
```
yarn install;
yarn nodemon;
```

Then visit in browser:
`localhost:/graphql:4000`


Try an example query:
```{
  getPokemon(name: "Dragonair") {
    id
    name
    img
    height
    weight
    elementalType
    elementalWeaknesses
    nextEvolution
    prevEvolution
  }
}```




