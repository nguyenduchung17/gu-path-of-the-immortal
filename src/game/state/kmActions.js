// Killer Move reducer cases — kept out of the main gameReducer so it stays
// under the edit-size limit. Returns the next state, or null when the action
// is not one of ours (the caller falls through untouched).
import { GU_BY_ID } from '../data/gu';
import { BALANCE } from '../config/balance';
import { applyEffects } from '../engine/effects';
import { advanceTime } from '../engine/time';
import { grantMastery } from '../engine/mastery';
import {
  kmState, kmUnlocked, kmMaxTotal, kmBoundOf, kmEstimate, kmResearchChance,
  kmBuildRecord, kmName,
} from '../engine/killerMoves';
import { KM_BLUEPRINT_BY_ID } from '../data/killerMoves';
import { T } from '../i18n/tr';

const pushToast = (s, t) => ({ ...s, toasts: [...(s.toasts || []), { id: `kmt${Date.now().toString(36)}`, ...t }] });

export function kmActions(state, action) {
  switch (action.type) {
    case 'KM_RESEARCH': {
      if (state.combat || state.recovery || state.sleeping || state.pendingEvent || state.wildEncounter) return state;
      if (!kmUnlocked(state)) return state;
      const cfg = BALANCE.km;
      const km = kmState(state);
      const day = state.time?.day || 1;
      if ((km.researchUntilDay || 0) > day) return { ...state, log: [...state.log, T('km.cooldownLeft', { n: km.researchUntilDay - day })] };
      const core = state.ownedGu.find(g => g.instanceId === action.coreInstanceId);
      if (!core) return state;
      const coreGu = GU_BY_ID[core.guId];
      const supportInsts = (action.supportInstanceIds || [])
        .map(id => state.ownedGu.find(g => g.instanceId === id)).filter(Boolean);
      if (!supportInsts.length || supportInsts.some(x => x.instanceId === core.instanceId)) return state;
      // complexity gate (#21) — a bound Gu cannot join a second move (#14)
      if (1 + supportInsts.length > kmMaxTotal(state, coreGu.path)) return state;
      if ([core, ...supportInsts].some(x => kmBoundOf(state, x.instanceId))) {
        return { ...state, log: [...state.log, T('km.loadout.lockNote')] };
      }
      const bp = action.blueprintId ? KM_BLUEPRINT_BY_ID[action.blueprintId] : null;
      if (bp && !km.blueprints?.[bp.id]) return state;
      const est = kmEstimate(state, coreGu, supportInsts.map(i => GU_BY_ID[i.guId]), bp);
      if (est.tier === 'invalid') return { ...state, log: [...state.log, T('km.tier.invalid')] };
      const total = 1 + supportInsts.length;
      const essenceCost = cfg.essenceFlat + cfg.essencePerComponent * total;
      const stonesCost = cfg.stonesPerComponent * total;
      const p = state.player;
      if (p.primevalEssence < essenceCost) return { ...state, log: [...state.log, T('cult.noEssence')] };
      if (p.spiritStones < stonesCost) return { ...state, log: [...state.log, T('shop.noStones')] };
      const chance = kmResearchChance(state, est, bp, action.minigameBonus || 0).total;
      let s = applyEffects(state, { essence: -essenceCost, spiritStones: -stonesCost });
      s = advanceTime(s, cfg.researchMinutes);
      if (Math.random() * 100 < chance) {
        const rec = kmBuildRecord(s, core, supportInsts, bp, est);
        s = { ...s, killerMoves: { ...kmState(s), known: [...kmState(s).known, rec] } };
        s = grantMastery(s, coreGu.path, cfg.masteryXp, 'guUsed', 'km');
        s = pushToast(s, {
          icon: '⚡', title: T('km.discovered.title'),
          lines: [
            T('km.discovered.line1', { name: kmName(rec) }),
            T('km.discovered.line2', { dmg: `${rec.damage[0]}–${rec.damage[1]}`, essence: rec.essence, act: rec.activation, cd: rec.cooldown }),
            T('km.discovered.line3'),
          ],
        });
        s = { ...s, log: [...s.log, T('km.discovered.log', { name: kmName(rec) })] };
      } else {
        // failure never destroys Gu (#12) — strain + a short cooldown
        let strained = 0;
        s = { ...s, ownedGu: s.ownedGu.map(g => {
          if (![core, ...supportInsts].some(x => x.instanceId === g.instanceId)) return g;
          if (Math.random() * 100 < cfg.strainChance) { strained++; return { ...g, strainUntilDay: day + cfg.strainDays }; }
          return g;
        }) };
        s = { ...s, killerMoves: { ...kmState(s), researchUntilDay: day + cfg.failCooldownDays } };
        s = pushToast(s, {
          icon: '💥', title: T('km.fail.title'),
          lines: [T('km.fail.line1'), T('km.fail.line2', { n: cfg.failCooldownDays }), ...(strained ? [T('km.strain', { n: day + cfg.strainDays })] : [])],
        });
        s = { ...s, log: [...s.log, T('km.fail.log')] };
      }
      return s;
    }
    case 'KM_EQUIP': {
      const km = kmState(state);
      const rec = (km.known || []).find(k => k.id === action.kmId);
      if (!rec || (km.equipped || []).includes(rec.id)) return state;
      const slots = (state.player?.rank || 0) >= 2 ? 3 : 2;
      if ((km.equipped || []).length >= slots) return { ...state, log: [...state.log, T('km.equip.full')] };
      return { ...state, killerMoves: { ...km, equipped: [...(km.equipped || []), rec.id] }, log: [...state.log, `${T('km.btn.equip')} — ${kmName(rec)}`] };
    }
    case 'KM_UNEQUIP': {
      const km = kmState(state);
      if (!(km.equipped || []).includes(action.kmId)) return state;
      return { ...state, killerMoves: { ...km, equipped: km.equipped.filter(id => id !== action.kmId) } };
    }
    case 'KM_DISMANTLE': {
      const km = kmState(state);
      const rec = (km.known || []).find(k => k.id === action.kmId);
      if (!rec) return state;
      // the component Gu are returned unharmed — only the technique is lost (#15)
      return {
        ...state,
        killerMoves: { ...km, known: km.known.filter(k => k.id !== action.kmId), equipped: (km.equipped || []).filter(id => id !== action.kmId) },
        log: [...state.log, T('km.dismantle.log', { name: kmName(rec) })],
      };
    }
    default:
      return null;
  }
}