// Localization for caves & functional vegetation: cave names, prompts, log
// lines, contextual tips, new enemy species and every new gathering node.
// Merged into the translation tables by tr.js (same pattern as packDict).

export const DICT_CAVE = {
  en: {
    'biome.cave': 'Cave',

    'cave.enterToast': 'A Cave Mouth',
    'cave.enterLine': 'You slip into the dark — the air is cold, still, and old.',
    'cave.visionLine': 'Vision is limited underground; a Scouting Gu sees farther.',
    'cave.exitLine': 'You climb back into the open air.',
    'cave.descendLine': 'You descend deeper into the dark.',
    'cave.ascendLine': 'You climb back up.',
    'cave.depth': 'Depth {n}',
    'cave.chestToast': 'An Abandoned Cache',
    'cave.chestLine': 'You pry the cache open: {loot}',
    'cave.chestEmpty': 'The cache is empty — you already took everything of value.',
    'cave.secretToast': 'A Secret Way!',
    'cave.secretLine': 'The cracked wall is no wall at all — a hidden passage opens.',
    'cave.crackedHint': 'The stone here is cracked and hollow… but it will not yield to bare hands.',

    'wld.enterCave': 'Enter — {name}',
    'wld.exitCave': 'Leave the cave',
    'wld.descendCave': 'Descend deeper',
    'wld.ascendCave': 'Climb up',
    'wld.chestCave': 'Open the cache',
    'wld.chamberCultivate': 'Cultivate in the chamber (×1.5)',

    'exp.grassRustle': 'Something rustles in the grass close by…',
    'exp.lurkReveal': '{enemy} bursts from the undergrowth!',
    'exp.lurkScouted': 'Your scouting Gu senses a hidden creature in the grass.',
    'exp.ambushGrass': 'You strike from the tall grass — {enemy} never sees you coming.',

    'tip.grassFirst.title': 'Tall Grass',
    'tip.grassFirst.body': 'Tall grass reduces how far enemies can detect you — sneak past packs, strike from cover, and step carefully: hidden creatures may lurk within.',
    'tip.caveFirst.title': 'Into the Cave',
    'tip.caveFirst.body': 'Caves limit your vision. A Scouting Gu can help you explore the dark.',

    // cave & grass gathering nodes (English source lives in the data files)
    'res.c_dusk_d0_r0.name': 'Cave Herb', 'res.c_dusk_d0_r1.name': 'Cave Herb', 'res.c_dusk_d0_r2.name': 'Pale Cave Bloom',
    'res.c_moon_d0_r0.name': 'Moonstone Cluster', 'res.c_moon_d0_r1.name': 'Moonstone Cluster',
    'res.c_moon_d1_r0.name': 'Deepfire Vein', 'res.c_moon_d1_r1.name': 'Deep Iron Vein', 'res.c_moon_d1_r2.name': 'Deep Iron Vein',
    'res.c_mine_d0_r0.name': 'Kingsmine Jade Vein', 'res.c_mine_d0_r1.name': 'Kingsmine Jade Vein',
    'res.c_mine_d0_r2.name': 'Iron Vein', 'res.c_mine_d0_r3.name': 'Iron Vein',
    'res.c_den_d0_r0.name': 'Fresh Kill', 'res.c_den_d0_r1.name': 'Fresh Kill', 'res.c_den_d0_r2.name': 'Bloodied Cache',
    'res.c_nest_d0_r0.name': 'Silkspinner Webbing', 'res.c_nest_d0_r1.name': 'Silkspinner Webbing', 'res.c_nest_d0_r2.name': 'Dripping Venom Sac',
    'res.c_ruin_d0_r0.name': 'Ruin Iron', 'res.c_ruin_d0_r1.name': 'Vault Ember',
    'res.c_grotto_d0_r0.name': 'Grotto Moon Petal', 'res.c_grotto_d0_r1.name': 'Stillwater Herb',
    'res.c_tomb_d0_r0.name': 'Tomb Iron', 'res.c_tomb_d0_r1.name': 'Grave Bloom',
    'res.gg1.name': 'Wildgrass Bundle', 'res.gg2.name': 'Sun-Warmed Flame Grass',
    'res.gg3.name': 'Marsh Venom Bulb', 'res.gg4.name': 'Shade Herb',
  },

  vi: {
    'biome.cave': 'Hang Động',

    'cave.enterToast': 'Cửa Hang',
    'cave.enterLine': 'Bạn lách vào bóng tối — không khí lạnh lẽo, tĩnh lặng và cổ xưa.',
    'cave.visionLine': 'Tầm nhìn dưới lòng đất bị hạn chế; Cổ Trinh Sát nhìn thấy xa hơn.',
    'cave.exitLine': 'Bạn leo trở ra ngoài trời.',
    'cave.descendLine': 'Bạn đi sâu hơn vào bóng tối.',
    'cave.ascendLine': 'Bạn leo trở lên.',
    'cave.depth': 'Tầng {n}',
    'cave.chestToast': 'Kho Tàng Bỏ Quên',
    'cave.chestLine': 'Bạn mở kho tàng: {loot}',
    'cave.chestEmpty': 'Kho tàng trống rỗng — bạn đã lấy hết mọi thứ có giá trị.',
    'cave.secretToast': 'Đường Bí Mật!',
    'cave.secretLine': 'Bức tường nứt vỡ hóa ra không phải tường — một lối bí mật mở ra.',
    'cave.crackedHint': 'Đá ở đây nứt nẻ và rỗng… nhưng không thể phá bằng tay không.',

    'wld.enterCave': 'Vào — {name}',
    'wld.exitCave': 'Rời hang động',
    'wld.descendCave': 'Đi sâu hơn',
    'wld.ascendCave': 'Leo lên',
    'wld.chestCave': 'Mở kho tàng',
    'wld.chamberCultivate': 'Tu luyện trong tĩnh thất (×1,5)',

    'exp.grassRustle': 'Có gì đó lao xao trong đám cỏ gần đây…',
    'exp.lurkReveal': '{enemy} bật khỏi đám cỏ!',
    'exp.lurkScouted': 'Cổ Trinh Sát của bạn ngửi thấy sinh vật ẩn nấp gần đó.',
    'exp.ambushGrass': 'Bạn xuất kích từ thảm cỏ — {enemy} không hề hay biết.',

    'tip.grassFirst.title': 'Thảm Cỏ Cao',
    'tip.grassFirst.body': 'Thảm cỏ cao làm giảm khả năng kẻ địch phát hiện bạn.',
    'tip.caveFirst.title': 'Vào Hang Động',
    'tip.caveFirst.body': 'Hang động có tầm nhìn hạn chế. Cổ Trinh Sát có thể giúp khám phá nơi tối.',

    // new species (English source lives in the enemy data files)
    'enemy.caveBat.name': 'Dơi Hang',
    'enemy.caveBat.desc': 'Bầy dơi lẩn trong hang tối, săn mồi bằng tiếng vọng.',
    'enemy.crystalSpider.name': 'Nhện Pha Lê',
    'enemy.crystalSpider.desc': 'Nhện treo tổ trên những mạch pha Lê; nọc độc của chúng âm thầm mà hiểm.',
    'enemy.paleSerpent.name': 'Bạch Xà Hầm Mộ',
    'enemy.paleSerpent.desc': 'Xà trắng mảnh mai bò giữa đá ẩm, nọc độc làm tê cứng từng chi.',
    'enemy.tunnelLurker.name': 'Bạo Sát Hầm Sâu',
    'enemy.tunnelLurker.desc': 'Quái vật tránh sáng, trấn giữ những hầm sâu nhất.',
    'enemy.webBroodmother.name': 'Mẫu Hậu Kết Tơ',
    'enemy.webBroodmother.desc': 'Mẹ của cả tổ nhện; tơ của bà phủ kín mọi góc hang.',
    'enemy.ironfangCub.name': 'Sói Con Thiết Nha',
    'enemy.ironfangCub.desc': 'Sói con của bầy Thiết Nha — yếu, nhưng cả bầy đang canh giữ.',

    // cave names (zone labels, landmark markers)
    'zone.c_dusk.name': 'Hố Sương Tối', 'lm.cave_c_dusk.name': 'Hố Sương Tối',
    'zone.c_moon.name': 'Vực Nguyệt Quang Thâm', 'lm.cave_c_moon.name': 'Vực Nguyệt Quang Thâm',
    'zone.c_mine.name': 'Khu Mỏ Cổ', 'lm.cave_c_mine.name': 'Khu Mỏ Cổ',
    'zone.c_den.name': 'Sào Huyệt Thiết Nha', 'lm.cave_c_den.name': 'Sào Huyệt Thiết Nha',
    'zone.c_nest.name': 'Tổ Kết Tơ', 'lm.cave_c_nest.name': 'Tổ Kết Tơ',
    'zone.c_ruin.name': 'Địa Cung Tĩnh Lặng', 'lm.cave_c_ruin.name': 'Địa Cung Tĩnh Lặng',
    'zone.c_grotto.name': 'Động Tĩnh Thủy', 'lm.cave_c_grotto.name': 'Động Tĩnh Thủy',
    'zone.c_tomb.name': 'Mộ Vị Đệ Nhất Phi Thăng', 'lm.cave_c_tomb.name': 'Mộ Vị Đệ Nhất Phi Thăng',

    // cave & grass gathering nodes
    'res.c_dusk_d0_r0.name': 'Linh Thảo Hang', 'res.c_dusk_d0_r1.name': 'Linh Thảo Hang', 'res.c_dusk_d0_r2.name': 'Hoa Trăng Nhợt',
    'res.c_moon_d0_r0.name': 'Mạch Nguyệt Quang', 'res.c_moon_d0_r1.name': 'Mạch Nguyệt Quang',
    'res.c_moon_d1_r0.name': 'Mạch Hỏa Sâu', 'res.c_moon_d1_r1.name': 'Mạch Sắt Sâu', 'res.c_moon_d1_r2.name': 'Mạch Sắt Sâu',
    'res.c_mine_d0_r0.name': 'Mạch Ngọc Khu Mỏ', 'res.c_mine_d0_r1.name': 'Mạch Ngọc Khu Mỏ',
    'res.c_mine_d0_r2.name': 'Mạch Sắt', 'res.c_mine_d0_r3.name': 'Mạch Sắt',
    'res.c_den_d0_r0.name': 'Mồi Tươi', 'res.c_den_d0_r1.name': 'Mồi Tươi', 'res.c_den_d0_r2.name': 'Kho Máu',
    'res.c_nest_d0_r0.name': 'Tơ Nhện', 'res.c_nest_d0_r1.name': 'Tơ Nhện', 'res.c_nest_d0_r2.name': 'Túi Độc Rỉ',
    'res.c_ruin_d0_r0.name': 'Sắt Địa Cung', 'res.c_ruin_d0_r1.name': 'Than Hồng Địa Cung',
    'res.c_grotto_d0_r0.name': 'Cánh Hoa Trăng Động', 'res.c_grotto_d0_r1.name': 'Linh Thảo Tĩnh Thủy',
    'res.c_tomb_d0_r0.name': 'Sắt Mộ', 'res.c_tomb_d0_r1.name': 'Hoa Mộ',
    'res.gg1.name': 'Bó Cỏ Hoang', 'res.gg2.name': 'Cỏ Hỏa Ấm Nắng',
    'res.gg3.name': 'Củ Độc Vũng Lầy', 'res.gg4.name': 'Linh Thảo Bóng Râm',
  },
};