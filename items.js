module.exports = {
  BasicRecipes: [
    [
      "Stone Axe",
      {
        description: "Basic Axe for quicker wood gain",
        type: "Tool",
        recipe: [
          { id: "wood", count: 5 },
          { id: "stone", count: 5 },
        ],
        output: {
          count: 1,
          image: "stoneaxe",
          stackSize: 1,
          equipable: true,
        },
      },
    ],
    [
      "Stone Pickaxe",
      {
        description: "Holy cow! I can mine this grey stuff",
        type: "Tool",
        recipe: [
          { id: "wood", count: 10 },
          { id: "stone", count: 5 },
        ],
        output: {
          count: 1,
          image: "stonepickaxe",
          stackSize: 1,
          equipable: true,
        },
      },
    ],
    [
      "Stone Sword",
      {
        description: "Made for killing, not very strong",
        type: "Tool",
        recipe: [
          { id: "wood", count: 5 },
          { id: "stone", count: 10 },
        ],
        output: {
          count: 1,
          image: "stonesword",
          stackSize: 1,
          equipable: true,
        },
      },
    ],
    [
      "Stone Hammer",
      {
        description:
          "Did you really just try to break my house down? Not cool, man",
        type: "Tool",
        recipe: [
          { id: "stone", count: 20 },
          { id: "wood", count: 15 },
        ],
        output: {
          count: 1,
          image: "stonehammer",
          stackSize: 1,
          equipable: true,
        },
      },
    ],
    [
      "Stone Shovel",
      {
        description: "Dirt :P",
        type: "Tool",
        recipe: [
          { id: "stone", count: 20 },
          { id: "wood", count: 15 },
        ],
        output: {
          count: 1,
          image: "stoneshovel",
          stackSize: 1,
          equipable: true,
        },
      },
    ],
    [
      "Wood Wall",
      {
        description: "Now you can make a hut(Not safe from destroyers)",
        type: "Structure",
        recipe: [{ id: "wood", count: 20 }],
        output: {
          count: 2,
          image: "woodwall",
          stackSize: 255,
          equipable: true,
        },
      },
    ],
    [
      "Stone Wall",
      {
        description: "Now you can make a house(Not safe from destroyers)",
        type: "Structure",
        recipe: [{ id: "stone", count: 20 }],
        output: {
          count: 1,
          image: "stonewall",
          stackSize: 255,
          equipable: true,
        },
      },
    ],
    [
      "Wood Floor",
      {
        description: "Prevents spawning and looks nice",
        type: "Structure",
        recipe: [{ id: "wood", count: 10 }],
        output: {
          count: 4,
          image: "woodfloor",
          stackSize: 255,
          equipable: true,
        },
      },
    ],
    [
      "Stone Floor",
      {
        description: "Prevents spawning and has a chiseled look",
        type: "Structure",
        recipe: [{ id: "stone", count: 10 }],
        output: {
          count: 4,
          image: "stonefloor",
          stackSize: 255,
          equipable: true,
        },
      },
    ],
    [
      "Crafting Table",
      {
        description: "Now you can craft stuff. Hell yeah",
        type: "Structure",
        recipe: [
          { id: "wood", count: 10 },
          { id: "stone", count: 10 },
        ],
        output: {
          count: 1,
          image: "craftingtable",
          stackSize: 255,
          equipable: true,
        },
      },
    ],
    [
      "Wood Door",
      {
        description: "Don't you need a way into your hut?",
        type: "Structure",
        recipe: [
          { id: "wood", count: 11 },
          { id: "stone", count: 1 },
          { id: "iron", count: 1 },
        ],
        output: {
          description: "",
          count: 2,
          image: "wooddoor",
          stackSize: 255,
          equipable: true,
        },
      },
    ],
    [
      "Stone Door",
      {
        description: "Hopefully it doesn't get blocked",
        type: "Structure",
        recipe: [
          { id: "wood", count: 1 },
          { id: "stone", count: 11 },
          { id: "iron", count: 1 },
        ],
        output: {
          count: 2,
          image: "stonedoor",
          stackSize: 255,
          equipable: true,
        },
      },
    ],
  ],
  TableRecipes: [
    [
      "Iron Axe",
      {
        description: "You could probably kill monsters with this",
        type: "Tool",
        recipe: [
          { id: "iron", count: 20 },
          { id: "stone", count: 10 },
        ],
        output: {
          count: 1,
          image: "ironaxe",
          stackSize: 1,
          equipable: true,
        },
      },
    ],
    [
      "Iron Pickaxe",
      {
        description: "Are you a miner now?",
        type: "Tool",
        recipe: [
          { id: "iron", count: 20 },
          { id: "stone", count: 15 },
        ],
        output: {
          count: 1,
          image: "ironpickaxe",
          stackSize: 1,
          equipable: true,
        },
      },
    ],
    [
      "Iron Sword",
      {
        description: "Woah there, what are you doing with that?",
        type: "Tool",
        recipe: [
          { id: "iron", count: 10 },
          { id: "stone", count: 15 },
          { id: "wood", count: 10 },
        ],
        output: {
          count: 1,
          image: "ironsword",
          stackSize: 1,
          equipable: true,
        },
      },
    ],
    [
      "Iron Hammer",
      {
        description: "Why do you need this?",
        type: "Tool",
        recipe: [
          { id: "iron", count: 20 },
          { id: "stone", count: 15 },
        ],
        output: {
          count: 1,
          image: "ironhammer",
          stackSize: 1,
          equipable: true,
        },
      },
    ],
    [
      "Iron Shovel",
      {
        description: "You could make a dirt hut with this :)",
        type: "Tool",
        recipe: [
          { id: "iron", count: 20 },
          { id: "stone", count: 15 },
        ],
        output: {
          count: 1,
          image: "ironshovel",
          stackSize: 1,
          equipable: true,
        },
      },
    ],
    [
      "Gold Axe",
      {
        description: "Woah. That's a lot of wood",
        type: "Tool",
        recipe: [
          { id: "gold", count: 20 },
          { id: "iron", count: 10 },
        ],
        output: {
          count: 1,
          image: "goldaxe",
          stackSize: 1,
          equipable: true,
        },
      },
    ],
    [
      "Gold Pickaxe",
      {
        description: "Why do you even need this? Skip to diamond",
        type: "Tool",
        recipe: [
          { id: "gold", count: 20 },
          { id: "iron", count: 15 },
        ],
        output: {
          count: 1,
          image: "goldpickaxe",
          stackSize: 1,
          equipable: true,
        },
      },
    ],
    [
      "Gold Sword",
      {
        description: "Incredible. It's like it was made for killing demons",
        type: "Tool",
        recipe: [
          { id: "gold", count: 10 },
          { id: "iron", count: 15 },
          { id: "stone", count: 10 },
        ],
        output: {
          count: 1,
          image: "goldsword",
          stackSize: 1,
          equipable: true,
        },
      },
    ],
    [
      "Gold Hammer",
      {
        description: "Seriously?",
        type: "Tool",
        recipe: [
          { id: "gold", count: 20 },
          { id: "iron", count: 15 },
        ],
        output: {
          count: 1,
          image: "goldhammer",
          stackSize: 1,
          equipable: true,
        },
      },
    ],
    [
      "Diamond Axe",
      {
        description: "So much wood OMG",
        type: "Tool",
        recipe: [
          { id: "diamond", count: 20 },
          { id: "iron", count: 10 },
        ],
        output: {
          count: 1,
          image: "diamondaxe",
          stackSize: 1,
          equipable: true,
        },
      },
    ],
    [
      "Diamond Pickaxe",
      {
        description: "Do I even need to say it? :D",
        type: "Tool",
        recipe: [
          { id: "diamond", count: 20 },
          { id: "iron", count: 15 },
        ],
        output: {
          count: 1,
          image: "diamondpickaxe",
          stackSize: 1,
          equipable: true,
        },
      },
    ],
    [
      "Diamond Sword",
      {
        description: "Hey wait what are you doing with that",
        type: "Tool",
        recipe: [
          { id: "diamond", count: 10 },
          { id: "iron", count: 15 },
          { id: "gold", count: 10 },
        ],
        output: {
          count: 1,
          image: "diamondsword",
          stackSize: 1,
          equipable: true,
        },
      },
    ],
    [
      "Diamond Hammer",
      {
        description: "This is overkill, griefer",
        type: "Tool",
        recipe: [
          { id: "diamond", count: 20 },
          { id: "iron", count: 15 },
        ],
        output: {
          count: 1,
          image: "diamondhammer",
          stackSize: 1,
          equipable: true,
        },
      },
    ],
    [
      "Iron Wall",
      {
        description: "Are you making a base, or a bunker?",
        type: "Structure",
        recipe: [{ id: "iron", count: 20 }],
        output: {
          count: 1,
          image: "ironwall",
          stackSize: 255,
          equipable: true,
        },
      },
    ],
    [
      "Chest",
      {
        description: "Store stuff IG",
        type: "Structure",
        recipe: [
          { id: "wood", count: 50 },
          { id: "gold", count: 10 },
        ],
        output: {
          count: 1,
          image: "chest",
          stackSize: 255,
          equipable: true,
        },
      },
    ],
    [
      "Iron Armor",
      {
        description: "Slows you down, but protects you",
        type: "Armor",
        recipe: [{ id: "iron", count: 20 }],
        output: {
          count: 1,
          image: "ironarmor",
          stackSize: 1,
          armorable: true,
        },
      },
    ],
    [
      "Campfire",
      {
        description: "Ooooh warm :)",
        type: "Structure",
        recipe: [
          { id: "wood", count: 2 },
          { id: "stone", count: 10 },
        ],
        output: {
          count: 1,
          image: "campfire",
          stackSize: 255,
          equipable: true,
        },
      },
    ],
  ],
  Resources: [
    [
      "wood",
      {
        description: "It's brown and sticky",
        type: "Resource",
      },
    ],
    [
      "stone",
      {
        description: "It's a rock",
        type: "Resource",
      },
    ],
    [
      "iron",
      {
        description: "It's hard",
        type: "Resource",
      },
    ],
    [
      "gold",
      {
        description: "It's shiny",
        type: "Resource",
      },
    ],
    [
      "diamond",
      {
        description: "It's blue",
        type: "Resource",
      },
    ],
    [
      "sand",
      {
        description: "It's erm dusty?",
        type: "Resource",
      },
    ],
  ],
};
