import "../src/CondutionEngine";
import {ReThinkPage} from "../src/Storage/Backends/RethinkDBBackend";
let r = require('rethinkdb')
var connection = null;

r.connect( {host: 'localhost',
	    port: 28015,
	    username: "admin",
	    password: ""}, function(err, conn) {
    if (err) throw err;
    connection = conn;

    try {
	let page = new ReThinkPage(["users", "testuserid", "tasks", "78239dd4-44c4-4dea-a60b-0f9a45558c68"], connection);
    } catch {
    }
})
