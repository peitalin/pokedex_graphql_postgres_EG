"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _expressGraphql = require("express-graphql");

var _expressGraphql2 = _interopRequireDefault(_expressGraphql);

var _graphql = require("graphql");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var exec = require('child_process').exec;
var bodyParser = require('body-parser');

var request = require('request');
var DBHOST = process.env['AWS_RDS_HOST'] || process.env['aws_rds_host'];
var DBPASSWORD = process.env['AWS_RDS_PASSWORD'] || process.env['aws_rds_host'];
var SERVER_IP = 'localhost';
var PORT = process.env['PORT'] || 4000;

var pgConn = require('pg-promise')()({
    host: DBHOST,
    port: 5432,
    database: 'pokedex',
    user: 'peitalin',
    password: DBPASSWORD
});

// construct schema using GraphQL schema language
var schema = (0, _graphql.buildSchema)("\n    type schema {\n        query: Query\n    }\n\n    type Pokemon {\n        id: String\n        name: String\n        img: String\n        height: Int\n        weight: Float\n        attack: Int\n        defense: Int\n        speed: Int\n        hp: Int\n        spAtk: Int\n        spDef: Int\n        skills: [String]\n        elementalType: [String]\n        elementalWeaknesses: [String]\n        nextEvolution: [Pokemon]\n        prevEvolution: [Pokemon]\n    }\n\n    type Query {\n        names: [String]\n        allPokemons: [Pokemon]\n        Pokemon(name: String): Pokemon\n        getPokemonByType(elementalType: [String]): [Pokemon]\n        getPokemonWithElementalAdvantage(name: String): [Pokemon]\n    }\n    ");

var esc = function esc(s) {
    console.log("Pokemon name is: ", s);
    if (!s.includes("'")) {
        return s;
    }
    if (s.match(/'/g).length === 1) {
        return s.replace("'", "''");
    } else {
        return s;
    }
};

var _Pokemon = function () {
    function Pokemon(name) {
        _classCallCheck(this, Pokemon);

        this.pgname = esc(name);
        var dbpromise = pgConn.one("SELECT * FROM pokemon WHERE name = '" + this.pgname + "'");
        this.name = name;
        this.id = dbpromise.then(function (d) {
            return d.id;
        });
        this.img = dbpromise.then(function (d) {
            return d.img;
        });
        this.height = dbpromise.then(function (d) {
            return d.height;
        });
        this.weight = dbpromise.then(function (d) {
            return d.weight;
        });
        this.attack = dbpromise.then(function (d) {
            return d.Attack;
        });
        this.defense = dbpromise.then(function (d) {
            return d.Defense;
        });
        this.hp = dbpromise.then(function (d) {
            return d.HP;
        });
        this.speed = dbpromise.then(function (d) {
            return d.Speed;
        });
        this.spAtk = dbpromise.then(function (d) {
            return d.Sp_Atk;
        });
        this.spDef = dbpromise.then(function (d) {
            return d.Sp_Def;
        });
    }

    _createClass(Pokemon, [{
        key: "skills",
        value: function skills() {
            return pgConn.many("SELECT skill FROM skills WHERE name = '" + this.pgname + "'").then(function (data) {
                return data.map(function (d) {
                    return d.skill;
                });
            }).catch(function (err) {
                return console.log(err);
            });
        }
    }, {
        key: "elementalType",
        value: function elementalType() {
            return pgConn.many("SELECT * FROM pokemon_type WHERE pokemon_type.name = '" + this.pgname + "'").then(function (data) {
                return data.map(function (d) {
                    return d.type;
                });
            }).catch(function (err) {
                return console.log(err);
            });
        }
    }, {
        key: "elementalWeaknesses",
        value: function elementalWeaknesses() {
            return pgConn.many("SELECT * FROM pokemon_weaknesses WHERE pokemon_weaknesses.name = '" + this.pgname + "'").then(function (data) {
                return data.map(function (d) {
                    return d.weaknesses;
                });
            }).catch(function (err) {
                return console.log(err);
            });
        }
    }, {
        key: "nextEvolution",
        value: function nextEvolution() {
            var _this = this;

            return pgConn.many("SELECT * FROM next_evolution WHERE next_evolution.name = '" + this.pgname + "'").then(function (data) {
                return data.map(function (d) {
                    return new Pokemon(d.next_evolution);
                });
            }).catch(function (err) {
                console.log("No next evolution species exists for " + _this.name + "!");
            });
        }
    }, {
        key: "prevEvolution",
        value: function prevEvolution() {
            var _this2 = this;

            return pgConn.many("SELECT * FROM prev_evolution WHERE prev_evolution.name = '" + this.pgname + "'").then(function (data) {
                return data.map(function (d) {
                    return new Pokemon(d.prev_evolution);
                });
            }).catch(function (err) {
                console.log("No previous evolution species exists for " + _this2.name + "!");
            });
        }
    }]);

    return Pokemon;
}();

// The root provides a resolve function for each API endpoint


var rootResolvers = {
    names: function names() {
        return ["Dolores", "Clementine", "Maeve"];
    },
    Pokemon: function Pokemon(_ref) {
        var name = _ref.name;

        return new _Pokemon(name);
    },
    getPokemonByType: function getPokemonByType(_ref2) {
        var elementalType = _ref2.elementalType;

        return pgConn.many("SELECT * FROM pokemon_type WHERE pokemon_type.type = '" + elementalType + "'").then(function (data) {
            return data.map(function (d) {
                return new _Pokemon(d.name);
            });
        }).catch(function (err) {
            return console.log(err);
        });
    },
    getPokemonWithElementalAdvantage: function getPokemonWithElementalAdvantage(_ref3) {
        var name = _ref3.name;

        return pgConn.many("SELECT * FROM pokemon_weaknesses WHERE pokemon_weaknesses.name = '" + esc(name) + "'").then(function (data) {
            return data.map(function (d) {
                return d.weaknesses;
            });
        }).then(function (weaknesses) {
            var weaknessTypeStr = '(' + weaknesses.map(function (w) {
                return "'" + w + "'";
            }).join(',') + ')';
            return pgConn.many("SELECT * FROM pokemon_type WHERE pokemon_type.type in " + weaknessTypeStr).then(function (data) {
                return data.map(function (d) {
                    return new _Pokemon(d.name);
                });
            });
        }).catch(function (err) {
            return console.log(err);
        });
    },
    allPokemons: function allPokemons() {
        return pgConn.many('SELECT name FROM pokemon').then(function (data) {
            return data.map(function (d) {
                return new _Pokemon(d.name);
            });
        }).catch(function (err) {
            return console.log(err);
        });
    }
};

var app = (0, _express2.default)();

// use: respond to any path starting with '/graphql' regardless of http verbs: GET, POST, PUT
app.use('/graphql', (0, _expressGraphql2.default)({
    graphiql: true,
    pretty: true,
    rootValue: rootResolvers,
    schema: schema
}));

//
app.post('/', (0, _expressGraphql2.default)({
    schema: schema,
    pretty: true,
    rootValue: rootResolvers
}));

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.post('/slackbot', function (req, res, next) {
    console.log(req.body);
    var text = req.body.investor;
    var investor = req.body.investor;
    var start = req.body.start;
    var end = req.body.end;
    if (start && end) {
        exec("python3 ./raydalio_slackbot/alpha.py " + investor + " " + start + " " + end, function (err, stdout, stderr) {
            console.log(stdout);
            console.log(text);
            res.json(req.body);
        });
    } else {
        exec("python3 ./raydalio_slackbot/alpha.py " + investor, function (err, stdout, stderr) {
            console.log(stdout);
            console.log(text);
            // res.send(text)
            res.json(req.body);
        });
    }
    // res.json(req.body)
    // res.send("POST to /slackbot")
});

app.get('/', function (req, res) {
    var query = "\n    {\n        metapod: Pokemon(name: \"Metapod\") {\n        ...pokemonStats\n        }\n        kakuna: Pokemon(name: \"Kakuna\") {\n        ...pokemonStats\n        }\n    }\n\n    fragment pokemonStats on Pokemon {\n        id\n        name\n        height\n        weight\n        img\n        elementalType\n        elementalWeaknesses\n        nextEvolution { name }\n        prevEvolution { name }\n    }\n    ";
    (0, _graphql.graphql)(schema, query, rootResolvers).then(function (result) {
        var jresult = JSON.stringify(result, null, 4);
        console.log(jresult);
        res.send("\n                <div>\n                    <h1>GraphlQL Pokemon API</h1>\n                    <h2>Visit: <i>localhost:4000/graphql</i></h2>\n                    <h3> Example query: </h3>\n                    <pre style=\"color: #3887b5\"> " + query + " </pre>\n                    <h3> Graphql Output: </h3>\n                    <pre style=\"color: #00968f\"> " + jresult + " </pre>\n                    <hr>\n                    <h3> More query examples at: </h3>\n                    <a href=\"https://github.com/peitalin/pokedex_graphql_postgres_EG\">pokedex_graphql_postgres_EG</a>\n                    <h1><br></h1>\n                </div>\n             ");
    });
});

app.listen(PORT, function () {
    console.log("\n=> Running a GraphQL API server at:\n" + SERVER_IP + ":" + PORT + "/graphql");
    console.log("\n=> Connected to database at:\n" + DBHOST + "\n\n");
});

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
