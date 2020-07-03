let dbFuncs = import("./src/ObjectManager.js");
let pspObj = import("./src/PerspectiveManage.js");
import {initFirebase} from "./src/DBManager.js";


export {initFirebase as start, dbFuncs as db, pspObj as perspective};