// Original code by Exr0n
// Adapted for the Condution Project db v2.0
// By Jemoka and Exr0n and Zbuster05 too

let firebaseDB, fsRef, dbPointer;

const init = function(firebasePointer, secrets, debug=1) {
    /*
     * Initalizes the firebase pointer
     *
     * @param   firebasePointer   A pointer to the Firebase API.
     *
     * @param   secrets   JSON in the standard Condution secrets format.
     *
     * @param   mode    Int 0=deploy 1=debug
     *
     */

    firebasePointer.initializeApp(debug ? secrets.dbkeys.debug : secrets.dbkeys.deploy)
    [ firebaseDB, fsRef ] = [firebasePointer.firestore(), firebasePointer.firestore];
    dbPointer = firebaseDB.collection("v2");
}

const authUtil = function() {
    const authenticate = function() {
    }

    const createAccount = function() {
    }
    
    return {login: authenticate, create:createAccount};
}

const loadData, onSync, flushData = function() {

    let uid;

    const loadData = function(userID) {

        /* 
         * Seed original data and subscribe listeners
         *
         * @param   userID   String UID.
         *
         * @return   object   The seed data
         *
         */

        uid = uid;
        dbPointer.doc(uid).collection();

    }
    return loadData;
}();

module.exports = {init, load:loadData, sync:onSync, flush: flushData};

