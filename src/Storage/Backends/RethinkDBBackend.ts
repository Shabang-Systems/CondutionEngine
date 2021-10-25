import { Provider, Page, Collection } from "./Backend";
import type { DataExchangeResult } from "./Backend"


let r = require('rethinkdb')
let callbacks:Function[] = [];

class RethinkCollection extends Collection {
    
}

class ReThinkPage extends Page {
    private userid: string;
    private pageid: string;
    private db: string;

    private data: object; 
    
    constructor(connection, db: string, userid:string, pageid:string, loadfunc: Function) {
	super();
	this.userid = userid;
	this.pageid = pageid;
	
	this.data = {}
    }
    
    async set(payload:object, ...param:any) : Promise<DataExchangeResult>{
	this.data = payload;
	
	return {identifier: this.id, payload: payload, response: pointer}
    }
    
    async update(payload:object) : Promise<DataExchangeResult>{
	return
    }

    async delete() : Promise<DataExchangeResult>{
	return
    }

    async exists() : Promise<boolean> {
	return
    }

    get id() : string {
	return this.pageid;
    }

    async get() : Promise<object> {
	
	return
    }
}
