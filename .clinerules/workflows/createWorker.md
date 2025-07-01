
# New Worker creation instructions

* Add a new .ts file at src\lib\agents\workers\ with a simple lowercase name indicating the name of the worker
* **Check how the workers works and are declared**, a good base and simple example is src\lib\agents\workers\display.ts
* Declare a global type using the name of the worker including fields and parameters.
* Create an empty "execute" function for the worker execution
* Create the const declaration, fill name, description and other fields and add the worker type and add any required handler
* Add the new worker in the registry at src\lib\agents\registry.ts
* Create a new component in src\components\flow\nodes following the name convention and create the basic component for React Flow
* Select the apropiate icon and assign it in the same way as other nodes at src\components\flow\nodes
* Open src\components\flow\flow.tsx and add the newly created component node and add it to the `nodeTypes` const.
* Ask the user any data you need to perform the task.