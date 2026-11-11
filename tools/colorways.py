# Regenerates the 1.5x colourways (bh-ink, bh-midnight, bh-signal, bh-ringer) from variants/big-hoodie.js
#   python3 tools/colorways.py
import re, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'variants'))
base=open('big-hoodie.js').read()
def ramp(s,name,vals):
    pat=re.compile(r"(    %s:\s+)\[[^\]]*\]" % name)
    assert len(pat.findall(s))==1, name
    return pat.sub(lambda m: m.group(1)+"["+", ".join("'%s'"%v for v in vals)+"]", s)
def rep(s,a,b):
    assert s.count(a)==1, a[:60]; return s.replace(a,b)
V={}
s=ramp(base,'hood',['#6e6878','#9d97a9','#c4bfcd','#dcd8e3','#ece9f1'])
s=ramp(s,'jean',['#3f3a4a','#5f5870','#746c86','#8a829b','#a29ab3'])
V['bh-ink']=rep(s,"    D: '#f6f4f9', L: '#ff570a'","    D: '#3b3645', L: '#ff570a'")
s=ramp(base,'hood',['#2e2a36','#4b4459','#5d556d','#726a83','#8a829b'])
V['bh-midnight']=ramp(s,'jean',['#262d3f','#3e4a63','#4f5d78','#64738f','#7d8ca8'])
s=ramp(base,'hood',['#7a2f0c','#c44c12','#e5641f','#f47d3a','#fb9a5e'])
s=ramp(s,'jean',['#3f3a4a','#5f5870','#746c86','#8a829b','#a29ab3'])
V['bh-signal']=rep(s,"    D: '#f6f4f9', L: '#ff570a'","    D: '#f6f4f9', L: '#f6f4f9'")
s=ramp(base,'hood',['#3d3846','#5c5569','#6f6880','#857d96','#9d95ae'])
s=ramp(s,'jean',['#77727c','#9a95a0','#b0abb6','#c6c2cc','#dcd9e2'])
s=rep(s,"""    f: ['OOOOOOOOOOOO', 'OOOODOODOOOO', 'OOOODOODOOOO', 'OOOODOODOOOO', 'OOOOLOOLOOOO',
        'OOooooooooOO', 'OoOOOOOOOOoO', 'OoOOOOOOOOoO', 'OOOOOOOOOOOO'],""",
"""    f: ['OOODDDDDDOOO', 'OOOODDDDOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO',
        'OOOOOOOOOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO'],""")
s=rep(s,"  var ARM = { all: ['OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'oooo',","  var ARM = { all: ['OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'DDDD',")
s=rep(s,"    if (!p.guest) box(up, -5.2, 20.2, -5.8, 5.2, 23.6, -1.6, HOOD);","    if (false) box(up, -5.2, 20.2, -5.8, 5.2, 23.6, -1.6, HOOD);")
V['bh-ringer']=rep(s,"    box(up, -6.5, 10, -3.5, 6.5, 11.6, 3.5, 'o');            // ribbed hem, a touch wider than the body","    box(up, -6.5, 10, -3.5, 6.5, 11.6, 3.5, 'D');            // white-ink ringer hem")
for k,v in V.items(): open(k+'.js','w').write(v); print('wrote',k)
