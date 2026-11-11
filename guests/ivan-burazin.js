// Ivan Burazin · Daytona · "Most Founders Don't Understand Open Source" (zRAGWJN_TwM)
// A shaved head, dark stubble along the jaw, a black crew-neck sweater and a silver watch with a
// white dial on his left wrist; he explains with his left hand up, palm sideways.
ktGuest('ivan-burazin', function (K) {
  var HH = K.HH;
  // his face: heavy straight brows, a quiet smile, short dark stubble over the lip, jaw and chin
  var smile = ['SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SbbbbSSbbbbS', 'SSSSSSSSSSSS', 'SSSxESSxESSS',
               'SSSEESSEESSS', 'SSSSSssSSSSS', 'tSSttttttSSt', 'tSSmwwwwmSSt', 'ttStmmmmtStt', 'stttttttttts'];
  var arm = ['OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'OOOO', 'kkkk', 'SSSS', 'SSSS', 'SSSS'];
  return {
    ramps: {
      gskin: ['#7a4038', '#c47f72', '#e09c8e', '#ecb1a3', '#f4c4b8'],     // from #d78f84, lifted; the scalp takes the top step
      gbrd:  ['#6a4038', '#9e6a5f', '#b37c71', '#be887c', '#c89387'],     // short dark stubble (#644139) over his skin
      gtop:  ['#28262a', '#454248', '#565259', '#5f5b62', '#69656c'],     // black sweater (#141313), lifted; lit steps held low
      gpant: ['#2e3445', '#47506a', '#58627e', '#6d7893', '#8792ac'],
      gxa:   ['#7a4a42', '#b98479', '#d19489', '#dca499', '#e6b3a8']      // the faint shadow of the shaved sides
    },
    def: { t: 'gbrd', b: '#5e4038' },
    faces: { smile: smile, blink: K.swap(smile, 5, 'SSSSSSSSSSSS'),
      talk: K.swap(K.swap(K.swap(smile, 8, 'tSStmmmmtSSt'), 9, 'tSSmwwwwmSSt'), 10, 'ttStmmmmtStt') },
    head: {   // bald: skin all over, a faint shaved shadow above and behind the ears, stubble along the jaw
      r: ['SSSSSSSSSS', 'SSSSSSSSSS', 'SSSSSSSSSS', 'SSSSSSSSSS', 'SSSSSS1111', 'SSSSS11111', 'SSSSS11111',
          'tSSSS11111', 'ttSSSS1111', 'tttSSSS111', 'ttttSSSsss', 'tttttSssss'],
      b: ['SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSSSSSSSSSSS', 'SSSSSSSSSSSS', '1SSSSSSSSSS1',
          '111111111111', '111111111111', '111111111111', '111111111111', 'ssssssssssss', 'ssssssssssss'],
      t: 'S'
    },
    phonesY: HH + 0.6,                                                // the band rests on his scalp
    hair: [[-5.2, HH - 0.2, -3.6, 5.2, HH + 0.6, 4.8, 'S', 'head']],    // no hair: just the rounded crown of his head, in skin
    torsoW: 5.8,
    torso: { all: 'O', t: 'k', f: ['OOOkSSSSkOOO', 'OOOOkkkkOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO',
      'OOOOOOOOOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO', 'OOOOOOOOOOOO'] },
    hem: 'k',
    // long sleeves with ribbed cuffs; the watch (steel case, white dial) wraps the +x half of the wrist:
    // the outside of his left wrist, the inside of his right one, where the body mostly hides it
    arm: { all: arm, f: K.swap(arm, 7, 'SSSK'), r: K.swap(arm, 7, 'KwwK'), b: K.swap(arm, 7, 'KSSS'), t: 'O', d: 'S' },
    gesture: function (p, tp) {                                       // left hand up, palm sideways, chopping the point
      p.aB = [-1.25 + 0.2 * Math.sin(tp * 3.0), 0, 0.55];
      p.aA = [-1.1 + 0.12 * Math.sin(tp * 3.0 + 1.4), 0, -0.2];
    }
  };
});
