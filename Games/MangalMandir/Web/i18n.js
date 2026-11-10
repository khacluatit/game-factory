// Chuỗi giao diện: en, hi. Tên thần, lễ vật, lễ hội có cả bản Devanagari.
(function () {
  const TITHI_EN = ['Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami', 'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi', 'Purnima', 'Amavasya'];
  const TITHI_HI = ['प्रतिपदा', 'द्वितीया', 'तृतीया', 'चतुर्थी', 'पंचमी', 'षष्ठी', 'सप्तमी', 'अष्टमी', 'नवमी', 'दशमी', 'एकादशी', 'द्वादशी', 'त्रयोदशी', 'चतुर्दशी', 'पूर्णिमा', 'अमावस्या'];
  const FEST = {
    makar: ['Makar Sankranti', 'मकर संक्रांति'], vasant: ['Vasant Panchami', 'वसंत पंचमी'], shivaratri: ['Maha Shivaratri', 'महाशिवरात्रि'], holika: ['Holika Dahan', 'होलिका दहन'],
    holi: ['Holi', 'होली'], ramnavami: ['Ram Navami', 'राम नवमी'], hanumanjayanti: ['Hanuman Jayanti', 'हनुमान जयंती'], akshaya: ['Akshaya Tritiya', 'अक्षय तृतीया'],
    rakhi: ['Raksha Bandhan', 'रक्षा बंधन'], janmashtami: ['Janmashtami', 'जन्माष्टमी'], ganeshchaturthi: ['Ganesh Chaturthi', 'गणेश चतुर्थी'], navratri: ['Navratri begins', 'नवरात्रि आरंभ'],
    dussehra: ['Dussehra', 'दशहरा'], dhanteras: ['Dhanteras', 'धनतेरस'], diwali: ['Diwali', 'दीपावली']
  };
  const OBS = { ekadashi: ['Ekadashi', 'एकादशी'], purnima: ['Purnima', 'पूर्णिमा'], amavasya: ['Amavasya', 'अमावस्या'], pradosh: ['Pradosh', 'प्रदोष'], sankashti: ['Sankashti Chaturthi', 'संकष्टी चतुर्थी'] };
  const DEITY = {
    ganesha: { d: 'श्री गणेश', en: 'Shri Ganesha', s: ['Ganesha', 'गणेश'] }, shiva: { d: 'शिव', en: 'Lord Shiva', s: ['Shiva', 'शिव'] },
    lakshmi: { d: 'माँ लक्ष्मी', en: 'Mother Lakshmi', s: ['Lakshmi', 'लक्ष्मी'] }, hanuman: { d: 'श्री हनुमान', en: 'Shri Hanuman', s: ['Hanuman', 'हनुमान'] },
    krishna: { d: 'श्री कृष्ण', en: 'Shri Krishna', s: ['Krishna', 'कृष्ण'] }, surya: { d: 'सूर्य देव', en: 'Surya, the Sun', s: ['Surya', 'सूर्य'] }
  };
  const ITEMS = {
    modak: ['Modak', 'मोदक'], durva: ['Durva grass', 'दूर्वा'], hibiscus: ['Red hibiscus', 'गुड़हल'], bael: ['Bael leaves', 'बेलपत्र'], whiteflower: ['White flowers', 'सफ़ेद फूल'], fruit: ['Fruits', 'फल'],
    sindoor: ['Sindoor', 'सिंदूर'], jasmineoil: ['Jasmine oil', 'चमेली का तेल'], ladoo: ['Boondi ladoo', 'बूंदी लड्डू'], redflower: ['Red flowers', 'लाल फूल'],
    tulsi: ['Tulsi leaves', 'तुलसी दल'], makhan: ['Butter & mishri', 'माखन मिश्री'], yellowflower: ['Yellow flowers', 'पीले फूल'], peacock: ['Peacock feather', 'मोरपंख'],
    lotus: ['Red lotus', 'लाल कमल'], kheer: ['Kheer', 'खीर'], ghee: ['Ghee lamp', 'घी का दीपक']
  };
  const S = {
    en: {
      title: 'Mangal Mandir', days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], daysShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      tithi: (i, p) => (i === 15 ? (p === 'shukla' ? TITHI_EN[14] : TITHI_EN[15]) : (p === 'shukla' ? 'Shukla ' : 'Krishna ') + TITHI_EN[i - 1]),
      tithiShort: (i, p) => (i === 15 ? (p === 'shukla' ? TITHI_EN[14] : TITHI_EN[15]) : TITHI_EN[i - 1]),
      streak: n => n + (n === 1 ? ' day' : ' days'), todayDeity: "today's deity", deityDay: d => d + "'s day",
      sub: { aarti: 'Aarti', arpan: 'Offer', japa: 'Japa', path: 'Read' }, abhishek: 'Abhishek', courtyard: 'Courtyard', done: 'Done', stop: 'Stop', back: 'Back',
      aHint: 'Draw circles clockwise to wave the lamp', aReceive: 'Draw the flame toward you to receive the aarti', aAuto: 'The lamp is waving',
      shankh: 'Hold to blow', ghanta: 'Ring', aartiDone: p => 'Aarti complete · prasad: ' + p, aartiOf: (a, b) => a + ' / ' + b,
      arpanTitle: d => 'Offer to ' + d, arpanNote: 'Only the right offerings for each deity appear here.', offered: i => i + ' offered', offeredAll: 'Offered today',
      japaHint: 'Tap the mala to move one bead', of108: 'of 108', round: n => 'Round ' + n, japaTurn: 'One mala complete · the mala turns back at the guru bead', mala: 'Mala',
      pathPick: 'Choose a reading', speeds: ['Manual', 'Slow', 'Normal'], pathDone: 'Path complete', lines: n => n + ' lines', readFor: d => 'Aarti of ' + d,
      pariHint: 'Walking clockwise around the sanctum, keeping the deity on your right', pariShiva: 'Half circle around the Shiva linga, never crossing the water channel',
      pariDone: 'Parikrama complete', pariRound: (a, b) => a + ' / ' + b,
      water: 'Water', milk: 'Milk', pour: 'Hold to pour', abHint: 'Pour slowly over the linga', abDone: 'Abhishek complete', abSub: 'Lord Shiva',
      yHint: 'Courtyard · tulsi, temple tank and lamp pillar', yTemple: 'Enter the temple', ySub: { tulsi: 'Water the tulsi', arghya: 'Water to the Sun' }, yGate: 'To the gate', tulsiDone: 'You watered the tulsi',
      agHint: 'Hold to pour water toward the rising sun', agDone: 'Arghya offered to Surya', agSub: 'Offer water to the Sun',
      gHint: 'Footwear stays at the rack inside the gate', gGo: 'Enter the temple', tapSkip: 'Tap to skip', bellTag: 'Ghanta',
      sunday: 'Sunday · offer water to the Sun in the courtyard', today: 'Today',
      panchang: 'Panchang', sunrise: 'Sunrise', sunset: 'Sunset', upcoming: 'Festivals', city: 'City', panchangNote: 'Tithi is calculated at sunrise for your city. Festival dates follow the Indian calendar for New Delhi.',
      settings: 'Settings', ambient: 'Temple ambience', effects: 'Sound effects', haptics: 'Vibration', notif: 'Reminders', nMorning: 'Morning aarti', nEvening: 'Sandhya aarti at sunset', nEkadashi: 'Ekadashi (evening before)', nFest: 'Festival mornings',
      language: 'Language', langAuto: 'Device', tutAgain: 'Show the guide again', restore: 'Restore purchases', privacy: 'Privacy policy',
      disclaimer: 'A simulated worship experience. No offering is made at a real temple, and purchases are app decorations only.',
      store: 'Decorations', owned: 'Owned', show: 'Show in temple', bought: 'Thank you!', buyFail: 'Purchase not completed', restored: 'Purchases restored',
      prod: {
        deepmala: ['Deepmala Lights', 'Hundreds of diyas along the roof, steps and courtyard at night'], flowers: ['Marigold Decor', 'Marigold garlands and mango-leaf torans on the gate and every shrine'],
        sphatik: ['Sphatik Mala', 'Clear crystal mala for japa'], chandan: ['Red Sandalwood Mala', 'Red sandalwood mala for japa'], goldmala: ['Gold-capped Rudraksha', 'Rudraksha mala with gold caps']
      },
      malas: { sandal: 'Sandalwood', rudraksha: 'Rudraksha', tulsi: 'Tulsi', sphatik: 'Sphatik', chandan: 'Red sandal', goldmala: 'Gold rudraksha' },
      ob: [['Welcome to Mangal Mandir', 'A quiet temple in your pocket. Ring the bell, do the aarti, offer flowers and count your japa.'],
        ['A deity for each day', 'Monday is for Shiva, Tuesday and Saturday for Hanuman, Wednesday for Ganesha, Thursday for Krishna, Friday for Lakshmi and Sunday for Surya.'],
        ['Gentle reminders', 'Get a reminder for morning aarti, Ekadashi and festivals. You can change this any time in Settings.']],
      obN: 'Remind me for morning aarti', next: 'Next', start: 'Begin',
      tut: [['Ring the bell', 'Tap the bell hanging before the shrine, as devotees do when they arrive.'], ['Do the aarti', 'Tap Aarti, then draw circles clockwise to wave the lamp.'], ['Visit every shrine', 'Use the arrows to go to Shiva, Lakshmi, Hanuman and Krishna.']],
      skip: 'Skip', gotIt: 'Got it', later: 'Later',
      nMorningT: 'Morning aarti', nMorningB: d => 'Today is ' + d + "'s day. Come for darshan.", nEveningT: 'Sandhya aarti', nEveningB: 'The sun is setting. Light the evening lamp.',
      nEkaT: 'Ekadashi tomorrow', nEkaB: 'Tomorrow is Ekadashi.', nFestT: f => f, nFestB: 'Happy festival. The temple is decorated.'
    },
    hi: {
      title: 'मंगल मंदिर', days: ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'], daysShort: ['रवि', 'सोम', 'मंगल', 'बुध', 'गुरु', 'शुक्र', 'शनि'],
      months: ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'],
      tithi: (i, p) => (i === 15 ? (p === 'shukla' ? TITHI_HI[14] : TITHI_HI[15]) : (p === 'shukla' ? 'शुक्ल ' : 'कृष्ण ') + TITHI_HI[i - 1]),
      tithiShort: (i, p) => (i === 15 ? (p === 'shukla' ? TITHI_HI[14] : TITHI_HI[15]) : TITHI_HI[i - 1]),
      streak: n => n + ' दिन', todayDeity: 'आज के देवता', deityDay: d => d + ' का दिन',
      sub: { aarti: 'दीप आरती', arpan: 'भोग लगाएँ', japa: 'माला जप', path: 'पाठ करें' }, abhishek: 'अभिषेक', courtyard: 'प्रांगण', done: 'हो गया', stop: 'रोकें', back: 'वापस',
      aHint: 'दीपक घुमाने के लिए घड़ी की दिशा में गोला बनाएँ', aReceive: 'आरती लेने के लिए लौ को अपनी ओर खींचें', aAuto: 'आरती हो रही है',
      shankh: 'दबाकर रखें', ghanta: 'बजाएँ', aartiDone: p => 'आरती पूर्ण · प्रसाद: ' + p, aartiOf: (a, b) => a + ' / ' + b,
      arpanTitle: d => d + ' को अर्पण', arpanNote: 'यहाँ हर देवता के लिए सही भोग ही दिखते हैं।', offered: i => i + ' अर्पित', offeredAll: 'आज अर्पित',
      japaHint: 'एक मनका आगे बढ़ाने के लिए माला को छुएँ', of108: '108 में से', round: n => 'माला ' + n, japaTurn: 'एक माला पूर्ण · सुमेरु पर माला पलटें', mala: 'माला',
      pathPick: 'पाठ चुनें', speeds: ['स्वयं', 'धीमा', 'सामान्य'], pathDone: 'पाठ पूर्ण', lines: n => n + ' पंक्तियाँ', readFor: d => d + ' की आरती',
      pariHint: 'देवता को दाईं ओर रखते हुए गर्भगृह की परिक्रमा', pariShiva: 'शिवलिंग की आधी परिक्रमा, जलधारी को लांघे बिना',
      pariDone: 'परिक्रमा पूर्ण', pariRound: (a, b) => a + ' / ' + b,
      water: 'जल', milk: 'दूध', pour: 'दबाकर अर्पित करें', abHint: 'शिवलिंग पर धीरे-धीरे अर्पित करें', abDone: 'अभिषेक पूर्ण', abSub: 'भगवान शिव',
      yHint: 'प्रांगण · तुलसी, कुंड और दीपस्तंभ', yTemple: 'मंदिर में प्रवेश', ySub: { tulsi: 'तुलसी को जल', arghya: 'सूर्य को जल' }, yGate: 'द्वार की ओर', tulsiDone: 'आपने तुलसी को जल चढ़ाया',
      agHint: 'उगते सूर्य की ओर जल अर्पित करने के लिए दबाकर रखें', agDone: 'सूर्य देव को अर्घ्य अर्पित', agSub: 'सूर्य को जल अर्पित करें',
      gHint: 'जूते-चप्पल द्वार के पास रैक पर रहते हैं', gGo: 'मंदिर में प्रवेश', tapSkip: 'आगे बढ़ने के लिए छुएँ', bellTag: 'घंटी',
      sunday: 'रविवार · प्रांगण में सूर्य को जल अर्पित करें', today: 'आज',
      panchang: 'पंचांग', sunrise: 'सूर्योदय', sunset: 'सूर्यास्त', upcoming: 'त्योहार', city: 'शहर', panchangNote: 'तिथि आपके शहर के सूर्योदय के अनुसार है। त्योहार की तिथियाँ नई दिल्ली के भारतीय पंचांग के अनुसार हैं।',
      settings: 'सेटिंग्स', ambient: 'मंदिर का वातावरण', effects: 'ध्वनि', haptics: 'कंपन', notif: 'याद दिलाएँ', nMorning: 'सुबह की आरती', nEvening: 'सूर्यास्त पर संध्या आरती', nEkadashi: 'एकादशी (एक शाम पहले)', nFest: 'त्योहार की सुबह',
      language: 'भाषा', langAuto: 'डिवाइस', tutAgain: 'मार्गदर्शन फिर देखें', restore: 'ख़रीदारी पुनः प्राप्त करें', privacy: 'गोपनीयता नीति',
      disclaimer: 'यह पूजा का एक अनुभव है। किसी असली मंदिर में कोई भोग नहीं चढ़ाया जाता, और ख़रीदारी केवल ऐप की सजावट है।',
      store: 'सजावट', owned: 'आपका', show: 'मंदिर में दिखाएँ', bought: 'धन्यवाद!', buyFail: 'ख़रीदारी पूरी नहीं हुई', restored: 'ख़रीदारी वापस मिल गई',
      prod: {
        deepmala: ['दीपमाला', 'रात में छत, सीढ़ियों और प्रांगण पर सैकड़ों दीये'], flowers: ['गेंदा सजावट', 'द्वार और हर मंदिर पर गेंदे की माला और आम के पत्तों का तोरण'],
        sphatik: ['स्फटिक माला', 'जप के लिए स्फटिक की माला'], chandan: ['रक्त चंदन माला', 'जप के लिए लाल चंदन की माला'], goldmala: ['स्वर्ण रुद्राक्ष', 'सोने की टोपी वाली रुद्राक्ष माला']
      },
      malas: { sandal: 'चंदन', rudraksha: 'रुद्राक्ष', tulsi: 'तुलसी', sphatik: 'स्फटिक', chandan: 'रक्त चंदन', goldmala: 'स्वर्ण रुद्राक्ष' },
      ob: [['मंगल मंदिर में आपका स्वागत है', 'आपकी जेब में एक शांत मंदिर। घंटी बजाएँ, आरती करें, फूल चढ़ाएँ और माला जपें।'],
        ['हर दिन एक देवता', 'सोमवार शिव का, मंगलवार और शनिवार हनुमान जी का, बुधवार गणेश जी का, गुरुवार कृष्ण का, शुक्रवार लक्ष्मी जी का और रविवार सूर्य देव का।'],
        ['प्यार भरी याद', 'सुबह की आरती, एकादशी और त्योहारों की याद पाएँ। इसे सेटिंग्स में कभी भी बदल सकते हैं।']],
      obN: 'सुबह की आरती के लिए याद दिलाएँ', next: 'आगे', start: 'शुरू करें',
      tut: [['घंटी बजाएँ', 'दर्शन से पहले मंदिर के सामने लटकी घंटी को छुएँ, जैसे भक्त आते समय करते हैं।'], ['आरती करें', 'आरती दबाएँ, फिर दीपक घुमाने के लिए घड़ी की दिशा में गोला बनाएँ।'], ['हर मंदिर में जाएँ', 'तीरों से शिव, लक्ष्मी, हनुमान और कृष्ण के मंदिर में जाएँ।']],
      skip: 'छोड़ें', gotIt: 'समझ गया', later: 'बाद में',
      nMorningT: 'सुबह की आरती', nMorningB: d => 'आज ' + d + ' का दिन है। दर्शन के लिए आइए।', nEveningT: 'संध्या आरती', nEveningB: 'सूर्यास्त हो रहा है। संध्या का दीपक जलाएँ।',
      nEkaT: 'कल एकादशी है', nEkaB: 'कल एकादशी है।', nFestT: f => f, nFestB: 'त्योहार की शुभकामनाएँ। मंदिर सजा है।'
    }
  };
  let pick = null;
  try { pick = new URLSearchParams(location.search).get('lang'); } catch (e) { /* ignore */ }
  if (!pick) { try { const st = typeof window.QP_STATE === 'string' ? JSON.parse(window.QP_STATE) : window.QP_STATE; pick = st && st.settings && st.settings.lang; } catch (e) { /* ignore */ } }
  if (!pick) { try { const st = JSON.parse(localStorage.getItem('mm') || 'null'); pick = st && st.settings && st.settings.lang; } catch (e) { /* ignore */ } }
  const want = ((pick && pick !== 'auto' && pick) || window.QP_LANG || navigator.language || 'en').toLowerCase();
  const lang = want.startsWith('hi') ? 'hi' : 'en';
  const k = lang === 'hi' ? 1 : 0;
  const T = S[lang];
  T.fest = f => FEST[f] ? FEST[f][k] : f; T.obs = o => OBS[o] ? OBS[o][k] : o; T.item = i => ITEMS[i] ? ITEMS[i][k] : i; T.itemD = i => ITEMS[i] ? ITEMS[i][1] : i;
  T.deity = id => DEITY[id]; T.dShort = id => DEITY[id].s[k];
  window.LANG = lang; window.T = T;
})();
