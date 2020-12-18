/* 
 * 
 * Buenas Dias Human
 * I am Backend.ts.
 *
 * A file that defines what the pernickty backend
 * of Condution takes as a Storage provider.
 * 
 * All storage providers should inherit from the 
 * Provider abstract class. They at least need to provide
 * the refrence function that returns an instance of Page.
 *
 * Imagine that this is Poetry.
 *
 *
 * @jemoka
 *
 */

abstract class AuthenticationProvider {
    // TODO
}

/**
 *
 * @Class Provider
 * 
 * A backend provider that is used by the engine to get and manage data
 * 
 * Example:
 *
 * > let provider = new Provider();
 * > let taskRef = provide.reference("users", "test", "tasks", "434d5fab10129a");
 *
 */

abstract class Provider {
    name: String;
    abstract reference(path: String[]) : Page;
    authenticationProvider() : AuthenticationProvider {
        console.log("CondutionEngine: attempting to acquire the auth provider on a backend with authenticationProvider() unimplemented!");
        return null;
    }
}


/**
 *
 * @Class Page
 * 
 * A single page of a document
 * You probably know it as what a Provider refrence()
 * returns.
 *
 * All functions does a particular action on the page
 * 
 * Example:
 *
 * > let provider = new Provider()
 * > let page = provider.refrence("users", "test", "tasks", "434d5fab10129a")
 * > page.set({"name": "A Task!"})
 *
 */

abstract class Page {
    abstract get id() : String; // The ID of the Page

    abstract get() : object; // Function to get the value of page
    abstract add(payload:object) : object; // Function to send a value to the page
    abstract set(payload:object, ...param:any) : Function; // Function to set a value of a page
    abstract update(payload:object) : Function; // Function to update the value of a page
    abstract delete() : Function; // Function to delete a page
}

export { Provider, Page, AuthenticationProvider };

