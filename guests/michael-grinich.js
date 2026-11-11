// Michael Grinich · WorkOS · "How to Engineer Real Product Market Fit" (uB8F7Ol7QGo)
// Short dark-brown hair, tousled and swept up on top, short at the sides, receding at the temples;
// clean-shaven with ruddy cheeks; an oversized cream tee with an orange/lilac/black geometric print.
// He reaches out to the side with one open hand as he makes a point.
ktGuest('michael-grinich', function (K) {
  var HH = K.HH;
  // his face: straight dark brows, a warm open smile, a little colour in the cheeks
  var smile = ['SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSbbbSSbbbSS', 'SSSSSSSSSSSS', 'SSSxESSxESSS',
               'SSSEESSEESSS', 'S99SSssSS99S', 'SSSSSssSSSSS', 'SSSmwwwwmSSS', 'sSSSmmmmSSSs', 'ssSSSSSSSSss'];
  var TOP = { all: 'H', t: ['HhHHhHHhHHhH', 'HHhHHHhHHHhH', 'hHHHhHHhHHHh'], f: ['GHGHHGHGHHGH', 'HhHHhHHhHHhH'] };
  var TUFT = { all: 'H', t: ['HhGH', 'GHhH', 'HGHh'], f: ['GHGH', 'HhHH'], l: ['HhH', 'hHh'], r: ['HHh', 'hHH'] };
  var SIDE = { all: 'h', l: ['hhhhhH', 'hhhhhh'], r: ['Hhhhhh', 'hhhhhh'] };
  // crew neck, then the print from mid-chest: an orange square and a lilac tab over black shapes and stripes
  var torso = ['OOOOkSSkOOOO', 'OOOOOkkOOOOO', 'OOOOOOOOOOOO', 'OO11O55O33OO', 'OO11k55k34OO',
               'OOk55kk55kOO', 'OO7k5kk5kOOO', 'OO5O55O5O5OO', 'OOOOOOOOOOOO'];
  return {
    ramps: {
      ghair: ['#3b2b27', '#5a423a', '#6b5046', '#7f6155', '#967566'],     // dark brown, lifted
      gskin: ['#6a3f38', '#b47d72', '#d69c90', '#e5b2a6', '#f0c7bc'],     // forehead sample #ce958e, lifted like Jesse's (the cheek sample read too pink)
      gtop:  ['#9b8f8a', '#c6b9b2', '#d8ccc5', '#e7ddd7', '#f2ebe6'],     // cream tee
      gpant: ['#363846', '#525565', '#646777', '#7a7d8c', '#9295a3'],
      gxa:   ['#8a3f1e', '#bb5a2c', '#d06a36', '#e0814c', '#eb9a68'],     // print: orange square
      gxb:   ['#6f5a96', '#9682c0', '#ab97d6', '#bfaee4', '#d2c5ee'],     // print: lilac tab
      gxc:   ['#2e2a36', '#4b4459', '#5d556d', '#726a83', '#8a829b'],     // print: black shapes
      gxd:   ['#2f5a86', '#4a7bb0', '#5b8dc2', '#73a2d2', '#8fb8e0'],     // print: blue quarter-circle
      gxe:   ['#6a3a36', '#b06e68', '#d48a82', '#e29f97', '#edb3ab']      // a hint of colour in the cheeks
    },
    def: { b: 'ghair-1' },
    faces: { smile: smile, blink: K.swap(smile, 5, 'SSSSSSSSSSSS'),
      talk: K.swap(K.swap(K.swap(smile, 8, 'SSSSSssSSSSS'), 9, 'SSSSmwwmSSSS'), 10, 'sSSSmmmmSSSs') },
    head: {
      // short dark sides, the temples bare where the hairline recedes
      r: ['SSShHHHHHH', 'SSShhHHHHH', 'SSShhhhhhh', 'SSShhhhhhh', 'SSSShhhhhh', 'SSSSShhhhh',
          'SSSSSShhhh', 'SSSSSSShhh', 'SSSSSSSShh', 'SSSSSSSSSh', 'sSSSSSSSss', 'ssSSSSSsss'],
      b: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'hhhhhhhhhhhh', 'hhhhhhhhhhhh', 'hhhhhhhhhhhh', 'hhhhhhhhhhhh',
          'hhhhhhhhhhhh', 'hhhhhhhhhhhh', 'shhhhhhhhhhs', 'sshhhhhhhhss', 'ssshhhhhhsss', 'ssssssssssss'],
      t: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH',
          'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'SHHHHHHHHHHS', 'SSHHHHHHHHSS']      // receding at the temples
    },
    phonesY: HH + 2.5,
    hair: [
      [-6.2, HH - 1.0, -4.8, 6.2, HH + 0.9, 1.6, TOP, 'hair'],          // the crown
      [-4.4, HH - 0.6, 1.2, 4.2, HH + 1.3, 5.4, TOP, 'hair'],           // the top, set back from bare temples
      [-3.9, HH + 0.8, -1.4, 0.4, HH + 2.4, 3.6, TUFT, 'c1'],           // tousled, swept up
      [0.1, HH + 0.7, -2.6, 4.3, HH + 2.1, 2.4, TUFT, 'c2'],
      [-3.6, HH + 0.4, 3.2, 0.2, HH + 2.0, 5.9, TUFT, 'c3'],           // the front lifts toward his right
      [0.0, HH + 0.4, 2.0, 3.2, HH + 1.6, 5.2, TUFT, 'c4'],
      [-6.35, 7.6, -4.8, -5.9, HH - 0.2, 1.2, SIDE, 'hair'],            // short sides
      [5.9, 7.6, -4.8, 6.35, HH - 0.2, 1.2, SIDE, 'hair']
    ],
    torsoW: 6.4,                                                      // an oversized tee
    torso: { all: 'O', t: 'o', f: torso },
    hem: 'o',
    arm: { all: ['OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'kkkk', 'SSSS', 'SSSS', 'SSSS', 'SSSS'], t: 'o', d: 'S' },
    gesture: function (p, tp) {                                       // an open hand out to the side
      var w = Math.sin(tp * 2.1);
      p.aB = [-0.95 - 0.15 * w, 0, 0.7 + 0.15 * w];
      p.aA = [-0.85, 0, -0.12];
    }
  };
});
