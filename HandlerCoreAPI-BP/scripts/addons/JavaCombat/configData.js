export { SPECIFIC_COOLDOWNS, TAG_COOLDOWNS, FIXED_DAMAGE };

const SPECIFIC_COOLDOWNS = {
    // --- Axes ---
    "minecraft:wooden_axe": 25,                 // 1.25s
    "minecraft:golden_axe": 20,                 // 1.00s
    "minecraft:stone_axe": 25,                  // 1.25s
    "minecraft:copper_axe": 25,                 // 1.25s
    "better_on_bedrock:amethyst_axe": 23,       // 1.15s
    "minecraft:iron_axe": 22,                   // 1.10s
    "minecraft:diamond_axe": 20,                // 1.00s
    "minecraft:netherite_axe": 20,              // 1.00s
    "better_on_bedrock:stardust_axe": 19,       // 0.95s
    "better_on_bedrock:enderite_axe": 18,       // 0.90s
    
    // --- Hoes ---
    "minecraft:wooden_hoe": 20,                 // 1.00s
    "minecraft:golden_hoe": 20,                 // 1.00s
    "minecraft:stone_hoe": 10,                  // 0.50s
    "minecraft:copper_hoe": 10,                 // 0.50s
    "minecraft:iron_hoe": 6,                    // 0.30s
    "minecraft:diamond_hoe": 5,                 // 0.25s
    "minecraft:netherite_hoe": 5,               // 0.25s
    "better_on_bedrock:stardust_hoe": 5,        // 0.25s

    // --- Mace ---
    "minecraft:mace": 33,                       // 1.65s

    // --- Spears ---
    "minecraft:wooden_spear": 12,               // 0.65s
    "minecraft:golden_spear": 19,               // 0.95s
    "minecraft:stone_spear": 15,                // 0.75s
    "minecraft:copper_spear": 16,               // 0.85s
    "minecraft:iron_spear": 19,                 // 0.95s
    "minecraft:diamond_spear": 21,              // 1.05s
    "minecraft:netherite_spear": 23,            // 1.15s

    // --- Better on Bedrock: Spears ---
    "better_on_bedrock:wooden_spear": 24,       // 1.20s
    "better_on_bedrock:stone_spear": 22,        // 1.10s
    "better_on_bedrock:amethyst_spear": 20,     // 1.00s
    "better_on_bedrock:golden_spear": 19,       // 0.95s
    "better_on_bedrock:iron_spear": 19,         // 0.95s
    "better_on_bedrock:diamond_spear": 18,      // 0.90s
    "better_on_bedrock:stardust_spear": 16,     // 0.80s

    // --- Better on Bedrock: Dagger ---
    "better_on_bedrock:dagger": 3,              // 0.15s
    "better_on_bedrock:resin_dagger": 3         // 0.15s
};

const TAG_COOLDOWNS = {
    "minecraft:is_sword": 12,                   // 0.60s
    "minecraft:is_axe": 23,                     // 1.15s
    "minecraft:is_pickaxe": 16,                 // 0.80s
    "minecraft:is_shovel": 20,                  // 1.00s
    "minecraft:is_trident": 18,                 // 0.90s
    "minecraft:is_hoe": 20                      // 1.00s
};

const FIXED_DAMAGE = {
   // --- Swords ---
   "minecraft:wooden_sword": 4,
   "minecraft:golden_sword": 4,
   "minecraft:stone_sword": 5,
   "minecraft:copper_sword": 5,
   "better_on_bedrock:amethyst_sword": 5,
   "minecraft:iron_sword": 6,
   "minecraft:diamond_sword": 7,
   "minecraft:netherite_sword": 8,
   "better_on_bedrock:bane_spike": 10,
   "better_on_bedrock:stardust_sword": 11,
   "better_on_bedrock:enderite_sword": 12,
   "better_on_bedrock:blade_of_the_nether": 13,

   // --- Axes ---
   "minecraft:wooden_axe": 7,
   "minecraft:golden_axe": 7,
   "minecraft:stone_axe": 9,
   "minecraft:copper_axe": 9,
   "better_on_bedrock:amethyst_axe": 9,
   "minecraft:iron_axe": 9,
   "minecraft:diamond_axe": 9,
   "minecraft:netherite_axe": 10,
   "better_on_bedrock:stardust_axe": 11,
   "better_on_bedrock:enderite_axe": 12,

   // --- Pickaxes ---
   "minecraft:wooden_pickaxe": 2,
   "minecraft:golden_pickaxe": 2,
   "minecraft:stone_pickaxe": 3,
   "minecraft:copper_pickaxe": 3,
   "better_on_bedrock:amethyst_pickaxe": 3,
   "minecraft:iron_pickaxe": 4,
   "minecraft:diamond_pickaxe": 5,
   "minecraft:netherite_pickaxe": 6,
   "better_on_bedrock:stardust_pickaxe": 6,
   "better_on_bedrock:enderite_pickaxe": 7,

   // --- Shovels ---
   "minecraft:wooden_shovel": 2.5,
   "minecraft:golden_shovel": 2.5,
   "minecraft:stone_shovel": 3.5,
   "minecraft:copper_shovel": 3.5,
   "minecraft:iron_shovel": 4.5,
   "minecraft:diamond_shovel": 5.5,
   "minecraft:netherite_shovel": 6.5,
   "better_on_bedrock:stardust_shovel": 7,

   // --- Hoes ---
   "minecraft:wooden_hoe": 1,
   "minecraft:golden_hoe": 1,
   "minecraft:stone_hoe": 1,
   "minecraft:copper_hoe": 1,
   "minecraft:iron_hoe": 1,
   "minecraft:diamond_hoe": 1,
   "minecraft:netherite_hoe": 1,
   "better_on_bedrock:stardust_hoe": 1,

   // --- Other Vanilla ---
   "minecraft:trident": 9,
   "minecraft:mace": 6,

   // --- Spears ---
   "minecraft:wooden_spear": 2,
   "minecraft:golden_spear": 2,
   "minecraft:stone_spear": 3,
   "minecraft:copper_spear": 3,
   "minecraft:iron_spear": 4,
   "minecraft:diamond_spear": 5,
   "minecraft:netherite_spear": 6,

   // --- Better on Bedrock: Spears ---
   "better_on_bedrock:wooden_spear": 5,
   "better_on_bedrock:stone_spear": 6,
   "better_on_bedrock:amethyst_spear": 7,
   "better_on_bedrock:golden_spear": 5,
   "better_on_bedrock:iron_spear": 8,
   "better_on_bedrock:diamond_spear": 10,
   "better_on_bedrock:stardust_spear": 12,

   // --- Better on Bedrock: Dagger ---
   "better_on_bedrock:dagger": 3,
   "better_on_bedrock:resin_dagger": 4
};