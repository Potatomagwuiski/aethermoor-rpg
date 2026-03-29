import { BLUEPRINTS } from '../commands/forge';

async function testAllCrafting() {
    console.log("=== STARTING FULL FORGE SIMULATION ===");
    let successCount = 0;
    let failCount = 0;
    
    for (const key in BLUEPRINTS) {
        try {
            const bp = BLUEPRINTS[key];
            
            // Validate essential fields
            if (!bp.name) throw new Error("Missing name");
            if (!bp.outputs || !bp.outputs.base) throw new Error("Missing base output");
            if (!bp.outputs.base.key) throw new Error("Output base has no key");
            
            // Validate materials
            if (!bp.materials || Object.keys(bp.materials).length === 0) {
               console.warn(`[WARNING] Blueprint ${key} requires NO materials!`);
            }
            
            // Simulate reading the requiredBlueprint (if there is one defined)
            if (bp.requiredBlueprint && !bp.requiredBlueprint.startsWith('blueprint_')) {
                throw new Error("Invalid reqBlueprint formatting: " + bp.requiredBlueprint);
            }
            
            successCount++;
        } catch (e: any) {
            console.error(`[ERROR] Blueprint ${key} FAILED validation: ${e.message}`);
            failCount++;
        }
    }
    
    console.log(`\n=== FORGE SIMULATION COMPLETE ===`);
    console.log(`✅ Passed: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    
    if (failCount > 0) {
        process.exit(1);
    }
}

testAllCrafting();
