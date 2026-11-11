// Bill Easton · FastMCP · "Future of MCP" (lBjB-f_I-bs)
// Short dark-brown hair swept back and over to his left, a big dark moustache with light stubble,
// a navy zip hoodie (hood down) over a black polo, sleeves pushed up; he talks with one open hand.
ktGuest('bill-easton', function (K) {
  var HH = K.HH;
  // his face: high forehead, straight dark brows, a long nose, the moustache across the whole upper lip
  var smile = ['SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSbbbSSbbbSS', 'SSSSSSSSSSSS', 'SSSxESSxESSS',
               'SSSEESSEESSS', 'SSSSSssSSSSS', 'SSbbbbbbbbSS', 'tSbSmwwmSbSt', 'ttSSmmmmSStt', 'stttttttttts'];
  var HAIR = { all: 'H', t: K.STRANDS, f: ['GHGGHGGHGGHG', 'HhHHhHHhHHhH'] };
  var SWEEP = { all: 'H', t: ['HhHHhHHhHHhH', 'HHhHHhHHhHHh', 'GHHGHHGHHGHH'], f: ['GGHGGHGGHGGH', 'HhHHhHHhHHhH'] };
  // navy zip hoodie: the black polo at the neck, black drawstrings, a white wordmark on his left chest
  var HOODIE = ['OOOO1111OOOO', 'OO2OO11OO2OO', 'OO2OOOkOO2OO', 'OO2OOOkww2OO', 'OO2OOOkOO2OO',
                'OOOOOOkOOOOO', 'OOOOOOkOOOOO', 'OkkOOOkOOkkO', 'OOOOOOkOOOOO'];
  return {
    ramps: {
      ghair: ['#2e211e', '#55403a', '#6a5048', '#76594f', '#836559'],
      gskin: ['#7c4438', '#c98271', '#e6a290', '#f0b6a5', '#f6c9bb'],
      gtop:  ['#262b4a', '#3a4470', '#48538a', '#5a669e', '#6e7ab2'],     // navy, lifted
      gpant: ['#272c3c', '#454d66', '#56607c', '#6a7490', '#808aa6'],
      gbrd:  ['#3d2a24', '#5e4136', '#704d40', '#84604f', '#987362'],     // moustache and brows
      gxa:   ['#1c1a22', '#45414e', '#55515f', '#66626f', '#7a7683'],     // the black polo, lifted
      gxd:   ['#7a4a40', '#b8806f', '#d0907f', '#dca290', '#e6b3a3']      // light stubble
    },
    def: { b: 'gbrd', t: 'gxd' },
    faces: { smile: smile, blink: K.swap(smile, 5, 'SSSSSSSSSSSS'),
      talk: K.swap(K.swap(smile, 9, 'tSbmmwwmmbSt'), 10, 'ttSmmmmmmStt') },
    head: {
      r: ['HHHHHHHHHH', 'HHHHHHHHHH', 'SHHHHHHHHH', 'SSHHHHHHHH', 'SSSHHHHHHH', 'SSShHHHHHH',
          'SSShhSSHHH', 'SSSShSSHHH', 'SSSSSSShhh', 'tSSSSSSShh', 'ttSSSSSSSs', 'tttSSSSsss'],
      b: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH',
          'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'hHHHHHHHHHHh', 'shhhhhhhhhhs', 'sshhhhhhhhss', 'ssssssssssss'],
      t: 'H'
    },
    phonesY: HH + 1.7,
    hair: [
      [-6.2, HH - 0.6, -4.7, 6.2, HH + 0.6, 5.0, HAIR, 'hair'],
      [-4.2, HH - 0.7, 1.6, 4.0, HH + 1.3, 6.3, SWEEP, 'c1'],          // the front, lifted and swept back; temples bare
      [-3.0, HH + 0.4, -2.8, 5.6, HH + 1.7, 4.6, SWEEP, 'c2'],          // the top, combed over to his left
      [5.6, HH - 1.4, -3.0, 6.6, HH + 1.0, 4.2, HAIR, 'c3'],            // where it falls on his left side
      [-6.5, HH - 1.6, -4.0, -5.8, HH + 0.4, 3.0, HAIR, 'hair'],        // shorter on his right
      [-6.4, 4.0, -5.0, 6.4, HH + 0.4, -4.3, HAIR, 'hair']
    ],
    torsoW: 5.8,
    torso: { all: 'O', t: 'k', f: HOODIE },
    hem: 'o',
    arm: { all: ['OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'kkkk', 'SSSS', 'SSSS', 'SSSS', 'SSSS'], t: 'k', d: 'S' },   // sleeves pushed up
    body: [
      [-5.0, 19.8, -5.4, 5.0, 22.8, -1.8, { all: 'O', f: 'k', t: 'o', d: 'o' }, 'hood']    // the hood, down behind his neck
    ],
    gesture: function (p, tp) {                                       // his right hand opens out toward the host
      p.aA = [-1.05 + 0.15 * Math.sin(tp * 2.2), 0, -0.55 - 0.25 * Math.sin(tp * 2.2)];
      p.aB = [-0.9, 0, 0.1];
    }
  };
});
