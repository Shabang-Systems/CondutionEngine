import ReferenceManager from "./Storage/ReferenceManager";
import FirebaseProvider from "./Storage/Backends/FirebaseBackend";
import Workspace from "./Objects/Workspace";
import Task from "./Objects/Task";
import Tag from "./Objects/Tag";
import Project from "./Objects/Project";
import { RepeatRule, RepeatRuleType } from "./Objects/Utils";
import { Context } from "./Objects/EngineManager";
import { Collection, Page } from "./Storage/Backends/Backend";

require('dotenv').config();

// #!/Shabang | Condution at home:
// - Missing collections/pages are not handled well
// 

async function test(): Promise<void> {
    let provider: FirebaseProvider = new FirebaseProvider();
    let manager: ReferenceManager = new ReferenceManager([provider])

    await provider.authenticationProvider.authenticate({ payload: { email: process.env.USERNAME, password: process.env.PASSWORD } });

    // --- TODO everything called before this line needs to be refactored... :( ---

    let cm: Context = new Context(manager); // create the context
    await cm.start(); // start our context

    /*
       * @lb's grand vision
       * sourcesfilters => condition-based sorted set queried based on data. Deals with one condition
           * Projects + tags => reverse table (and foward table.) static in object
           * 
       * agg => logic??
       * 
       *
    */

    let tg:Tag = await Tag.create(cm, "mmm");
    tg.weight = 3;
    console.log(tg.id);

    let task:Task = await Task.create(cm, "Run task test");
    const actualtask:Task = await Task.fetch(cm, task.id);
    actualtask.tags = [tg, tg, tg, tg, tg, tg, tg];
    let weight:number = await actualtask.calculateWeight();
    let wtf = await actualtask.async_tags;
    console.log(wtf);
    console.log(weight);
    actualtask.tags = actualtask.tags.concat([tg]);
    console.log("Done! Exit me now.");
}

test();

export { ReferenceManager };
