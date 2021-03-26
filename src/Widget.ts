import Perspective from "./Objects/Perspective";
import Project from "./Objects/Project";

import { Query } from "./Objects/Utils";
import { Context } from "./Objects/EngineManager";
import type { Filterable } from "./Objects/Utils";

/**
 * Collections of Elements
 *
 * Widgets are actually pretty simple things: 
 * they contain a specific Query, probably 
 * the cached results of the Query, and some 
 * hooking system to tell you when stuff changed.
 *
 * @param{Context} context    the context you wish to create the widget from
 *
 */

abstract class Widget {
    protected query:Query;
    protected hooks:Function[] = [];
    protected static cache:Map<string, Filterable[]>;

    /**
     * Execute the widget
     *
     * @returns{Promise<Filterable[]>} the desired list
     *
     */

    abstract execute():Promise<Filterable[]>;

    constructor(context:Context) {
        this.query = new Query(context);
    }

    /**
     * Nuke the cache
     * @static
     *
     */

    static SelfDestruct() {
        delete Widget.cache;
        Widget.cache = new Map();
    }
    
    /**
     * Hook a callback to whence this Query updates
     *
     * @param{Function} hookFn    the function you want to hook in
     * @returns{void}
     *
     */

    hook(hookFn: Function): void {
        this.hooks.push(hookFn);
        Query.hook(hookFn);
    }

    /**
     * Unook a hooked callback to whence this Query updates
     *
     * @param{Function} hookFn    the function you want to unhook
     * @returns{void}
     *
     */

    unhook(hookFn: Function): void {
        this.hooks = this.hooks.filter((i:any) => i !== hookFn);
        Query.unhook(hookFn);
    }
}

class PerspectivesMenuWidget extends Widget {
    async execute() {
        let allPerspectives:Perspective[] = await this.query.execute(Perspective, (_:Perspective)=>true) as Perspective[];
        allPerspectives.sort((a: Perspective, b: Perspective) => a.order-b.order);
        return allPerspectives;
    }
}

class ProjectMenuWidget extends Widget {
    async execute() {
        let topProjects:Project[] = await this.query.execute(Project, (i:Project)=> i.topLevel && !i.isComplete) as Project[];
        topProjects.sort((a: Project, b: Project) => a.order-b.order);

        return topProjects;
    }
}

export { Widget, ProjectMenuWidget, PerspectivesMenuWidget };
