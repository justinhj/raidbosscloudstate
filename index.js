/*
 * Copyright 2019 Lightbend Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const EventSourced = require("cloudstate").EventSourced;

const entity = new EventSourced(
  ["./myservice.proto", "./domain.proto"],
  "com.example.myservice.MyService",
  {
    persistenceId: "myservice",
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
const pkg = "com.example.myservice.persistence.";
const MyItemAdded = entity.lookupType(pkg + "MyItemAdded");
const MyItemRemoved = entity.lookupType(pkg + "MyItemRemoved");
const MyState = entity.lookupType(pkg + "MyState");


/*
 * Set a callback to create the initial state. This is what is created if there is no
 * snapshot to load.
 *
 * We can ignore the userId parameter if we want, it's the id of the entity, which is
 * automatically associated with all events and state for this entity.
 */
entity.setInitial(userId => MyState.create({items: []}));

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
      AddItem: myAddItem,
      RemoveItem: myRemoveItem,
      GetState: myGetState
    },
    // Event handlers. The name of the event corresponds to the (unqualified) name of the
    // persisted protobuf message.
    eventHandlers: {
      MyItemAdded: myItemAdded,
      MyItemRemoved: myItemRemoved
    }
  };
});

/**
 * Handler for add item commands.
 */
function myAddItem(addItem, state, ctx) {
  console.log("addItem", addItem);
  // Validation:
  // Make sure that it is not possible to add negative quantities
  if (addItem.quantity < 1) {
    console.log("addItem:: quantity check failed")
    ctx.fail("Cannot add negative quantity to item " + addItem.id);
  } else {
    // Create the event.    
    const itemAdded = MyItemAdded.create({
      item: {
        id: addItem.id,
        name: addItem.name,
        quantity: addItem.quantity
      }
    });
    // Emit the event.
    console.log("addItem::emit event", itemAdded);
    ctx.emit(itemAdded);
    return {};
  }
}

/**
 * Handler for remove item commands.
 */
function myRemoveItem(removeItem, state, ctx) {
  console.log("removeItem", removeItem);
  // Validation:
  // Check that the item that we're removing actually exists.
  const existing = state.items.find(item => {
    console.log("removeItem:: return existing");
    return item.id === removeItem.id;
  });

  // If not, fail the command.
  if (!existing) {
    ctx.fail("Item " + removeItem.id + " not in state");
  } else {
    // Otherwise, emit an item removed event.
    const itemRemoved = MyItemRemoved.create({
      id: removeItem.id
    });
    ctx.emit(itemRemoved);
    return {};
  }
}

/**
 * Handler for get state commands.
 */
function myGetState(request, state) {
  console.log("getState", state);
  // Simply return the state as is.
  return state;
}

/**
 * Handler for item added events.
 */
function myItemAdded(added, state) {
  console.log("itemAdded");
  // If there is an existing item with that id, we need to increment its quantity.
  const existing = state.items.find(item => {
    console.log("itemAdded::return existing");
    return item.id === added.item.id;
  });

  if (existing) {
    existing.quantity = existing.quantity + added.item.quantity;
  } else {
    console.log("itemAdded::push");
    // Otherwise, we just add the item to the existing list.
    state.items.push(added.item);
  }

  // And return the new state.
  console.log("return state");
  return state;
}

/**
 * Handler for item removed events.
 */
function myItemRemoved(removed, state) {
  // Filter the removed item from the items by id.
  state.items = state.items.filter(item => {
    return item.id !== removed.id;
  });

  // And return the new state.
  return state;
}

// Export the entity
module.exports = entity;
entity.start();