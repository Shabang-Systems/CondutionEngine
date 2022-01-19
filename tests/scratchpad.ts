import "../src/CondutionEngine";
import {ReThinkPage, ReThinkCollection, ReThinkProvider} from "../src/Storage/Backends/RethinkDBBackend";
import ReferenceManager from "../src/Storage/ReferenceManager.ts";
import { Context } from "../src/Objects/EngineManager.ts";

import { Task, Project, Perspective } from "../src/CondutionEngine.ts"


ReThinkProvider.create("localhost", 28015, "admin", "").then((p:ReThinkProvider) => {
    let m = new ReferenceManager([p]);

    let context = new Context(m, "testuserid");
    context.start();

    Task.create(context, "hewoo").then((t:any) => console.log(t));
});





// var connection = null;
// let r = require('rethinkdb')



// r.connect( {host: 'localhost',
// 	    port: 28015,
// 	    username: "admin",
// 	    password: ""}, function(err, conn) {
//     if (err) throw err;
//     connection = conn;

//     try {
// 	let col = new ReThinkCollection(["users", "testuserid", "tasks"], connection);
// 	// col.pages().then(e=>console.log(e[0]));
// 	// page.update({"name": "howo"});
//     } catch {
// 	co
//     }
// })
