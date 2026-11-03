// Chuỗi giao diện: vi, zh-Hant, en.
(function () {
  const S = {
    vi: {
      title: 'Chùa Tĩnh Tâm', tapCushion: 'Chạm vào bồ đoàn trống để ngồi', seatTaken: 'Chỗ này đã có người ngồi',
      walking: 'Đang tới chỗ ngồi', seated: 'Đang ngồi trước Phật', incense: 'Thắp hương', pond: 'Ra hồ sen', enter: 'Vào chùa',
      stand: 'Đứng dậy', gassho: 'Chắp tay', bow: 'Lạy', beads: 'Lần chuỗi', moktak: 'Gõ mõ',
      bowsToday: 'lạy hôm nay · nhấn giữ để lạy liên tục', beadsToday: 'hạt chuỗi hôm nay · vuốt chuỗi', moktakToday: 'tiếng mõ hôm nay', gasshoNow: 'chắp tay, thở chậm',
      lunar: (d, m) => (d <= 10 ? 'Mùng ' + d : (d === 15 ? 'Rằm' : 'Ngày ' + d)) + ' tháng ' + (m === 1 ? 'Giêng' : m === 12 ? 'Chạp' : m),
      toFull: n => n === 0 ? 'Hôm nay là ngày rằm' : 'Còn ' + n + ' ngày tới rằm', newMoon: 'Hôm nay mùng một',
      streak: n => n + ' ngày', ritualSoon: (h) => 'Thời kinh lúc ' + h, ritualNow: 'Thời kinh đang diễn ra',
      lotusBloom: 'Một bông sen vừa nở ngoài hồ', lotusCount: (n, m) => n + ' / ' + m + ' bông sen',
      npcNote: 'Khách hành hương trong chùa là nhân vật mô phỏng', pilgrim: 'Khách hành hương',
      incenseLit: 'Hương đang cháy', incenseUsed: 'Hôm nay bạn đã thắp hương miễn phí',
      censer: 'Lư hương', free3: '3 nén hương', freeLeft: 'Miễn phí · hôm nay còn 1 lần', freeUsed: 'Miễn phí · mai thắp tiếp', light: 'Thắp',
      itemsHead: 'Vật phẩm · đặt trong chùa 24 giờ', wishHead: 'Lời nguyện', offer: (n, p) => 'Dâng ' + n + ' · ' + p,
      wishes: ['Gia đình bình an', 'Tưởng nhớ người đã khuất', 'Sức khỏe', 'Tâm an', 'Công việc thuận lợi'],
      items: { incense: 'Hương trầm', lantern: 'Đèn hoa đăng', fruit: 'Mâm ngũ quả', robes: 'Áo tràng 3 màu', beadsSkin: 'Tràng hạt đàn hương', tet: 'Chùa ngày Tết' },
      itemsSub: { robes: 'Nâu, vàng, trắng', beadsSkin: 'Hạt gỗ, tiếng ấm hơn', tet: 'Hoa đào, mai, đèn lồng đỏ' },
      hoursLeft: h => 'còn ' + h + ' giờ', journal: 'Sổ tay', done: 'Xong', streakHead: 'Chuỗi ngày đến chùa', restLeft: 'Mỗi tuần được nghỉ 1 ngày không mất chuỗi',
      totBow: 'lạy', totBeads: 'chuỗi 108', totDays: 'ngày đến', yourWish: 'Lời nguyện của bạn', wishPh: 'Viết điều bạn mong cầu… chỉ lưu trên máy này',
      keep: 'Gói giữ vĩnh viễn', owned: 'Đã có', restore: 'Khôi phục giao dịch', restored: 'Đã khôi phục', robeColor: 'Màu áo tràng', tetOn: 'Trang trí Tết',
      settings: 'Cài đặt', ambient: 'Âm thanh nền', effects: 'Chuông, mõ, chuỗi', haptics: 'Rung', notif: 'Thông báo',
      nMorning: 'Thời kinh sáng (5:00)', nEvening: 'Thời kinh chiều (18:00)', nMoon: 'Ngày rằm, mùng một (6:30)', yourName: 'Tên của bạn', privacy: 'Chính sách quyền riêng tư',
      ob1t: 'Một góc chùa nhỏ cho bạn', ob1b: 'Ghé lúc nào cũng được: ngồi trước Phật, lạy, lần chuỗi, gõ mõ, thắp một nén hương. Không chat, không ai làm phiền.',
      ob2t: 'Chạm bồ đoàn để ngồi', ob2b: 'Ngồi xong, chọn nghi thức ở thanh dưới cùng. Đủ 108 lạy hay 108 hạt, ngoài hồ sẽ nở một bông sen.',
      ob3t: 'Bạn không ngồi một mình', ob3b: 'Những vị khách hành hương trong chùa là nhân vật mô phỏng, đến và đi theo giờ trong ngày. Họ không phải người thật và không ai thấy bạn.',
      ob3n: 'Nhắc ngày rằm, mùng một', next: 'Tiếp', start: 'Vào chùa', bought: 'Đã dâng', buyFail: 'Chưa mua được, thử lại sau',
      offerToast: 'Thả một đèn hoa đăng?', later: 'Để sau',
      nMorningT: 'Thời kinh sáng', nMorningB: 'Chùa sắp vào thời kinh lúc 5:00.', nEveningT: 'Thời kinh chiều', nEveningB: 'Chùa sắp vào thời kinh lúc 18:00.',
      nFullT: 'Hôm nay là ngày rằm', nNewT: 'Hôm nay mùng một', nMoonB: 'Ghé chùa thắp một nén hương nhé.'
    },
    zh: {
      title: '靜心寺', tapCushion: '輕觸空的蒲團坐下', seatTaken: '這個位子已有人', walking: '正在走向座位', seated: '正在佛前靜坐',
      incense: '上香', pond: '到蓮花池', enter: '進入大殿', stand: '起身', gassho: '合掌', bow: '禮拜', beads: '撥念珠', moktak: '敲木魚',
      bowsToday: '今日禮拜 · 長按連續禮拜', beadsToday: '今日念珠 · 滑動念珠', moktakToday: '今日木魚聲', gasshoNow: '合掌，慢慢呼吸',
      lunar: (d, m) => '農曆' + ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '臘'][m - 1] + '月' + (d <= 10 ? '初' + '一二三四五六七八九十'[d - 1] : d === 15 ? '十五' : d < 20 ? '十' + '一二三四五六七八九'[d - 11] : d === 20 ? '二十' : d < 30 ? '廿' + '一二三四五六七八九'[d - 21] : '三十'),
      toFull: n => n === 0 ? '今天是十五' : '距十五還有 ' + n + ' 天', newMoon: '今天是初一',
      streak: n => '連續 ' + n + ' 天', ritualSoon: h => '早晚課 ' + h, ritualNow: '早晚課進行中',
      lotusBloom: '池中開了一朵蓮花', lotusCount: (n, m) => n + ' / ' + m + ' 朵蓮花', npcNote: '寺中香客為模擬角色', pilgrim: '香客',
      incenseLit: '香正在燃', incenseUsed: '今天已免費上過香', censer: '香爐', free3: '三炷香', freeLeft: '免費 · 今天還有 1 次', freeUsed: '免費 · 明天再上', light: '點香',
      itemsHead: '供品 · 在寺中擺放 24 小時', wishHead: '祈願', offer: (n, p) => '供奉' + n + ' · ' + p,
      wishes: ['闔家平安', '追思先人', '身體健康', '心安', '工作順利'],
      items: { incense: '沉香', lantern: '蓮花燈', fruit: '五果盤', robes: '海青三色', beadsSkin: '檀香念珠', tet: '新春佈置' },
      itemsSub: { robes: '褐、黃、白', beadsSkin: '木珠，聲音更溫潤', tet: '桃花、梅花、紅燈籠' },
      hoursLeft: h => '剩 ' + h + ' 小時', journal: '手記', done: '完成', streakHead: '連續到寺天數', restLeft: '每週可休息一天不中斷',
      totBow: '禮拜', totBeads: '串念珠', totDays: '到寺天數', yourWish: '你的祈願', wishPh: '寫下你的心願…只存在這支手機',
      keep: '永久項目', owned: '已擁有', restore: '恢復購買', restored: '已恢復', robeColor: '海青顏色', tetOn: '新春佈置',
      settings: '設定', ambient: '環境音', effects: '鐘、木魚、念珠', haptics: '震動', notif: '通知',
      nMorning: '早課 (5:00)', nEvening: '晚課 (18:00)', nMoon: '初一、十五 (6:30)', yourName: '你的名字', privacy: '隱私權政策',
      ob1t: '屬於你的一座小寺', ob1b: '隨時都能來：佛前靜坐、禮拜、撥念珠、敲木魚、上一炷香。沒有聊天，不受打擾。',
      ob2t: '輕觸蒲團坐下', ob2b: '坐下後在下方選擇儀式。滿 108 拜或 108 顆念珠，池中便開一朵蓮花。',
      ob3t: '你不是一個人', ob3b: '寺中的香客是模擬角色，隨一天的時辰來去。他們不是真人，也沒有人看得到你。',
      ob3n: '初一、十五提醒', next: '下一步', start: '進入大殿', bought: '已供奉', buyFail: '購買未完成，請稍後再試',
      offerToast: '放一盞蓮花燈？', later: '稍後',
      nMorningT: '早課', nMorningB: '寺院 5:00 即將早課。', nEveningT: '晚課', nEveningB: '寺院 18:00 即將晚課。',
      nFullT: '今天是十五', nNewT: '今天是初一', nMoonB: '來寺裡上一炷香吧。'
    },
    en: {
      title: 'Quiet Pagoda', tapCushion: 'Tap an empty cushion to sit', seatTaken: 'Someone is sitting here', walking: 'Walking to your seat', seated: 'Sitting before the Buddha',
      incense: 'Light incense', pond: 'Lotus pond', enter: 'Enter hall', stand: 'Stand up', gassho: 'Palms', bow: 'Bow', beads: 'Beads', moktak: 'Moktak',
      bowsToday: 'bows today · hold to keep bowing', beadsToday: 'beads today · swipe the beads', moktakToday: 'strikes today', gasshoNow: 'palms together, breathe slowly',
      lunar: (d, m) => 'Lunar month ' + m + ', day ' + d,
      toFull: n => n === 0 ? 'Full moon today' : n + ' days to the full moon', newMoon: 'New moon today',
      streak: n => n + (n === 1 ? ' day' : ' days'), ritualSoon: h => 'Chanting at ' + h, ritualNow: 'Chanting now',
      lotusBloom: 'A lotus just bloomed in the pond', lotusCount: (n, m) => n + ' / ' + m + ' lotuses', npcNote: 'Pilgrims in the temple are simulated characters', pilgrim: 'Pilgrim',
      incenseLit: 'Incense is burning', incenseUsed: 'You already lit free incense today', censer: 'Incense burner', free3: '3 incense sticks', freeLeft: 'Free · 1 left today', freeUsed: 'Free · again tomorrow', light: 'Light',
      itemsHead: 'Offerings · stay in the temple 24 hours', wishHead: 'Wish', offer: (n, p) => 'Offer ' + n + ' · ' + p,
      wishes: ['Peace for my family', 'In memory of loved ones', 'Good health', 'A calm mind', 'Success at work'],
      items: { incense: 'Agarwood incense', lantern: 'Lotus lantern', fruit: 'Fruit offering', robes: 'Robes, 3 colors', beadsSkin: 'Sandalwood beads', tet: 'Lunar New Year' },
      itemsSub: { robes: 'Brown, saffron, white', beadsSkin: 'Wooden beads, warmer sound', tet: 'Peach and apricot blossoms, red lanterns' },
      hoursLeft: h => h + 'h left', journal: 'Journal', done: 'Done', streakHead: 'Days in a row', restLeft: 'One rest day a week keeps your streak',
      totBow: 'bows', totBeads: 'rounds of 108', totDays: 'visits', yourWish: 'Your wish', wishPh: 'Write what you hope for… saved only on this phone',
      keep: 'Keep forever', owned: 'Owned', restore: 'Restore purchases', restored: 'Restored', robeColor: 'Robe color', tetOn: 'New Year decorations',
      settings: 'Settings', ambient: 'Ambience', effects: 'Bell, moktak, beads', haptics: 'Haptics', notif: 'Notifications',
      nMorning: 'Morning chanting (5:00)', nEvening: 'Evening chanting (18:00)', nMoon: 'Full & new moon (6:30)', yourName: 'Your name', privacy: 'Privacy policy',
      ob1t: 'A quiet pagoda for you', ob1b: 'Drop in any time: sit before the Buddha, bow, count beads, strike the moktak, light incense. No chat, no one to bother you.',
      ob2t: 'Tap a cushion to sit', ob2b: 'Once seated, pick a practice at the bottom. Finish 108 bows or 108 beads and a lotus blooms in the pond.',
      ob3t: 'You are not alone', ob3b: 'The pilgrims in the temple are simulated characters who come and go with the time of day. They are not real people, and no one can see you.',
      ob3n: 'Full & new moon reminders', next: 'Next', start: 'Enter', bought: 'Offered', buyFail: 'Purchase not completed, try again later',
      offerToast: 'Float a lotus lantern?', later: 'Later',
      nMorningT: 'Morning chanting', nMorningB: 'Chanting begins at 5:00.', nEveningT: 'Evening chanting', nEveningB: 'Chanting begins at 18:00.',
      nFullT: 'Full moon today', nNewT: 'New moon today', nMoonB: 'Stop by and light some incense.'
    }
  };
  const want = (window.QP_LANG || navigator.language || 'en').toLowerCase();
  const lang = want.startsWith('vi') ? 'vi' : (want.startsWith('zh') ? 'zh' : 'en');
  window.LANG = lang; window.T = S[lang];
  window.NAMES = {
    vi: ['Sen Hồng', 'Mây Trắng', 'Trúc Xanh', 'Gió Nhẹ', 'Hạt Sương', 'Lá Bồ Đề', 'Trăng Non', 'Suối Nhỏ', 'Hoa Cau', 'Nắng Sớm', 'Đá Rêu', 'Chim Sẻ'],
    zh: ['蓮心', '白雲', '青竹', '清風', '朝露', '菩提', '新月', '小溪', '晨曦', '松影', '石苔', '雀鳥'],
    en: ['Lotus', 'White Cloud', 'Bamboo', 'Breeze', 'Dew', 'Bodhi Leaf', 'New Moon', 'Brook', 'Dawn', 'Pine', 'Moss', 'Sparrow']
  }[lang];
})();
