import SupabaseProvider, { SupabasePage, SupabaseCollection } from "../src/Storage/Backends/SupabaseBackend";
import { DataExchangeResult, Page } from "../src/Storage/Backends/Backend";

const FakeAccount:string = "26aee1fe-641d-4d33-9e61-6e51bbaeb894";
const FakeWorkspace:string = "23c7eb73-203a-458f-bd0b-54d95c2ea529";


async function test() {
    let provider: SupabaseProvider = new SupabaseProvider();
    //let col: SupabaseCollection = provider.collection(["users", FakeAccount, "tasks"]);
    let col: SupabaseCollection = provider.collection(["users", FakeAccount, "tasks"]);
    console.log(await (await col.pages())[0].set({"name": "hewab"}));
    //let pg: SupabasjPage = provider.page(["profiles", FakeAccount]);
    //col.add({"name": "bontehu"});
    //let col: SupabaseCollection = provider.collection(["profiles"]);
    //console.log(await col.add({"name": "chicken"}));

    //console.log(await pg[0].delete());
    //let res: DataExchangeResult = await col.add({"hewo":"hewo", "dt": new Date()});

}

test();

