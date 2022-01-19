import { Provider, Page, Collection } from "./Backend";
import type { DataExchangeResult } from "./Backend"
import { resolvePlugin } from "@babel/core";


let r = require('rethinkdb')
let callbacks:Function[] = [];

/*
class RethinkCollection extends Collection {
    
}*/

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
							     key:this.primarykey}).run(connection, (_, res) => {
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
	    r.db(this.db).table(this.userid).replace(Object.assign(data, {id: this.pageid})).run(this.working_connection, (err, result) => {
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

export { ReThinkPage }
