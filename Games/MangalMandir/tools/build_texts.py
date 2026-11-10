#!/usr/bin/env python3
"""Sinh Web/texts.js: mantra, aarti, Hanuman Chalisa — chữ Devanagari + phiên âm IAST (tự sinh) + nghĩa tiếng Anh/Hindi.
Nguồn văn bản: bản truyền thống đã hết bản quyền (Rig Veda; Tulsidas, thế kỷ 16; Samarth Ramdas, thế kỷ 17;
Shardha Ram Phillauri, thế kỷ 19; các aarti dân gian). Nghĩa tiếng Anh/Hindi là bản dịch của BeeMob.
Chạy: python3 tools/build_texts.py"""
import json, os, re

V = {'अ': 'a', 'आ': 'ā', 'इ': 'i', 'ई': 'ī', 'उ': 'u', 'ऊ': 'ū', 'ऋ': 'ṛ', 'ए': 'e', 'ऐ': 'ai', 'ओ': 'o', 'औ': 'au'}
M = {'ा': 'ā', 'ि': 'i', 'ी': 'ī', 'ु': 'u', 'ू': 'ū', 'ृ': 'ṛ', 'े': 'e', 'ै': 'ai', 'ो': 'o', 'ौ': 'au'}
C = {'क': 'k', 'ख': 'kh', 'ग': 'g', 'घ': 'gh', 'ङ': 'ṅ', 'च': 'c', 'छ': 'ch', 'ज': 'j', 'झ': 'jh', 'ञ': 'ñ', 'ट': 'ṭ', 'ठ': 'ṭh', 'ड': 'ḍ', 'ढ': 'ḍh', 'ण': 'ṇ',
     'त': 't', 'थ': 'th', 'द': 'd', 'ध': 'dh', 'न': 'n', 'प': 'p', 'फ': 'ph', 'ब': 'b', 'भ': 'bh', 'म': 'm', 'य': 'y', 'र': 'r', 'ल': 'l', 'ळ': 'ḷ', 'व': 'v',
     'श': 'ś', 'ष': 'ṣ', 'स': 's', 'ह': 'h'}
NUK = {'ड': 'ṛ', 'ढ': 'ṛh', 'क': 'q', 'ख': 'x', 'ग': 'ġ', 'ज': 'z', 'फ': 'f'}


def translit(s, hindi):
    out, i, n = [], 0, len(s)
    while i < n:
        ch = s[i]
        if ch == 'ॐ':
            out.append('oṃ'); i += 1; continue
        if ch in C:
            base = C[ch]; i += 1
            if i < n and s[i] == '़':
                base = NUK.get(ch, base); i += 1
            if i < n and s[i] == '्':
                out.append(base); i += 1; continue
            if i < n and s[i] in M:
                out.append(base + M[s[i]]); i += 1; continue
            out.append(base + 'a'); continue
        if ch in V:
            out.append(V[ch]); i += 1; continue
        if ch == 'ं': out.append('ṃ' if not hindi else 'ṃ'); i += 1; continue
        if ch == 'ँ': out.append('̃'); i += 1; continue
        if ch == 'ः': out.append('ḥ'); i += 1; continue
        if ch == 'ऽ': out.append("'"); i += 1; continue
        if ch in '।॥': i += 1; continue
        if ch in '०१२३४५६७८९': i += 1; continue
        out.append(ch); i += 1
    r = ''.join(out)
    if hindi:  # bỏ "a" câm cuối từ kiểu Hindi/Awadhi
        r = re.sub(r"(?<=[bcdfghjklmnpqrstvwyzḍḥḷṃṅñṇṛṣśṭ])a(?=[\s,]|$)", '', r)
    r = re.sub(r'\s+', ' ', r).strip(' ,')
    return r


def L(d, en, hi=None, kind='l'):
    return {'d': d, 'en': en, 'hi': hi, 'k': kind}


GAYATRI = [L('ॐ भूर्भुवः स्वः', 'Om. Earth, sky and the heavens.', 'ॐ। पृथ्वी, अंतरिक्ष और स्वर्ग।'),
           L('तत्सवितुर्वरेण्यं', 'That most excellent light of the divine Sun,', 'उस सविता देव के श्रेष्ठ'),
           L('भर्गो देवस्य धीमहि', 'that radiance of the Divine, we hold in meditation.', 'दिव्य तेज का हम ध्यान करते हैं।'),
           L('धियो यो नः प्रचोदयात्', 'May it awaken and guide our minds.', 'वह हमारी बुद्धि को प्रेरित करे।')]
MRITYUNJAYA = [L('ॐ त्र्यम्बकं यजामहे', 'Om. We worship the three-eyed Lord,', 'ॐ। हम त्रिनेत्र भगवान शिव की पूजा करते हैं,'),
               L('सुगन्धिं पुष्टिवर्धनम्', 'fragrant, who nourishes all beings.', 'जो सुगंधित हैं और सबका पोषण करते हैं।'),
               L('उर्वारुकमिव बन्धनान्', 'As the ripe cucumber is freed from its vine,', 'जैसे पका हुआ खरबूजा बेल से छूट जाता है,'),
               L('मृत्योर्मुक्षीय माऽमृतात्', 'free us from death, not from immortality.', 'वैसे ही हमें मृत्यु से मुक्त करें, अमृत से नहीं।')]

AARTI = {
    'ganesha': {'title': {'en': 'Sukhakarta Dukhaharta', 'hi': 'सुखकर्ता दुःखहर्ता'}, 'by': 'Samarth Ramdas', 'lang': 'mr', 'lines': [
        L('सुखकर्ता दुःखहर्ता वार्ता विघ्नाची', 'You who bring joy and take away sorrow, ending every obstacle,'),
        L('नुरवी पुरवी प्रेम कृपा जयाची', 'whose love and grace remove all trouble and fulfil every need;'),
        L('सर्वांगी सुंदर उटी शेंदुराची', 'beautiful in every limb, anointed with sindoor,'),
        L('कंठी झळके माळ मुक्ताफळांची', 'a garland of pearls shining at your throat.'),
        L('जय देव जय देव जय मंगलमूर्ती', 'Victory, O Lord, victory to the auspicious one, Mangalmurti!', None, 'r'),
        L('दर्शनमात्रे मनकामना पुरती', 'One sight of you fulfils the wishes of the heart.', None, 'r'),
        L('रत्नखचित फरा तुज गौरीकुमरा', 'Jewelled ornaments for you, son of Gauri,'),
        L('चंदनाची उटी कुमकुम केशरा', 'sandal paste, kumkum and saffron;'),
        L('हिरे जडित मुकुट शोभतो बरा', 'a diamond-studded crown sits gracefully on you,'),
        L('रुणझुणती नूपुरे चरणी घागरिया', 'anklets chime softly at your feet.'),
        L('लंबोदर पीतांबर फणिवरबंधना', 'Round-bellied one in yellow silk, a serpent at your waist,'),
        L('सरळ सोंड वक्रतुंड त्रिनयना', 'with a straight trunk and curved tusk, three-eyed one;'),
        L('दास रामाचा वाट पाहे सदना', 'Ramdas, your servant, waits for you at home —'),
        L('संकटी पावावे निर्वाणी रक्षावे सुरवरवंदना', 'come in times of trouble and protect us, you whom the gods revere.')]},
    'shiva': {'title': {'en': 'Om Jai Shiv Omkara', 'hi': 'ॐ जय शिव ओंकारा'}, 'by': 'traditional', 'lang': 'hi', 'lines': [
        L('ॐ जय शिव ओंकारा, स्वामी जय शिव ओंकारा', 'Om, victory to Shiva, the sacred sound Om; victory, O Lord!', None, 'r'),
        L('ब्रह्मा विष्णु सदाशिव, अर्द्धांगी धारा', 'Brahma, Vishnu and Sadashiva, with Parvati as half of your being.', None, 'r'),
        L('एकानन चतुरानन पंचानन राजे', 'One-faced, four-faced, five-faced, you reign in every form;'),
        L('हंसासन गरूड़ासन वृषवाहन साजे', 'seated on the swan, on Garuda, riding the bull Nandi.'),
        L('दो भुज चार चतुर्भुज दसभुज अति सोहे', 'With two arms, four arms, ten arms, you shine;'),
        L('त्रिगुण रूप निरखते त्रिभुवन जन मोहे', 'seeing your threefold form, all three worlds are enchanted.'),
        L('अक्षमाला वनमाला मुण्डमाला धारी', 'You wear the rudraksha mala, the forest garland and the garland of skulls;'),
        L('चंदन मृगमद सोहै भाले शशिधारी', 'sandal and musk adorn you, the crescent moon upon your brow.')]},
    'hanuman': {'title': {'en': 'Aarti Kije Hanuman Lala Ki', 'hi': 'आरती कीजै हनुमान लला की'}, 'by': 'traditional', 'lang': 'hi', 'lines': [
        L('आरती कीजै हनुमान लला की', 'Let us offer the aarti to beloved Hanuman,', None, 'r'),
        L('दुष्ट दलन रघुनाथ कला की', 'destroyer of evil, the power of Lord Rama.', None, 'r'),
        L('जाके बल से गिरिवर काँपे', 'Before whose strength the mountains tremble,'),
        L('रोग दोष जाके निकट न झाँके', 'near whom no sickness or fault can come.'),
        L('अंजनि पुत्र महा बलदाई', 'Son of Anjani, giver of great strength,'),
        L('संतन के प्रभु सदा सहाई', 'ever the helper of the saints.'),
        L('दे बीरा रघुनाथ पठाए', 'Sent by Rama with his blessing,'),
        L('लंका जारि सिया सुधि लाए', 'you burned Lanka and brought back news of Sita.'),
        L('लंका सो कोट समुद्र सी खाई', 'Lanka was a fortress, its moat the ocean itself;'),
        L('जात पवनसुत बार न लाई', 'the son of the wind crossed it without delay.')]},
    'krishna': {'title': {'en': 'Om Jai Jagdish Hare', 'hi': 'ॐ जय जगदीश हरे'}, 'by': 'Shardha Ram Phillauri', 'lang': 'hi', 'lines': [
        L('ॐ जय जगदीश हरे, स्वामी जय जगदीश हरे', 'Om, victory to Hari, Lord of the universe; victory, O Lord!', None, 'r'),
        L('भक्त जनों के संकट, क्षण में दूर करे', 'You remove the troubles of your devotees in a moment.', None, 'r'),
        L('जो ध्यावे फल पावे, दुःख बिनसे मन का', 'Whoever meditates on you is rewarded; the sorrow of the mind fades.'),
        L('सुख संपत्ति घर आवे, कष्ट मिटे तन का', 'Happiness and plenty come home, and the body’s pain is eased.'),
        L('मात पिता तुम मेरे, शरण गहूँ मैं किसकी', 'You are my mother and father; whose shelter should I seek?'),
        L('तुम बिन और न दूजा, आस करूँ मैं जिसकी', 'There is no other but you in whom I place my hope.'),
        L('तुम पूरण परमात्मा, तुम अंतर्यामी', 'You are the complete Supreme Self, the one who knows every heart,'),
        L('पारब्रह्म परमेश्वर, तुम सब के स्वामी', 'the highest Brahman, the Supreme Lord, master of all.'),
        L('तुम करुणा के सागर, तुम पालनकर्ता', 'You are an ocean of compassion, the sustainer of all.'),
        L('मैं मूरख खल कामी, कृपा करो भर्ता', 'I am foolish and full of desire; show me your grace, O Lord.')]},
    'lakshmi': {'title': {'en': 'Om Jai Lakshmi Mata', 'hi': 'ॐ जय लक्ष्मी माता'}, 'by': 'traditional', 'lang': 'hi', 'lines': [
        L('ॐ जय लक्ष्मी माता, मैया जय लक्ष्मी माता', 'Om, victory to Mother Lakshmi; victory, O Mother!', None, 'r'),
        L('तुमको निशदिन सेवत, हरि विष्णु विधाता', 'Day and night you are honoured by Hari, Vishnu and Brahma.', None, 'r'),
        L('उमा रमा ब्रह्माणी, तुम ही जग माता', 'Uma, Rama, Brahmani — you alone are the mother of the world.'),
        L('सूर्य चंद्रमा ध्यावत, नारद ऋषि गाता', 'The sun and moon meditate on you, and the sage Narada sings of you.'),
        L('दुर्गा रूप निरंजनी, सुख संपत्ति दाता', 'Pure one in the form of Durga, giver of happiness and plenty;'),
        L('जो कोई तुमको ध्यावत, ऋद्धि सिद्धि धन पाता', 'whoever meditates on you gains prosperity, success and wealth.'),
        L('जिस घर में तुम रहतीं, सब सद्गुण आता', 'Every virtue comes to the home where you dwell;'),
        L('सब संभव हो जाता, मन नहीं घबराता', 'all becomes possible, and the mind knows no fear.')]}
}

CHALISA_D = [
    ('श्रीगुरु चरन सरोज रज, निज मनु मुकुरु सुधारि', 'With the dust of my Guru’s lotus feet I polish the mirror of my mind,', 'd'),
    ('बरनउँ रघुबर बिमल जसु, जो दायकु फल चारि', 'and sing the pure glory of Rama, which grants the four fruits of life.', 'd'),
    ('बुद्धिहीन तनु जानिके, सुमिरौं पवन-कुमार', 'Knowing myself to be without wisdom, I remember you, son of the Wind.', 'd'),
    ('बल बुधि बिद्या देहु मोहिं, हरहु कलेस बिकार', 'Give me strength, wisdom and knowledge; remove my troubles and faults.', 'd'),
    ('जय हनुमान ज्ञान गुन सागर', 'Victory to Hanuman, ocean of wisdom and virtue;', 'l'),
    ('जय कपीस तिहुँ लोक उजागर', 'victory to the lord of monkeys, who lights up the three worlds.', 'l'),
    ('राम दूत अतुलित बल धामा', 'Messenger of Rama, abode of matchless strength,', 'l'),
    ('अंजनि-पुत्र पवनसुत नामा', 'known as Anjani’s son and the son of the Wind.', 'l'),
    ('महाबीर बिक्रम बजरंगी', 'Great hero, mighty one with a body like a thunderbolt,', 'l'),
    ('कुमति निवार सुमति के संगी', 'you drive away bad thoughts and are the companion of good ones.', 'l'),
    ('कंचन बरन बिराज सुबेसा', 'Golden in colour, beautifully dressed,', 'l'),
    ('कानन कुंडल कुंचित केसा', 'with earrings and curly hair.', 'l'),
    ('हाथ बज्र औ ध्वजा बिराजै', 'In your hands shine the mace and the banner;', 'l'),
    ('काँधे मूँज जनेऊ साजै', 'a sacred thread of munja grass adorns your shoulder.', 'l'),
    ('संकर सुवन केसरीनंदन', 'Embodiment of Shiva, son of Kesari,', 'l'),
    ('तेज प्रताप महा जग बंदन', 'your radiance and glory are honoured by the whole world.', 'l'),
    ('बिद्यावान गुनी अति चातुर', 'Learned, virtuous and very wise,', 'l'),
    ('राम काज करिबे को आतुर', 'always eager to do Rama’s work.', 'l'),
    ('प्रभु चरित्र सुनिबे को रसिया', 'You delight in hearing the Lord’s story;', 'l'),
    ('राम लखन सीता मन बसिया', 'Rama, Lakshmana and Sita dwell in your heart.', 'l'),
    ('सूक्ष्म रूप धरि सियहिं दिखावा', 'Taking a tiny form you appeared to Sita;', 'l'),
    ('बिकट रूप धरि लंक जरावा', 'taking a fearsome form you burned Lanka.', 'l'),
    ('भीम रूप धरि असुर सँहारे', 'In a mighty form you destroyed the demons', 'l'),
    ('रामचंद्र के काज सँवारे', 'and accomplished the work of Ramachandra.', 'l'),
    ('लाय सजीवन लखन जियाये', 'You brought the life-giving herb and revived Lakshmana;', 'l'),
    ('श्रीरघुबीर हरषि उर लाये', 'Rama, overjoyed, held you to his heart.', 'l'),
    ('रघुपति कीन्ही बहुत बड़ाई', 'The Lord of the Raghus praised you greatly:', 'l'),
    ('तुम मम प्रिय भरतहि सम भाई', '“You are as dear to me as my brother Bharata.”', 'l'),
    ('सहस बदन तुम्हरो जस गावैं', '“May the thousand-headed serpent sing your glory,”', 'l'),
    ('अस कहि श्रीपति कंठ लगावैं', 'said the Lord, and embraced you.', 'l'),
    ('सनकादिक ब्रह्मादि मुनीसा', 'Sanaka and the sages, Brahma and the great seers,', 'l'),
    ('नारद सारद सहित अहीसा', 'Narada, Saraswati and the king of serpents —', 'l'),
    ('जम कुबेर दिगपाल जहाँ ते', 'Yama, Kubera and the guardians of the directions —', 'l'),
    ('कबि कोबिद कहि सके कहाँ ते', 'how could poets and scholars describe your glory?', 'l'),
    ('तुम उपकार सुग्रीवहिं कीन्हा', 'You did a great kindness to Sugriva:', 'l'),
    ('राम मिलाय राज पद दीन्हा', 'you brought him to Rama, who gave him back his kingdom.', 'l'),
    ('तुम्हरो मंत्र बिभीषन माना', 'Vibhishana followed your counsel', 'l'),
    ('लंकेस्वर भए सब जग जाना', 'and became king of Lanka, as the whole world knows.', 'l'),
    ('जुग सहस्र जोजन पर भानू', 'The sun, thousands of leagues away,', 'l'),
    ('लील्यो ताहि मधुर फल जानू', 'you swallowed, thinking it a sweet fruit.', 'l'),
    ('प्रभु मुद्रिका मेलि मुख माहीं', 'Holding the Lord’s ring in your mouth', 'l'),
    ('जलधि लाँघि गये अचरज नाहीं', 'you leapt across the ocean — no wonder at all.', 'l'),
    ('दुर्गम काज जगत के जेते', 'Every difficult task in the world', 'l'),
    ('सुगम अनुग्रह तुम्हरे तेते', 'becomes easy by your grace.', 'l'),
    ('राम दुआरे तुम रखवारे', 'You are the guardian at Rama’s door;', 'l'),
    ('होत न आज्ञा बिनु पैसारे', 'none enter without your leave.', 'l'),
    ('सब सुख लहै तुम्हारी सरना', 'Those who take refuge in you find every joy;', 'l'),
    ('तुम रच्छक काहू को डर ना', 'with you as protector, there is nothing to fear.', 'l'),
    ('आपन तेज सम्हारो आपै', 'Only you can contain your own power;', 'l'),
    ('तीनों लोक हाँक तें काँपै', 'the three worlds tremble at your roar.', 'l'),
    ('भूत पिसाच निकट नहिं आवै', 'Ghosts and evil spirits do not come near', 'l'),
    ('महाबीर जब नाम सुनावै', 'when the name of the great hero is spoken.', 'l'),
    ('नासै रोग हरै सब पीरा', 'Disease is destroyed and all pain removed', 'l'),
    ('जपत निरंतर हनुमत बीरा', 'for those who constantly repeat the name of brave Hanuman.', 'l'),
    ('संकट तें हनुमान छुड़ावै', 'Hanuman frees from every hardship', 'l'),
    ('मन क्रम बचन ध्यान जो लावै', 'those who keep him in mind, deed and word.', 'l'),
    ('सब पर राम तपस्वी राजा', 'Rama, the ascetic king, is above all,', 'l'),
    ('तिन के काज सकल तुम साजा', 'and you carried out all his work.', 'l'),
    ('और मनोरथ जो कोई लावै', 'Whoever comes to you with any wish', 'l'),
    ('सोइ अमित जीवन फल पावै', 'receives the boundless fruit of life.', 'l'),
    ('चारों जुग परताप तुम्हारा', 'Your glory spans all four ages;', 'l'),
    ('है परसिद्ध जगत उजियारा', 'it is famous and lights up the world.', 'l'),
    ('साधु संत के तुम रखवारे', 'You are the protector of saints and sages,', 'l'),
    ('असुर निकंदन राम दुलारे', 'destroyer of demons, beloved of Rama.', 'l'),
    ('अष्ट सिद्धि नौ निधि के दाता', 'Giver of the eight powers and nine treasures —', 'l'),
    ('अस बर दीन जानकी माता', 'this boon was given to you by Mother Sita.', 'l'),
    ('राम रसायन तुम्हरे पासा', 'You hold the nectar of devotion to Rama;', 'l'),
    ('सदा रहो रघुपति के दासा', 'may you always remain his servant.', 'l'),
    ('तुम्हरे भजन राम को पावै', 'Through devotion to you one reaches Rama', 'l'),
    ('जनम जनम के दुख बिसरावै', 'and forgets the sorrows of many lifetimes.', 'l'),
    ('अंत काल रघुबर पुर जाई', 'At the end one goes to Rama’s abode,', 'l'),
    ('जहाँ जन्म हरि-भक्त कहाई', 'and wherever born, is called a devotee of Hari.', 'l'),
    ('और देवता चित्त न धरई', 'One need not hold any other deity in mind;', 'l'),
    ('हनुमत सेइ सर्ब सुख करई', 'serving Hanuman brings every happiness.', 'l'),
    ('संकट कटै मिटै सब पीरा', 'Hardship is cut away and all pain ends', 'l'),
    ('जो सुमिरै हनुमत बलबीरा', 'for those who remember mighty Hanuman.', 'l'),
    ('जै जै जै हनुमान गोसाईं', 'Victory, victory, victory to Lord Hanuman!', 'l'),
    ('कृपा करहु गुरुदेव की नाईं', 'Bless me as my own Guru would.', 'l'),
    ('जो सत बार पाठ कर कोई', 'Whoever recites this a hundred times', 'l'),
    ('छूटहि बंदि महा सुख होई', 'is freed from bondage and finds great joy.', 'l'),
    ('जो यह पढ़ै हनुमान चालीसा', 'Whoever reads this Hanuman Chalisa', 'l'),
    ('होय सिद्धि साखी गौरीसा', 'will succeed — Shiva, lord of Gauri, is witness.', 'l'),
    ('तुलसीदास सदा हरि चेरा', 'Tulsidas, forever the servant of Hari,', 'l'),
    ('कीजै नाथ हृदय महँ डेरा', 'prays: Lord, make your home in my heart.', 'l'),
    ('पवन तनय संकट हरन, मंगल मूरति रूप', 'Son of the Wind, remover of hardship, auspicious in form,', 'd'),
    ('राम लखन सीता सहित, हृदय बसहु सुर भूप', 'dwell in my heart, king of the gods, with Rama, Lakshmana and Sita.', 'd')]

JAPA = {
    'ganesha': ('ॐ गं गणपतये नमः', 'Om, salutations to Ganapati.', 'ॐ, गणपति को नमस्कार।', False),
    'shiva': ('ॐ नमः शिवाय', 'Om, salutations to Shiva.', 'ॐ, शिव को नमस्कार।', False),
    'hanuman': ('ॐ हं हनुमते नमः', 'Om, salutations to Hanuman.', 'ॐ, हनुमान जी को नमस्कार।', False),
    'krishna': ('ॐ नमो भगवते वासुदेवाय', 'Om, salutations to Lord Vasudeva.', 'ॐ, भगवान वासुदेव को नमस्कार।', False),
    'lakshmi': ('ॐ श्रीं महालक्ष्म्यै नमः', 'Om Shreem, salutations to Mahalakshmi.', 'ॐ श्रीं, महालक्ष्मी को नमस्कार।', False),
    'surya': ('ॐ सूर्याय नमः', 'Om, salutations to Surya, the Sun.', 'ॐ, सूर्य देव को नमस्कार।', False)
}


def pack(lines, hindi):
    return [{'d': l['d'], 'r': translit(l['d'], hindi), 'en': l['en'], 'hi': l['hi'], 'k': l['k']} for l in lines]


def main():
    out = {
        'gayatri': {'id': 'gayatri', 'title': {'en': 'Gayatri Mantra', 'hi': 'गायत्री मंत्र'}, 'src': 'Rig Veda 3.62.10', 'repeat': 3, 'lines': pack(GAYATRI, False)},
        'mrityunjaya': {'id': 'mrityunjaya', 'title': {'en': 'Mahamrityunjaya Mantra', 'hi': 'महामृत्युंजय मंत्र'}, 'src': 'Rig Veda 7.59.12', 'repeat': 3, 'lines': pack(MRITYUNJAYA, False)},
        'chalisa': {'id': 'chalisa', 'title': {'en': 'Hanuman Chalisa', 'hi': 'हनुमान चालीसा'}, 'src': 'Tulsidas', 'repeat': 1,
                    'lines': pack([L(d, en, None, k) for d, en, k in CHALISA_D], True)},
        'aarti': {k: {'id': 'aarti-' + k, 'title': v['title'], 'src': v['by'], 'lines': pack(v['lines'], True)} for k, v in AARTI.items()},
        'japa': {k: {'d': d, 'r': translit(d, False), 'en': en, 'hi': hi} for k, (d, en, hi, _) in JAPA.items()}
    }
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    with open(os.path.join(root, 'Web', 'texts.js'), 'w', encoding='utf-8') as f:
        f.write('// Sinh bởi tools/build_texts.py — không sửa tay.\nwindow.TEXTS = ' + json.dumps(out, ensure_ascii=False) + ';\n')
    print('ok', len(out['chalisa']['lines']), 'chalisa lines')
    for t in [GAYATRI[1]['d'], 'ॐ गं गणपतये नमः', 'जय हनुमान ज्ञान गुन सागर', 'सुखकर्ता दुःखहर्ता वार्ता विघ्नाची', 'काँधे मूँज जनेऊ साजै', 'संकट तें हनुमान छुड़ावै']:
        print(t, '→', translit(t, 'ॐ' not in t and t != GAYATRI[1]['d']))


if __name__ == '__main__':
    main()
