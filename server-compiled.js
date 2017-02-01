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

///////////////// SLACKBOT ////////////////////////

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.post('/slackbot', function (req, res, next) {
    console.log(req.body);
    var text = req.body.text.split(' ');
    //req.body: {
    //   token: 'dN9s2fjYnnoq4jLyq4noH3LC',
    //   team_id: 'T1H1H1EBG',
    //   team_domain: 'fincapstone',
    //   channel_id: 'D1KEWSKMF',
    //   channel_name: 'directmessage',
    //   user_id: 'U1H21P07L',
    //   user_name: 'peita',
    //   command: '/alpha',
    //   text: 'buffett 2012-01 2015-11',
    //   response_url: 'https://hooks.slack.com/commands/T1H1H1EBG/135929767095/klEbWti43IGke41GsgvsXwBT' }

    var investor = text[0];
    if (text.length === 3) {
        var start = text[1];
        var end = text[2];
    } else {
        var start = undefined;
        var end = undefined;
    }

    if (start && end) {
        exec("python3 ./raydalio_slackbot/alpha.py " + investor + " " + start + " " + end, function (err, stdout, stderr) {
            console.log(stdout);
            console.log(text);
            res.json({
                "text": "```" + stdout + "```"
            });
        });
    } else {
        exec("python3 ./raydalio_slackbot/alpha.py " + investor, function (err, stdout, stderr) {
            console.log(stdout);
            console.log(text);
            res.json({
                "text": "```" + stdout + "```"
            });
        });
    }
    // res.json(req.body)
    // res.send("POST to /slackbot")
});

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

app.post('/rayconcurs', function (req, res, next) {
    var rayconcurs = ["I concur. Brilliant insight.", "I agree 100%.", "Yes, that sounds convincing.", "I concur, Fascinating perspective.", "I agree whole-heartedly.", "Yes, I agree completely.", "Touche, I concur."];
    res.send(rayconcurs[getRandomInt(0, 6)]);
});

app.post('/buffettsays', function (req, res, next) {
    var buffettsays = ["It takes 20 years to build a reputation and five minutes to ruin it. If you think about that, you'll do things differently.", "It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price.", "We simply attempt to be fearful when others are greedy and to be greedy only when others are fearful.", "Someone's sitting in the shade today because someone planted a tree a long time ago.", "Risk comes from not knowing what you're doing.", "Rule No.1: Never lose money. Rule No.2: Never forget rule No.1.", "It's better to hang out with people better than you. Pick out associates whose behavior is better than yours and you'll drift in that direction.", "It's only when the tide goes out that you discover who's been swimming naked.", "You only have to do a very few things right in your life so long as you don't do too many things wrong.", "Successful Investing takes time, discipline and patience. No matter how great the talent or effort, some things just take time: You can't produce a baby in one month by getting nine women pregnant.", "When a management with reputation for brilliance gets hooked up with a business with a reputation for bad economics, it's the reputation of the business that remains intact.", "The Stock Market is designed to transfer money from the Active to the Patient.", "Price is what you pay. Value is what you get."];
    res.send(buffettsays[getRandomInt(0, 12)]);
});

app.post('/icahnsays', function (req, res, next) {
    var icahnsays = ["Some people get rich studying artificial intelligence. Me, I make money studying natural stupidity.", "When friends and acquaintances are telling you that you are a genius, before you accept their opinion, take a moment to remember what you always thought of their opinions in the past.", "In life and business, there are two cardinal sins. The first is to act precipitously without thought and the second is to not act at all.", "Don't confuse luck with skill when judging others, and especially when judging yourself.", "When most investors, including the pros, all agree on something, they're usually wrong.", "You learn in this business.. If you want a friend, get a dog.", "CEOs are paid for doing a terrible job. If the system wasn't so messed up, guys like me wouldn't make this kind of money.", "Everything I have is for sale, except for my kids and possibly my wife.", "Now the guy that got to the top, the CEO, would obviously be stupid to have a number two guy who was a lot smarter than he is. So by definition, since he's a survivor and he got to the top and he isn't that brilliant, his number two guy is going to always be a little worse than he is. So, as time goes on, it's anti-Darwinism, the survival of the un-fittest.", "We want these assets to be productive. We buy them. We own them. To say we care only about the short term is wrong. What I care about is seeing these assets in the best hands."];
    res.send(icahnsays[getRandomInt(0, 9)]);
});

app.post('/raysays', function (req, res, next) {
    var raysays = ["More than anything else, what differentiates people who live up to their potential from those who don't is a willingness to look at themselves and others objectively", "Be wary of the arrogant intellectual who comments from the stands without having played on the field.", "There is nothing to fear from truth....Being truthful is essential to being an independent thinker and obtaining greater understanding of what is right.", "Success is achieved by people who deeply understand reality and know how to use it to get what they want. The converse is also true: idealists who are not well-grounded in reality create problems, not progress.", "I believe that the biggest problem that humanity faces is an ego sensitivity to finding out whether one is right or wrong and identifying what one's strengths and weaknesses are.", "Ask yourself whether you have earned the right to have an opinion. Opinions are easy to produce, so bad ones abound. Knowing that you don't know something is nearly as valuable as knowing it. The worst situation is thinking you know something when you don't.", "Don't worry about looking good - worry about achieving your goals.", "I'm scared of one man, one vote because it suggests that everybody has an equal ability at making decisions, and I think that's dangerous.", "The more you think you know, the more closed-minded you'll be.", "I think the basic problem is that everybody thinks they know what the truth is, and sometimes they're even distorting the truth to make their arguments.", "Sometimes we forge our own principles and sometimes we accept others' principles, or holistic packages of principles, such as religion and legal systems. While it isn't necessarily a bad thing to use others' principles - it's difficult to come up with your own, and often much wisdom has gone into those already created - adopting pre-packaged principles without much thought exposes you to the risk of inconsistency with your true values.", "Principles are what allow you to live a life consistent with those values. Principles connect your values to your actions."];
    res.send(raysays[getRandomInt(0, 11)]);
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
