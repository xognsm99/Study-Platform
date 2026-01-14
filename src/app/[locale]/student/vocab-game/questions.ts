export type VocabKeypadItem = {
  id: string;
  sentence: string;   // () 포함
  answers: string[];  // 빈칸 정답들 (순서대로)
  explain: string;    // 한글 해설/뜻
};

export const VOCAB_GAME_ITEMS: VocabKeypadItem[] = [
  {
    id: "dl_01",
    sentence: "I grew up in (), so I had many chances to see dolphins.",
    answers: ["Jeju-do"],
    explain: "나는 제주도에서 자라서 돌고래를 볼 기회가 많았다.",
  },
  {
    id: "dl_02",
    sentence: "Then, I learned that some dolphins are in ().",
    answers: ["danger"],
    explain: "그러던 중 나는 일부 돌고래들이 위험에 처해 있다는 것을 알게 되었다.",
  },
  {
    id: "dl_03",
    sentence: "Some are even ().",
    answers: ["endangered"],
    explain: "그중 일부는 심지어 멸종 위기에 처해 있다.",
  },
  {
    id: "dl_04",
    sentence: "So, I searched the Internet and found an (), Dolphin Lovers.",
    answers: ["NGO"],
    explain: "그래서 인터넷을 검색하다가 NGO ‘돌핀 러버스’를 찾게 되었다.",
  },
  {
    id: "dl_05",
    sentence: "It does () activities such as cleaning up beaches and helping dolphins.",
    answers: ["various"],
    explain: "그 단체는 해변 청소나 돌고래를 돕는 등 다양한 활동을 한다.",
  },
  {
    id: "dl_06",
    sentence: "After some (), I joined it today.",
    answers: ["thought"],
    explain: "고민 끝에 나는 오늘 그 단체에 가입했다.",
  },
  {
  id: "dl_07",
  sentence:
    "Many dolphins get sick or even die because of () waste, so cleaning up beaches is important.",
  answers: ["plastic"],
  explain: "플라스틱 쓰레기 때문에 돌고래들이 아프거나 죽기도 해서 해변 청소는 중요하다.",
},
    {
    id: "dl_08",
    sentence: "There was a beach cleanup party today, and I took part in ().",
    answers: ["it"],
    explain: "오늘 해변 정화 활동이 있었고, 나는 그 활동에 참여했다.",
  },
  {
    id: "dl_09",
    sentence: "Cleaning up the beach was not easy, but I () it.",
    answers: ["enjoyed"],
    explain: "해변을 청소하는 일은 쉽지 않았지만 나는 그것을 즐겼다.",
  },
  {
    id: "dl_10",
    sentence: "This afternoon, I took part in a () class for Halla and Olle.",
    answers: ["training"],
    explain: "오늘 오후 나는 한라와 올레를 위한 훈련 수업에 참여했다.",
  },
  {
    id: "dl_11",
    sentence: "The latest project of Dolphin Lovers is to () them to the sea.",
    answers: ["return"],
    explain: "돌핀 러버스의 최신 프로젝트는 그들을 바다로 돌려보내는 것이다.",
  },
  {
    id: "dl_12",
    sentence: "For this, they first need to learn some ().",
    answers: ["skills"],
    explain: "이를 위해 그들은 먼저 몇 가지 기술을 배워야 한다.",
  },
  {
    id: "dl_13",
    sentence: "They will need them to () in the wild.",
    answers: ["survive"],
    explain: "그 기술들은 야생에서 살아남기 위해 필요하다.",
  },
  {
    id: "dl_14",
    sentence: "Luckily, I got the ().",
    answers: ["chance"],
    explain: "운 좋게도 나는 그 기회를 얻었다.",
  },
  {
    id: "dl_15",
    sentence: "I just ran some () today, but the experience made me so excited.",
    answers: ["errands"],
    explain: "오늘은 허드렛일만 했지만 그 경험은 나를 매우 설레게 했다.",
  },
  {
    id: "dl_16",
    sentence: "The ceremony made us quite (). In fact, I cried a little.",
    answers: ["emotional"],
    explain: "그 기념식은 우리를 매우 감정적으로 만들었고, 사실 나는 조금 울었다.",
  },
  {
    id: "dl_17",
    sentence: "After 10 years of hard life in an (), now all the sea is their home.",
    answers: ["aquarium"],
    explain: "수족관에서의 힘든 10년 후, 이제 바다 전체가 그들의 집이 되었다.",
  },
  {
    id: "dl_18",
    sentence: "I shouted and () goodbye to them.",
    answers: ["waved"],
    explain: "나는 외치며 그들에게 손을 흔들어 작별 인사를 했다.",
  },
  {
  id: "dl_19",
  sentence:
    "Many dolphins get sick or even die because of fishing (), so cleaning up beaches is important.",
  answers: ["nets"],
  explain: "어망 때문에 돌고래들이 아프거나 죽기도 해서 해변 청소는 중요하다.",
}
];
