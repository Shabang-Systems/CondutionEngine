import "../src/CondutionEngine";
import {ReThinkPage} from "../src/Storage/Backends/RethinkDBBackend.ts";

let r = require('rethinkdb')
var connection = null;
r.connect( {host: 'localhost', port: 28015}, function(err, conn) {
    if (err) throw err;
    connection = conn;

    let page = new ReThinkPage(["users", "testuserid", "tasks", "hewoooooo"], connection)
})



