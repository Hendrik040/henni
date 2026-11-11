// Jesse Vincent · Superpowers · "Fixing AI Slop" (aB2dVA-Y7CQ)
// Thick yellow acetate glasses, shaggy ear-length waves going grey at the temples, a navy/white gingham shirt;
// he talks with both hands.
ktGuest('jesse-vincent', function (K) {
  var HH = K.HH;
  // his face: straight heavy brows, a long nose, a wide toothy grin, light stubble on a narrower chin
  var smile = ['hhSSSSSSSShh', 'hSSSSSSSSSSh', 'SSSSSSSSSSSS', 'SbbbbSSbbbbS', 'SSSSSSSSSSSS', 'SSSxESSxESSS',
               'SSSEESSEESSS', 'sSSSSssSSSSs', 'sSmSSssSSmSs', 'tSmwwwwwwmSt', 'ttSmmmmmmStt', 'stttttttttts'];
  var SHAG = { all: 'H', t: ['HGhHGHhGHHhG', 'hHGHhHHGhHGH', 'GHhHHGhHGhHH'],
    f: ['GhHGhHGhH7hG', 'HhHHhH7HhHHh', 'hHHhHHhHHhHh'], l: ['H7hH', '7HhH', 'HhH7'], r: ['Hh7H', 'HH7h', '7HhH'] };
  var LOCK = { all: 'H', f: ['GhG', 'HhH', 'hHh'], t: 'G' };
  // gingham in 2x2 checks: navy (3) where the stripes cross, white (5) where none, the mix (O) between; a placket
  var torso = [];
  for (var r = 0; r < 9; r++) {
    var row = '', a = (r >> 1) % 2 === 0;
    for (var c = 0; c < 12; c++) row += c === 6 ? (r % 3 === 2 ? 'w' : 'k') : a ? ((c >> 1) % 2 === 0 ? '3' : 'O') : ((c >> 1) % 2 === 0 ? 'O' : '5');
    torso.push(r === 0 ? row.slice(0, 5) + 'SS' + row.slice(7) : row);
  }
  var LENS = { all: '1', f: ['11111', '1...1', '1...1', '21112'] };
  return {
    ramps: {
      ghair: ['#3a2a24', '#5e463b', '#73574a', '#8a6b5b', '#a3826f'],
      gskin: ['#6e3d2c', '#b97a5a', '#d99a76', '#e8b08e', '#f2c6a8'],
      gtop:  ['#4a5070', '#6a7192', '#8b93b3', '#a6adc9', '#c0c6dc'],
      gpant: ['#2e3550', '#46507a', '#5a6694', '#7280ab', '#8f9cc2'],
      gbrd:  ['#6e4a3a', '#9c7560', '#b58c74', '#c7a089', '#d6b39e'],
      gxa:   ['#8a6a1c', '#c9a136', '#e9c453', '#f2d77a', '#f8e8a8'],     // the yellow glasses
      gxb:   ['#1f2a4a', '#33416b', '#45558a', '#5a6ca3', '#7486bb'],     // gingham navy
      gxc:   ['#9a98a8', '#c4c2d0', '#e0dee8', '#eeedf3', '#f8f7fb'],     // gingham white
      gxd:   ['#5a534f', '#7d7570', '#9a928c', '#b5aea8', '#cdc7c1']      // grey at the temples
    },
    def: { t: 'gbrd', b: 'ghair', h: 'ghair' },
    faces: { smile: smile, blink: K.swap(smile, 5, 'SSSSSSSSSSSS'),
      talk: K.swap(K.swap(K.swap(smile, 8, 'sSSSSssSSSSs'), 9, 'tSSmmwwmmSSt'), 10, 'ttSSmmmmSStt') },
    head: {
      r: ['HHHHHHHHHH', 'HHHHHHHHHH', '7HHHHHHHHH', '77HHHHHHHH', 'S7HHHHHHHH', 'SS7HHHHHHH', 'SSSHHHHHHH', 'SSSSHHHHHH',
          'SSSSSFFFFF', 'tSSSSSSFFF', 'ttSSSSSSSs', 'tttSSSSsss'],
      b: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH',
          'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'FFFFFFFFFFFF', 'sFFFFFFFFFFs', 'ssFFFFFFFFss', 'ssssssssssss'],
      t: 'H'
    },
    phonesY: HH + 3.4,
    hair: [
      [-6.5, HH - 1.4, -5.1, 6.5, HH + 0.9, 6.2, SHAG, 'hair'],
      [-6.2, HH + 0.7, -4.4, -1.6, HH + 2.3, 4.4, SHAG, 'c1'],
      [-2.2, HH + 0.7, -3.8, 2.4, HH + 3.1, 5.4, SHAG, 'c2'],
      [2.0, HH + 0.7, -4.6, 6.2, HH + 2.0, 3.8, SHAG, 'c3'],
      [-4.4, HH + 2.1, -1.2, -0.8, HH + 3.0, 3.4, SHAG, 'c4'],
      [-7.1, 6.0, -5.0, -5.8, HH + 0.6, 4.9, SHAG, 'hair'],          // over the ears...
      [-7.9, 4.8, -3.8, -6.5, 6.6, 2.2, SHAG, 'f1'],                  // ...flicking out at the ends
      [5.8, 6.4, -5.0, 7.0, HH + 0.6, 4.7, SHAG, 'hair'],
      [6.5, 5.2, -2.4, 7.7, 6.8, 3.0, SHAG, 'f2'],
      [-6.6, 3.4, -5.7, 6.6, HH + 0.4, -4.0, SHAG, 'hair'],
      [-4.2, 2.2, -6.0, 3.6, 3.8, -4.8, SHAG, 'f3'],
      [-6.3, HH - 2.7, 5.6, -3.1, HH - 0.3, 6.9, LOCK, 'l1'],         // four uneven locks of fringe
      [-3.3, HH - 1.7, 5.7, 0.9, HH - 0.2, 7.0, LOCK, 'l2'],
      [1.1, HH - 3.0, 5.6, 4.3, HH - 0.3, 6.9, LOCK, 'l3'],
      [4.1, HH - 1.9, 5.5, 6.4, HH - 0.2, 6.8, LOCK, 'l4']
    ],
    glasses: [                                                        // chunky acetate: heavier top rim, darker lower corners
      [-4.9, 4.6, 6.0, -0.3, 8.4, 6.8, LENS, 'glasses'],
      [0.3, 4.6, 6.0, 4.9, 8.4, 6.8, LENS, 'glasses'],
      [-0.4, 7.0, 6.0, 0.4, 7.9, 6.8, '1', 'glasses'],
      [-6.7, 7.2, 0.4, -6.0, 8.0, 6.4, '2', 'glasses'],
      [6.0, 7.2, 0.4, 6.7, 8.0, 6.4, '2', 'glasses']
    ],
    torsoW: 5.6,                                                      // a fitted shirt, not a hoodie
    torso: { all: 'O', t: 'k', f: torso },
    arm: { all: ['3O3O', 'O5O5', '3O3O', 'O5O5', '3O3O', 'O5O5', '3O3O', 'kkkk', 'SSSS', 'SSSS'], t: 'k', d: 'S' },
    body: [
      [-4.0, 20.2, 2.0, -0.7, 22.0, 3.7, { all: 'O', f: ['O5O5', '5O5O'] }, 'collarL'],
      [0.7, 20.2, 2.0, 4.0, 22.0, 3.7, { all: 'O', f: ['5O5O', 'O5O5'] }, 'collarR']
    ],
    gesture: function (p, tp) {                                       // both hands go when it's his turn
      p.aA = [-0.95 + 0.3 * Math.sin(tp * 2.7), 0, -0.6];
      p.aB = [-0.75 - 0.3 * Math.sin(tp * 2.7), 0, 0.55];
    }
  };
});
