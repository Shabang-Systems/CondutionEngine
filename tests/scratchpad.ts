import "../src/CondutionEngine";
import {ReThinkPage} from "../src/Storage/Backends/RethinkDBBackend";

let r = require('rethinkdb')
var connection = null;
r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;
    connection = conn;

    try {
	let page = new ReThinkPage(["users", "testuserid", "tasks", "b722c494-3ffd-4ac0-b578-452f0b9746d5"], connection)
    } catch {
    }
})
