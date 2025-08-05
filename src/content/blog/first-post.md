---
title: "Game Engine Deep Dive - Part 1: GTA 3"
description: "
There have been a lot of video games over the years; thus, a lot of different approaches  
to doing the same things! In this series of arbitrary length, we go through a bunch of different  
video games - aided by their source code, either released publically, decompiled, or leaked through  
legally dubious means - and determine what kinds of approaches were used by tried-and-true games of  
various pedigree.


In the first installment, we'll go through Grand Theft Auto: Vice City. It uses the same underlying  
game engine as Grand Theft Auto 3, with some advantages that make it useful for me to use as a  
reference. We'll introduce the various things we're looking for, as well as some neat extras in all of  
the engines we go through, with perhaps some history and insights provided."
summary: "We're looking at how the Grand Theft Auto 3 game engine handles some important game engine tasks."
pubDate: 2023-09-12T03:58:11+01:00
draft: false
tags:
  - "Game Engine"
  - "GTA 3"
  - "GTA VC"
  - "RenderWare"
  - "Game Development"
---

Before we dive into the engine and the main content of today, let's first dive into the history,
because there's a lot to unpack before we can get to the meat of today's project.

Grand Theft Auto 3 was released in 2001 (for the PlayStation 2), with a 2002 release for PC and a 2003 release for the Xbox (the original, chunky one).

It was the first 3D instalment of the GTA series, and it was developed primarily by Rockstar North 
(which was actually a British (which was actually Scottish) company called DMA Design). They created it using Criterion Games' RenderWare engine.


<img src="https://gemwire.uk/files/i7no5.png" width="20%" style="margin-bottom:20px" /> <img src="https://gemwire.uk/files/1085646-renderwarelogo.jpg" width="70%" style="margin-bottom:20px" /> 

The RenderWare engine was created primarily to bridge the gap between the PlayStation 2's rendering hardware, 
and the computers you'd use to write the software. During its' time, 
it was known as "Sony's DirectX" - a comparison to DirectX which was used on the Xbox.

As an aside, this is where the Xbox got its' name; it was a box ("computer") running DirectX. 
It was a DirectX box. It was a Direct XBox. An Xbox, if you will.

Back to the subject, RenderWare was used in a LOT of cross-platform games in the very early 2000s. 
Some of the more notable games that used RenderWare are:

* Battlefield 2
* Burnout (1, 2, 3, Dominator, Legends, Paradise, Revenge)
* Grand Theft Auto (3, Vice City, San Andreas)
* Rayman (2, M)
* Tony Hawk's Pro Skater 3
* Shadow The Hedgehog
* Sonic Heroes

Almost all of the games I just listed are usually regarded by a significant amount of people 
as "the best game of all time", which is a purely subjective measure, but it speaks to the number 
of people that grew up with these games as their primary time sink.

Personally, I was suprised to see Shadow The Hedgehog and Sonic Heroes on this list. 
These are VERY highly regarded games, along with the Burnout and 
Grand Theft Auto series. However, yeah, that's what we're looking into today.

I have a copy of Grand Theft Auto: Vice City, which uses an unmodified version of the RenderWare engine. 
Naturally, RenderWare is more-or-less only a renderer, 
so it doesn't handle most of the stuff game engines do nowadays, but we're getting 
a significant amount of insight into [all of these other games.](https://en.wikipedia.org/wiki/Category:RenderWare_games)

Because RenderWare is so cross-platform, it is very light, and very easy to 
understand - it had to be compiled for a lot of systems, after all! It's claimed to work on the 
GameCube, Wii, Xbox, Xbox 360, PlayStation 2, PlayStation 3, PlayStation Portable(!), Windows, and Mac OS X.

That mention of the PSP made me check, and yeah - GTA 3 is also sold for the PSP, and it uses the RenderWare engine. Impressive!

Getting back to topic, GTA: VC 
(as i'll refer to it from now on, because typing the full name is a huge pain..) 
is a follow-up to GTA 3 using the exact same engine, and in fact uses the exact 
same code for almost everything, to the point where the game's assets are stored in "models/gta3.img". It's more or less GTA 3 but with different assets.

All this to mean, when we look at the GTA: VC code, we're also looking at the 
GTA 3 code, and to a lesser extent the GTA: San Andreas code. All three were developed 
by Rockstar North, and all use RenderWare, so it's a safe bet that they use the same code, 
for the most part. However, San Andreas represents a significant jump in fidelity and gameplay, 
so it's likely that Rockstar North upgraded the engine itself between these two installations.

Because of that, it's likely that what we go through today only really applies to GTA 3 and 
GTA VC, with most(?) of the rendering stuff applying to all the other RenderWare games.

With that aside, let's start getting into it.

# GTA 3 Engine

The engine underlying the games is interesting in that it is extremely lightweight 
(because it runs on so many platforms) and yet capable of running a lot of.. game (as in, story wise) in as little memory as it has.

What this tells me is that the engine itself is designed with as little operating overhead as possible, 
to leave enough space in memory for the world and the player with a lot of chaotic, high speed action.

Therefore, what I'm interested in is:
- how objects are represented, stored, and processed in the game
- how objects interactions are handled
- how scripted events are handled
- what the limits of the graphics system are
- how many objects it takes to bring the engine to its knees
- how fast it can render a single object
- what happens if everything explodes at once

.. Okay, fine, those last few went a little off the rails. To keep it fair, we'll do the same 
to every other engine we look at... as long as they support explosions, at least. :)

Let's start off with..

## The Entity System

Game engines tend to follow Occam's Razor - that being, the simplest solution is usually the easiest. 
This means that entities follow a similar process.

By "entities" here, i mean everything that can interact with anything else. 
If you can see it, or touch it, it's an entity. Usually people call these "objects", or "actors", but the parlance 
I prefer is "entity", because that's also what almost every engine 
I'm going to look at calls them, and I like not making my life harder.

And, yes, that means that walls and buildings are entities, despite being inanimate. I didn't write the rules.

Anyway, Occam's Razor.. when making a game, there's something called the core game 
loop that you have to deal with, and it looks something like this:

```c
while (the game is running) {
  update (every entity);
  // and then
  render (every entity);
  // and then
  wait (until we need to update again);
}
```


We need to update entities so that they can move, otherwise we just render the same unmoving screen over and over, 
and our game engine is actually an image viewer.. that can only show one image.

We also need to wait, so that we can run other things in the background once this core loop is done. 
Generally, systems have a maximum "frame rate" - how many times we can render in a second - of about thirty 
or sixty frames per second, but our frames don't usually take very long to render, so we can 
do other stuff in betweeen, such as playing audio, or processing scripts.

If we don't wait here, we'll end up rendering as fast as the processor and graphics chip will allow us to, 
which can usually end up in pinning both at 100% usage, which will cause the entire system to slow down... 
which means our input will take longer to go through, and the game will "feel" slower, despite running much faster.

Some games allow you to artificially increase the wait time, which is called a "frame limiter" 
in GTA 3, Vice City and San Andreas. It forces the game to render fewer frames so that it can focus on other things, 
which can sometimes make audio less stuttery and reduce input latency, which can sometimes make the game feel faster, 
as mentioned before.

Holy moly, we're four tangents deep. Let's start digging our way out of this rabbit hole..

Those update and render functions could be implemented in a lot of ways. A full ECS (Entity-Component-System) system[^1] 
would be very complicated to develop, take a significant amount of memory overhead, but be extremely fast on the 
processor to update and render, due to its ability to take advantage of processor caching and optimized instruction stepping. 
This typically results in a requirement to have a hierarchy of Scenes, Actors, Entities, Components, 
and data attached to those components.

However, the simplest solution.. is simply to have a list (or an "array") of entities, 
and iterate over them in order to perform the update:

```c
update (entities) {
  for (entity in the list of entities) {
    entity.update()
  }
}
```

Yes. That's literally it.

Occam's Razor would lead us to believe this is the most common solution.

And it's right! This is by far how most engines deal with their entities.

Indeed, this is also how GTA 3 deals with its entities:


```cpp
for(CPtrNode *node = ms_listMovingEntityPtrs.first; node; node = node->next) {
  CPhysical *movingEnt = (CPhysical *)node->item;
  if(movingEnt->bRemoveFromWorld) {
    RemoveEntityInsteadOfProcessingIt(movingEnt);
  } else {
    movingEnt->ProcessControl();
    if(movingEnt->GetIsStatic()) { movingEnt->RemoveFromMovingList(); }
  }
}
```

This is one of several loops that the game uses per update cycle.

``movingEnt->ProcessControl()`` is what actually performs the update on the entity - applies velocity related movement 
deltas, gravity, friction, and air resistance slowdowns, along with everything else that the game processes.

There's a lot more to unpack here, though. For example, ```ms_listMovingEntityPtrs```, what exactly a ```CPtrNode*``` is, and how that relates to a ```CPhysical```.

### The GTA 3 World

In Grand Theft Auto 3, the world is split into a number (80 * 80 = 6,400) of "sectors", which are small fragments 
of the open-world level that can be loaded in independently to provide a sense of having the entire level loaded at one time.

A sector is sized to be compatible with CD Streaming, as that is the method that the game 
is loaded from disc on all systems, hence the number of them.

A sector is very simple:

```cpp
class CSector {
  public:
  CPtrList m_lists[NUMSECTORENTITYLISTS];
};
```

``NUMSECTORENTITYLISTS`` is simply the size of the list of types of objects that the game can handle. A readable list of these types:
* buildings (most level geometry!)
* objects   (props, ie. lamp posts, traffic lights)
* vehicles  (cars, buses, motorcycles)
* peds      (humans, including player)
* dummies   (non-physical objects, such as internal triggers and lights)

Interestingly, buildings doesn't just apply to the big concrete structures that you see in the game;
it's also the ground, the grass, and everything static that can't be destroyed.

For example, here's a screenshot of the game with "buildings" still rendered, vs without:

<img src="https://gemwire.uk/files/d1cxy.png" width="45%" style="margin-bottom:20px" /> <img src="https://gemwire.uk/files/jr7b1.png" width="45%" style="margin-bottom:20px" /> 

To get the big buildings away, we must also disable... "big buildings". That looks like:

<img src="https://gemwire.uk/files/h58me.png" width="45%" style="margin-bottom:20px" />
<br>

Oddly, this building remains even if we disable all of these sector entity lists from being rendered:
<br>

<img src="https://gemwire.uk/files/hxbyy.png" width="45%" style="margin-bottom:20px" />

Which I truly cannot explain. Moving on...


Each of these sector entity lists gets their own CPtrList in the game's memory, 
to simplify iterating over all of the objects of each type in each sector.

The implementatiion of CPtrList simply stores the first element in a linked list:

```cpp
class CPtrList {
  public:
  CPtrNode *first;
```

and provides some utility methods for accessing, finding, inserting, and removing nodes from the list. 
That's more or less it.

The CPtrNode within it allows for storing arbitrary data through a void* typeless pointer:

```cpp
class CPtrNode {
  public:
  void *item;
  CPtrNode *prev;
  CPtrNode *next;

  void *operator new(size_t);
  void operator delete(void *p, size_t);
};
```

which allows for some interesting behaviours.

As seen above, when iterating the world for objects that need to move, the game loops over 
``ms_listMovingEntityPtrs`` (which is just a CPtrList stored in the world to keep track of things that move) 
and casts each item inside it to CPhysical*.

A CPhysical is basically a ``CEntity`` (yes, we'll get there) that can collide with other ``CPhysicals``. 
They have mass, momentum, inertia, and a bunch of functions to handle collisions. Apart from that, there's not much about them.

Now, we can finally dive into the Entity itself. Let's start with a diagram:

```goat
.-------. Contains     .-------. 
| World +----+------->| Sectors |
'---+---'    |         '---+---' 
    |        |Caches       | Contains
    |        |             v
    |        |    .--------+-------.  Maintains     .----------------------------.   Stores    .---------------.
    |        +-->| Entity CPtrLists +------------->| Entity CPtrNode Linked Lists +---------->| CPhysical* Data |
    |             '----------------'                '----------------------------'             '--------+------'
    |                                   Updates                                                     ^   |
    +-----------------------------------------------------------------------------------------------'   | Handles
                                                                .---------------.----------------.------'
                                                                |               |                |             
                                                                v               v                v           
                                                          .-----------.    .----------.    .----------.
                                                          | Collision |    | Velocity |    | Friction |
                                                          '-----------'    '----------'    '----------'
```
[^2]

This is more or less the answer to "how entities are stored, represented and processed" in the game. 
This only refers to processing the entity movement logic, but there are other kinds of ways that entities can interact with each other:

### Entity Interactions

Entity interactions are handled in several different ways, but let's walk through a variety of 
different scenarios to see how they play out in the game engine, and determine 
what we can learn from how Rockstar North implemented it.

We'll look at:
* Spawning a car
* Spawning a grenade
* Throwing a grenade at the car

There are a couple of functions that are important and common between these scenarios, so we'll go through 
the common elements beforehand, and get those under our belt before we dive into what 
actually happens in the game code when this happens.

First, there's a function to get a list of things that are close to, or are already, intersecting each other:
```cpp
static void FindObjectsKindaColliding(
  const CVector& position, 
  float radius, 
  bool bCheck2DOnly, 
  int16* nCollidingEntities, 
  int16 maxEntitiesToFind, 
  CEntity** aEntities, 
  bool bBuildings, 
  bool bVehicles, 
  bool bPeds, 
  bool bObjects, 
  bool bDummies
);
```

This feeds into the functions that determine whether an object is *actually* intersecting, 
and serves as a performant way to narrow the search list for entities that actually have a chance 
to be intersecting (say, a car in Escobar International Airport has absolutely no chance to intersect a lamppost near Vice City Beach).

Actually performing the intersection calculations is done later, but the general process for FindObjectsKindaColliding looks like this:

```goat
    (input: position)
.---------------------------.      .----------------------------------.       .------------------.
| FindObjectsKindaColliding +---->| Get all sectors in the search area +---->| For each sector... |
'---------------------------'      '----------------------------------'       '---------+--------'
  ^                                                                                     |
  |                                                     .-------------------------------'
  |                                                     |  (and for every entity list)
  |                                                     v
  |                                 .-------------------------------------.
  |                                 | FindObjectsKindaCollidingSectorList |
  |                                 '-------------------+-----------------'
  |                                                     |
  |                                                     v
  |                                      .------------------------------.
  |                                     | For every entity in the list.. |<--------------------------------------------------------------------------.
  |                                      '-------------+----------------'                                                                            |
  |                              .---------------------'                                                                                             |
  |                              |                                                                                                                   |
  |                              v                                                                                                                   |
  |     .------------------------+-------------------------------.      .--------------------------------.  if distance > bounding range   .---------+-------------.       
  |    | Check the distance from the given position to the entity +--->| Compare to entity's bounding box +------------------------------>| Continue to next entity |
  |     '--------------------------------------------------------'      '---------------+----------------'                                 '-----------------------'
  |                                                                                 |                                                               ^
  |                                                                                 | if distance <= bounding range                                 |
  |                                                                                 |                                                               |
  |                                                                                 v                                                               |
  |                                           data                  .---------------------------------.            control flow                     |
  '----------------------------------------------------------------+  Save to colliding entities list  +--------------------------------------------'
                                                                    '---------------------------------'
```


Outwardly, this looks like a standard spherical bounding volume detection algorithm. It tends to be the fastest way to implement something like this, so it makes sense that it shows up in a highly multiplatform game like this.

Now, when we use the short form FindColliding, we can substitute that square with the above flowchart, and continue forward with the data passed from the colliding entities list (which is called aEntities[] in code).

Next up, we can start picking apart the vehicle spawn logic.

The function that spawns vehicles is relatively short, and the entire code can be placed in a block, so here it is:

```cpp
void CCarGenerator::Process() {
  if (
    m_nVehicleHandle == -1 &&
    (CTheCarGenerators::GenerateEvenIfPlayerIsCloseCounter || CTimer::GetTimeInMilliseconds() >= m_nTimer) &&
    m_nUsesRemaining != 0 && CheckIfWithinRangeOfAnyPlayers()
  )
    DoInternalProcessing();
    
  if (m_nVehicleHandle == -1)
    return;
    
  CVehicle* pVehicle = CPools::GetVehiclePool()->GetAt(m_nVehicleHandle);
  if (!pVehicle){
    m_nVehicleHandle = -1;
    return;
  }
  if (pVehicle->GetStatus() != STATUS_PLAYER)
    return;
    
  m_nTimer += 60000;
  m_nVehicleHandle = -1;
  m_bIsBlocking = true;
  pVehicle->bExtendedRange = false;
  if (m_nModelIndex < 0)
    m_nModelIndex = -1;
}
```

Despite being short, it's not exactly simple, so let's turn it into a diagram we can follow visually:

```goat
                                                                                         Pre-spawn checks
.------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------.
|                                                                                                                                                                                                      |
|                            Check whether we can spawn                                                                          Check whether we need to spawn                                        |
|  .----------------------------------------------------------------------------------.    .--------------------------------------------------------------------------------------------------------.  |
|  |                                                                                  |    |                                                                                                        |  |
|  |   .-------------------------------.     .----------------------------.           |    |     .---------------------------------------------------.       .--------------------------------.     |  |
|  |  | Is there a car already spawned? |   | Is there a player too close? |          |    |    | Has this spawner got at least one "uses" remaining? |     | Has the spawn countdown elapsed? |    |  |
|  |   '-------------+-----------------'     '----------------------------'           |    |     '-------------------------+-------------------------'       '----------------+---------------'     |  |
|  |                 |                                        |                       |    |                               |                                                  |                     |  |
|  |                 | if no                           if no  |                       |    |                               | if yes                                   if yes  |                     |  |
|  |                 |                                        |                       |    |                               |                                                  |                     |  |
|  |                 '-------------------+--------------------'                       |    |                               '-----------------------+--------------------------'                     |  |
|  |                                     |                                            |    |                                                       |                                                |  |
|  |                                     v                                            |    |                                                       v                                                |  |
|  '-------------------------------------+--------------------------------------------'    '-------------------------------------------------------+------------------------------------------------'  |
|                                        |                                                                                                         |                                                   |
|                                        '---------------------------------------------------------+-----------------------------------------------'                                                   |
|                                                                                                  |                                                                                                   |
|                                                                                                  v                                                                                                   |
'------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------'
                                                                                                   |                                                                        
                                                                                                   |
                                                                                                   +--------------------------------------------------------.
                                                                                                   |                                                        |                  
                                                                                                   | if checks did not pass (result is no)                  | if checks passed (result is yes)
                                                                                                   |                                                        |
                                                                                                   |                                                        |
                                                                                                   v                                                        v
                                                                         .--------------------------------------------------.                        .-------------.
                                                                         | Check if there is a car already spawned. (again) |<----------------------+ Spawn the car |
                                                                         '-------------------------+------------------------'                        '-------------'
                                                                                                   |
                                                                                                   |
                                                                                                   v if the car exists
                                                                                      .-------------------------.
                                                                                     | Find the car that spawned |
                                                                                      '------------+------------'
                                                                                                   |
                                                                                                   |
                                                                                                   v
                                                                              .------------------------------------------.  if not       .----------------------------------.
                                                                              | Check if the car is ready for the player +------------->| Delete the car and try again later |
                                                                              '--------------------+---------------------'               '----------------------------------'
                                                                                                   |
                                                                                                   | if it is
                                                                                                   |
                                                                                                   v
                                             .-----------------------------------------------------+--------------------------------.
                                             | Reset the spawner to prepare for another spawn.     |                                |
                                             |                                                     |                                |
                                             |                    .--------------------------------'------.                         |
                                             |                    |                                       |                         |
                                             |                    v                                       v                         |
                                             |         .-----------------------.      .---------------------------------------.     |
                                             |        | Reset spawner countdown |    | Clear the "type" of car that will spawn |    |
                                             |         '-----------------------'      '---------------------------------------'     |
                                             '--------------------------------------------------------------------------------------'

```

The astute among you may have noticed that I put "spawn the car" in its own little block while glancing over the details completely.  
Quite simply, that's because this is just the setup function. DoInternalProcessing is where the real magic happens, but it's 105 lines long.

I'm not going to share the full code here, but I am going to sum it up in both written language and diagram form - and hopefully this will set the stage for most future entity spawning logic.

### DoInternalProcessing

It first checks if it's in a full car park - empty car parks occasionally get people driving through, but full car parks are full, and thus don't need people trying to find a spot. If it is, then it just exits and falls through to the other checks, which will delete the car and try again another time.

If it isn't in a full car park, then it checks if the type of car to spawn is known - for police chases, it tends to know what kind of vehicle it wants to spawn, but sometimes (cars driving around or parked on the street) it doesn't.

If it knows what kind of car to spawn, it'll check whether there's enough space to spawn the car, then request that the model and texture data is pulled off disc via asset streaming.  
It checks if there's enough space by calling FindObjectsKindaColliding from earlier - a very simple way to know whether a car intersects another, and thus would cause issues by suddenly appearing "inside" another car.

If it doesn't know what kind of car to spawn, it'll choose an appropriate random car for the zone you're in (the trashy areas get trashy cars, and the rich areas get rich cars) and load that car's data in, and then wait until there's enough space where it wants to spawn the car - potentially waiting infinitely long for a space to open up for the car it wants.

Once the car's assets are loaded, it'll try to place the car. If the car is in the water, it's a boat, so it creates a parked boat on the water rather than on a road. If the car is on the road, it's either a car or a bike, so it'll find the highest available road space to put the car or bike on.

If the car is trying to spawn below -100 vertically, then it's under the map, and will be placed on the nearest road surface immediately above it. This prevents falling infinitely through a cold, dead void and softlocking the game. Useful.

Otherwise, it checks whether it's a bike or a car. If it's a bike, it's set to be standing in a "parked" state. If it's a car, it's placed with the engine off, and with the doors unlocked.

Finally, the car is added to the world and is available to interact with and render.

The spawner does some cleanup logic - randomly setting the car's alarm, randomly locking the cars, etc. but we don't need to care about that.

The diagram for the car spawner logic is:

```goat

    .-------------------------------.
    | Check if we're in a car park. +----------------------------------------.
    '--------------+----------------'                                        |
                   |                                                         |
                   | if yes                                            if no |
                   |                                                         v
                   v                                           .------------------------------.
    .-------------------------------.    if no                 | Check if car type is known   |
    | Check if > 10 cars in the lot +------------------------->| Also check if car is a boat. +-------------.
    '--------------+----------------'                          | Also check if car is a bike. |             |
                   |                                           '---+----------+---------+-----'             |
                   | if yes                                   bike |      car |    boat |         not known |
                   |                                               |          |         |                   v
                   v                                               |          |         |     .----------------------------------------.
           .----------------.                                      |          |         |    | Choose random car type for player's area |
          | Stop processing. |                                     |          |         |     '-------------+--------------------------'
           '----------------'                                      |          |         |                   |
                   ^                                               |          |         |                   |
                   |                                               v          v         v                   v
                   |                                         .---------------------------------------------------.
                   |                                        | Load vehicle data (model, texture, sound) from disc |
                   |                                         '-----+----------+---------+-------------------+----'
                   |                                          bike |      car |    boat |            random |
                   |                                               v          v         v                   v
                   |                          not enough     .-------------------------------.   .-----------------------------------.
                   +-----------------------------------------+ Check if there's enough space |   | Wait for there to be enough space |
                   |                                         '-----+----------+----------+---'   '-+---------------------------------'
                   |                                          bike |      car |     boat |  ^       ^   
                   |                                               |          |          |  '-------'
                   |                                               |          |          | 
                   |                                             .-'          v          '-.
                   |                                             |  .-------------------.  |
                   |                                             |  | Check if in water |  |
                   |                                             |  '------+----------+-'  |
                   |                                             '-. if no |   if yes |  .-'
                   |                                               |       '--.       '--+
                   |                                               |          |          |
                   |                                               v          v          v
                   |                                        .----------------------------------. not under the map
                   |                                        | Check if under the map (z < 100) +----------------------------.
                   |                                        '------+----------+----------+-----'                            |
                   |                                          bike |      car |        boat |                               |
                   |                                               |          |             |                               |
                   |                                               |        .-'             |                               |
                   |                                               |        |               |                               |
                   |                                               v        v               v                               v
       .-----------+----------------.                            .-------------.   .--------------.     .-------------------------------------------------------.       
      | Reduce number of spawns left |                          | Find the road | | Find the water |   | Find the ground closest to the position it should spawn |
       '----------------------------'                            '-+--------+--'   '--------+-----'     '-------------------------------------------------------'
                   ^                                          bike |    car |          boat |
                   |                                               v        |               |
                   |                                .--------------------.  |       .---------------.
                   |                               | Spawn "standing up". | |      | Spawn floating. |
                   |                                '--------------+-----'  |       '-------+-------'
                   |                                          bike |    car |          boat |
                   |                                               v        v               v
                   |                                             .-------------+---------------. 
                   |                                            | Add the vehicle to the world. |
                   |                                             '-+--------+---------------+--' 
                   |                                          bike |   boat |           car |
                   |                                               |        |               |
                   +-----------------------------------------------+--------'               |
                   |                                                                        v
                   |                                                         .---------------------------------.
                   |                                                        | Sometimes spawn with doors locked |
                   |                                                         '--------------+------------------'
                   |                                                                        |
                   |                                                                        v
                   |                                                         .---------------------------------.
                   |                                                        | Sometimes spawn with broken alarm |
                   |                                                         '--------------+------------------'
                   |                                                                        |
                   |                                                                        v
                   |                                                             .----------------------.
                   |                                                            | Randomize paint colors |
                   |                                                             '----------+-----------'
                   |                                                                        |
                   '------------------------------------------------------------------------'
```

It's long, and it's a bit of a mess, but it's a far sight better than the code it was translated from.

That more or less completes the logic for spawning a car. It's just a matter of checking whether 
it would intersect another car, making sure the car we want exists, making sure it has somewhere to be, and then... putting it there.

Similarly, the logic for creating a grenade is also shared between multiple "similar types" - where the car logic 
was shared between boats, cars and motorcycles, the grenade logic is actually shared between 
rockets (from the RPG), molotov cocktails, tear gas grenades, fragmentation grenades, and C4.

Running through the logic for just a fragmentation grenade, we can see that it's a very similar matter: 
it sets the position and speed, loads the assets, adds it to the world, and keeps track of who threw it.

In fact, that's so simple, it's not even worth a diagram.

So instead, we'll move onto collision between our car and our grenade:

<video autoplay loop="true" src="https://gemwire.uk/files/grenade.webm" width="65%" style="margin-bottom:20px"></video>
![](https://gemwire.uk/files/grenade.webm)

Don't worry, it's not just you; this clip is stretched out many times its' original length, 
because this is approximately a quarter of a second of gameplay at regular speed.

As you can see, the clip ends when it's riiight about to touch the door - one frame before, 
in fact. Let's walk through what the game will do on the next frame:


[^1]: Surprisingly, this isn't actually a tautology. The "System" of ECS refers to a process that operates over the 
Components and transforms the data contained, and has nothing to do with the actual system itself that contains and 
manages the whole ECS process, so "ECS System" is a valid thing to say, despite meaning 
"Entity Component System System", as the two "system"s mean and refer to different things.

[^2]: Excuse the bad kerning here - Hugo uses an old, unmaintained fork of a popular library to 
create these diagrams, and it's missing several months worth of fixes that would make this a lot tidier.