# Raidboss cloudstate
A massively multiplayer raid boss implementation (A shared monster that thousands of players can attack. Includes leaderboards to track damager).

## Layout
* `myservice.proto` - This is the gRPC interface that is exposed to the rest of the world. The user function doesn't implement this directly, it passes it to the Akka backend, that implements it, and then proxies all requests to the user function through an event sourcing specific protocol. Note the use of the `cloudstate.entity_key` field option extension, this is used to indicate which field(s) form the entity key, which the Akka backend will use to identify entities and shard them.
* `domain.proto` - These are the protobuf message definitions for the domain events and state. They are used to serialize and deserialize events stored in the journal, as well as being used to store the current state which gets serialized and deserialized as snapshots when snapshotting is used.
* `myservice.js` - This is the JavaScript code for implementing the service entity user function. It defines handlers for events and commands. It uses the cloudstate-event-sourcing Node.js module to actually implement the event sourcing protocol.
* `deploy` directory that contains the deployment yaml files.

### Storage Setup
* Modify `deploy/postgres-store.yaml`
    * Change the `name` to be unique amongst your services.
    * eg: `myservice-postgres`
* Modify `my-service.yaml` to match
    * Change `spec|storeConfig|statefulStore|name` to match the name used above.

## Your Code
You want to make changes to the following files:
* Edit both the `domain.proto` and the `myservice.proto`, renaming those files as you see fit.
* Once your model, command and events are defined as you like, we need to know how to implement the service.
* Edit the `index.js` file, again renaming the file and contents to your liking.
   * Follow the comments in these files as a guide to help you edit.

## Building
```
npm install
npm run prestart
```

This will create `user-function.desc` which describes your stateful function to Cloudstate
```
docker build . -t <my-registry>/my-service:latest
```

Push the docker image to the registry
```
docker push <my-registry>/my-service:latest
```

Deploy the image by changing into the deploy folder and editing the `my-service.yaml` to point to your docker image that you just pushed.
```
$ cd ../deploy
$ cat my-service.yaml
apiVersion: cloudstate.io/v1alpha1
kind: StatefulService
metadata:
  name: my-service
spec:
  containers:
  - image: coreyauger/my-service:latest    # <-- Change this to your image
    name: my-service
```

## Deploy

Deploy the stateful store to your project namespace
```
$ kubectl apply -f postgres-store.yaml -n <project-name>
statefulstore.cloudstate.io/my-postgres created
````

Deploy the service to your project namespace
```
$ kubectl apply -f my-service.yaml -n <project-name>
statefulservice.cloudstate.io/my-service created
````

### Verify they are ready
Check that the store and service are in the ready state.
```
$ kubectl get statefulstore -n <project-name>
NAME             REPLICAS   STATUS
my-postgres      1          Running

$ kubectl get statefulservices -n <project-name>
NAME             REPLICAS   STATUS
my-service       1          Running
```

To redeploy a new image to the cluster you must delete and then redeploy using the yaml file.
For example if we updated the my-service docker image we would do the following.
````
$ kubectl delete statefulservice my-service -n <project-name>
statefulservice.cloudstate.io "my-service" deleted
$ kubectl apply -f my-service.yaml -n <project-name>
statefulservice.cloudstate.io/my-service created
````

## Routes
Public routes can be used through grpc and grpc-web calls.  These exist in the `routes.yaml` file.

```
$ cat routes.yaml
apiVersion: cloudstate.io/v1alpha1
kind: Route
metadata:
  name: my-routes
spec:
  http:
  - name: my-routes
    match:
    - uri:
        prefix: /
    route:
      service: my-service
```

Add these routes by performing
```
kubectl apply -f routes.yaml -n <project-name>
```

The web url that will resolve the above route to the default route:
`https://<project-name>.us-east1.apps.lbcs.dev/`

NOTE: utilities like `grpcurl` use service reflection on the default route `/`.  What this means is that you
can only use `grpcurl` with the service on the default route.

## Testing
You can now use `curl` in combination with the `option (google.api.http)` that you defined in your `myservice.proto`.  For more information
on how json is encoded to protobuf see: [https://cloud.google.com/endpoints/docs/grpc/transcoding](https://cloud.google.com/endpoints/docs/grpc/transcoding).

### Building and launching the service locally

Uses Docker rather than Kubernetes

`docker build . -t [your docker registry account]/raidboss-service:latest`

OR

`DOCKER_PUBLISH_TO=[your docker registry account] npm run dockerbuild`

`docker run -it --rm --network container:cloudstate --name raidboss -e DEBUG="cloudstate*" [your docker registry account]/raidboss-service`

### Creating a boss
```
curl -v -H "Content-Type:application/json"  https://.us-east1.apps.lbcs.dev/state/example-boss-instance-1/raidbosses/create -d '{"boss_instance_id":"example-boss-instance-1", "boss_def_id":"angry-ben-1, "group_id:yoppworks-1"}'
```

### Adding an item
```
curl -v  -H  "Content-Type:application/json"  https://<PROJECT_NAME>.us-east1.apps.lbcs.dev/state/{user_id}/items/add -d '{"user_id":"username", "id":"test", "name":"test", quantity: 1}'
```

### Getting the state
```
curl -v -H 'Content-Type:application/json'  https://<PROJECT_NAME>.us-east1.apps.lbcs.dev/state/{user_id}/items
```

### Removing an item
```
curl -v  -XPOST -H  "Content-Type:application/json"  https://<PROJECT_NAME>.us-east1.apps.lbcs.dev/state/{user_id}/items/{id}/remove
```


## Maintenance notes

### License
The license is Apache 2.0, see [LICENSE-2.0.txt](LICENSE-2.0.txt).

### Maintained by
__This project is NOT supported under the Lightbend subscription.__

If you find any issues with these instructions, please report them [here](https://github.com/lightbend/cloudstate-samples/pull/link_to_issue_tracker).

Feel free to ping the maintainers above for code review or discussions. Pull requests are very welcome–thanks in advance!


### Disclaimer

[DISCLAIMER.txt](../DISCLAIMER.txt)
