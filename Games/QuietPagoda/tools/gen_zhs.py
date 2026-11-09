# Sinh khối zhs (Trung giản thể) trong Web/i18n.js từ khối zh (phồn thể) bằng OpenCC.
import re, sys
from opencc import OpenCC
p = sys.argv[1]; s = open(p, encoding='utf8').read()
s = re.sub(r'\n    /\*ZHS\*/.*?/\*END\*/', '', s, flags=re.S)
a = s.index('\n    zh: {'); b = s.index('\n    },', a) + len('\n    },')
blk = s[a:b]
conv = OpenCC('t2tw' if False else 't2s').convert(blk).replace('\n    zh: {', '\n    /*ZHS*/zhs: {', 1)
conv = conv.replace('手记', '手账').replace('海青三色', '海青三色').rstrip(',') + ',/*END*/'
s = s[:b] + conv + s[b:]
open(p, 'w', encoding='utf8').write(s)
