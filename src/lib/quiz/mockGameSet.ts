import type { GameSet } from "./schema";

/**
 * 기존 items 배열(문제 객체들)을 "내용 변경 없이" 그대로 여기로 옮김
 */
const RAW_ITEMS: GameSet["items"] = [
  {
    type: "flash4",
    payload: {
      focusWord: "activity",
      choices: ["활동", "사막", "후식", "탐정, 형사"],
      answerIndex: 0,
      decoys: ["culture", "exercise", "library", "peaceful", "win"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "almost",
      choices: ["거의", "중요한", "영화", "낮잠"],
      answerIndex: 0,
      decoys: ["important", "movie", "nap", "near", "usually"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "also",
      choices: ["또한", "고기", "동쪽", "끝나다"],
      answerIndex: 0,
      decoys: ["meat", "east", "end", "enjoy", "everyone"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "around",
      choices: ["~경, ~주위에", "도서관", "조깅하다", "수프"],
      answerIndex: 0,
      decoys: ["library", "jog", "soup", "sunset", "country"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "bake",
      choices: ["굽다", "빗질하다 / 붓", "평화로운", "주다"],
      answerIndex: 0,
      decoys: ["brush", "peaceful", "give", "fun", "practice"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "because",
      choices: ["~ 때문에", "국가", "문화", "사진"],
      answerIndex: 0,
      decoys: ["country", "culture", "picture", "favorite", "kind"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "before",
      choices: ["~하기 전에", "운동하다", "가장 좋아하는", "경주"],
      answerIndex: 0,
      decoys: ["exercise", "favorite", "race", "runner", "show"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "boring",
      choices: ["지루한", "끓이다", "보드", "볼링"],
      answerIndex: 0,
      decoys: ["romantic", "horror", "novel", "movie", "fun"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "both",
      choices: ["둘 다", "사장님", "버스", "보수적인"],
      answerIndex: 0,
      decoys: ["southern", "vegetable", "sunset", "east", "when"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "brush",
      choices: ["빗질하다", "전진하다", "술에취한", "칫약"],
      answerIndex: 0,
      decoys: ["carrot", "kind", "practice", "peaceful", "meat"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "carrot",
      choices: ["당근", "사과", "브로컬리", "커피"],
      answerIndex: 0,
      decoys: ["vegetable", "meat", "soup", "lunch", "country"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "classical",
      choices: ["고전적인", "현대적인", "보통의", "화려한"],
      answerIndex: 0,
      decoys: ["sci-fi", "comedy show", "action movie", "horror movie", "rock music"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "country",
      choices: ["국가", "문화", "국민", "국경"],
      answerIndex: 0,
      decoys: ["culture", "library", "desert", "east", "southern"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "culture",
      choices: ["문화", "활동", "연습", "특히"],
      answerIndex: 0,
      decoys: ["activity", "practice", "especially", "everyone", "favorite"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "desert",
      choices: ["사막", "후식", "모래", "습한"],
      answerIndex: 0,
      decoys: ["east", "southern", "near", "sunset", "peaceful"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "dessert",
      choices: ["후식", "사막", "식사", "채소"],
      answerIndex: 0,
      decoys: ["soup", "lunch", "vegetable", "meat", "carrot"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "detective",
      choices: ["탐정", "핵", "보호하는", "공격적인"],
      answerIndex: 0,
      decoys: ["runner", "novel", "picture", "movie", "horror"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "east",
      choices: ["동쪽", "남쪽", "북쪽", "서쪽"],
      answerIndex: 0,
      decoys: ["southern", "end", "peaceful", "near", "when"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "end",
      choices: ["끝나다", "즐기다", "시작하다", "그리고"],
      answerIndex: 0,
      decoys: ["enjoy", "show", "win", "give", "practice"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "enjoy",
      choices: ["즐기다", "좋아하다", "연습하다", "운동하다"],
      answerIndex: 0,
      decoys: ["like", "practice", "exercise", "fun", "favorite"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "especially",
      choices: ["특히", "보통", "거의", "가끔"],
      answerIndex: 0,
      decoys: ["usually", "almost", "also", "both", "everyone"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "everyone",
      choices: ["모든 사람", "매일", "매번", "원하다"],
      answerIndex: 0,
      decoys: ["kind", "picture", "culture", "country", "activity"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "exercise",
      choices: ["운동하다", "조깅하다", "달리다", "걷다"],
      answerIndex: 0,
      decoys: ["jog", "ride", "nap", "practice", "runner"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "favorite",
      choices: ["가장 좋아하는", "중요한", "재미", "평화로운"],
      answerIndex: 0,
      decoys: ["important", "fun", "peaceful", "romantic", "horror"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "fun",
      choices: ["재미", "재미없는", "공포", "낭만적인"],
      answerIndex: 0,
      decoys: ["boring", "horror", "romantic", "movie", "show"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "give",
      choices: ["주다", "보여 주다", "끝나다", "이기다"],
      answerIndex: 0,
      decoys: ["show", "end", "win", "enjoy", "practice"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "horror",
      choices: ["공포", "소설", "영화", "사진"],
      answerIndex: 0,
      decoys: ["novel", "movie", "picture", "detective", "action movie"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "important",
      choices: ["중요한", "특별히", "보통", "거의"],
      answerIndex: 0,
      decoys: ["especially", "usually", "almost", "also", "both"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "jog",
      choices: ["조깅하다", "운동하다", "걷다", "경주"],
      answerIndex: 0,
      decoys: ["exercise", "runner", "race", "ride", "practice"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "kind",
      choices: ["종류/친절한", "모든 사람", "문화", "국가/나라"],
      answerIndex: 0,
      decoys: ["everyone", "culture", "country", "activity", "favorite"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "library",
      choices: ["도서관", "사진", "영화", "소설"],
      answerIndex: 0,
      decoys: ["picture", "movie", "novel", "culture", "country"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "like",
      choices: ["좋아하다/~처럼", "주다", "즐기다", "보여 주다"],
      answerIndex: 0,
      decoys: ["give", "enjoy", "show", "end", "win"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "lunch",
      choices: ["중식", "후식", "조식", "브런치"],
      answerIndex: 0,
      decoys: ["dessert", "soup", "vegetable", "meat", "carrot"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "meat",
      choices: ["고기", "채소", "당근", "수프"],
      answerIndex: 0,
      decoys: ["vegetable", "carrot", "soup", "lunch", "dessert"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "movie",
      choices: ["영화", "소설", "사진", "책"],
      answerIndex: 0,
      decoys: ["novel", "picture", "comedy show", "action movie", "horror movie"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "nap",
      choices: ["낮잠", "점심", "일몰", "평화로운"],
      answerIndex: 0,
      decoys: ["lunch", "sunset", "peaceful", "usually", "near"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "near",
      choices: ["가까운", "동쪽", "남쪽에", "사막"],
      answerIndex: 0,
      decoys: ["east", "southern", "desert", "sunset", "country"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "novel",
      choices: ["소설", "영화", "사진", "문화"],
      answerIndex: 0,
      decoys: ["movie", "picture", "culture", "library", "detective"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "on",
      choices: ["~위에", "~전에", "~할 때", "~ 때문에"],
      answerIndex: 0,
      decoys: ["before", "when", "because", "also", "around"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "peaceful",
      choices: ["평화로운", "낭만적인", "재미없는", "중요한"],
      answerIndex: 0,
      decoys: ["romantic", "boring", "important", "sunset", "country"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "picture",
      choices: ["사진", "영화", "소설", "도서관"],
      answerIndex: 0,
      decoys: ["movie", "novel", "library", "culture", "country"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "practice",
      choices: ["연습하다", "운동하다", "즐기다", "보여 주다"],
      answerIndex: 0,
      decoys: ["exercise", "enjoy", "show", "jog", "race"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "race",
      choices: ["경주", "주자", "조깅하다", "굴다"],
      answerIndex: 0,
      decoys: ["runner", "jog", "ride", "win", "end"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "ride",
      choices: ["(말 등을) 타다, 굴다", "조깅하다", "주다", "연습 / 연습하다"],
      answerIndex: 0,
      decoys: ["jog", "give", "practice", "runner", "race"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "romantic",
      choices: ["낭만적인", "공포", "평화로운", "재미없는"],
      answerIndex: 0,
      decoys: ["horror", "peaceful", "boring", "movie", "sunset"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "runner",
      choices: ["주자", "경주", "조깅하다", "운동하다"],
      answerIndex: 0,
      decoys: ["race", "jog", "exercise", "ride", "win"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "sci-fi",
      choices: ["공상과학소설", "소설", "액션 영화", "공포 영화"],
      answerIndex: 0,
      decoys: ["novel", "action movie", "horror movie", "comedy show", "rock music"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "show",
      choices: ["보여 주다", "주다", "즐기다", "끝나다"],
      answerIndex: 0,
      decoys: ["give", "enjoy", "end", "win", "practice"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "soup",
      choices: ["수프", "고기", "채소", "후식"],
      answerIndex: 0,
      decoys: ["meat", "vegetable", "dessert", "lunch", "carrot"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "southern",
      choices: ["남쪽에", "동쪽에", "국가", "문화"],
      answerIndex: 0,
      decoys: ["east", "country", "culture", "desert", "near"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "sunset",
      choices: ["일몰", "낮잠", "점심 식사", "평화로운"],
      answerIndex: 0,
      decoys: ["nap", "lunch", "peaceful", "near", "usually"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "usually",
      choices: ["보통", "특히", "거의", "또한"],
      answerIndex: 0,
      decoys: ["especially", "almost", "also", "both", "everyone"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "vegetable",
      choices: ["채소", "고기", "수프", "후식"],
      answerIndex: 0,
      decoys: ["meat", "soup", "dessert", "lunch", "carrot"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "when",
      choices: ["~할 때/언제", "~하기 전에", "~ 때문에", "~위에"],
      answerIndex: 0,
      decoys: ["before", "because", "on", "around", "also"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "win",
      choices: ["이기다", "끝나다", "주다", "보여 주다"],
      answerIndex: 0,
      decoys: ["end", "give", "show", "race", "runner"],
    },
  },

  // ===== 숙어 =====
  {
    type: "flash4",
    payload: {
      focusWord: "action movie",
      choices: ["액션 영화", "공포 영화", "코미디", "과학소설"],
      answerIndex: 0,
      decoys: ["horror movie", "comedy show", "sci-fi", "rock music", "rap music"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "be on a team",
      choices: ["~팀에 속해 있다", "~을 자랑스러워하다", "모이다", "~을 돌보다"],
      answerIndex: 0,
      decoys: ["be proud of ~", "get together", "take care of ~", "free time", "in fact"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "be proud of ~",
      choices: ["~을 자랑스러워하다", "팀에 속해 있다", "실제로, 사실은", "~에 관해 말하다"],
      answerIndex: 0,
      decoys: ["be on a team", "in fact", "tell ~ about …", "listen to ~", "take a nap"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "both A and B",
      choices: ["A와 B 둘 다", "A와 B 중 하나", "평상시에", "여가 시간"],
      answerIndex: 0,
      decoys: ["on most days", "free time", "get together", "in fact", "lunch time"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "comedy show",
      choices: ["코미디 쇼", "액션 영화", "공포 영화", "랩 음악"],
      answerIndex: 0,
      decoys: ["action movie", "horror movie", "rap music", "rock music", "sci-fi"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "enjoy + 동명사",
      choices: ["~하는 것을 즐기다", "~을 돌보다", "~을 듣다", "영화를 보러 가다"],
      answerIndex: 0,
      decoys: ["take care of ~", "listen to ~", "go see a movie", "free time", "in fact"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "free time",
      choices: ["여가 시간", "점심시간", "평상시", "실제로"],
      answerIndex: 0,
      decoys: ["lunch time", "on most days", "in fact", "get together", "take a nap"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "get together",
      choices: ["모이(으)다", "~을 자랑스러워하다", "영화를 보러 가다", "~을 듣다"],
      answerIndex: 0,
      decoys: ["be proud of ~", "go see a movie", "listen to ~", "free time", "in fact"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "go see a movie",
      choices: ["영화를 보러 가다", "낮잠을 자다", "점심시간", "록 음악"],
      answerIndex: 0,
      decoys: ["take a nap", "lunch time", "rock music", "action movie", "comedy show"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "horror movie",
      choices: ["공포 영화", "액션 영화", "코미디 쇼", "공상과학소설"],
      answerIndex: 0,
      decoys: ["action movie", "comedy show", "sci-fi", "rock music", "rap music"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "in fact",
      choices: ["사실은", "평상시", "여가 시간", "점심시간"],
      answerIndex: 0,
      decoys: ["on most days", "free time", "lunch time", "get together", "listen to ~"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "listen to ~",
      choices: ["~을 듣다", "~에게 …에 관해 말하다", "~을 돌보다", "낮잠을 자다"],
      answerIndex: 0,
      decoys: ["tell ~ about …", "take care of ~", "take a nap", "rap music", "rock music"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "lunch time",
      choices: ["점심시간", "여가 시간", "실제로", "대부분의 날에"],
      answerIndex: 0,
      decoys: ["free time", "in fact", "on most days", "get together", "take a nap"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "on most days",
      choices: ["평상시", "실제로", "점심시간", "여가 시간"],
      answerIndex: 0,
      decoys: ["in fact", "lunch time", "free time", "get together", "be on a team"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "rap music",
      choices: ["랩 음악", "록 음악", "공포 영화", "코미디"],
      answerIndex: 0,
      decoys: ["rock music", "horror movie", "comedy show", "action movie", "sci-fi"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "ride a horse",
      choices: ["말을 타다", "낮잠을 자다", "~을 돌보다", "영화를 보러 가다"],
      answerIndex: 0,
      decoys: ["take a nap", "take care of ~", "go see a movie", "get together", "in fact"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "rock music",
      choices: ["록 음악", "랩 음악", "액션 영화", "공포 영화"],
      answerIndex: 0,
      decoys: ["rap music", "action movie", "horror movie", "comedy show", "sci-fi"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "take a nap",
      choices: ["낮잠을 자다", "영화를 보러 가다", "~을 듣다", "모으다"],
      answerIndex: 0,
      decoys: ["go see a movie", "listen to ~", "get together", "free time", "lunch time"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "take care of ~",
      choices: ["~을 돌보다", "~을 듣다", "~에게 …에 관해 말하다", "~하는 것을 즐기다"],
      answerIndex: 0,
      decoys: ["listen to ~", "tell ~ about …", "enjoy + 동명사", "be proud of ~", "be on a team"],
    },
  },
  {
    type: "flash4",
    payload: {
      focusWord: "tell ~ about …",
      choices: ["~에게 …에 관해 말하다", "~을 듣다", "~을 돌보다", "실제로, 사실은"],
      answerIndex: 0,
      decoys: ["listen to ~", "take care of ~", "in fact", "get together", "free time"],
    },
  },
];


/** 시드 기반 RNG */
function makeRng(seedStr: string) {
  function cyrb128(str: string) {
    let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
      k = str.charCodeAt(i);
      h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
      h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
      h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
      h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
  }
  function sfc32(a: number, b: number, c: number, d: number) {
    return function () {
      a >>>= 0; b >>>= 0; c >>>= 0; d >>>= 0;
      let t = (a + b) | 0;
      a = b ^ (b >>> 9);
      b = (c + (c << 3)) | 0;
      c = (c << 21) | (c >>> 11);
      d = (d + 1) | 0;
      t = (t + d) | 0;
      c = (c + t) | 0;
      return (t >>> 0) / 4294967296;
    };
  }
  const s = cyrb128(seedStr);
  return sfc32(s[0], s[1], s[2], s[3]);
}

function shuffleWithRng<T>(arr: T[], rng: () => number) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** flash4만 choices 셔플 + answerIndex 보정 */
function shuffleChoicesIfFlash4(
  item: GameSet["items"][number],
  rng: () => number
): GameSet["items"][number] {
  if (item.type !== "flash4") return item;

  const choices = item.payload.choices;
  const correct = choices[item.payload.answerIndex];

  const shuffled = shuffleWithRng(choices, rng);
  const newAnswerIndex = shuffled.findIndex((c) => c === correct);

  return {
    ...item,
    payload: {
      ...item.payload,
      choices: shuffled,
      answerIndex: newAnswerIndex,
    },
  };
}

/** 전체 풀 셔플 → count개 선택 → 각 문제 보기 셔플 */
function buildTodayItems(pool: GameSet["items"], count = 10, seedOverride?: string): GameSet["items"] {
  // ✅ seedOverride가 없으면 매번 새로운 랜덤 seed 생성 (타임스탬프 + 랜덤)
  const seedString = seedOverride
    ? `seed:${seedOverride}`
    : `random:${Date.now()}-${Math.random()}`;
  const rng = makeRng(seedString);
  const picked = shuffleWithRng(pool, rng).slice(0, Math.min(count, pool.length));
  return picked.map((it) => shuffleChoicesIfFlash4(it, rng)) as GameSet["items"];
}

/** seed에 따라 GameSet 생성 (외부에서 호출용) */
export function buildGameSet(seedOverride?: string): GameSet {
  return {
    title: "오늘의 5분 미션",
    grade: "middle2",
    is_active: true,
    items: buildTodayItems(RAW_ITEMS, 10, seedOverride),
  };
}

/** export 이름/구조 유지 (하위 호환) */
export const mockGameSet: GameSet = buildGameSet();