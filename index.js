// Sample Cloudstate application
// RaidBoss by Justin Heyes-Jones
// @justinhj

const EventSourced = require("cloudstate").EventSourced;

const entity = new EventSourced(
  ["./raidbossservice.proto", "./domain.proto"],
  "org.justinhj.raidbossservice.RaidBossService",
  {
    persistenceId: "raidbossservice",
    snapshotEvery: 5, // Usually you wouldn't snapshot this frequently, but this helps to demonstrate snapshotting
    includeDirs: ["./"]
  }
);

/*
 * Here we load the Protobuf types. When emitting events or setting state, we need to return
 * protobuf message objects, not just ordinary JavaScript objects, so that the framework can
 * know how to serialize these objects when they are persisted.
 *
 * Note this shows loading them dynamically, they could also be compiled and statically loaded.
 */
const pkg = "org.justinhj.raidbossservice.persistence.";
const RaidBossCreated = entity.lookupType(pkg + "RaidBossCreated");
const RaidBossInstance = entity.lookupType(pkg + "RaidBossInstance");

const apipkg = "org.justinhj.raidbossservice.";

const APIRaidBossInstance = entity.lookupType(pkg + "RaidBossInstance");

/*
 * Set a callback to create the initial state. This is what is created if there is no
 * snapshot to load.
 *
 * We can ignore the userId parameter if we want, it's the id of the entity, which is
 * automatically associated with all events and state for this entity.
 */
entity.setInitial(instanceId => RaidBossInstance.create({
    bossInstanceId: instanceId}));

/*
 * Set a callback to create the behavior given the current state. Since there is no state
 * machine like behavior transitions for our example, we just return one behavior, but
 * this could inspect the state, and return a different set of handlers depending on the
 * current state of the MyState
 *
 * This callback will be invoked after each time that an event is handled to get the current
 * behavior for the current state.
 */
entity.setBehavior(state => {
  return {
    // Command handlers. The name of the command corresponds to the name of the rpc call in
    // the gRPC service that this entity offers.
    commandHandlers: {
      CreateRaidBoss: createRaidBoss,
      ViewRaidBoss: viewRaidBoss
    },
    // Event handlers. The name of the event corresponds to the (unqualified) name of the
    // persisted protobuf message.
    eventHandlers: {
      RaidBossCreated: raidBossCreated
    }
  };
});

/**
 * Handler for create command
 */
function createRaidBoss(raidBossCreate, state, ctx) {
  console.log("create raidboss", JSON.stringify(raidBossCreate), JSON.stringify(state));
  // Validation: check if already created
  if (state.created > 0) {
    var message = "createRaidBoss already created with id " + raidBossCreate.bossInstanceId
      + " and created " + state.created ;
    console.log(message);
    return APIRaidBossInstance.create({
      bossInstanceId: state.bossInstanceId,
      bossDefId: state.bossDefId,
      health: state.health,
      leaderboard: state.leaderboard,
      created: state.created,
      updated: state.updated,
      groupId: state.groupId
    });
  } else {
    // Create the event.
    const raidBossCreated = RaidBossCreated.create({
      instance: {
        bossInstanceId: raidBossCreate.bossInstanceId,
        bossDefId: raidBossCreate.bossDefId,
        health: 1000,
        leaderboard: [],
        created: Date.now(),
        updated: Date.now(),
        groupId: raidBossCreate.groupId
      }
    });
    // Emit the event.
    console.log("createRaidBoss::emit event", raidBossCreated);
    ctx.emit(raidBossCreated);

    var apiResult = APIRaidBossInstance.create({
        bossInstanceId: raidBossCreated.instance.bossInstanceId,
        bossDefId: raidBossCreated.instance.bossInstanceId,
        health: raidBossCreated.instance.health,
        leaderboard: raidBossCreated.instance.leaderboard,
        created: raidBossCreated.instance.created,
        updated: raidBossCreated.instance.updated,
        groupId: raidBossCreated.instance.groupId
      });

    console.log("createRaidBoss::responding with", apiResult);

    return apiResult;
  }
}


/**
 * Handler for view raidboss command
 */
function viewRaidBoss(request, state) {
  console.log("viewRaidBoss", state);
  return APIRaidBossInstance.create(state);
}

// Event handler for created

function raidBossCreated(createdEvent, state) {
  return createdEvent.instance
}

// /**
//  * Handler for item removed events.
//  */
// function myItemRemoved(removed, state) {
//   // Filter the removed item from the items by id.
//   state.items = state.items.filter(item => {
//     return item.id !== removed.id;
//   });

//   // And return the new state.
//   return state;
// }

// Export the entity
module.exports = entity;
entity.start();


