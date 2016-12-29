


import express from "express";
import graphqlHTTP from "express-graphql";
import { buildSchema } from "graphql";
import _ from "lodash";
import pgp from "pg-promise";


const DBHOST = process.env['AWS_RDS_HOST']
const DBPASSWORD = process.env['AWS_RDS_PASSWORD']
const PORT = 5432

// var pgConn = pgp()('postgres://peitalin@localhost:5432/pokedex')
// var pgConn = pgp()({
//     host: 'localhost',
//     post: 5432,
//     database: 'pokedex',
//     // user: 'peitalin',
//     // password: 'qwer'
// })

var pgConn = pgp()({
    host: DBHOST,
    post: 5432,
    database: 'pokedex',
    user: 'peitalin',
    password: DBPASSWORD
})
console.log('\n');
console.log(pgConn);
console.log('\n');


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
        elementalType: [String]
        elementalWeaknesses: [String]
        nextEvolution: [String]
        prevEvolution: [String]
    }

    type Query {
        names: [String]
        rollDice(numDice: Int!, numSides: Int): [Int]
        getPokemon(name: String!): Pokemon
    }

    `
);


class Pokemon {
    constructor(name) {
        var dbpromise = pgConn.one(`SELECT * FROM pokemon WHERE name = '${name}'`)
        this.name = name;
        this.id = dbpromise.then(d => d.id)
        this.img = dbpromise.then(d => d.img)
        this.height = dbpromise.then(d => d.height)
        this.weight = dbpromise.then(d => d.weight)
    }

    elementalType() {
        return pgConn.many(`SELECT * FROM pokemon_type WHERE pokemon_type.name = '${this.name}'`)
                .then(data => data.map(d => d.type))
                // unwrap data object, turn into list of elemental types: ["fire", "ground"]
    }

    elementalWeaknesses() {
        return pgConn.many(`SELECT * FROM pokemon_weaknesses WHERE pokemon_weaknesses.name = '${this.name}'`)
                .then(data => data.map(d => d.weaknesses))
    }

    nextEvolution() {
        // return ['grub', 'worm']
        return pgConn.many(`SELECT * FROM next_evolution WHERE next_evolution.name = '${this.name}'`)
                .then(data => data.map(d => d.next_evolution))
                .catch(err => {
                    console.log(`No next evolution species exists for ${this.name}!`);
                })
    }

    prevEvolution() {
        // return ['grub', 'worm']
        return pgConn.many(`SELECT * FROM prev_evolution WHERE prev_evolution.name = '${this.name}'`)
                .then(data => data.map(d => d.prev_evolution))
                .catch(err => {
                    console.log(`No previous evolution species exists for ${this.name}!`);
                })
    }
}


// The root provides a resolve function for each API endpoint
var rootResolver = {
    names: () => {
        return ["Dolores", "Clementine", "Maeve"]
    },
    rollDice: ({ numDice, numSides }) => {
        return _.range(numDice).map(n => 1 + Math.floor(Math.random() * (numSides || 6)))
    },
    getPokemon: ({ name }) => {
        return new Pokemon(name)
    },
};


var app = express();
app.use('/graphql', graphqlHTTP({
    graphiql: true,
    pretty: true,
    rootValue: rootResolver,
    schema: schema,
}));

app.listen(4000, () => {
    console.log(
`\n\n=> Running a GraphQL API server at:\nlocalhost:4000/graphql
\n=> Connected to database at:\n${DBHOST}\n\n`);
})

/*

var xhr = new XMLHttpRequest();
xhr.responseType = 'json';
xhr.open("POST", "/graphql");
xhr.setRequestHeader("Content-Type", "application/json");
xhr.setRequestHeader("Accept", "application/json");
xhr.onload = function () {
  console.log('data returned:', xhr.response);
}
var query =`{
  names
  getPokemon(name: "Bellsprout") {
    id
    name
    img
    height
    weight
    elementalType
    elementalWeaknesses
  }
}`
xhr.send(JSON.stringify({
  query: query,
}));

*/

