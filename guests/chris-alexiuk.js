// Chris Alexiuk · NVIDIA · "5X Faster Coding? ... Nemotron-3 Ultra" (8UWvF2y78Ms)
// Long light-brown hair slicked straight back from a high forehead into a ponytail, clear rectangular
// glasses, a ginger goatee and moustache, a black polo with the green NVIDIA mark. He makes his points
// with one hand, beating time on them.
ktGuest('chris-alexiuk', function (K) {
  var HH = K.HH;
  // his face: light brows, a moustache running down into a chin goatee, bare cheeks
  var smile = ['SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSbbbSSbbbSS', 'SSSSSSSSSSSS', 'SSSxESSxESSS',
               'SSSEESSEESSS', 'SSSSSssSSSSS', 'SSSttttttSSS', 'SSStmmmmtSSS', 'SSSttttttSSS', 'sSSSttttSSSs'];
  // slicked back: strands run front to back, a little shine on the crown
  var SLICK = { all: 'H', t: ['HhHHhHHhHHhH', 'HhHHhHHhHHhH', 'HhGHhHGhHHhG', 'HhHHhHHhHGhH'],
    f: ['GHGGHGGHGGHG', 'HHHHHHHHHHHH'], l: ['HhHHHH', 'HHhhHH'], r: ['HHHHhH', 'HHhhHH'] };
  var SIDE = { all: 'H', l: ['hhHHHH', 'HHhhHH', 'hhHHhh'], r: ['HHHHhh', 'HHhhHH', 'hhHHhh'] };
  var TAIL = { all: 'H', b: ['hHh', 'HhH', 'hHh', 'HhH'], l: ['hH', 'Hh', 'hH'], r: ['Hh', 'hH', 'Hh'], t: 'h' };
  var BEARD = { all: 't', f: ['ttt', 'ttt', 'ttt'], d: 't' };
  var LENS = { all: '2', f: ['22222', '2...2', '2...2', '2...2', '21112'] };
  return {
    ramps: {
      ghair: ['#5e3d28', '#87603f', '#9a6f4b', '#b0845c', '#c49a72'],     // light-mid brown
      gskin: ['#a05438', '#d09c81', '#e9bea4', '#f4d4c0', '#fbe9dd'],     // sampled #ddac90, lifted like Jesse's
      gtop:  ['#2b2930', '#47434e', '#59555f', '#6e6a75', '#86828d'],     // black polo, lifted
      gpant: ['#353b52', '#525a76', '#636c8a', '#78819f', '#909ab6'],
      gbrd:  ['#6a3a1e', '#9a5f36', '#b07044', '#c38556', '#d39a6c'],     // ginger goatee
      gxa:   ['#5f5c68', '#86838f', '#a3a0ab', '#bcbac4', '#d4d2da'],     // clear frames: thin, light grey
      gxb:   ['#3f6410', '#5f8f12', '#76b900', '#8ccf1f', '#a6e04a']      // the NVIDIA mark
    },
    def: { t: 'gbrd', b: 'ghair-1' },
    faces: { smile: smile, blink: K.swap(smile, 5, 'SSSSSSSSSSSS'),
      talk: K.swap(K.swap(smile, 9, 'SSStmwwmtSSS'), 10, 'SSStmmmmtSSS') },
    head: {
      // the hair runs back over the ear to the nape; temples bare under a high hairline
      r: ['SSHHHHHHHH', 'SSShHHHHHH', 'SSSHhHHHHH', 'SSSSHHhHHH', 'SSSSHHHhHH', 'SSSSSHHHhH',
          'SSSSSSHHHh', 'SSSSSSSHHH', 'SSSSSSSShH', 'SSSSSSSSHh', 'sSSSSSSSsh', 'ssSSSSSsss'],
      b: ['HHHHHHHHHHHH', 'HhHHHhhHHHhH', 'HHhHHhhHHhHH', 'HHHhHhhHhHHH', 'HHHHhhhhHHHH', 'HHHHHhhHHHHH',
          'HHHHHhhHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'sHHHHHHHHHHs', 'ssHHHHHHHHss', 'ssssssssssss'],
      t: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH',
          'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'SSHHHHHHHHSS', 'SSSSSSSSSSSS']      // a high, even hairline
    },
    phonesY: HH + 0.7,
    hair: [
      [-6.2, HH - 1.2, -4.8, 6.2, HH + 0.6, 3.8, SLICK, 'hair'],         // flat, combed straight back
      [-6.4, 6.4, -4.8, -5.9, HH - 0.3, 2.4, SIDE, 'hair'],             // over the ears, back
      [5.9, 6.4, -4.8, 6.4, HH - 0.3, 2.4, SIDE, 'hair'],
      [-6.2, 3.0, -5.1, 6.2, HH - 0.3, -4.5, { all: 'H', b: ['HhHHhHHhHHhH', 'HHhHHhhHHhHH', 'HHHhHhhHhHHH'] }, 'hair'],
      [-1.1, 4.6, -6.0, 1.1, 6.6, -5.0, 'h', 'tie'],                   // gathered at the back...
      [-0.9, 0.2, -5.9, 0.9, 4.8, -4.9, TAIL, 'tail'],                 // ...and hanging down the back
      [-0.8, -4.2, -4.9, 0.8, 0.4, -3.7, TAIL, 'tail2'],
      [-1.9, -1.0, 3.8, 1.9, 0.4, 6.2, BEARD, 'beard']                 // the goatee runs on below the chin
    ],
    glasses: [                                                        // thin clear rectangular frames
      [-5.1, 4.5, 6.0, -0.4, 8.5, 6.5, LENS, 'glasses'],
      [0.4, 4.5, 6.0, 5.1, 8.5, 6.5, LENS, 'glasses'],
      [-0.4, 7.3, 6.0, 0.4, 7.9, 6.5, '1', 'glasses'],
      [-6.5, 7.5, 0.6, -6.0, 8.1, 6.3, '1', 'glasses'],
      [6.0, 7.5, 0.6, 6.5, 8.1, 6.3, '1', 'glasses']
    ],
    torsoW: 6.4,
    // polo: open top button, placket, the green mark and its lettering on his left chest
    torso: { all: 'O', t: 'o', f: ['OOOOOSSOOOOO', 'OOOOOkkOOOOO', 'OOOOOkkOO33O', 'OOOOOOOOOKKO', 'OOOOOOOOOOOO',
      'OOOOOOOOOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO'] },
    hem: 'o',
    arm: { all: ['OOOO', 'OOOO', 'OOOO', 'OOOO', 'kkkk', 'SSSS', 'SSSS', 'SSSS', 'SSSS', 'SSSS'], t: 'o', d: 'S' },
    body: [                                                           // the polo collar
      [-4.0, 19.9, 1.8, -0.7, 22.1, 3.6, { all: 'O', f: ['nO', 'Ok'], t: 'n' }, 'collarL'],
      [0.7, 19.9, 1.8, 4.0, 22.1, 3.6, { all: 'O', f: ['On', 'kO'], t: 'n' }, 'collarR'],
      [-3.6, 20.8, -3.5, 3.6, 22.5, -2.0, { all: 'O', t: 'n' }, 'collarB']
    ],
    gesture: function (p, tp) {                                       // one hand forward, beating out his points
      var w = Math.sin(tp * 3.0);
      p.aA = [-1.2 + 0.16 * w, 0, -0.22];
      p.aB = [-0.88, 0, 0.14];
    }
  };
});
