import { FightEntity } from './types.js';
import { rollACMitigation, rollDamage } from './stats.js';

export interface CombatResult {
    winner: 'player' | 'enemy';
    turns: number;
    logs: string[];
    playerTurnsTaken: number;
    finalHpLeft: number;
}

export function simulateCombat(player: FightEntity, enemy: FightEntity, startDistance: number = 8): CombatResult {
    const logs: string[] = [];
    let distance = startDistance;
    let turnCount = 0;
    
    logs.push(`The distance between you is ${distance} tiles.`);

    // Loop until someone dies or a massive safety cap is reached to prevent infinity loops
    while (player.hpLeft > 0 && enemy.hpLeft > 0 && turnCount < 1000) {
        turnCount++;
        logs.push(`\nTURN ${turnCount} ------------------------------------------------------------------------------------------`);

        // Entity that is "ready" goes first. If both > 1.0, the one with more moves goes.
        // If neither are > 1.0, they both regenerate 1.0 moves (Time ticks).
        let pReady = player.movesLeft >= 1.0;
        let eReady = enemy.movesLeft >= 1.0;

        if (!pReady && !eReady) {
            player.movesLeft += 1.0;
            enemy.movesLeft += 1.0;
            
            // At the start of a "Global Tick", apply regeneration
            if (player.data.hpRegen > 0 && player.hpLeft < player.data.maxHp) {
                player.hpLeft = Math.min(player.data.maxHp, player.hpLeft + player.data.hpRegen);
            }
            if (enemy.data.hpRegen > 0 && enemy.hpLeft < enemy.data.maxHp) {
                enemy.hpLeft = Math.min(enemy.data.maxHp, enemy.hpLeft + enemy.data.hpRegen);
            }
            
            pReady = player.movesLeft >= 1.0;
            eReady = enemy.movesLeft >= 1.0;
            // Technically some could still be under 1.0 if they were negative or start 0, 
            // but since they just gained +1 they will usually be ready.
        }

        // Determine who goes next in this tick
        let activeEntity: FightEntity;
        let targetEntity: FightEntity;
        
        if (pReady && eReady) {
            // Speed Tie-breaker based on highest movesLeft
            if (player.movesLeft >= enemy.movesLeft) {
                activeEntity = player;
                targetEntity = enemy;
            } else {
                activeEntity = enemy;
                targetEntity = player;
            }
        } else if (pReady) {
            activeEntity = player;
            targetEntity = enemy;
        } else if (eReady) {
            activeEntity = enemy;
            targetEntity = player;
        } else {
             // Both still somehow not ready?
             continue; 
        }

        const isPlayer = activeEntity.data.id === player.data.id;
        const tag = isPlayer ? `[${player.data.name}]` : `[${enemy.data.name}]`;
        const targetTag = isPlayer ? `[${enemy.data.name}]` : `[${player.data.name}]`;

        logs.push(`${tag} gains 1.0 moves. Moves left = ${activeEntity.movesLeft.toFixed(4)}. HP left: ${activeEntity.hpLeft}/${activeEntity.data.maxHp}.`);

        // Check if we need to close distance based on weapon
        const isRanged = activeEntity.data.weaponType === 'bow' || activeEntity.data.weaponType === 'rifle';
        if (distance > 0 && !isRanged) {
            distance -= 1;
            activeEntity.movesLeft -= 1.0; // Moving always costs 1.0 moves
            logs.push(`${tag} moves 1 space closer to ${targetTag}. Distance left = ${distance}.`);
            logs.push(`${tag} uses 1.0 moves! Moves left = ${activeEntity.movesLeft.toFixed(4)}.`);
            continue;
        }

        // We are within attack range
        if (distance > 0) {
            logs.push(`${tag} shoots ${targetTag} from a distance of ${distance} tiles! Applying each damage...`);
        } else {
            logs.push(`${tag} hits ${targetTag} with a melee attack! Applying each damage...`);
        }
        
        // Evasion check
        const hitRoll = Math.random() * 100;
        if (hitRoll < targetEntity.evadeChance) {
            logs.push(`${tag} tries attacking in melee but misses!`);
        } else {
            // Pick a weapon/damage range
            const dmgInfo = activeEntity.data.damages[0]; // Simplest approach
            const rawDmg = rollDamage(dmgInfo.minAmount, dmgInfo.maxAmount);
            logs.push(`${tag} rolls ${rawDmg} for :punch: physical!`);

            // Armor mitigation (Rifles pierce heavily)
            let acRoll = 0;
            if (activeEntity.data.weaponType === 'rifle') {
                logs.push(`*The rifle pierces ${targetTag}'s armor!*`);
            } else {
                acRoll = rollACMitigation(targetEntity.data.defenses.ac);
                logs.push(`${targetTag} rolls ${acRoll} for AC and reduces the damage by ${acRoll}!`);
            }

            // Always deal at least 1 damage on a successful hit, unless mitigated
            let finalDmg = rawDmg - acRoll;
            // The logs show damage can be blunted to strictly 1, or 0. Dundor usually does minimum 1 or negative becomes 1 for flavor. Wait, looking at the logs:
            // "[skyris6678] rolls 25 for AC and reduces the damage by 25! Damage Left = 1"
            // Usually min damage is 1 if it hits and mitigates highly.
            if (finalDmg < 1) finalDmg = 1; 

            targetEntity.hpLeft -= finalDmg;
            logs.push(`${targetTag} gets damaged by ${finalDmg} damage! HP Left = ${targetEntity.hpLeft}/${targetEntity.data.maxHp}.`);
        }

        activeEntity.movesLeft -= activeEntity.data.attackSpeed;
        logs.push(`${tag} uses ${activeEntity.data.attackSpeed} moves! Moves left = ${activeEntity.movesLeft.toFixed(4)}.`);
    }

    if (player.hpLeft <= 0) {
        logs.push(`[${player.data.name}] dies!`);
        logs.push(`[${enemy.data.name}] wins the fight because [${player.data.name}] has died!`);
    } else if (enemy.hpLeft <= 0) {
        logs.push(`[${enemy.data.name}] dies!`);
        logs.push(`[${player.data.name}] wins the fight because [${enemy.data.name}] has died!`);
    }

    return {
        winner: player.hpLeft > 0 ? 'player' : 'enemy',
        turns: turnCount,
        logs: logs,
        playerTurnsTaken: 0,
        finalHpLeft: player.hpLeft > 0 ? player.hpLeft : 0
    };
}
