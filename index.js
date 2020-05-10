// Sample Cloudstate application
// RaidBoss by Justin Heyes-Jones
// @justinhj

const Long = require("long");

const EventSourced = require("cloudstate").EventSourced;

const entity = new EventSourced(
  ["./raidbossservice.proto", "./domain.proto"],
  "org.justinhj.raidbossservice.RaidBossService",
  {
    persistenceId: "raidbossservice",
    snapshotEvery: 5,
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
const RaidBossAttacked = entity.lookupType(pkg + "RaidBossAttacked");

const RaidBossInstance = entity.lookupType(pkg + "RaidBossInstance");

const apipkg = "org.justinhj.raidbossservice.";

const APIRaidBossInstance = entity.lookupType(apipkg + "RaidBossInstance");

/*
 * Set a callback to create the initial state. This is what is created if there is no
 * snapshot to load.
 *
 * We can ignore the userId parameter if we want, it's the id of the entity, which is
 * automatically associated with all events and state for this entity.
 */
entity.setInitial(instanceId => RaidBossInstance.create({
    bossInstanceId: instanceId,
    leaderboard: [],
    killedBy: ""}));

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
      ViewRaidBoss: viewRaidBoss,
      AttackRaidBoss: attackRaidBoss
    },
    // Event handlers. The name of the event corresponds to the (unqualified) name of the
    // persisted protobuf message.
    eventHandlers: {
      RaidBossCreated: raidBossCreated,
      RaidBossAttacked: raidBossAttacked
    }
  };
});

// Leaderboard management
function incrementPlayerLeaderboardScore(playerId, scoreInc, leaderboard) {

  var updated = false;

  for (var i=0; i<leaderboard.length; i++) {
    var entry = leaderboard[i];
    if(entry.playerId.localeCompare(playerId) === 0) {
      //console.log("updating player " + playerId + " from " + entry.score + " to " + scoreInc );
      entry.score = entry.score.add(Long.fromValue(scoreInc));
      updated = true;
      break;
    }
  }

  if(updated == false) {
    //console.log("init player " + playerId + " to " + scoreInc );
    leaderboard.push({playerId: playerId, score: Long.fromValue(scoreInc)});
  }

  return leaderboard;
}

// Take the top n leaderboard entries
function takeNLeaderboard(n, leaderboard) {

  leaderboard.sort(function(a, b) {
    if(a.score == b.score) {
      return a.playerId.localeCompare(b.playerId)
    } else {
      return b.score - a.score;
    }
  });

  var leaderboardOut = leaderboard.slice(0,n);
  for(i=0; i<leaderboardOut.length; i++) {
    leaderboardOut[i].score = Long.fromValue(leaderboardOut[i].score);
  }
  return leaderboardOut;
}

/**
 * Handler for create command
 */
function createRaidBoss(raidBossCreate, state, ctx) {
  console.log("create raidboss", JSON.stringify(raidBossCreate), JSON.stringify(state));
  // Validation: check if already created
  if (state.created > 0) {
    return APIRaidBossInstance.create({
      bossInstanceId: state.bossInstanceId,
      bossDefId: state.bossDefId,
      health: state.health,
      leaderboard: state.leaderboard,
      created: state.created,
      updated: state.updated,
      groupId: state.groupId,
      killedBy: state.killedBy
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
    //console.log("createRaidBoss::emit event", raidBossCreated);
    ctx.emit(raidBossCreated);

    var apiResult = APIRaidBossInstance.create({
        bossInstanceId: raidBossCreated.instance.bossInstanceId,
        bossDefId: raidBossCreated.instance.bossDefId,
        health: raidBossCreated.instance.health,
        leaderboard: takeNLeaderboard(10, raidBossCreated.instance.leaderboard),
        created: raidBossCreated.instance.created,
        updated: raidBossCreated.instance.updated,
        groupId: raidBossCreated.instance.groupId
      });

    //console.log("createRaidBoss::responding with", apiResult);

    return apiResult;
  }
}

/**
 * Handler for attack raidboss command
 */
function attackRaidBoss(attackReq, state, ctx) {
  var damage = Long.fromValue(attackReq.damage);

  if (state.created > 0) {
    var newHealth = Long.fromValue(state.health).subtract(damage);
    var inflicted = damage;
    if(newHealth < 0) {
      inflicted = inflicted.add(newHealth);
      newHealth = 0;
    }

    var killedBy = "";
    if(newHealth == 0) {
      killedBy = attackReq.playerId;
    }

    var newLeaderboard = state.leaderboard.slice();
    incrementPlayerLeaderboardScore(attackReq.playerId, inflicted, newLeaderboard);

    const raidBossAttacked = RaidBossAttacked.create({
       playerId:  attackReq.playerId,
       damageInflicted: inflicted
    });
    ctx.emit(raidBossAttacked)

    return APIRaidBossInstance.create({
      bossInstanceId: state.bossInstanceId,
      bossDefId: state.bossDefId,
      health: newHealth,
      leaderboard: takeNLeaderboard(10, newLeaderboard),
      created: state.created,
      updated: Date.now(),
      groupId: state.groupId,
      killedBy: killedBy
    });

  } else {
    ctx.fail("attackRaidBoss::attacked before initialized");
    return {};
  }
}

/**
 * Handler for view raidboss command
 */
function viewRaidBoss(request, state) {
  var view = {
    bossInstanceId: state.bossInstanceId,
    bossDefId: state.bossDefId,
    health: state.health,
    leaderboard: takeNLeaderboard(10, state.leaderboard),
    created: state.created,
    updated: state.updated,
    groupId: state.groupId,
    killedBy: state.killedBy
  }

  return APIRaidBossInstance.create(view);
}

// Event handler for created

function raidBossCreated(createdEvent, state) {
  return createdEvent.instance
}

// Event handler for attacked

function raidBossAttacked(attackEvent, state) {

  var newHealth = state.health - attackEvent.damageInflicted;

  if(state.health > 0 && newHealth == 0) {
    state.killedBy = attackEvent.playerId;
  }

  state.health = newHealth;

  var newLeaderboard = state.leaderboard.slice();
  incrementPlayerLeaderboardScore(attackEvent.playerId, attackEvent.damageInflicted, newLeaderboard);

  state.updated = Date.now();
  state.leaderboard = newLeaderboard;
  return state
}

// Export the entity
module.exports = entity;
entity.start();
