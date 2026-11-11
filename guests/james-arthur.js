// James Arthur · ElectricSQL · "Why Fetch When You Can Sync?" (LBfHnVn4tus)
// Short thinning sandy-grey hair receding at the temples, thin dark rectangular glasses,
// an olive overshirt worn open over a white tee with a green print; he explains with one open hand.
ktGuest('james-arthur', function (K) {
  var HH = K.HH;
  // his face: high forehead, light straight brows, a narrow chin, a small closed smile
  var smile = ['SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSbbbSSbbbSS', 'SSSSSSSSSSSS', 'SSSxESSxESSS',
               'SSSEESSEESSS', 'SSSSSssSSSSS', 'sSSSSssSSSSs', 'sSSmSSSSmSSs', 'ssSSmmmmSSss', 'ssSSSSSSSSss'];
  // thinning on top: the scalp shows between sparse strands toward the front
  var CAP = { all: 'H', t: ['HhHHhHHhHHhH', 'HHhHHHhHHhHH', 'HhHHhHHhHHhH', 'HHsHHhHsHHHH', 'hsHHsHHsHHsh'],
    f: ['hHhHHhHHhHhh'], l: ['HHHhHH', 'HhHHHH'], r: ['HHhHHH', 'HHHHhH'] };
  var TUFT = { all: 'H', t: ['HsHhH', 'sHhHs'], f: ['hHsHh'] };
  // the tee: white with a leafy green print from mid-chest down, between the open panels
  var torso = ['OOOO6556OOOO', 'OOOO5555OOOO', 'OkkO5555OkkO', 'OOOO5555OOOO', 'OOOO5335OOOO',
               'OOOO3343OOOO', 'OOOO4335OOOO', 'OOOO3453OOOO', 'OOOO5335OOOO'];
  var LENS = { all: '1', f: ['11111', '1...1', '1...1', '1...1', '11111'] };
  return {
    ramps: {
      ghair: ['#5a4434', '#8a6c56', '#9d7f66', '#b0937a', '#c0a68e'],     // sandy light brown going grey
      gskin: ['#573632', '#a06e62', '#c68978', '#d99e8c', '#e7b4a2'],     // sampled #b37a6b, lifted like Jesse's
      gtop:  ['#3c3d2b', '#5a5c40', '#6b6d4c', '#80835c', '#979a70'],     // olive overshirt
      gpant: ['#353b52', '#525a76', '#636c8a', '#78819f', '#909ab6'],
      gxa:   ['#2c2a30', '#4a4750', '#5b5862', '#6f6c77', '#86838e'],     // dark glasses frames
      gxb:   ['#2f6a2a', '#3f8a35', '#4fa040', '#66b654', '#82c96c'],     // the green print
      gxc:   ['#9a98a0', '#c8c6cc', '#e2e0e5', '#efedf1', '#f8f7fa']      // white tee
    },
    def: { b: 'ghair-1' },
    faces: { smile: smile, blink: K.swap(smile, 5, 'SSSSSSSSSSSS'),
      talk: K.swap(K.swap(smile, 9, 'sSSSmmmmSSSs'), 10, 'ssSSmwwmSSss') },
    head: {
      // short sides: bare temples in front, hair above and behind the ear
      r: ['SSHHHHHHHH', 'SSHHHHHHHH', 'SSSHHHHHHH', 'SSSHHHHHHH', 'SSSShHHHHH', 'SSSSShhHHH',
          'SSSSSShhHH', 'SSSSSSShhH', 'SSSSSSSShh', 'SSSSSSSSSh', 'sSSSSSSSss', 'ssSSSSSsss'],
      b: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH',
          'HHHHHHHHHHHH', 'hHHHHHHHHHHh', 'hhHHHHHHHHhh', 'shhhhhhhhhhs', 'sshhhhhhhhss', 'ssssssssssss'],
      t: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH',
          'HHHHHHHHHHHH', 'SSSHSHHSHSSS', 'SSSSHSSHSSSS', 'SSSSSSSSSSSS']
    },
    phonesY: HH + 0.6,
    hair: [
      [-6.2, HH - 0.6, -4.8, 6.2, HH + 0.5, 2.8, CAP, 'hair'],          // a close crop, thin on top
      [-1.8, HH - 0.3, 2.6, 1.6, HH + 0.45, 4.4, TUFT, 'tuft'],         // what's left of the front
      [-6.35, 6.6, -4.8, -5.9, HH - 0.4, 2.2, { all: 'H', l: ['HHHHhH', 'HhHHHh', 'hHhHhh'] }, 'hair'],             // short fullness above the ears
      [5.9, 6.6, -4.8, 6.35, HH - 0.4, 2.2, { all: 'H', r: ['HhHHHH', 'hHHHhH', 'hhHhHh'] }, 'hair'],
      [-6.2, 3.2, -4.85, 6.2, HH - 0.4, -4.5, { all: 'H', b: ['HhHHhHHhHHhH', 'HHHhHHHHhHHH', 'hHHHHhHHHHHh'] }, 'hair']
    ],
    glasses: [                                                        // thin dark rectangular full rims
      [-5.1, 4.5, 6.0, -0.4, 8.5, 6.6, LENS, 'glasses'],
      [0.4, 4.5, 6.0, 5.1, 8.5, 6.6, LENS, 'glasses'],
      [-0.4, 7.2, 6.0, 0.4, 7.9, 6.6, '1', 'glasses'],
      [-6.6, 7.4, 0.6, -6.0, 8.1, 6.3, '2', 'glasses'],
      [6.0, 7.4, 0.6, 6.6, 8.1, 6.3, '2', 'glasses']
    ],
    torsoW: 5.8,
    torso: { all: 'O', t: 'k', f: torso },
    hem: { all: 'o', f: ['oooo5555oooo'] },
    arm: { all: ['OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'kkkk', 'SSSS', 'SSSS'], t: 'k', d: 'S' },
    body: [                                                           // the overshirt's collar, spread open
      [-4.4, 19.8, 1.6, -1.4, 22.0, 3.7, { all: 'O', f: ['nOO', 'OOk'], t: 'n' }, 'collarL'],
      [1.4, 19.8, 1.6, 4.4, 22.0, 3.7, { all: 'O', f: ['OOn', 'kOO'], t: 'n' }, 'collarR'],
      [-3.4, 20.8, -3.4, 3.4, 22.2, -2.0, 'O', 'collarB']
    ],
    gesture: function (p, tp) {                                       // one open hand sweeps out as he explains
      var w = Math.sin(tp * 2.4);
      p.aA = [-1.05 + 0.22 * w, 0, -0.5 - 0.2 * w];
      p.aB = [-0.85, 0, 0.12];
    }
  };
});
