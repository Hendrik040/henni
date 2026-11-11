// Kunal Kushwaha · Cast AI · "Why Open Source is Killing Proprietary AI" (_14E-EwcXtE)
// A charcoal cap with a brim, round black glasses with amber lenses, a full dark beard,
// a navy snap jacket over a grey tee and a light-blue conference lanyard; he talks with both hands.
ktGuest('kunal-kushwaha', function (K) {
  var HH = K.HH;
  // his face: thick dark brows, amber tint inside the lenses around the eyes, a full trimmed beard and moustache
  var smile = ['SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SbbbbSSbbbbS', 'SS55SSSS55SS', 'SSSxESSxESSS',
               'SS5EE55EE5SS', 'tSSSSssSSSSt', 'ttSttttttStt', 'tttmwwwwmttt', 'ttttmmmmtttt', 'stttttttttts'];
  var CAP = { all: '1', t: ['111111111111', '211111111112', '111111111111'], f: ['111111111111', '121111111121', '111111111111'] };
  var BRIM = { all: '1', f: '2', d: '2', t: ['111111111111', '111111111111', '111111111111'] };
  var LENS = { all: '3', f: ['.333.', '3...3', '3...3', '3...3', '.333.'] };
  // the open jacket over the grey tee; the lanyard comes down from his neck in a V to the badge, a snap on the left
  var torso = ['OOO9kSSk9OOO', 'OOO977779OOO', 'OOOk9779kOOO', 'OOOk9779kKOO', 'OOOk7997kOOO',
               'OOOk7ww7kOOO', 'OOOk7777kOOO', 'OOOk7777kOOO', 'OOOk7777kOOO'];
  return {
    ramps: {
      ghair: ['#262120', '#48403d', '#5b524e', '#645a55', '#6e635d'],     // near-black hair at the sides, lifted
      gskin: ['#653a2a', '#9e6a51', '#b98469', '#c99a7f', '#d8ae95'],     // from #a47459, lifted
      gbrd:  ['#33251f', '#57413a', '#6a4f45', '#765a4f', '#82655a'],     // the beard, from #694939
      gtop:  ['#232838', '#3c4560', '#4b5575', '#525d7e', '#5a6587'],     // navy jacket, lifted; lit steps held low
      gpant: ['#2c2a30', '#47444d', '#58545f', '#6a6672', '#7e7a87'],
      gxa:   ['#29282b', '#47454b', '#58565c', '#5f5d64', '#67656c'],     // charcoal cap (#272523), lifted; lit steps held low
      gxb:   ['#211d22', '#463f47', '#575059', '#615a63', '#6c656e'],     // black frames, lifted
      gxc:   ['#5a3412', '#86501c', '#a4682a', '#b97c38', '#cc904a'],     // amber lenses
      gxd:   ['#4a4643', '#6c6662', '#807a75', '#938d87', '#a59f99'],     // grey tee
      gxe:   ['#4f7898', '#79a6c8', '#94bede', '#acd0ea', '#c4e0f4']      // light-blue lanyard
    },
    def: { t: 'gbrd', b: 'ghair' },
    faces: { smile: smile, blink: K.swap(smile, 5, 'SSSSSSSSSSSS'),
      talk: K.swap(K.swap(smile, 9, 'tttmmmmmmttt'), 10, 'ttttmwwmtttt') },
    head: {   // under the cap: dark hair over the ear running into the beard along the jaw
      r: ['HHHHHHHHHH', 'HHHHHHHHHH', 'SHHHHHHHHH', 'SSHHHHHHHH', 'SSSHHHHHHH', 'SSSHHHHHHH', 'SSStHHHHHH',
          'SttttHHHHH', 'ttttttHHhh', 'tttttthhss', 'ttttttssss', 'tttttsssss'],
      b: ['HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH', 'HHHHHHHHHHHH',
          'HHHHHHHHHHHH', 'hHHHHHHHHHHh', 'hhhhhhhhhhhh', 'shhhhhhhhhhs', 'ssssssssssss', 'ssssssssssss'],
      t: 'H'
    },
    phonesY: HH + 1.4,                                                // the band sits on the cap
    hair: [
      [-6.5, HH - 2.2, -4.9, 6.5, HH + 0.7, 6.4, CAP, 'cap'],          // crown of the cap, snug
      [-5.6, HH + 0.6, -4.0, 5.6, HH + 1.4, 5.4, CAP, 'cap'],          // its rounded top
      [-6.5, 8.2, -4.9, 6.5, HH - 2.1, -2.6, CAP, 'cap'],              // the back sits lower
      [-0.5, HH + 1.4, 0.3, 0.5, HH + 1.8, 1.3, '1', 'cap'],           // button
      [-5.2, HH - 2.8, 5.8, 5.2, HH - 2.1, 9.6, BRIM, 'brim']           // the brim, straight ahead
    ],
    glasses: [                                                        // round black frames, amber lenses
      [-4.1, 4.5, 6.0, -0.1, 8.5, 6.7, LENS, 'glasses'],
      [0.1, 4.5, 6.0, 4.1, 8.5, 6.7, LENS, 'glasses'],
      [-6.7, 7.3, 0.4, -6.0, 8.0, 6.4, '3', 'glasses'],
      [6.0, 7.3, 0.4, 6.7, 8.0, 6.4, '3', 'glasses']
    ],
    torsoW: 5.9,
    torso: { all: 'O', t: 'k', f: torso },
    arm: { all: ['OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'kkkk', 'SSSS', 'SSSS'], t: 'O', d: 'S' },
    body: [                                                           // the jacket's collar standing up at the neck
      [-4.3, 20.0, 1.6, -1.1, 22.2, 3.6, { all: 'O', f: ['Oo', 'oO', 'OO'] }, 'collarL'],
      [1.1, 20.0, 1.6, 4.3, 22.2, 3.6, { all: 'O', f: ['oO', 'Oo', 'OO'] }, 'collarR']
    ],
    gesture: function (p, tp) {                                       // both hands working in front of his chest
      p.aA = [-1.2 + 0.25 * Math.sin(tp * 3.1), 0, -0.3 + 0.1 * Math.sin(tp * 1.7)];
      p.aB = [-1.05 - 0.25 * Math.sin(tp * 3.1 + 0.8), 0, 0.3];
    }
  };
});
