import {
    world as gameWorld,
    EquipmentSlot,
    Player,
    system,
    world as aWorld,
    GameMode,
    EntityDamageCause
} from "@minecraft/server";

import { SPECIFIC_COOLDOWNS, TAG_COOLDOWNS, FIXED_DAMAGE } from "./configData.js";

const MainhandSlot = EquipmentSlot;
const HandSlot = EquipmentSlot;
const ToolSlot = EquipmentSlot;

export var CombatConfig = class {
    static defaultCooldown = 5; 
    static ignoredGamemodes = [GameMode.Spectator];
    
    static sweepingEffectTags = ["minecraft:is_sword"];
    static ignoredSweepingItems = ["minecraft:mace"];
    
    static matchedEnchants = ["sharpness", "bane_of_arthropods", "smite", "density", "breach", "knockback", "impaling"];
    
    static javaAquaticMobs = [
        "minecraft:axolotl",
        "minecraft:cod",
        "minecraft:dolphin",
        "minecraft:elder_guardian",
        "minecraft:glow_squid",
        "minecraft:guardian",
        "minecraft:pufferfish",
        "minecraft:salmon",
        "minecraft:squid",
        "minecraft:tadpole",
        "minecraft:tropical_fish",
        "minecraft:turtle"
    ];
};

var IconData = class {
    static icons = ["\uE120", "\uE121", "\uE122", "\uE123", "\uE124", "\uE125", "\uE126", "\uE127", "\uE128", "\uE129", "\uE12A", "\uE12B", "\uE12C", "\uE12F"]
};

export var CombatManager = class {
    constructor(cooldownStrategy, displayStrategy, effectHandlers = []) {
        this.cooldownStrategy = cooldownStrategy;
        this.displayStrategy = displayStrategy;
        this.effectHandlers = effectHandlers;
    }

    initialize() {
        system.afterEvents.scriptEventReceive.subscribe(event => this.handleSwing(event), { namespaces: ["javacombat"] });
        
        aWorld.afterEvents.entityHitEntity.subscribe(event => this.handleHitEffects(event, true));
        
        aWorld.afterEvents.playerSpawn.subscribe(event => this.handleSpawn(event));
    }

    onTick() {
        let players = aWorld.getPlayers({
            excludeGameModes: CombatConfig.ignoredGamemodes
        });
        for (let player of players) {
            this.updateCooldown(player); 
        }
    }

    handleSpawn(event) {
        try {
            event.player.triggerEvent('custom_attack');
        } catch (e) {}

        event.player.setDynamicProperty("cooldown", 0);
        event.player.setDynamicProperty("maxCooldown", 0);
    }
    
    handleSwing(event) {
        if (event.id !== 'javacombat:swinging') return;
        const player = event.sourceEntity;
        
        if (!(player instanceof Player) || CombatConfig.ignoredGamemodes.includes(player.getGameMode())) return;

        let currentCooldown = player.getDynamicProperty("cooldown") ?? 0;
        let maxCooldown = player.getDynamicProperty("maxCooldown") ?? 1;
        
        let progress = (maxCooldown > 0) ? (maxCooldown - currentCooldown) / maxCooldown : 1.0;
        
        player.setDynamicProperty("lastSwingProgress", progress);
        
        this.updateCooldown(player, true);
    }
    
    handleHitEffects(event, isHit = false) {
        let attacker = event.damagingEntity;
        let hitEntity = "hitEntity" in event ? event.hitEntity : void 0;

        if (!(attacker instanceof Player) || CombatConfig.ignoredGamemodes.includes(attacker.getGameMode())) {
            return; 
        }

        let player = attacker;
        if (!hitEntity) return;

        try {
            if (hitEntity.hasComponent("minecraft:riding")) {
                return;
            }
        } catch (e) {}

        
        let mainhandItem = player.getComponent("equippable")?.getEquipment(MainhandSlot.Mainhand);
        let itemTags = mainhandItem?.getTags() ?? [];
        let itemTypeId = mainhandItem?.typeId;
        let progress = player.getDynamicProperty("lastSwingProgress") ?? 0.0;

        const enchantLevels = {
            knockback: 0,
            sharpness: 0,
            smite: 0,
            bane_of_arthropods: 0,
            impaling: 0,
            density: 0,
            breach: 0
        };

        const enchantments = mainhandItem?.getComponent("enchantable")?.getEnchantments() ?? [];
        
        if (enchantments.length > 0) {
            for (const enchant of enchantments) {
                const id = enchant.type.id;
                if (id in enchantLevels) {
                    enchantLevels[id] = enchant.level;
                }
            }
        }

        const isMace = itemTypeId === "minecraft:mace";
        
        if (isMace) {
             const isVehicle = hitEntity.typeId.includes("boat") || hitEntity.typeId.includes("minecart");
             if (isVehicle) {
                 try {
                     hitEntity.kill();
                     return;
                 } catch(e) {}
             }
        }

        if (itemTags.includes("minecraft:is_spear") && progress < 0.99) {
            return;
        }
        
        const knockbackLevel = enchantLevels.knockback;
        const lastHitTick = hitEntity.getDynamicProperty("combat_lastHitTick") ?? 0;
        const currentTick = system.currentTick;
        const iFrameDuration = 10;

        let isInanimate = false;
        try {
            const typeFamily = hitEntity.getComponent("type_family");
            if (typeFamily && typeFamily.hasTypeFamily("inanimate")) {
                isInanimate = true;
            }
        } catch (e) {}

        const isInvulnerable = (currentTick - lastHitTick < iFrameDuration) && !isInanimate;

        if (isInvulnerable) {
            if (knockbackLevel === 0) return; 
            
        } else {
            hitEntity.setDynamicProperty("combat_lastHitTick", currentTick);
        }

        const isSpecialAttackEligible = progress > 0.848; 
        
        let isSprintKnockback = false;
        let isCriticalHit = false;
        let isSweeping = false;
        let isMaceSmash = false;
        let smashDamageBonus = 0;

        if (isMace && !player.isOnGround && !player.isGliding && !player.getEffect("slow_falling")) {
            const fallDist = player.fallDistance;
            
            if (fallDist > 1.5) {
                isMaceSmash = true;
                
                let distRemaining = fallDist;
                
                let firstTier = Math.min(distRemaining, 3);
                smashDamageBonus += firstTier * 4;
                distRemaining -= firstTier;
                
                if (distRemaining > 0) {
                    let secondTier = Math.min(distRemaining, 5);
                    smashDamageBonus += secondTier * 2;
                    distRemaining -= secondTier;
                }
                
                if (distRemaining > 0) {
                    smashDamageBonus += distRemaining * 1;
                }

                if (enchantLevels.density > 0) {
                    smashDamageBonus += (fallDist * 0.5 * enchantLevels.density);
                }

                isCriticalHit = true; 
            }
        }

        if (isSpecialAttackEligible && !isMaceSmash) {
            const isSpear = itemTags.includes("minecraft:is_spear");
            
            if (player.isSprinting && !isSpear) {
                isSprintKnockback = true;
            } 
            else if (
                player.isFalling &&         
                !player.isInWater && 
                !player.isOnGround && 
                !player.isSprinting &&      
                !player.isGliding &&        
                !player.getEffect("blindness") &&       
                !player.getEffect("slow_falling") &&    
                !player.hasComponent("minecraft:riding") 
            ) {
                isCriticalHit = true;
            }
            else if (player.isOnGround && 
                     CombatConfig.sweepingEffectTags.some(tag => itemTags.includes(tag)) && 
                     !CombatConfig.ignoredSweepingItems.includes(itemTypeId) &&
                     !player.isSprinting) {
                isSweeping = true;
            }
        }

        
        let baseToolDamage = (itemTypeId && itemTypeId in FIXED_DAMAGE) ? FIXED_DAMAGE[itemTypeId] : 1;
        
        const strength = player.getEffect("strength");
        const weakness = player.getEffect("weakness");
        let strengthBonus = strength ? (strength.amplifier + 1) * 3 : 0;
        let weaknessBonus = weakness ? (weakness.amplifier + 1) * -4 : 0; 
        
        let rawBaseDamage = baseToolDamage + strengthBonus + weaknessBonus;
        if (rawBaseDamage < 0) rawBaseDamage = 0; 

        rawBaseDamage += smashDamageBonus;

        let enchantmentBonus = 0;
        let familyComponent = null;
        try { familyComponent = hitEntity.getComponent("type_family"); } catch (e) {}

        if (enchantLevels.sharpness > 0) {
            enchantmentBonus += (0.5 * enchantLevels.sharpness) + 0.5;
        }
        
        if (enchantLevels.smite > 0 && familyComponent?.hasTypeFamily("undead")) {
            enchantmentBonus += 2.5 * enchantLevels.smite;
        }

        if (enchantLevels.bane_of_arthropods > 0 && familyComponent?.hasTypeFamily("arthropod")) {
            enchantmentBonus += 2.5 * enchantLevels.bane_of_arthropods;
        }

        if (enchantLevels.impaling > 0 && CombatConfig.javaAquaticMobs.includes(hitEntity.typeId)) {
            enchantmentBonus += 2.5 * enchantLevels.impaling;
        }

        let cooldownMultiplier = Math.max(0.2, (0.2 + (progress * 0.8)));
        
        let finalBase = rawBaseDamage * cooldownMultiplier;
        if (isCriticalHit) {
            finalBase *= 1.5;
        }

        let finalEnchant = enchantmentBonus * cooldownMultiplier;
        let totalDamage = finalBase + finalEnchant;

        let breachLevel = enchantLevels.breach;
        let finalDamageCause = EntityDamageCause.entityAttack; 

        if (breachLevel > 0) {
            const { armorPoints, toughness } = this.calculateArmorAndToughness(hitEntity);
            
            const damageForCalc = totalDamage;
            const defense = Math.max(damageForCalc / 5, armorPoints - damageForCalc / (2 + toughness / 4));
            const clampedDefense = Math.min(20, defense);
            const vanillaReductionFactor = clampedDefense / 25; 

            let breachedReductionFactor = vanillaReductionFactor - (0.15 * breachLevel);
            if (breachedReductionFactor < 0) breachedReductionFactor = 0;

            totalDamage = totalDamage * (1 - breachedReductionFactor);
            
            finalDamageCause = EntityDamageCause.magic;
        }

        if (hitEntity.typeId === "xp_cd:cave_dweller") {
            hitEntity.triggerEvent("xp_cd:reenter_engage");
        }

        if (!isInvulnerable) {
            try {
                hitEntity.applyDamage(totalDamage, {
                    damagingEntity: player,
                    cause: finalDamageCause
                });
            } catch (e) {}
        }

        
        let kbStrength = (isSprintKnockback ? 1 : 0) + knockbackLevel;
        let kbSpeed = kbStrength * 0.5;
        const baseSpeed = 0.4;
        let finalHorizontal = baseSpeed + kbSpeed;

        let kbResistance = 0.0;
        try {
            const kbAttr = hitEntity.getAttribute("minecraft:knockback_resistance");
            if (kbAttr) kbResistance = kbAttr.value;
        } catch (e) {}

        try {
            if (hitEntity instanceof Player && hitEntity.isSneaking) {
                 const offhand = hitEntity.getComponent("equippable")?.getEquipment(EquipmentSlot.Offhand);
                 const mainhand = hitEntity.getComponent("equippable")?.getEquipment(EquipmentSlot.Mainhand);
                 if (offhand?.typeId.includes("shield") || mainhand?.typeId.includes("shield")) {
                     kbResistance = 1.0;
                 }
            }
        } catch (e) {}

        const isException = hitEntity.typeId.includes("armor_stand") || hitEntity.typeId.includes("boat");
        
        if (!isException) {
            finalHorizontal *= (1.0 - kbResistance);
        }
        if (finalHorizontal <= 0) finalHorizontal = 0;

        let finalVertical = 0.4;
        if (isException) finalVertical = 0.1;

        try {
            if (!hitEntity.isOnGround) finalVertical = 0.0;
        } catch(e) {}

        try {
            const targetVel = hitEntity.getVelocity();
            
            let oldX = targetVel.x / 2;
            let oldZ = targetVel.z / 2;
            let oldY = targetVel.y;
            if (hitEntity.isOnGround) oldY = targetVel.y / 2;

            const viewDirection = player.getViewDirection();
            const dist = Math.sqrt(viewDirection.x * viewDirection.x + viewDirection.z * viewDirection.z);
            const dirX = dist > 0 ? viewDirection.x / dist : 0;
            const dirZ = dist > 0 ? viewDirection.z / dist : 0;

            let newX = oldX + (dirX * finalHorizontal);
            let newZ = oldZ + (dirZ * finalHorizontal);
            let newY = oldY + finalVertical;

            if (newY > 0.4) newY = 0.4;

            hitEntity.clearVelocity();
            hitEntity.applyImpulse({ x: newX, y: newY, z: newZ });
        } catch (e) {}

        try {
            const attackerVel = player.getVelocity();
            player.applyImpulse({ 
                x: attackerVel.x * -0.4, 
                y: 0, 
                z: attackerVel.z * -0.4 
            });
        } catch (e) {}

        if (!isInvulnerable) { 
            try {
                const equipment = hitEntity.getComponent("equippable");
                if (equipment) {
                    const armorSlots = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];
                    for (const slot of armorSlots) {
                        const item = equipment.getEquipment(slot);
                        if (!item) continue; 
                        const enchantments = item.getComponent("enchantable")?.getEnchantments() ?? [];
                        const thorns = enchantments.find(e => e.type.id === "thorns");
                        if (thorns && Math.random() < thorns.level * 0.15) {
                            const thornsDamage = Math.floor(Math.random() * 4) + 1;
                            player.applyDamage(thornsDamage, { damagingEntity: hitEntity, cause: EntityDamageCause.entityAttack });
                            const durability = item.getComponent("durability");
                            if (durability) {
                                durability.damage += 2;
                                equipment.setEquipment(slot, item);
                            }
                            break; 
                        }
                    }
                }
            } catch (e) {}
        }

        this.applyDurabilityDamage(player, mainhandItem, enchantments);

        if (isSpecialAttackEligible || isMaceSmash) {
            this.effectHandlers.forEach(handler => handler.handleSpecialEffects(
                player, hitEntity, mainhandItem, enchantments, 
                isSpecialAttackEligible, isCriticalHit, itemTypeId, itemTags, 
                progress, isSprintKnockback, isSweeping
            ));
            player.setDynamicProperty("showReadyOnComplete", 1);
        }
    }

    calculateArmorAndToughness(entity) {
        let armorPoints = 0;
        let toughness = 0;
        
        const equippable = entity.getComponent("equippable");
        if (equippable) {
            const slots = [EquipmentSlot.Head, EquipmentSlot.Chest, EquipmentSlot.Legs, EquipmentSlot.Feet];
            for (const slot of slots) {
                const item = equippable.getEquipment(slot);
                if (item) {
                    const armorComp = item.getComponent("minecraft:armor");
                    if (armorComp) {
                        armorPoints += armorComp.protection;
                    }
                    if (item.typeId.includes("netherite")) {
                        toughness += 3;
                    } else if (item.typeId.includes("diamond")) {
                        toughness += 2;
                    }
                }
            }
        }
        return { armorPoints, toughness };
    }

    updateCooldown(player, shouldReset = false) {
        let mainhandItem = player.getComponent("equippable")?.getEquipment(MainhandSlot.Mainhand);
        let lastItemTypeId = player.getDynamicProperty("lastItem"); 
        let currentItemTypeId = mainhandItem?.typeId; 
        let currentCooldown = player.getDynamicProperty("cooldown") ?? 0; 
        let maxCooldown = player.getDynamicProperty("maxCooldown") ?? 0; 
        
        let shouldResetCooldown = currentItemTypeId !== lastItemTypeId || shouldReset; 

        if (shouldResetCooldown) {
            player.setDynamicProperty("lastItem", currentItemTypeId);
            maxCooldown = this.cooldownStrategy.calculateCooldown(player);
            currentCooldown = maxCooldown;
            player.setDynamicProperty("cooldown", maxCooldown);
            player.setDynamicProperty("maxCooldown", maxCooldown);
        }
        
        let progress = (maxCooldown > 0) ? (maxCooldown - currentCooldown) / maxCooldown : 1.0; 
        this.displayStrategy.display(player, progress, mainhandItem);
        
        if (currentCooldown > 0) {
            currentCooldown--;
            player.setDynamicProperty("cooldown", currentCooldown);
        }
    }

    applyDurabilityDamage(player, item, enchantments) {
        try {
            if (!item) return;
            if (player.getGameMode() === GameMode.creative) return;
    
            const durability = item.getComponent("durability");
            if (!durability) return; 
    
            const unbreaking = enchantments.find(e => e.type.id === "unbreaking");
            const level = unbreaking ? unbreaking.level : 0;
            
            if (level > 0 && Math.random() > (1 / (level + 1))) return;
    
            durability.damage++;
    
            if (durability.damage >= durability.maxDurability) {
                system.runTimeout(() => { player.dimension.playSound("random.break", player.location); }, 1);
                player.getComponent("equippable").setEquipment(HandSlot.Mainhand, undefined);
            } else {
                player.getComponent("equippable").setEquipment(HandSlot.Mainhand, item);
            }
        } catch (e) {}
    }
};

var CooldownDisplay = class {
    #updateDisplay(player, icon, options) {
        const lastIcon = player.getDynamicProperty("lastIcon") ?? "";
        if (icon === lastIcon) return; 
        player.onScreenDisplay.setTitle(icon, options);
        player.setDynamicProperty("lastIcon", icon);
    }

    display(player, progress, mainhandItem) { 
        if (progress < 1.0) {
            const iconIndex = Math.min(12, Math.round(progress * 13)); 
            const icon = IconData.icons[iconIndex];

            this.#updateDisplay(player, icon, {
                fadeInDuration: 0,
                fadeOutDuration: 200, 
                stayDuration: 100
            });
        } else {
            let iconToShow = ""; 
            try {
                let maxDistance = 3.45;
                if (mainhandItem) {
                    const tags = mainhandItem.getTags() ?? [];
                    if (tags.includes("minecraft:is_spear")) {
                        maxDistance = 5.075;
                    }
                }

                const entities = player.getEntitiesFromViewDirection({ maxDistance: maxDistance });
                const target = entities.find(hit => 
                    hit.entity.id !== player.id && 
                    hit.entity.getComponent('health')
                );
                
                if (target) {
                    iconToShow = `${IconData.icons[13]}`;
                }
            } catch (e) {}

            this.#updateDisplay(player, iconToShow, {
                fadeInDuration: 0,
                fadeOutDuration: (iconToShow === "") ? 1 : 99999, 
                stayDuration: (iconToShow === "") ? 1 : 99999 
            });
        }
    }
};


var EnchantEffectHandler = class {
    handleSpecialEffects(player, hitEntity, mainhandItem, enchantments, isFullPowerAttack, isCriticalHit, itemTypeId, itemTags, progress, isSprintKnockback, isSweeping) {
        try {
            if (!hitEntity || !isFullPowerAttack) return; 
            if (!mainhandItem || !enchantments) return;
            let enchantIds = enchantments.map(enchant => enchant.type.id);
            
            if (CombatConfig.matchedEnchants.some(enchantId => enchantIds.includes(enchantId))) {
                hitEntity.dimension.spawnParticle("javacombat:enchant", hitEntity.location);
            }
        } catch (e) {}
    }
};

var SweepEffectHandler = class {
    handleSpecialEffects(player, hitEntity, mainhandItem, enchantments, isFullPowerAttack, isCriticalHit, itemTypeId, itemTags, progress, isSprintKnockback, isSweeping) {
        try {
            if (!isSweeping) return; 
            if (!hitEntity) return;
            
            system.runTimeout(() => { player.dimension.playSound("sweep", player.location); }, 1);
            let hitLocation = hitEntity.location;
            player.dimension.runCommand(`execute as "${player.name}" at @s positioned ${hitLocation.x} ${hitLocation.y} ${hitLocation.z} run function javacombat_sweep`);
        } catch (e) {}
    }
};

var KnockbackEffectHandler = class {
    handleSpecialEffects(player, hitEntity, mainhandItem, enchantments, isFullPowerAttack, isCriticalHit, itemTypeId, itemTags, progress, isSprintKnockback, isSweeping) { 
        try {
            if (hitEntity && isSprintKnockback) {
                system.runTimeout(() => { player.dimension.playSound("knockback", player.location); }, 1);
            }
        } catch (e) {}
    }
};

var CritEffectHandler = class {
    handleSpecialEffects(player, hitEntity, mainhandItem, enchantments, isFullPowerAttack, isCriticalHit, itemTypeId, itemTags, progress, isSprintKnockback, isSweeping) {
        try {
            if (isCriticalHit) {
                system.runTimeout(() => { player.dimension.playSound("crit", player.location); }, 1);
                const hitLocation = hitEntity.location;
                const particleLocation = { x: hitLocation.x, y: hitLocation.y + 1, z: hitLocation.z };
                hitEntity.dimension.spawnParticle("minecraft:critical_hit_emitter", particleLocation);
            }
        } catch (e) {}
    }
};

var CooldownCalculator = class {
    constructor() {
        this.cooldownCache = new Map();
    }

    calculateCooldown(player) {
        let mainhandItem = player.getComponent("equippable")?.getEquipment(ToolSlot.Mainhand);
        
        let baseTicks = CombatConfig.defaultCooldown; 

        if (mainhandItem) {
            let itemTypeId = mainhandItem.typeId;
            let itemTags = mainhandItem.getTags() ?? [];

            if (this.cooldownCache.has(itemTypeId)) {
                baseTicks = this.cooldownCache.get(itemTypeId);
            } 
            else if (itemTypeId in SPECIFIC_COOLDOWNS) {
                baseTicks = SPECIFIC_COOLDOWNS[itemTypeId];
                this.cooldownCache.set(itemTypeId, baseTicks);
            } 
            else {
                let foundTag = false;
                for (const tag of itemTags) {
                    if (tag in TAG_COOLDOWNS) {
                        baseTicks = TAG_COOLDOWNS[tag];
                        this.cooldownCache.set(itemTypeId, baseTicks);
                        foundTag = true;
                        break;
                    }
                }
                if (!foundTag) {
                    this.cooldownCache.set(itemTypeId, CombatConfig.defaultCooldown);
                }
            }
        }

        let speedMultiplier = 1.0;
        const haste = player.getEffect("haste");
        if (haste) {
            speedMultiplier += 0.1 * (haste.amplifier + 1);
        }
        const fatigue = player.getEffect("mining_fatigue");
        if (fatigue) {
            speedMultiplier -= 0.1 * (fatigue.amplifier + 1);
        }
        if (speedMultiplier <= 0.1) speedMultiplier = 0.1;

        return Math.ceil(baseTicks / speedMultiplier);
    }
};

export var mainCombatManager = new CombatManager(
    new CooldownCalculator(),                                                                             
    new CooldownDisplay,                                                                                  
    [new EnchantEffectHandler, new SweepEffectHandler, new KnockbackEffectHandler, new CritEffectHandler] 
);