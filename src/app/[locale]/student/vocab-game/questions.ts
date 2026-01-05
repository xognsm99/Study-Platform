export type VocabKeypadQ = {
  id: string;
  sentence: string;   // 빈칸은 반드시 "()" 토큰
  answers: string[];  // 빈칸 개수와 동일
  explain?: string;
  hint?: string;
};

export const VOCAB_GAME_ITEMS: VocabKeypadQ[] = [
  {
    id: "q1",
    sentence: "Hello! () Somin.",
    answers: ["Iam"],
    explain: "안녕! 나는 소민이야.",
  },
  {
    id: "q2",
    sentence: "I'm 15 () old, and I live in Korea",
    answers: ["years"],
    explain: "나는 15살이고 한국에 살아.",
  },
  {
    id: "q3",
    sentence: "I'm 15 years old, and I () Korea",
    answers: ["livein"],
    explain: "나는 15살이고 한국에 살아.",
  },
  {
    id: "q4",
    sentence: "Please tell me () your favorite time of the day.",
    answers: ["about"],
    explain: "너희들이 하루 중 가장 좋아하는 시간에 대해 내게 말해 줘.",
  },
  {
    id: "q5",
    sentence: "Please tell me about your favorite time () the day.",
    answers: ["of"],
    explain: "너희들이 하루 중 가장 좋아하는 시간에 대해 내게 말해 줘.",
  },
  {
    id: "q6",
    sentence: "My favorite time of the day is () the afternoon.",
    answers: ["in"],
    explain: "하루 중 내가 가장 좋아하는 시간은 오후이다.",
  },
  {
    id: "q7",
    sentence: "I'm usually () school at two o'clock.",
    answers: ["outof"],
    explain: "나는 보통 두 시에 학교를 끝낸다.",
  },
  {
    id: "q8",
    sentence: "I then come back () my house.",
    answers: ["to"],
    explain: "나는 그 후 집으로 돌아온다.",
  },
  {
    id: "q9",
    sentence: "My mom is already () home.",
    answers: ["at"],
    explain: "엄마는 이미 집에 계신다.",
  },
  {
    id: "q10",
    sentence: "She () me with a smile.",
    answers: ["greets"],
    explain: "엄마는 미소로 나를 맞이하신다.",
  },
  {
    id: "q11",
    sentence: "Then I take a () in my room.",
    answers: ["rest"],
    explain: "그 다음 나는 방에서 휴식을 취한다.",
  },
  {
    id: "q12",
    sentence: "A little later, I listen () music.",
    answers: ["to"],
    explain: "조금 뒤에 나는 음악을 듣는다.",
  },
  {
    id: "q13",
    sentence: "I often talk to my best friend () the phone, too.",
    answers: ["on"],
    explain: "또 나는 전화로 가장 친한 친구와 자주 이야기한다.",
  },
  {
    id: "q14",
    sentence: "We talk about our day () make each other laugh.",
    answers: ["and"],
    explain: "우리는 하루에 대해 이야기하고 서로 웃게 만든다.",
  },
  {
    id: "q15",
    sentence: "After that, I do my homework () my desk.",
    answers: ["at"],
    explain: "그 후 나는 책상에서 숙제를 한다.",
  },
];
