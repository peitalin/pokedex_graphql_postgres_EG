


require('babel-polyfill');
import express from "express";
import graphqlHTTP from "express-graphql";
import { graphql, buildSchema } from "graphql";
import _ from "lodash";
var request = require('request')
var cors = require('cors')


const DBHOST = process.env['AWS_RDS_HOST'] || process.env['aws_rds_host']
const DBPASSWORD = process.env['AWS_RDS_PASSWORD'] || process.env['aws_rds_host']
var SERVER_IP = process.env['AWS_EC2_IP'] || 'localhost'
const PORT = process.env['PORT'] || 4000

// var pgConn = pgp()('postgres://peitalin@localhost:5432/pokedex')
// var pgConn = pgp()({
//     host: 'localhost',
//     port: 5432,
//     database: 'pokedex',
//     // user: 'peitalin',
//     // password: 'qwer'
// })

var pgConn = require('pg-promise')()({
    host: DBHOST,
    port: 5432,
    database: 'pokedex',
    user: 'peitalin',
    password: DBPASSWORD
})
// console.log(pgConn);


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
var rootResolvers = {
    names: () => {
        return ["Dolores", "Clementine", "Maeve"]
    },
    getPokemon: ({ name }) => {
        return new Pokemon(name)
    },
};


var app = express();

// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });
app.use(cors())

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
	`
	graphql(schema, query, rootResolvers)
		.then(result => {
			var jresult = JSON.stringify( result, null, 4 )
			console.log( jresult );
			res.send( jresult )
		})
})

app.listen(PORT, () => {
    console.log(`\n=> Running a GraphQL API server at:\n${SERVER_IP}:${PORT}/graphql`)
	console.log(`\n=> Connected to database at:\n${DBHOST}\n\n`);
})




// var getPokemonData = (name="Haunter") => {
// 	var quote;
// 	var query = `
// 	{
// 		getPokemon(name: "${name}") {
// 			id
// 			name
// 			img
// 			height
// 			weight
// 			elementalType
// 			elementalWeaknesses
// 			nextEvolution
// 			prevEvolution
// 		}
// 	}
// 	`
// 	var options = {
// 		url: `http://${SERVER_IP}`,
// 		method: "POST",
// 		headers: { 'Content-Type': 'application/graphql' },
// 		body: query,
// 	}
// 	return new Promise(function(resolve, reject) {
// 		request(options, (err, res, body) => {
// 			quote = body;
// 			resolve(quote)
// 		})
// 	})
// }
//
// async function main(name="Haunter") {
// 	console.log("prints first, before await");
// 	console.log("awaiting getPokemonData(name) to return..." );
// 	var quote = await getPokemonData(name);
// 	console.log("finished awaiting...");
// 	console.log(quote)
// 	return JSON.parse(quote)
// }
//

/*
var qres = main('Magikarp')
qres.then(x => console.log(x['data']['getPokemon']))
*/


