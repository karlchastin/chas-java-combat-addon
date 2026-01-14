import { world } from "@minecraft/server";
import { mainCombatManager } from "./combat_manager";
import { CoreTicker } from "../../tick_registry";

world.afterEvents.worldLoad.subscribe(() => {
    
    mainCombatManager.initialize();

    CoreTicker.register((currentTick) => {
        mainCombatManager.onTick();
    }, "JavaCombatSystem");
    
    console.warn("[JavaCombat v.2.4.0] Loaded via HandlerCoreAPI.");
});