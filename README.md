# Raidboss cloudstate

## Summary

This is an implementaion of a feature common in multiplayer games, the Raid Boss. Designs vary but in this case what we mean is some entity in a massively multiplayer video game (could be a PC, Console or Mobile game), that belongs to a group of players (an alliance or guild). A group summons a boss, usually with some form of in-game resource and then compete with each other to destroy it. Prizes are usually awarded for the players that inflict the most damage, so we track a leaderboard of damage inflicted.

Whilst this is a fully working backend feature, it is not a complete game. This system would be accessed by other game systems that handle validation that groups can create monster of certain types and at specific times. It would validate that players have the skills and resources to inflict the damage sent.

Given that a game may have hundreds of groups and millions of players online at any time, it is important that game features can remain responsive under heavy load. The first time I encountered this kind of game feature it was implemented with a combination of PHP, MySQL and used Memcached to synchronize the attacks. Unfortunately with this architecture the system was not responsive under load, since as multiple players attacked the same boss at once there would be a lot of contention to access the same resources.

A solution was built that used Akka cluster, Akka sharded actors and event sourcing. Under this new model the system was now easy to scale under load just by adding new servers. It was more responsive because active bosses are in memory and we switched to Cassandra which can also be scaled to handle much higher numbers of writes. While this solution works very well it required a dedicated team of Scala programmers familiar with Akka sharding.

With Lightbend's Cloudstate, the power of event sourcing and sharding actors now requires much less specialist knowledge and can be implemented in various languages. This implementation uses Node.js and Javascript to implement the raidboss feature. In the background Cloudstate handles all of the database interaction and event sourcing logic.

This service can be deployed using Docker or Kubernetes or you can deploy it to Lightbend's commercial hosting for Cloudstate services. There is an accompanying frontend to interact with this project here:

https://github.com/justinhj/cloudstate-raidboss-frontend

For load testing there is a sample project for load testing your raid boss service using Gatling here:

https://github.com/justinhj/gatling-raidboss-cloudstate

## Layout
* `raidbossservice.proto` - This is the gRPC interface that is exposed to the rest of the world. The user function doesn't implement this directly, it passes it to the Akka backend, that implements it, and then proxies all requests to the user function through an event sourcing specific protocol. Note the use of the `cloudstate.entity_key` field option extension, this is used to indicate which field(s) form the entity key, which the Akka backend will use to identify entities and shard them.
* `domain.proto` - These are the protobuf message definitions for the domain events and state. They are used to serialize and deserialize events stored in the journal, as well as being used to store the current state which gets serialized and deserialized as snapshots when snapshotting is used.
* `index.js` - This is the JavaScript code for implementing the service entity user function. It defines handlers for events and commands. It uses the cloudstate-event-sourcing Node.js module to actually implement the event sourcing protocol.
* `deploy` directory that contains the deployment yaml files.

### Storage Setup

`kubectl apply -f deploy/postgres-store.yaml`

## Building
```
npm install
DOCKER_PUBLISH_TO=[YOUR CONTAINER REGISTRY] npm run dockerbuildpush
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
 curl -v -H "Content-Type:application/json"  http://127.0.0.1:9000/raidboss/create -d '{"boss_instance_id":"example-boss-instance-1", "boss_def_id":"angry-ben-1", "group_id":"yoppworks-1"}'
```

### Attacking a boss

 curl -vv -H "Content-Type:application/json" http://127.0.0.1:9000/raidboss/attack -d '{"boss_instance_id":"example-boss-instance-1", "player_id":"justin-91", "damage":100}'

### Getting the current state of the boss
```
curl -v -H 'Content-Type:application/json' http://127.0.0.1:9000/raidboss/get/example-boss-instance-1
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
