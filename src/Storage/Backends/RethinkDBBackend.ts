import { Provider, Page, Collection } from "./Backend";
import type { DataExchangeResult } from "./Backend"
import { resolvePlugin } from "@babel/core";


let r = require('rethinkdb')
let callbacks:Function[] = [];

/*
class RethinkCollection extends Collection {
    
}*/

class ReThinkProvider extends Provider {
    name: string;
    private connection: any;

    constructor(connection, name:string="rethink") {
        super();

	this.connection = connection;
	this.name = connection;
	// RETHIK DB BACKENDS ARE NEVER MEANT TO BE CREATED THIS WAY. YOU ARE BAD. Call async ReThinkProvider.create() instead.
    }

    static async create(host:string, port:number, username:string, password:string, name:string="rethink") {
	let connection = new Promise((res, _) =>
	    r.connect( {host: host,
			port: port,
			username: username,
			password: password}, function(_, conn:any) {res(conn) }));

	return new ReThinkProvider(await connection, name);
    }

    /**
     * Gets a Page to operate on
     *
     * @param {string[]} path: path that you desire to get a reference to
     * @param {Function} refreshCallback: the callback to update when data gets refreshed
     * @returns {Page}: the page ye wished for
     *
     */

    page(path: string[], refreshCallback?:Function) : ReThinkPage {
        return new ReThinkPage(path, this.connection, refreshCallback);
    }

    /**
     * Gets a collection
     * get a list of pages, and some other stuff
     * to operate on
     *
     * @param {string[]} path: path that you desire to get a reference to
     * @param {Function} refreshCallback: the callback to update when data gets refreshed
     * @returns {FirebaseCollection}: the collection ye wished for
     *
     */

    collection(path: string[], refreshCallback?:Function) : ReThinkCollection {
        return new ReThinkCollection(path, this.connection, refreshCallback);
    }

   
    /**
     * Nuke the cache
     * 
     * Used for logging out and general cleanup
     *
     */

    flush() {
	// do nothing
    }
}

class ReThinkCollection extends Collection {
    path: string[];
    private userid: string;
    private db: string;
    private primarykey: string;
    private working_connection: any;

    constructor(path:string[], connection:any, refreshCallback?:Function) {
        super()
        this.path = path;

	this.db = path[0]
	this.userid = path[1]
	this.primarykey = path[2]

	this.working_connection = connection

	this.path = path

	r.db(this.db).tableList().run(connection, (_, result) => {
	    // @zach Am I going craazy? Please look at line above :point_up:
	    if (!(result.includes(this.userid))) {
		r.db(this.db).tableCreate(this.userid).run(connection);
	    }
	}); // a


	if (refreshCallback) {
	    r.db(this.db).table(this.userid).changes().filter({key: this.primarykey}).run(connection, (result:any) => {
		refreshCallback(result);
	    });
	}
    }

    async add(payload:object) {
	let p:Promise<DataExchangeResult> = new Promise((res,rej) => r.db(this.db).table(this.userid).insert({id:this.pageid, key:this.primarykey}).run(this.working_connection, (_, result) => {res({
	    identifier: result["generated_keys"][0],
	    payload: payload,
	    response: result
	})}));

	return await p;
    }

    async delete() {
	let p:Promise<object> = new Promise((res,_) => r.db(this.db).table(this.userid).delete().run(this.working_connection, (_, resu:object) => res(resu)));

        return {identifier: null, payload: null, response: await p}
    }

    /**
     * Gets a page array from the database.
     *
     * @param   path - The valid path to the reference
     * @returns {Page[]} - The result of calling `.get()` on the database reference
     *
     */

    async pages() : Promise<Page[]> {
	let p:Promise<ReThinkPage[]> = new Promise((res,_) => {
	    r.db(this.db).table(this.userid).filter({key: this.primarykey}).run(this.working_connection, (rej, result:any) => {
		result.toArray((_,resultli)=>res(resultli.map((page:object) => {
		    return (new ReThinkPage([...this.path, page["id"]], this.working_connection));
		})));
	    });
	});

	return await p;
    }

    /**
     * Gets a data snapshot from the database.
     *
     * @param   path    The valid path to the reference
     * @returns  {object[]} The result of calling `.get()` on the database reference
     *
     */

    async data() : Promise<object[]> {
	let p:Promise<object[]> = new Promise((res,_) => {
	    r.db(this.db).table(this.userid).filter({key: this.primarykey}).run(this.working_connection, (rej,result:any) => {
		result.toArray((_,resultli)=>res(resultli));
	    });
	});

	return await p;
    }
}

class ReThinkPage extends Page {
    private userid: string;
    private pageid: string;
    private db: string;
    private primarykey: string;
    //private path: string[];
    private working_connection;
    private data: object; 
    private primarykey: any;
    private path: string[];
    
    constructor(path:string[], connection, refreshCallback?:Function) {
	super();

	this.db = path[0]
	this.userid = path[1]
	this.primarykey = path[2]
	this.pageid = path[path.length-1]

	this.working_connection = connection

	this.path = path
	this.data = new Promise((res,rej) => {
	    r.db(this.db).tableList().run(connection, (_, result) => {
		// @zach Am I going craazy? Please look at line above :point_up:
		if (!(result.includes(this.userid))) {
		    r.db(this.db).tableCreate(this.userid).run(connection);
		}
	    }); // a

	    r.db(this.db).table(this.userid).get(this.pageid).run(connection, (err, result) => {
		if (!result) {
		    r.db(this.db).table(this.userid).insert({id:this.pageid,
							     key:this.primarykey}).run(connection, (_) => {
								 res({id:this.pageid, key:this.primarykey});
							     });
		} else {
		    res(result);
		}
	    });
	}); 

	if (refreshCallback) {
	    r.db(this.db).table(this.userid).changes().get(this.pageid).run(connection, (err, result) => {
		if (!err)  {
		    let r = result;
		    refreshCallback(r);
		    this.data = new Promise((res, _) => r)
		}
	    });
	}
    }
    
    async set(payload:object, ...param:any) : Promise<DataExchangeResult>{
	let data = await this.data;

        if (param[0] && param[0].merge)
            data = Object.assign(data, payload);
        else
            data = payload;

	this.data = new Promise((res, _) => res(data));

	let res = new Promise((res, _) => {
	    // r.
	    r.db(this.db).table(this.userid).replace(Object.assign(data, {id: this.pageid, key:this.primarykey})).run(this.working_connection, (err, result) => {
		res(result);
	    });
	});
	
	return {identifier: this.id, payload: payload, response: await res}
    }
    
    async update(payload:object) : Promise<DataExchangeResult>{
	let data = await this.data;

	data = Object.assign(data, payload);

	this.data = new Promise((res, _) => res(data));

	let res = new Promise((res, _) => {
	    // r.
	    r.db(this.db).table(this.userid).update(Object.assign(data, {id: this.pageid})).run(this.working_connection, (err, result) => {
		res(result);
	    });
	});
	
	return {identifier: this.id, payload: payload, response: await res}
    }

    async delete() : Promise<DataExchangeResult>{
	let res = new Promise((res, _) => {
	    r.db(this.db)
		.table(this.userid).get(this.pageid)
		.delete().run(this.working_connection, (err, result) => {
		res(result);
	    });
	});
	return {identifier: null, payload: null, response: await res};
    }

    async exists() : Promise<boolean> {
	// yes, I really did this.
	// yes, I am ashamed of it.
	/*r.db(this.db).table(this.userid).get(this.pageid).run(this.working_connection, (err, result) => {
	    if (err) 
	    })*/
	return true; // ????? TODO??? No I didn't pull... I am smart.
    }

    get id() : string {
	return this.pageid;
    }

    async get() : Promise<object> {
	return await this.data;
    }
}

export { ReThinkPage, ReThinkCollection }
