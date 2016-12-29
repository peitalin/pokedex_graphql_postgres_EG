"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _express = require("express");

var _express2 = _interopRequireDefault(_express);

var _expressGraphql = require("express-graphql");

var _expressGraphql2 = _interopRequireDefault(_expressGraphql);

var _graphql = require("graphql");

var _lodash = require("lodash");

var _lodash2 = _interopRequireDefault(_lodash);

var _pgPromise = require("pg-promise");

var _pgPromise2 = _interopRequireDefault(_pgPromise);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var DBHOST = process.env['AWS_RDS_HOST'];
var DBPASSWORD = process.env['AWS_RDS_PASSWORD'];
var PORT = 5432;

// var pgConn = pgp()('postgres://peitalin@localhost:5432/pokedex')
// var pgConn = pgp()({
//     host: 'localhost',
//     post: 5432,
//     database: 'pokedex',
//     // user: 'peitalin',
//     // password: 'qwer'
// })

var pgConn = (0, _pgPromise2.default)()({
    host: DBHOST,
    post: 5432,
    database: 'pokedex',
    user: 'peitalin',
    password: DBPASSWORD
});
console.log('\n');
console.log(pgConn);
console.log('\n');

// construct schema using GraphQL schema language
var schema = (0, _graphql.buildSchema)("\n    type schema {\n        query: Query\n    }\n\n    type Pokemon {\n        id: String\n        name: String\n        img: String\n        height: Int\n        weight: Float\n        elementalType: [String]\n        elementalWeaknesses: [String]\n        nextEvolution: [String]\n        prevEvolution: [String]\n    }\n\n    type Query {\n        names: [String]\n        rollDice(numDice: Int!, numSides: Int): [Int]\n        getPokemon(name: String!): Pokemon\n    }\n\n    ");

var Pokemon = function () {
    function Pokemon(name) {
        _classCallCheck(this, Pokemon);

        var dbpromise = pgConn.one("SELECT * FROM pokemon WHERE name = '" + name + "'");
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
    }

    _createClass(Pokemon, [{
        key: "elementalType",
        value: function elementalType() {
            return pgConn.many("SELECT * FROM pokemon_type WHERE pokemon_type.name = '" + this.name + "'").then(function (data) {
                return data.map(function (d) {
                    return d.type;
                });
            });
            // unwrap data object, turn into list of elemental types: ["fire", "ground"]
        }
    }, {
        key: "elementalWeaknesses",
        value: function elementalWeaknesses() {
            return pgConn.many("SELECT * FROM pokemon_weaknesses WHERE pokemon_weaknesses.name = '" + this.name + "'").then(function (data) {
                return data.map(function (d) {
                    return d.weaknesses;
                });
            });
        }
    }, {
        key: "nextEvolution",
        value: function nextEvolution() {
            var _this = this;

            // return ['grub', 'worm']
            return pgConn.many("SELECT * FROM next_evolution WHERE next_evolution.name = '" + this.name + "'").then(function (data) {
                return data.map(function (d) {
                    return d.next_evolution;
                });
            }).catch(function (err) {
                console.log("No next evolution species exists for " + _this.name + "!");
            });
        }
    }, {
        key: "prevEvolution",
        value: function prevEvolution() {
            var _this2 = this;

            // return ['grub', 'worm']
            return pgConn.many("SELECT * FROM prev_evolution WHERE prev_evolution.name = '" + this.name + "'").then(function (data) {
                return data.map(function (d) {
                    return d.prev_evolution;
                });
            }).catch(function (err) {
                console.log("No previous evolution species exists for " + _this2.name + "!");
            });
        }
    }]);

    return Pokemon;
}();

// The root provides a resolve function for each API endpoint


var rootResolver = {
    names: function names() {
        return ["Dolores", "Clementine", "Maeve"];
    },
    rollDice: function rollDice(_ref) {
        var numDice = _ref.numDice,
            numSides = _ref.numSides;

        return _lodash2.default.range(numDice).map(function (n) {
            return 1 + Math.floor(Math.random() * (numSides || 6));
        });
    },
    getPokemon: function getPokemon(_ref2) {
        var name = _ref2.name;

        return new Pokemon(name);
    }
};

var app = (0, _express2.default)();
app.use('/graphql', (0, _expressGraphql2.default)({
    graphiql: true,
    pretty: true,
    rootValue: rootResolver,
    schema: schema
}));

app.listen(4000, function () {
    console.log("\n\n=> Running a GraphQL API server at:\nlocalhost:4000/graphql\n\n=> Connected to database at:\n" + DBHOST + "\n\n");
});

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
