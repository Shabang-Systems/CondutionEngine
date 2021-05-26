import SupabaseProvider, { SupabasePage, SupabaseCollection } from "../src/Storage/Backends/SupabaseBackend";
import { DataExchangeResult } from "../src/Storage/Backends/Backend";

const FakeAccount:string = "26aee1fe-641d-4d33-9e61-6e51bbaeb894";


async function test() {
    let provider: SupabaseProvider = new SupabaseProvider();
    let col: SupabaseCollection = provider.collection(["users", FakeAccount, "tasks"]);
    //let col: SupabaseCollection = provider.collection(["profiles"]);
    //let pg: SupabasePage = provider.page(["profiles", FakeAccount]);
    //console.log(await pg.set({}));
    let res: DataExchangeResult = await col.add({"hewo":"hewo", "dt": new Date()});

    console.log(res);
}

test();

