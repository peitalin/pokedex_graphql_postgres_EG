


import express from "express";
import graphqlHTTP from "express-graphql";
import { graphql, buildSchema } from "graphql";
import _ from "lodash";


var request = require('request')
const DBHOST = process.env['AWS_RDS_HOST'] || process.env['aws_rds_host']
const DBPASSWORD = process.env['AWS_RDS_PASSWORD'] || process.env['aws_rds_host']
var SERVER_IP = 'localhost'
const PORT = process.env['PORT'] || 4000

var pgConn = require('pg-promise')()({
    host: DBHOST,
    port: 5432,
    database: 'pokedex',
    user: 'peitalin',
    password: DBPASSWORD
})


// construct schema using GraphQL schema language
var schema = buildSchema(
    `
    type schema {
        query: Query
    }

    type Pokemon {
        id: String
        name: String
        img: String
        height: Int
        weight: Float
        attack: Int
        defense: Int
        speed: Int
        hp: Int
        spAtk: Int
        spDef: Int
        skills: [String]
        elementalType: [String]
        elementalWeaknesses: [String]
        nextEvolution: [Pokemon]
        prevEvolution: [Pokemon]
    }

    type Query {
        names: [String]
        allPokemons: [Pokemon]
        Pokemon(name: String): Pokemon
        getPokemonByType(elementalType: [String]): [Pokemon]
        getPokemonWithElementalAdvantage(name: String): [Pokemon]
    }
    `
);


class Pokemon {
    constructor(name) {
        var dbpromise = pgConn.one(`SELECT * FROM pokemon WHERE name = '${escape(name)}'`)
        this.name = name;
        this._name = escape(name)
        this.id = dbpromise.then(d => d.id)
        this.img = dbpromise.then(d => d.img)
        this.height = dbpromise.then(d => d.height)
        this.weight = dbpromise.then(d => d.weight)
        this.attack = dbpromise.then(d => d.Attack)
        this.defense = dbpromise.then(d => d.Defense)
        this.hp = dbpromise.then(d => d.HP)
        this.speed = dbpromise.then(d => d.Speed)
        this.spAtk = dbpromise.then(d => d.Sp_Atk)
        this.spDef = dbpromise.then(d => d.Sp_Def)
    }

    skills() {
      return pgConn.many(`SELECT skill FROM skills WHERE name = '${this._name}'`)
              .then(data => data.map(d => d.skill))
              .catch(err => console.log(err))
    }

    elementalType() {
        return pgConn.many(`SELECT * FROM pokemon_type WHERE pokemon_type.name = '${this._name}'`)
                .then(data => data.map(d => d.type))
                .catch(err => console.log(err))
    }

    elementalWeaknesses() {
        return pgConn.many(`SELECT * FROM pokemon_weaknesses WHERE pokemon_weaknesses.name = '${this._name}'`)
                .then(data => data.map(d => d.weaknesses))
                .catch(err => console.log(err))
    }

    nextEvolution() {
        return pgConn.many(`SELECT * FROM next_evolution WHERE next_evolution.name = '${this._name}'`)
                .then(data => data.map(d => new Pokemon(d.next_evolution)))
                .catch(err => {
                    console.log(`No next evolution species exists for ${this._name}!`);
                })
    }

    prevEvolution() {
        return pgConn.many(`SELECT * FROM prev_evolution WHERE prev_evolution.name = '${this._name}'`)
                .then(data => data.map(d => new Pokemon(d.prev_evolution)))
                .catch(err => {
                    console.log(`No previous evolution species exists for ${this.name}!`);
                })
    }
}


// The root provides a resolve function for each API endpoint
var rootResolvers = {
    names: () => {
        return ["Dolores", "Clementine", "Maeve"]
    },
    Pokemon: ({ name }) => {
        return new Pokemon(name)
    },
    getPokemonByType: ({ elementalType }) => {
        return pgConn.many(
            `SELECT * FROM pokemon_type WHERE pokemon_type.type = '${elementalType}'`
        ).then(data => data.map(d => new Pokemon(escape(d.name))))
        .catch(err => console.log(err))
    },
    getPokemonWithElementalAdvantage: ({ name }) => {
        return pgConn.many(`SELECT * FROM pokemon_weaknesses WHERE pokemon_weaknesses.name = '${escape(name)}'`)
                .then(data => data.map(d => d.weaknesses))
                .then(weaknesses => {
                    var weaknessTypeStr = '(' + weaknesses.map(w => `'${w}'`).join(',') + ')'
                    return pgConn.many( `SELECT * FROM pokemon_type WHERE pokemon_type.type in ${weaknessTypeStr}` )
                    .then(data => data.map(d => new Pokemon(escape(d.name))))
                }).catch(err => console.log(err))
    },
    allPokemons: () => {
        return pgConn.many('SELECT name FROM pokemon;')
            .then(data => data.map(d => new Pokemon(d.name)))
            .catch(err => console.log(err))
    }
};



const escape = (s) => {
  if (s.match(/'/g).length === 1) {
    return s.replace("'", "''")
  } else {
    return s
  }
}





var app = express();

// use: respond to any path starting with '/graphql' regardless of http verbs: GET, POST, PUT
app.use('/graphql', graphqlHTTP({
    graphiql: true,
    pretty: true,
    rootValue: rootResolvers,
    schema: schema,
}));

//
app.post('/', graphqlHTTP({
    schema: schema,
    pretty: true,
    rootValue: rootResolvers
}))

app.get('/', (req, res) => {
    var query = `
    {
        metapod: Pokemon(name: "Metapod") {
        ...pokemonStats
        }
        kakuna: Pokemon(name: "Kakuna") {
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
        nextEvolution { name }
        prevEvolution { name }
    }
    `
    graphql(schema, query, rootResolvers)
        .then(result => {
            var jresult = JSON.stringify( result, null, 4 )
            console.log( jresult );
            res.send(`
                <div>
                    <h1>GraphlQL Pokemon API</h1>
                    <h2>Visit: <i>localhost:4000/graphql</i></h2>
                    <h3> Example query: </h3>
                    <pre style="color: #3887b5"> ${ query } </pre>
                    <h3> Graphql Output: </h3>
                    <pre style="color: #00968f"> ${ jresult } </pre>
                    <hr>
                    <h3> More query examples at: </h3>
                    <a href="https://github.com/peitalin/pokedex_graphql_postgres_EG">pokedex_graphql_postgres_EG</a>
                    <h1><br></h1>
                </div>
             `)
        })
})

app.listen(PORT, () => {
    console.log(`\n=> Running a GraphQL API server at:\n${SERVER_IP}:${PORT}/graphql`)
    console.log(`\n=> Connected to database at:\n${DBHOST}\n\n`);
})




// For development environment only
/*
var getPokemonData = (name="Haunter") => {
    var quote;
    var query = `
    {
        getPokemon(name: "${name}") {
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
    }
    `
    var options = {
        url: `http://${SERVER_IP}`,
        method: "POST",
        headers: { 'Content-Type': 'application/graphql' },
        body: query,
    }
    return new Promise(function(resolve, reject) {
        request(options, (err, res, body) => {
            resolve(body)
        })
    })
}

async function main(name="Haunter") {
    console.log("prints first, before await");
    console.log("awaiting getPokemonData(name) to return..." );
    var quote = await getPokemonData(name);
    console.log("finished awaiting...");
    console.log(quote)
    return JSON.parse(quote)
}

var qres = main('Magikarp')
qres.then(x => console.log(x['data']['getPokemon']))
*/


