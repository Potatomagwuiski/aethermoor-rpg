import { BLUEPRINTS } from '../commands/forge.js';
import fs from 'fs';
import path from 'path';

function auditMaterials() {
    const requiredMaterials = new Set<string>();
    
    // Extract all materials required in blueprints
    for (const key in BLUEPRINTS) {
        const bp = BLUEPRINTS[key];
        if (bp.materials) {
            for (const mat in bp.materials) {
                requiredMaterials.add(mat);
            }
        }
    }
    
    console.log(`Found ${requiredMaterials.size} unique materials required by Forge blueprints.`);
    console.log(Array.from(requiredMaterials).join(', '));
}

auditMaterials();
