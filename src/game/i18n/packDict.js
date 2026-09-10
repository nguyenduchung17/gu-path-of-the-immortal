// Localization for the pack-warfare expansion: enemy packs, pack leaders,
// multi-enemy combat, target selection and the single-target / AoE attack
// categories. Merged LAST in tr.js so these keys win.
export const DICT_PACK = {
  en: {
    // ---- attack targeting categories (#15, #17) ----
    'tg.single': 'Single Target',
    'tg.all': 'AoE · All Enemies',
    'tg.cleave': 'Cleave',
    'tg.chain': 'Chain',
    'tg.random': 'Multi-Hit',
    'fx.targets': 'Targets',
    'fx.armorPen': 'Armor pen',
    'fx.hitsN': '{n} random hits',
    'fx.adjacentPct': 'Adjacent {p}%',

    // ---- battle UI ----
    'battle.pickTarget': 'Select target',
    'battle.leader': 'PACK LEADER',
    'battle.packFoes': 'Enemies',
    'battle.hitsAll': 'Hits every enemy',
    'battle.target': 'TARGET',

    // ---- battle log (ALL-CAPS markers feed the VFX parser where relevant) ----
    'cmt.packIntro': 'The pack answers the call — {n} enemies close in!',
    'cmt.howl': '{enemy} HOWLS! The pack quickens — Speed +{sp}%, damage +{dmg}%.',
    'cmt.leaderDown': '{enemy} falls — its pack wavers (damage −{dmg}%, Speed −{sp}%).',
    'cmt.chainLeap': 'The lightning leaps to {enemy}!',
    'cmt.cleaveHit': 'The cut carves into {enemy}!',

    // ---- world UI ----
    'pack.members': 'Pack ×{n}',
    'pack.leaderTag': 'Leader',
    'pack.threat': 'Threat: {label}',

    // ---- enemy intent ----
    'intent.howl': 'Pack Howl — the pack quickens',
    'intent.rough.howl': 'A gathering howl…',

    // ---- pack scouting report (#34) ----
    'scout.title': 'Scouting',
    'scout.none': 'No threats within {n} paces.',
    'scout.pack': 'PACK',
    'scout.packMembers': '{n} members',
    'scout.leaderDetected': 'Leader detected',
    'scout.threatEst': 'Estimated threat',

    // ---- new pack-warfare Gu (vi content overrides; en lives in gu.js) ----
    'gu.flameWave.desc': 'A rolling wave of flame that washes over EVERY enemy — and may leave each one burning.',
    'gu.swordArc.desc': 'A sweeping arc of sword-light: the primary foe takes the full cut, adjacent foes take half.',
    'gu.piercingEdge.desc': 'One target, one perfect thrust — heavy damage, high criticals, and it bites straight through armor.',
    'gu.chainBolt.desc': 'A bolt of lightning that leaps foe to foe — each jump bites softer, but the whole pack feels it.',
    'gu.toxicMist.desc': 'A creeping mist that lays Poison on every enemy in the fight — weak now, relentless later.',
    'gu.galeStorm.desc': 'A storm of cutting wind that strikes 3 different foes in one breath — and builds momentum.',
    'gu.frostField.desc': 'A field of dead-still frost: every enemy is chilled slow, and may freeze outright.',
    'gu.earthTremor.desc': 'The ground heaves under every enemy — modest damage, heavy GUARD damage, and their actions drag.',

    // ---- quest (#39) ----
    'quest.q_alpha.name': "The Alpha's Howl",
    'quest.q_alpha.desc': 'The Ironfang Alpha has led its pack deep into the northern forest. Gu Master Bai asks you to end its howl for good — without the Alpha, the pack scatters.',
    'quest.q_alpha.hint': 'The Ironfang pack dens far to the northwest, past the deep forest. Scout before you strike: where the Alpha walks, the pack follows.',
    'quest.q_alpha.reward': '"The howl is silenced. The herds will graze in peace. Take this from the sect vault, cultivator."',
  },
  vi: {
    // ---- phân loại mục tiêu tấn công ----
    'tg.single': 'Đơn Mục Tiêu',
    'tg.all': 'Sát Thương Diện Rộng · Tất Cả',
    'tg.cleave': 'Xoáy (Cleave)',
    'tg.chain': 'Liên Hoàn',
    'tg.random': 'Đa Liên',
    'fx.targets': 'Mục tiêu',
    'fx.armorPen': 'Xuyên giáp',
    'fx.hitsN': '{n} đòn ngẫu nhiên',
    'fx.adjacentPct': 'Kề bên {p}%',

    // ---- giao diện chiến đấu ----
    'battle.pickTarget': 'Chọn mục tiêu',
    'battle.leader': 'THỦ LĨNH',
    'battle.packFoes': 'Địch thủ',
    'battle.hitsAll': 'Cả đòn quét mọi địch',
    'battle.target': 'MỤC TIÊU',

    // ---- nhật ký chiến đấu ----
    'cmt.packIntro': 'Cả bầy ứng tiếng gọi — {n} kẻ địch áp sát!',
    'cmt.howl': '{enemy} HÚ LÊN! Cả bầy hưng phấn — Tốc +{sp}%, sát thương +{dmg}%.',
    'cmt.leaderDown': '{enemy} gục ngã — cả bầy nao núng (sát thương −{dmg}%, Tốc −{sp}%).',
    'cmt.chainLeap': 'Tia sét nhảy sang {enemy}!',
    'cmt.cleaveHit': 'Nhát chém xoáy vào {enemy}!',

    // ---- giao diện thế giới ----
    'pack.members': 'Bầy ×{n}',
    'pack.leaderTag': 'Thủ lĩnh',
    'pack.threat': 'Mức đe dọa: {label}',

    // ---- ý đồ của địch ----
    'intent.howl': 'Tiếng Hú Đàn — cả bầy hưng phấn',
    'intent.rough.howl': 'Một tiếng hú tụ về…',

    // ---- báo cáo trinh sát bầy ----
    'scout.title': 'Trinh sát',
    'scout.none': 'Không có mối đe dọa trong {n} bước.',
    'scout.pack': 'BẦY',
    'scout.packMembers': '{n} thành viên',
    'scout.leaderDetected': 'Phát hiện thủ lĩnh',
    'scout.threatEst': 'Đe dọa ước tính',

    // ---- Cổ chiến tranh bầy đàn (bản Việt) ----
    'gu.flameWave.name': 'Hải Hỏa Cổ',
    'gu.flameWave.desc': 'Sóng lửa cuộn qua MỌI kẻ địch — và có thể để lại từng tên BỎNG.',
    'gu.swordArc.name': 'Kiếm Quang Cổ',
    'gu.swordArc.desc': 'Vệt kiếm quét vòng cung: mục tiêu chính nhận trọn nhát, kẻ kề bên nhận một nửa.',
    'gu.piercingEdge.name': 'Xuyên Phong Cổ',
    'gu.piercingEdge.desc': 'Một mục tiêu, một nhát đâm hoàn hảo — sát thương lớn, bội kích cao, xuyên thẳng giáp.',
    'gu.chainBolt.name': 'Liên Hoàn Lôi Cổ',
    'gu.chainBolt.desc': 'Tia sét nhảy từ địch sang địch — mỗi nhịp nhảy yếu hơn, nhưng cả bầy đều trọn.',
    'gu.toxicMist.name': 'Độc Vụ Cổ',
    'gu.toxicMist.desc': 'Sương độc lan kín, rải ĐỘC lên mọi kẻ địch — yếu lúc đầu, dai dẳng về sau.',
    'gu.galeStorm.name': 'Cuồng Phong Cổ',
    'gu.galeStorm.desc': 'Cơn gió cắt quất 3 kẻ khác nhau trong một hơi thở — và cộng dồn Thế Gió.',
    'gu.frostField.name': 'Hàn Địa Cổ',
    'gu.frostField.desc': 'Cánh đồng sương giá chết lặng: mọi địch bị làm chậm, và có thể bị đóng băng.',
    'gu.earthTremor.name': 'Địa Chấn Cổ',
    'gu.earthTremor.desc': 'Đại địa rung chuyển dưới mọi địch — sát thương vừa, nghiền nát HỘ THẾ, kéo lùi hành động.',

    // ---- nhiệm vụ ----
    'quest.q_alpha.name': 'Tiếng Hú Của Thủ Lĩnh',
    'quest.q_alpha.desc': 'Thủ Lĩnh Thiết Nha dẫn bầy sâu vào rừng bắc. Cổ Sư Bái nhờ ngươi dập tắt tiếng hú — mất thủ lĩnh, bầy tan rã.',
    'quest.q_alpha.hint': 'Bầy Thiết Nha đóng hang về tây bắc, qua rừng sâu. Trinh sát trước khi ra tay: thủ lĩnh đi đâu, bầy theo đó.',
    'quest.q_alpha.reward': '"Tiếng hú đã tắt. Nhạn dân sẽ được yên ổn. Hãy lấy thứ này từ kho tàng tông môn."',

    // ----配方 recipe rumors / clues / leads (vi) ----
    'recipe.flameWave.rumor': 'Người ta nói thủ lĩnh bầy sói ngậm trong người một cuốn lửa biết cuộn thành sóng.',
    'recipe.flameWave.clue': 'Một phối phương Hỏa liên quan tới thủ lĩnh của một bầy sói ở phía bắc.',
    'recipe.flameWave.lead': 'Trong người Thủ Lĩnh Thiết Nha, nơi rừng sâu phía bắc.',
    'recipe.swordArc.rumor': 'Trùm cướp Đông Bắc được cho là giữ một bí kiếp chém quét.',
    'recipe.swordArc.clue': 'Một phối phương Kiếm trong tay trùm cướp bắc.',
    'recipe.swordArc.lead': 'Trùm Cướp giữ nó ở sào huyệt đông bắc.',
    'recipe.piercingEdge.rumor': 'Nói rằng có nhát đâm xuyên mọi lớp giáp — và trùm cướp biết chữ.',
    'recipe.piercingEdge.clue': 'Một phối phương Kiếm của trùm cướp bắc, hiếm hơn cả đường chém.',
    'recipe.piercingEdge.lead': 'Trùm Cướp thỉnh thoảng mang nó theo người.',
    'recipe.chainBolt.rumor': 'Chó bóng mang trong hầu một tia sét biết nhảy đàn.',
    'recipe.chainBolt.clue': 'Một phối phương Lôi đôi khi ẩn trong chó bóng nơi rừng sâu.',
    'recipe.chainBolt.lead': 'Chó bóng ở rừng sâu và phế tích đôi khi mang nó.',
    'recipe.toxicMist.rumor': 'Nhện độc nhuốm sương — ai học được sương, học được độc.',
    'recipe.toxicMist.clue': 'Một phối phương Độc giấu trong nhện độc.',
    'recipe.toxicMist.lead': 'Nhện độc trong rừng hoang và đầm lầy mang nó.',
    'recipe.galeStorm.rumor': 'Quạ máu tha về những lông vũ cắt gió.',
    'recipe.galeStorm.clue': 'Một phối phương Phong đôi khi nằm trong quạ máu.',
    'recipe.galeStorm.lead': 'Quạ máu vùng đồi đồng mang nó theo.',
    'recipe.frostField.rumor': 'Băng tông thuần thục tự sinh ra một vùng sương giá.',
    'recipe.frostField.clue': 'Nó tự lộ diện với bậc Thục Luyện của Băng Đạo.',
    'recipe.frostField.lead': 'Ban tặng ở Băng Đạo cấp 3.',
    'recipe.earthTremor.rumor': 'Thổ tông thuần thục nghe được tiếng đất rung.',
    'recipe.earthTremor.clue': 'Nó tự lộ diện với bậc Thục Luyện của Thổ Đạo.',
    'recipe.earthTremor.lead': 'Ban tặng ở Thổ Đạo cấp 3.',
  },
};