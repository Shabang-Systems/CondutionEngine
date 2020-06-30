const firebaseCore = require("./core/firebase");

let core;

const init = function(type, source, ...args) {
    switch (type) {
        case "firebase":
            core = firebaseCore;
            break;
    }

    core.init(source, ...args);
}

module.exports = {init};

