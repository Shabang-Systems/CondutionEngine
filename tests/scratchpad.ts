import "../src/CondutionEngine";
import {ReThinkPage, ReThinkCollection} from "../src/Storage/Backends/RethinkDBBackend";
let r = require('rethinkdb')
var connection = null;

r.connect( {host: 'localhost',
	    port: 28015,
	    username: "admin",
	    password: ""}, function(err, conn) {
    if (err) throw err;
    connection = conn;

    try {
	let col = new ReThinkCollection(["users", "testuserid", "projects"], connection);
	// col.pages().then(e=>console.log(e[0]));
	// page.update({"name": "howo"});
    } catch {
	co
    }
})
