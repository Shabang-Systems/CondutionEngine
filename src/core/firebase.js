// Original code by Exr0n
// Adapted for the Condution Project db v2.0
// By Jemoka and Exr0n and Zbuster05 too

let firebaseDB, fsRef;

const init = function(firebasePointer, keyfile, debug=1) {
    /*
     * Initalizes the firebase pointer
     *
     * @param   firebasePointer   A pointer to the Firebase API.
     *
     * @param   keyfile   String location of secrets.json
     *
     * @param   mode    Int 0=deploy 1=debug
     */

    const secrets = require(keyfile)
    firebasePointer.initializeApp(debug ? secrets.dbkeys.debug : secrets.dbkeys.deploy)
    [ firebaseDB, fsRef ] = [fbPointer.firestore(), fbPointer.firestore];
}

module.exports = {init};

