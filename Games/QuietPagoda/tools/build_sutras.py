# Sinh Web/sutras.js từ bản kinh gốc (CBETA T251, T262, T293) + âm đọc.
# Chữ Hán và âm Hán Việt nhập tay; âm Hán Hàn (Tâm Kinh nhập tay, còn lại từ thư viện hanja + sửa),
# pinyin từ pypinyin, giản thể từ OpenCC. Nghĩa Anh/Nhật tự viết theo đoạn.
import json, re, sys
import hanja
from pypinyin import pinyin, Style, load_phrases_dict
from opencc import OpenCC

t2s = OpenCC('t2s')
load_phrases_dict({'南無': [['ná'], ['mó']], '般若': [['bō'], ['rě']], '揭諦': [['jiē'], ['dì']],
                   '薩婆訶': [['sà'], ['pó'], ['hē']], '阿耨': [['ā'], ['nòu']], '三藐': [['sān'], ['miǎo']],
                   '菩提': [['pú'], ['tí']], '觀音': [['guān'], ['yīn']], '無盡意': [['wú'], ['jìn'], ['yì']],
                   '須彌': [['xū'], ['mí']], '羅剎': [['luó'], ['chà']], '說': [['shuō']], '重問': [['chóng'], ['wèn']], '名為': [['míng'], ['wéi']], '能為': [['néng'], ['wéi']]})

KO_FIX = [('반약', '반야'), ('파라', '바라'), ('보제', '보리'), ('아누', '아뇩'), ('삼묘', '삼먁'), ('게체', '아제'),
          ('나무', '나무'), ('남무', '나무'), ('살파하', '사바하'), ('괘애', '가애'), ('불정', '부정'), ('불증', '부증'),
          ('불득', '부득'), ('불단', '부단'), ('불능', '불능'), ('세존', '세존')]

def ko_auto(han):
    s = hanja.translate(han, 'substitution')
    for a, b in KO_FIX:
        s = s.replace(a, b)
    return s

def py(han):
    return ' '.join(x[0] for x in pinyin(han, style=Style.TONE, heteronym=False))

def L(han, vi, ko=None):
    h = re.sub(r'[\s，。、；！：「」『』]', '', han)
    syl = vi.replace(',', ' ').split()
    assert len(h) == len(syl), (han, vi, len(h), len(syl))
    k = ko or ko_auto(h)
    assert len(k.replace(' ', '')) == len(h), ('ko', han, k)
    return {'h': h, 'vi': vi, 'ko': k, 'zh': py(h), 's': t2s.convert(h)}

OPEN = L('南無本師釋迦牟尼佛', 'Nam mô Bổn Sư Thích Ca Mâu Ni Phật', '나무본사석가모니불')
OPEN_QA = L('南無大悲觀世音菩薩', 'Nam mô Đại Bi Quán Thế Âm Bồ Tát', '나무대비관세음보살')

HEART = [
 ('觀自在菩薩', 'Quán Tự Tại Bồ Tát', '관자재보살'),
 ('行深般若波羅蜜多時', 'hành thâm Bát Nhã Ba La Mật Đa thời', '행심반야바라밀다시'),
 ('照見五蘊皆空', 'chiếu kiến ngũ uẩn giai không', '조견오온개공'),
 ('度一切苦厄', 'độ nhất thiết khổ ách', '도일체고액'),
 ('舍利子', 'Xá Lợi Tử', '사리자'),
 ('色不異空，空不異色', 'sắc bất dị không, không bất dị sắc', '색불이공공불이색'),
 ('色即是空，空即是色', 'sắc tức thị không, không tức thị sắc', '색즉시공공즉시색'),
 ('受想行識，亦復如是', 'thọ tưởng hành thức, diệc phục như thị', '수상행식역부여시'),
 ('舍利子', 'Xá Lợi Tử', '사리자'),
 ('是諸法空相', 'thị chư pháp không tướng', '시제법공상'),
 ('不生不滅', 'bất sanh bất diệt', '불생불멸'),
 ('不垢不淨', 'bất cấu bất tịnh', '불구부정'),
 ('不增不減', 'bất tăng bất giảm', '부증불감'),
 ('是故空中無色', 'thị cố không trung vô sắc', '시고공중무색'),
 ('無受想行識', 'vô thọ tưởng hành thức', '무수상행식'),
 ('無眼耳鼻舌身意', 'vô nhãn nhĩ tỷ thiệt thân ý', '무안이비설신의'),
 ('無色聲香味觸法', 'vô sắc thanh hương vị xúc pháp', '무색성향미촉법'),
 ('無眼界，乃至無意識界', 'vô nhãn giới, nãi chí vô ý thức giới', '무안계내지무의식계'),
 ('無無明，亦無無明盡', 'vô vô minh, diệc vô vô minh tận', '무무명역무무명진'),
 ('乃至無老死，亦無老死盡', 'nãi chí vô lão tử, diệc vô lão tử tận', '내지무노사역무노사진'),
 ('無苦集滅道', 'vô khổ tập diệt đạo', '무고집멸도'),
 ('無智亦無得', 'vô trí diệc vô đắc', '무지역무득'),
 ('以無所得故', 'dĩ vô sở đắc cố', '이무소득고'),
 ('菩提薩埵', 'Bồ Đề Tát Đỏa', '보리살타'),
 ('依般若波羅蜜多故', 'y Bát Nhã Ba La Mật Đa cố', '의반야바라밀다고'),
 ('心無罣礙', 'tâm vô quái ngại', '심무가애'),
 ('無罣礙故，無有恐怖', 'vô quái ngại cố, vô hữu khủng bố', '무가애고무유공포'),
 ('遠離顛倒夢想', 'viễn ly điên đảo mộng tưởng', '원리전도몽상'),
 ('究竟涅槃', 'cứu cánh Niết Bàn', '구경열반'),
 ('三世諸佛', 'tam thế chư Phật', '삼세제불'),
 ('依般若波羅蜜多故', 'y Bát Nhã Ba La Mật Đa cố', '의반야바라밀다고'),
 ('得阿耨多羅三藐三菩提', 'đắc A Nậu Đa La Tam Miệu Tam Bồ Đề', '득아뇩다라삼먁삼보리'),
 ('故知般若波羅蜜多', 'cố tri Bát Nhã Ba La Mật Đa', '고지반야바라밀다'),
 ('是大神咒，是大明咒', 'thị đại thần chú, thị đại minh chú', '시대신주시대명주'),
 ('是無上咒，是無等等咒', 'thị vô thượng chú, thị vô đẳng đẳng chú', '시무상주시무등등주'),
 ('能除一切苦，真實不虛', 'năng trừ nhất thiết khổ, chân thật bất hư', '능제일체고진실불허'),
 ('故說般若波羅蜜多咒', 'cố thuyết Bát Nhã Ba La Mật Đa chú', '고설반야바라밀다주'),
 ('即說咒曰', 'tức thuyết chú viết', '즉설주왈'),
 ('揭諦揭諦，波羅揭諦', 'Yết đế yết đế, ba la yết đế', '아제아제바라아제'),
 ('波羅僧揭諦，菩提薩婆訶', 'ba la tăng yết đế, Bồ đề tát bà ha', '바라승아제모지사바하'),
]
HEART_MEAN = [
 (0, 4, 'Avalokiteśvara, deep in the practice of wisdom, saw that the five aggregates are empty and passed beyond all suffering.',
  '観自在菩薩は深い智慧の行の中で、五つの集まりがすべて空であると見て、あらゆる苦しみを越えられた。'),
 (4, 8, 'Form is not other than emptiness, emptiness not other than form; so too feeling, perception, formation and consciousness.',
  '形あるものは空と異ならず、空は形と異ならない。感受・想い・意志・意識もまた同じである。'),
 (8, 13, 'All things are marked by emptiness: not born, not ending, not stained, not pure, not growing, not shrinking.',
  'すべてのものは空のすがたであり、生じも滅しもせず、汚れも清らかさもなく、増えも減りもしない。'),
 (13, 22, 'In emptiness there are no senses or their objects, no chain of ignorance to old age and death, no path, no wisdom and nothing gained.',
  '空の中には感覚もその対象もなく、無明から老死までの連なりもなく、道も智慧も得るものもない。'),
 (22, 32, 'With nothing to gain, the bodhisattva rests on wisdom, the mind free of obstruction and fear, reaching peace; all Buddhas awaken this way.',
  '得るものがないゆえに、菩薩は智慧に依り、心にさわりも恐れもなく安らぎに至る。三世の仏もこれによって目覚める。'),
 (32, 40, 'So know this wisdom as the great mantra that removes all suffering, true and not false: gate gate pāragate pārasaṃgate bodhi svāhā.',
  'ゆえにこの智慧こそ一切の苦を除く大いなる真言であり、真実で偽りがない。ギャテイ ギャテイ ハラギャテイ ハラソウギャテイ ボジ ソワカ。'),
]

PHOMON = '''世尊妙相具|Thế Tôn diệu tướng cụ
我今重問彼|ngã kim trùng vấn bỉ
佛子何因緣|Phật tử hà nhân duyên
名為觀世音|danh vi Quán Thế Âm
具足妙相尊|Cụ túc diệu tướng tôn
偈答無盡意|kệ đáp Vô Tận Ý
汝聽觀音行|nhữ thính Quán Âm hạnh
善應諸方所|thiện ứng chư phương sở
弘誓深如海|Hoằng thệ thâm như hải
歷劫不思議|lịch kiếp bất tư nghị
侍多千億佛|thị đa thiên ức Phật
發大清淨願|phát đại thanh tịnh nguyện
我為汝略說|Ngã vị nhữ lược thuyết
聞名及見身|văn danh cập kiến thân
心念不空過|tâm niệm bất không quá
能滅諸有苦|năng diệt chư hữu khổ
假使興害意|Giả sử hưng hại ý
推落大火坑|thôi lạc đại hỏa khanh
念彼觀音力|niệm bỉ Quán Âm lực
火坑變成池|hỏa khanh biến thành trì
或漂流巨海|Hoặc phiêu lưu cự hải
龍魚諸鬼難|long ngư chư quỷ nạn
念彼觀音力|niệm bỉ Quán Âm lực
波浪不能沒|ba lãng bất năng một
或在須彌峯|Hoặc tại Tu Di phong
為人所推墮|vị nhân sở thôi đọa
念彼觀音力|niệm bỉ Quán Âm lực
如日虛空住|như nhật hư không trụ
或被惡人逐|Hoặc bị ác nhân trục
墮落金剛山|đọa lạc Kim Cang sơn
念彼觀音力|niệm bỉ Quán Âm lực
不能損一毛|bất năng tổn nhất mao
或值怨賊繞|Hoặc trị oán tặc nhiễu
各執刀加害|các chấp đao gia hại
念彼觀音力|niệm bỉ Quán Âm lực
咸即起慈心|hàm tức khởi từ tâm
或遭王難苦|Hoặc tao vương nạn khổ
臨刑欲壽終|lâm hình dục thọ chung
念彼觀音力|niệm bỉ Quán Âm lực
刀尋段段壞|đao tầm đoạn đoạn hoại
或囚禁枷鎖|Hoặc tù cấm già tỏa
手足被杻械|thủ túc bị nữu giới
念彼觀音力|niệm bỉ Quán Âm lực
釋然得解脫|thích nhiên đắc giải thoát
呪詛諸毒藥|Chú trớ chư độc dược
所欲害身者|sở dục hại thân giả
念彼觀音力|niệm bỉ Quán Âm lực
還著於本人|hoàn trước ư bổn nhân
或遇惡羅剎|Hoặc ngộ ác La Sát
毒龍諸鬼等|độc long chư quỷ đẳng
念彼觀音力|niệm bỉ Quán Âm lực
時悉不敢害|thời tất bất cảm hại
若惡獸圍遶|Nhược ác thú vi nhiễu
利牙爪可怖|lợi nha trảo khả bố
念彼觀音力|niệm bỉ Quán Âm lực
疾走無邊方|tật tẩu vô biên phương
蚖蛇及蝮蠍|Ngoan xà cập phúc yết
氣毒煙火燃|khí độc yên hỏa nhiên
念彼觀音力|niệm bỉ Quán Âm lực
尋聲自迴去|tầm thanh tự hồi khứ
雲雷鼓掣電|Vân lôi cổ xiết điện
降雹澍大雨|giáng bạc chú đại vũ
念彼觀音力|niệm bỉ Quán Âm lực
應時得消散|ứng thời đắc tiêu tán
眾生被困厄|Chúng sanh bị khốn ách
無量苦逼身|vô lượng khổ bức thân
觀音妙智力|Quán Âm diệu trí lực
能救世間苦|năng cứu thế gian khổ
具足神通力|Cụ túc thần thông lực
廣修智方便|quảng tu trí phương tiện
十方諸國土|thập phương chư quốc độ
無剎不現身|vô sát bất hiện thân
種種諸惡趣|Chủng chủng chư ác thú
地獄鬼畜生|địa ngục quỷ súc sanh
生老病死苦|sanh lão bệnh tử khổ
以漸悉令滅|dĩ tiệm tất linh diệt
真觀清淨觀|Chân quán thanh tịnh quán
廣大智慧觀|quảng đại trí huệ quán
悲觀及慈觀|bi quán cập từ quán
常願常瞻仰|thường nguyện thường chiêm ngưỡng
無垢清淨光|Vô cấu thanh tịnh quang
慧日破諸闇|huệ nhật phá chư ám
能伏災風火|năng phục tai phong hỏa
普明照世間|phổ minh chiếu thế gian
悲體戒雷震|Bi thể giới lôi chấn
慈意妙大雲|từ ý diệu đại vân
澍甘露法雨|chú cam lồ pháp vũ
滅除煩惱焰|diệt trừ phiền não diệm
諍訟經官處|Tranh tụng kinh quan xứ
怖畏軍陣中|bố úy quân trận trung
念彼觀音力|niệm bỉ Quán Âm lực
眾怨悉退散|chúng oán tất thối tán
妙音觀世音|Diệu Âm Quán Thế Âm
梵音海潮音|Phạm âm hải triều âm
勝彼世間音|thắng bỉ thế gian âm
是故須常念|thị cố tu thường niệm
念念勿生疑|Niệm niệm vật sanh nghi
觀世音淨聖|Quán Thế Âm tịnh thánh
於苦惱死厄|ư khổ não tử ách
能為作依怙|năng vị tác y hỗ
具一切功德|Cụ nhất thiết công đức
慈眼視眾生|từ nhãn thị chúng sanh
福聚海無量|phước tụ hải vô lượng
是故應頂禮|thị cố ưng đảnh lễ'''
PM_MEAN = [
 ('The World-Honoured One is asked why this bodhisattva is called Guanyin, the one who hears the cries of the world.',
  '世尊は、この菩薩がなぜ観世音、世の声を聞く者と呼ばれるのかと問われる。'),
 ('Her vow is deep as the ocean, made over countless ages; whoever hears her name, sees her or keeps her in mind is freed from suffering.',
  'その誓いは海のように深く、名を聞き、姿を見、心に念じる者は苦しみから救われる。'),
 ('In fire, flood, falling, attack or chains, keeping Guanyin in mind turns danger aside.',
  '火、水、墜落、襲撃、束縛の中でも、観音の力を念じれば危難は退く。'),
 ('Poison, fierce beasts, serpents and storms are calmed by keeping her in mind.',
  '毒、猛獣、蛇、嵐も、観音を念じれば静まる。'),
 ('With wisdom and skilful means she appears in every land, easing birth, ageing, sickness and death.',
  '智慧と方便によりあらゆる国に現れ、生老病死の苦しみを和らげる。'),
 ('Her gaze is pure, wise, compassionate and kind; her light breaks darkness and her rain of teaching cools the flames of affliction.',
  'そのまなざしは清らかで慈悲深く、光は闇を破り、法の雨は煩悩の炎を鎮める。'),
 ('Her voice surpasses all worldly sound, so keep her in mind without doubt and bow to the ocean of her blessings.',
  'その声は世のすべての音にまさる。疑わず念じ続け、福の海に礼拝しよう。'),
]
PM_GROUPS = [(0, 8), (8, 16), (16, 44), (44, 64), (64, 76), (76, 92), (92, 104)]

SAMHOI = [
 ('往昔所造諸惡業', 'Vãng tích sở tạo chư ác nghiệp', None),
 ('皆由無始貪瞋癡', 'giai do vô thỉ tham sân si', None),
 ('從身語意之所生', 'tùng thân ngữ ý chi sở sanh', None),
 ('一切我今皆懺悔', 'nhất thiết ngã kim giai sám hối', None),
 ('南無求懺悔菩薩摩訶薩', 'Nam mô Cầu Sám Hối Bồ Tát Ma Ha Tát', '나무구참회보살마하살'),
]
SH_MEAN = [('All the harm I have done since beginningless time, born of greed, anger and delusion through body, speech and mind, I now acknowledge and repent.',
            '遠い昔から貪り・怒り・愚かさによって身と口と心で作ってきた悪い行いを、今すべて懺悔します。')]
HOIHUONG = [
 ('願以此功德', 'Nguyện dĩ thử công đức', None),
 ('普及於一切', 'phổ cập ư nhất thiết', None),
 ('我等與眾生', 'ngã đẳng dữ chúng sanh', None),
 ('皆共成佛道', 'giai cộng thành Phật đạo', None),
]
HH_MEAN = [('May the merit of this practice reach everyone, so that we and all beings together realise the Way.',
            'この功徳があまねくすべてに及び、私たちと生きとし生けるものが共に仏道を成就しますように。')]

def sutra(id, titles, opening, rows, means, groups=None):
    lines = [opening, opening, opening] + [L(*r) for r in rows]
    off = 3
    g = groups or [(a, b) for a, b, *_ in means] if means and len(means[0]) == 4 else groups
    secs = []
    if means and len(means[0]) == 4:
        for a, b, en, ja in means:
            secs.append({'from': a + off, 'to': b + off, 'en': en, 'ja': ja})
    else:
        for (a, b), (en, ja) in zip(groups, means):
            secs.append({'from': a + off, 'to': b + off, 'en': en, 'ja': ja})
    return {'id': id, 'title': titles, 'lines': lines, 'sections': secs}

pm_rows = [tuple(l.split('|')) + (None,) for l in PHOMON.split('\n')]
data = [
 sutra('heart', {'vi': 'Bát Nhã Tâm Kinh', 'en': 'Heart Sutra', 'zh': '般若波羅蜜多心經', 'zhs': '般若波罗蜜多心经', 'ko': '반야심경', 'ja': '般若心経'},
       OPEN, HEART, HEART_MEAN),
 sutra('pho-mon', {'vi': 'Phổ Môn · cầu an', 'en': 'Universal Gate · for peace', 'zh': '普門品偈 · 祈安', 'zhs': '普门品偈 · 祈安', 'ko': '보문품 게송 · 기원', 'ja': '普門品偈 · 祈り'},
       OPEN_QA, pm_rows, PM_MEAN, PM_GROUPS),
 sutra('sam-hoi', {'vi': 'Kệ Sám hối', 'en': 'Verse of Repentance', 'zh': '懺悔偈', 'zhs': '忏悔偈', 'ko': '참회게', 'ja': '懺悔文'},
       OPEN, SAMHOI, SH_MEAN, [(0, 5)]),
 sutra('hoi-huong', {'vi': 'Hồi hướng', 'en': 'Dedication of Merit', 'zh': '迴向偈', 'zhs': '回向偈', 'ko': '회향게', 'ja': '回向文'},
       OPEN, HOIHUONG, HH_MEAN, [(0, 4)]),
]
out = sys.argv[1]
with open(out, 'w', encoding='utf8') as f:
    f.write('// Sinh tự động bởi tools/build_sutras.py — đừng sửa tay.\n')
    f.write('// Nguồn chữ Hán: CBETA T08n0251 (Tâm Kinh), T09n0262 (Phổ Môn), T10n0293 (kệ Sám hối, theo bản tụng phổ biến), T09n0262 (Hồi hướng).\n')
    f.write('window.SUTRAS = ' + json.dumps(data, ensure_ascii=False) + ';\n')
print('lines', sum(len(s['lines']) for s in data))
