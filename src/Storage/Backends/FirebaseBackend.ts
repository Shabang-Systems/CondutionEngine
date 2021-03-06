import firebase from "firebase";
import "firebase/firestore";
import "firebase/auth";

import  { Provider, Page, Collection, AuthenticationProvider } from "./Backend";
import type { AuthenticationResult, AuthenticationRequest, AuthenticationUser, DataExchangeResult } from "./Backend";

// TODO TODO the maps should go to somewhere better than this.
let cache = new Map();
let unsubscribeCallbacks = new Map();
let snapshots: any[] = [];

/**
 * A firebase collection to operate on 
 * 
 * Storage/Backend/Backend/Page/Collection abstract 
 * class for usage and documentation.
 *
 * @extends {Collection}
 * 
 */

class FirebaseCollection extends Collection {
    path: string[];
    firebaseDB: firebase.firestore.Firestore;
    firebaseRef: typeof firebase.firestore;

    constructor(path:string[], firebaseDB:firebase.firestore.Firestore, firebaseRef:(typeof firebase.firestore), refreshCallback?:Function) {
        super();
        this.path = path;
        this.firebaseDB = firebaseDB;
        this.firebaseRef = firebaseRef;

        const ref = this.getFirebaseRef(this.path);           //  get the reference from the database

        if (refreshCallback) {
            snapshots.push(ref.onSnapshot({
                error: console.trace,
                next: (snap:any) => {
                    refreshCallback(snap.docs.map((page:any)=>{
                        return Object.assign(page.data(), {id: page.id});
                    }));
                }
            }));
        }

        cache.set(JSON.stringify(path), this);
    }

    async add(payload:object) {
        const ref = this.getFirebaseRef(this.path);           //  get the reference from the database
        const resultDocument = await ref.add(payload); // add the document
        return {identifier: resultDocument.id, payload: payload, response: resultDocument};
    }

    async delete() {
        const ref = this.getFirebaseRef(this.path);           //  get the reference from the database
        const resultDocument = await ref.delete(); // delete the document
        return {identifier: null, payload: null, response: resultDocument};
    }

    /**
     * Gets a page array from the database.
     *
     * @param   path - The valid path to the reference
     * @returns {Page[]} - The result of calling `.get()` on the database reference
     *
     */

    async pages() : Promise<Page[]> {
        return (await this.getFirebaseRef(this.path).get()).docs.map((page:any)=>{
            return new FirebasePage([...this.path, page.id], this.firebaseDB, this.firebaseRef);
        });
    }

    /**
     * Gets a data snapshot from the database.
     *
     * @param   path    The valid path to the reference
     * @returns  {object[]} The result of calling `.get()` on the database reference
     *
     */

    async data() : Promise<object[]> {
        return (await this.getFirebaseRef(this.path).get()).docs.map((page:any)=>{
            return Object.assign(page.data(), {id: page.id});
        });
    }


    /**
     * Get a database reference.
     *
     * @param   path        A valid path array, see below.
     * @returns reference   The generated reference
     *
     * Examples of valid path arrays:
     *  [`collection/${docName}`] => DocumentReference
     *  ["collection", "docName"] => DocumentReference
     *  ["collection", "docName", "collection"] => CollectionReference
     *  ["collection", ["query", "params"], ["more", "params"]] => Query
     *  ["collection", ["query", "params"], "docname"] => DocumentReference
     * 
     */

    getFirebaseRef(path:string[]) {
        let ref:any = this.firebaseDB;
        let fsRef:any = this.firebaseRef;

        // special handling for first collection from root
        console.assert(typeof path[0] === 'string');
        if (path[0].includes('/'))
            ref = ref.collectionGroup(path[0]);
        else
            ref = ref.collection(path[0]);
        // generic handling
        for (let n of path.slice(1)) {
            let nav:any = n;
            if (typeof nav === 'string') {
                if (ref instanceof fsRef.DocumentReference) {
                    ref = ref.collection(nav);
                } else if (ref instanceof fsRef.Query) {
                    ref = ref.doc(nav);
                } else {
                    throw new Error("Unknown reference");
                }
            } else if (Array.isArray(nav)) {                // query, TODO shouldn't need to query
                if (ref instanceof fsRef.Query) {
                    ref = ref.where(...nav);
                } else {
                    throw new Error("Cannot query with");
                }
                console.assert(ref instanceof fsRef.Query)
            } else {
                throw new Error("Cannot parse");
            }
        }
        return ref;
    }
}

/**
 * A firebase page to operate on see 
 * 
 * Storage/Backend/Backend/Page abstract 
 * class for usage and documentation.
 *
 * @extends {Page}
 * 
 */


class FirebasePage extends Page {
    path: string[];
    firebaseDB: firebase.firestore.Firestore;
    firebaseRef: typeof firebase.firestore;

    private data: Promise<object>; 
    
    constructor(path:string[], firebaseDB:firebase.firestore.Firestore, firebaseRef:(typeof firebase.firestore), refreshCallback:Function=()=>{}) {
        super();

        this.path = path;
        this.firebaseDB = firebaseDB;
        this.firebaseRef = firebaseRef;
        const ref = this.getFirebaseRef(path);           //  get the reference from the database

        this.data = (async () : Promise<Object> => {
            let snapshot = await ref.get();
            let data: Object = snapshot.data();
            return Object.assign(data ? data : {}, {id: snapshot.id, exists: snapshot.exists});
        })();

        snapshots.push(ref.onSnapshot({
            error: console.trace,
            next: (snap:any) => {
                let originalData = snap.data();
                if (originalData) {
                    let data = Object.assign(originalData, {id:snap.id, exists: snap.exists});
                     // TODO janky AF resolving to a Promise of data b/c the original fetch is a promise
                    this.data = new Promise((res, _)=>res(data));
                    refreshCallback(data);
                    // TODO TODO: requestRefresh
                }
            }
        }));

        cache.set(JSON.stringify(path), this);

    }

    get id() : string {
        const ref = this.getFirebaseRef(this.path);           //  get the reference from the database
        return ref.id; // return the requested ID
    }

    async set(payload:object, ...param:any):Promise<DataExchangeResult> {
        const ref = this.getFirebaseRef(this.path);           //  get the reference from the database
        const resultDocument = await ref.set(payload, ...param); // set the document
        return {identifier: payload["id"], payload: payload, response: resultDocument};
    }

    async update(payload:object) {
        const ref = this.getFirebaseRef(this.path);           //  get the reference from the database
        const resultDocument = await ref.update(payload); // update the document
        return {identifier: payload["id"], payload: payload, response: resultDocument};
    }

    async delete() {
        const ref = this.getFirebaseRef(this.path);           //  get the reference from the database
        const resultDocument = await ref.delete(); // delete the document
        return {identifier: null, payload: null, response: resultDocument};
    }

    /**
     * Look in the database for the object
     *
     */

    async exists() : Promise<boolean> {
        return (await this.data)["exists"];
    }

    /**
     * Get a snapshot from the cache.
     *
     * @param   path - The valid path to the reference
     * @returns  any - The result of calling `.get()` on the database reference
     *
     * Logic:
     *  If the path is cached, return from cache.
     *  Else, register a snapshot listener to update the cache
     *      and return the newly cached value.
     *
     */

    async get() : Promise<object> {
        // TODO Janky AF javasccipt to strip prop "exists" from the data
        let {["exists"]:_, ...data} = await this.data as any;
        return data;
    }

    /**
     * Get a database reference.
     *
     * @param   path - A valid path array, see below.
     * @return  reference - The generated reference
     *
     * Examples of valid path arrays:
     *  [`collection/${docName}`] => DocumentReference
     *  ["collection", "docName"] => DocumentReference
     *  ["collection", "docName", "collection"] => CollectionReference
     *  ["collection", ["query", "params"], ["more", "params"]] => Query
     *  ["collection", ["query", "params"], "docname"] => DocumentReference
     * 
     */

    getFirebaseRef(path:string[]) {
        let ref:any = this.firebaseDB;
        let fsRef:any = this.firebaseRef;

        // special handling for first collection from root
        console.assert(typeof path[0] === 'string');
        if (path[0].includes('/'))
            ref = ref.collectionGroup(path[0]);
        else
            ref = ref.collection(path[0]);
        // generic handling
        for (let n of path.slice(1)) {
            let nav:any = n;
            if (typeof nav === 'string') {
                if (ref instanceof fsRef.DocumentReference) {
                    ref = ref.collection(nav);
                } else if (ref instanceof fsRef.Query) {
                    ref = ref.doc(nav);
                } else {
                    throw new Error("Unknown reference");
                }
            } else if (Array.isArray(nav)) {                // query, TODO shouldn't need to query
                if (ref instanceof fsRef.Query) {
                    ref = ref.where(...nav);
                } else {
                    throw new Error("Cannot query with");
                }
                console.assert(ref instanceof fsRef.Query)
            } else {
                throw new Error("Cannot parse");
            }
        }
        return ref;
    }
}

class FirebaseAuthenticationProvider extends AuthenticationProvider {
    private firebaseAuthPointer: firebase.auth.Auth;

    constructor() {
        super();
        this.firebaseAuthPointer = firebase.auth();

        if (this.firebaseAuthPointer.currentUser)
            this._authenticated = true;
        else
            this._authenticated = false;
    }

    get currentUser() : Promise<AuthenticationUser> {
        return new Promise((res, _) => {
            firebase.auth().onAuthStateChanged((user:any) => {
                if (user)
                    res({
                        identifier: user.uid,
                        displayName: user.displayName,
                        email: user.email,
                        emailVerified: user.emailVerified
                    })
                else res(null);
            });
        });
    }

    refreshAuthentication = async () => {
        await firebase.auth().currentUser.reload();
        if (this.firebaseAuthPointer.currentUser)
            this._authenticated = true;
        else
            this._authenticated = false;
    }

    async authenticate(request: AuthenticationRequest) : Promise<AuthenticationResult> {
        if (request.requestType == "email_pass" || !request.requestType) {
            if (request.requestType)
                await this.firebaseAuthPointer.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

            let e_code:string;
            let e_msg:string;

            (await this.firebaseAuthPointer.signInWithEmailAndPassword(request.payload.email, request.payload.password).catch((err) => {
                e_code = err["code"];
                e_msg = err["message"];
            }));

            if (e_code) {
                return {
                    actionDesired: "authenticate", 
                    actionSuccess: false, 
                    identifier: null, 
                    payload: {msg: e_msg, code: e_code}
                }
            } else {
                if (this.firebaseAuthPointer.currentUser.emailVerified)
                    this._authenticated = true;
                else
                    this.firebaseAuthPointer.currentUser.sendEmailVerification();

                return {
                    actionDesired: "authenticate", 
                    actionSuccess: this.firebaseAuthPointer.currentUser.emailVerified ? true : false, 
                    identifier: this.firebaseAuthPointer.currentUser.uid, 
                    payload: this.firebaseAuthPointer.currentUser.emailVerified ? null : {msg: "User email unverified", code: "email_verification_needed"}
                }
            }
        }
        else 
            return {
                actionDesired: "authenticate", 
                actionSuccess: false, 
                identifier: null, 
                payload: {msg: "Unknown request type", code: "unknown_request_type"}
            };
    }

    async deauthenticate() {
        this.firebaseAuthPointer.signOut();
        this._authenticated = false;
    }

    async createUser(request: AuthenticationRequest) : Promise<AuthenticationResult> {
        try {
            await this.firebaseAuthPointer.createUserWithEmailAndPassword(request.payload.email, request.payload.password);
            // TODO should we remove email verification requirement??
            this.firebaseAuthPointer.currentUser.updateProfile({displayName: request.payload.displayName});
            this.firebaseAuthPointer.currentUser.sendEmailVerification();
            this._authenticated = true;
            return {
                actionDesired: "createUser", 
                actionSuccess: true, 
                identifier: this.firebaseAuthPointer.currentUser.uid, 
                payload: null
            }
        } catch (err) {
            return {
                actionDesired: "createUser", 
                actionSuccess: false, 
                identifier: null, 
                payload: {msg: err.message, code: err.code}
            };
        }
    }

    async updateUserProfile(request: AuthenticationRequest) : Promise<AuthenticationResult> {
        if (!this._authenticated) 
            return {
                actionDesired: "updateUserProfile", 
                actionSuccess: false, 
                identifier: null, 
                payload: {msg: "Cannot update a non-existent user", code: "user_missing"}
            };
        try {
            this.firebaseAuthPointer.currentUser.updateProfile(request.payload);
            return {
                actionDesired: "updateUserProfile", 
                actionSuccess: true, 
                identifier: this.firebaseAuthPointer.currentUser.uid, 
                payload: null
            }
        } catch (err) {
            return {
                actionDesired: "updateUserProfile", 
                actionSuccess: false, 
                identifier: null, 
                payload: err
            };
        }
    }
}

/**
 * A backend provider that provides for Condution connection to Firebase
 *
 *
 * Example:
 *
 * > let provider = new Provider();
 * > let taskRef = provide.reference("Users", "test", "tasks");
 *
 * @extends {Provider}
 *
 */

class FirebaseProvider extends Provider {
    name: string;
    firebaseDB: firebase.firestore.Firestore;
    firebaseRef: typeof firebase.firestore;

    private authProvider: AuthenticationProvider;

    constructor(name:string="firebase") {
        super();

        this.name = name;

        // Yes, we support auth
        this._authSupported = true;

        // Get our shared secrets file
        const obj = require("./../../../secrets.json");

        // Initialize the correct version of the database
        if (process.env.NODE_ENV === "development")
            firebase.initializeApp(obj.dbkeys.debug);
        else if (process.env.NODE_ENV === "production")
            firebase.initializeApp(obj.dbkeys.deploy);
        else
            firebase.initializeApp(obj.dbkeys.debug);

        // Initialize and add the provider
        this.authProvider = new FirebaseAuthenticationProvider();

        // Get firestore references
        [ this.firebaseDB, this.firebaseRef ] = [firebase.firestore(), firebase.firestore];

        // Enable Persistance
        this.firebaseDB.enablePersistence({synchronizeTabs: true}).catch((e)=>console.log(`CondutionEngine (FirebaseProvider): persistance enabling failed due to code "${e.code}"`));
    }

    /**
     * Gets the FB pointer. B/c why not?
     * @property
     *
     */

    get fbPointer() {
        return firebase;
    }

    /**
     * Gets a Page to operate on
     *
     * @param {string[]} path: path that you desire to get a reference to
     * @param {Function} refreshCallback: the callback to update when data gets refreshed
     * @returns {Page}: the page ye wished for
     *
     */

    page(path: string[], refreshCallback?:Function) : FirebasePage {
        if (cache.has(JSON.stringify(path))) // TODO
            return cache.get(JSON.stringify(path))
        return new FirebasePage(path, this.firebaseDB, this.firebaseRef, refreshCallback);
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

    collection(path: string[], refreshCallback?:Function) : FirebaseCollection {
        if (cache.has(JSON.stringify(path))) // TODO
            return cache.get(JSON.stringify(path))
        return new FirebaseCollection(path, this.firebaseDB, this.firebaseRef, refreshCallback);
    }


    /**
     * The Authentication Providerj
     * @property
     *
     * Return the AuthenticationProvider instance bundled with the Provider, 
     * if that is supposed to be a thing
     *
     */

    get authenticationProvider() {
        return this.authProvider;
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
        snapshots.map((i:any) => i());
    }
}

function TODOFlushFirebaseData() {
    cache = new Map();
    unsubscribeCallbacks = new Map();
    snapshots.map((i:any) => i());
}

export default FirebaseProvider;
export { FirebasePage, FirebaseCollection, TODOFlushFirebaseData };

