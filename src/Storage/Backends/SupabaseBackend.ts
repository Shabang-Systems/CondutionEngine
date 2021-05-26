import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid';

const obj = require("./../../../secrets.json");

const OFFICIAL_URL = 'https://tpnuyfcezwyecfitllbc.supabase.co'
const OFFICIAL_PUBKEY = obj.supabase // I was told this is publicable. Come at me.

let cache = new Map();
let unsubscribeCallbacks = new Map();
let snapshots: any[] = [];


import  { Provider, Page, Collection, AuthenticationProvider } from "./Backend";
import type { AuthenticationResult, AuthenticationRequest, AuthenticationUser, DataExchangeResult } from "./Backend";

class SupabaseCollection extends Collection {
    path: string[];
    supabaseDB: ReturnType<typeof createClient>;

    private table: string;
    private owner: string;

    constructor(path:string[], supabaseDB:ReturnType<typeof createClient>, refreshCallback:Function=()=>{}) {
        super();
        this.path = path;
        this.supabaseDB = supabaseDB;

        this.table = ((path[0] === "workspaces") ? "w" : "") + path[2];
        this.owner = path[1];

        this.supabaseDB
            .from(`${this.table}:owner=${this.owner}`)
            .on('*', payload => {
                refreshCallback(payload);
            })
            .subscribe()
    }

    async add(payload:object) {
        let id = uuidv4();
        const { data, error } = await this.supabaseDB
            .from(`${this.table}`)
            .insert([{
                id: id,
                owner: this.owner,
                payload: payload
            }]);
        return {identifier: id, payload: data, response: error};
    }

    async delete() {
        await this.supabaseDB
            .from(`${this.table}`)
            .delete()
            .eq("owner", this.owner);

        return { identifier:null, payload:null, response: {} };
    }

    async pages() : Promise<Page[]> {
        let { data , error } = await this.supabaseDB.from(this.table)
            .select("*").eq('owner', this.owner)

        return data.map((i:object) => new SupabasePage([...this.path, i["id"]], this.supabaseDB));
    }

    async data() : Promise<object[]> {
        let { data , error } = await this.supabaseDB.from(this.table)
            .select("*").eq('owner', this.owner)

        return data.map((i:object) => Object.assign(i["payload"], {id: i["id"]}));
    }
}

class SupabasePage extends Page {
    path: string[];
    supabaseDB: ReturnType<typeof createClient>;

    private data: Promise<object>; 
    private table: string;
    private _id: string;
    private owner: string;
    private isProfileReq: boolean = false;

    constructor(path:string[], supabaseDB:ReturnType<typeof createClient>, refreshCallback:Function=()=>{}) {
        super();

        this.path = path;

        console.assert(path.length % 2 == 0, `Paths to pages should either be length 2 or 4, got ${path}.`)
        if (path.length == 2) {
            this.table = path[0];
            this._id = path[1];
            this.isProfileReq = true;
        } else {
            this.table = (path[0] === "workspaces" ? "w":"")+path[2];
            this._id = path[3];
            this.owner = path[1];
        }

        this.supabaseDB = supabaseDB;

        let stringPath: string = JSON.stringify(path);
        this.data = cache.has(stringPath) ? 
            cache.get(stringPath) : 
            this.fetchAndSubscribe(refreshCallback);

        cache.set(stringPath, this.data);
    }

    async get() : Promise<object> {
        // TODO Janky AF javasccipt to strip prop "exists" from the data
        return await this.data as any;
    }

    async set(payload:object, ..._:any):Promise<DataExchangeResult> {
        let e:any;
        if (this.isProfileReq) {
            const { data, error } = await this.supabaseDB
                .from(`${this.table}`)
                .insert([{
                    id: this.id,
                    payload: payload
                }], { upsert: true})
            e = error;
        } else {
            const { data, error } = await this.supabaseDB
                .from(`${this.table}`)
                .insert([{
                    id: this.id,
                    owner: this.owner,
                    payload: payload
                }], { upsert: true})
            e = error;
        }

        return { identifier:this._id, payload: payload, response: e };
    }

    async update(payload:object):Promise<DataExchangeResult> {
        await this.supabaseDB
            .from(`${this.table}`)
            .update([{
                payload: payload
            }]).eq("id", this._id);

        return { identifier:this._id, payload: payload, response: {} };
    }


    async delete():Promise<DataExchangeResult> {
        await this.supabaseDB
            .from(`${this.table}`)
            .delete()
            .eq("id", this._id);

        return { identifier:null, payload:null, response: {} };
    }

    async fetchAndSubscribe(refreshCallback:Function=()=>{}): Promise<object> {
        let { data , error } = await this.supabaseDB.from(this.table)
            .select("*").eq('id', this._id)

        this.supabaseDB
            .from(`${this.table}:id=${this._id}`)
            .on('*', payload => {
                refreshCallback(payload[0]);
                this.data = (async ():Promise<object> => {
                    if (payload[0])
                        return Object.assign(payload[0]["payload"], {id: payload[0]["id"]});
                })();
            })
            .subscribe()

        return Object.assign(data[0]["payload"], {id: data[0]["id"]});
    }

    async exists(): Promise<boolean> {
        let { data , error } = await this.supabaseDB.from(this.table)
            .select("*").eq('id', this._id)

        return data.length > 0;
    }

    get id(): string {
        return this._id;
    }
}

class SupabaseProvider extends Provider {
    name: string;
    supabaseDB: ReturnType<typeof createClient>;

    constructor(rootURL=OFFICIAL_URL, key=OFFICIAL_PUBKEY, name:string="supabase") {
        super();

        this.name = name;

        // Yes, we support auth
        this._authSupported = true;

        // Initialize and add the auth provider
        //this.authProvider = new FirebaseAuthenticationProvider();
        //TODO

        // Get supabase reference
        this.supabaseDB = createClient(rootURL, key);
    }
    
    /**
     * Gets a Page to operate on
     *
     * @param {string[]} path: path that you desire to get a reference to
     * @param {Function} refreshCallback: the callback to update when data gets refreshed
     * @returns {Page}: the page ye wished for
     *
     */

    page(path: string[], refreshCallback?:Function) : SupabasePage {
        if (cache.has(JSON.stringify(path))) // TODO
            return cache.get(JSON.stringify(path))
        return new SupabasePage(path, this.supabaseDB, refreshCallback);
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

    collection(path: string[], refreshCallback?:Function) : SupabaseCollection {
        return new SupabaseCollection(path, this.supabaseDB, refreshCallback);
    }

   
    /**
     * Nuke the cache
     * 
     * Used for logging out and general cleanup
     *
     */

    flush() {
        cache = new Map();
        unsubscribeCallbacks = new Map();
    }
}

export default SupabaseProvider;
export { SupabasePage, SupabaseCollection };

