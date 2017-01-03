


# Pokedex GraphQL api with PostgresQL backend

This template sets up a GraphQl Api for pokemon using graphql-express server and a Postgresql database on AWS.

## GraphQl-express server to query AWS postgresql database

Start GraphiQL:
```
yarn install; # or npm install
yarn start;
```

Then visit this url in your browser:
`localhost:4000/graphql`

Now try a Graphql query:
```
{
  getPokemon(name: "Magikarp") {
    id
    name
    img
    height
    weight
    elementalType
    elementalWeaknesses
    nextEvolution
  }
}
```

Try another! with fragments:

```
{
	metapod: getPokemon(name: "Metapod") {
	...pokemonStats
	}
	kakuna: getPokemon(name: "Kakuna") {
	...pokemonStats
	}
}

fragment pokemonStats on Pokemon {
	id
	name
	height
	weight
	img
	elementalType
	elementalWeaknesses
	nextEvolution
	prevEvolution
}
```


## Setting up a Postgresql/GraphQL backend on AWS RDS/EC2
Steps

### 1) Setup a postgresql database with username "peitalin" and database name "pokedex" on AWS RDS:
[AWS RDS Postgresql Instructions]( http://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_GettingStarted.CreatingConnecting.PostgreSQL.html ).

You should go through `server.js` and `postgres_odo_example.py` and replace the username, password and database details as needed.


### 2) Then run the `postgres_odo_example.py` script to populate postgres database with pokedex data from `pokedex.csv`:

```
pip3 install pandas;
pip3 install sqlalchemy;
python3pokedex_postgres_data/postgres_odo_example.py
```

### 3) Boot up an EC2 instances and setup environment variables:
```
ssh -i '.pemkey' 'aws.ec2.instance.ip'
sudo apt install npm
echo "export AWS_RDS_HOST=xxxxxxxxxxxxxx.rds.amazonaws.com" >> ~/.bashid
echo "export AWS_RDS_PASSWORD=rds_password" >> ~/.bashid
source ~/.bashid
```

### 4) Open up ports on both the EC2 server, and the RDS database.
a) Make sure you open up inbound ports: 4000 on the EC2 server. Also open http, https ports.
[Redirect port 4000 to 80](http://stackoverflow.com/questions/16573668/best-practices-when-running-node-js-with-port-80-ubuntu-linode).
b) Open up all inbound ports on the RDS databse server (so that the graphql-express server running on EC2 can make requests to the RDS postgres database).


### 5) Run the graphql-express server. (Or run as a service using `forever` package)
```
git clone https://github.com/peitalin/pokedex_graphql_postgres_EG
cd ./pokedex_graphql_postgres_EG
npm install
npm start
```

6. Enable AWS api gateway to allow CORS (cross origin requests)
Otherwise you won't be able to use the server as a GraphQL api for other applications.

