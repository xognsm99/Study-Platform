export type WordOrderQuestion = {
  id: string;
  prompt: string;      // 상황/첫 문장(완성문장)
  tokens: string[];    // 선택할 조각(슬래시로 나뉜 덩어리)
  answer: string;      // 정답 문장
};

export const WORD_ORDER_QUESTIONS: WordOrderQuestion[] = [
  {
    id: "q1",
    prompt: "I'm thirsty.",
    tokens: ["something", "drink", "to", "I need"],
    answer: "I need something to drink.",
  },
  {
    id: "q2",
    prompt: "I'm hungry.",
    tokens: ["anything", "eat", "to", "do you have"],
    answer: "Do you have anything to eat?",
  },
  {
    id: "q3",
    prompt: "I'm tired.",
    tokens: ["it's", "time", "to", "go", "to", "bed"],
    answer: "It's time to go to bed.",
  },
  {
    id: "q4",
    prompt: "I love rock music.",
    tokens: ["I'd like", "to", "have", "a chance", "to", "go", "to", "a concert"],
    answer: "I'd like to have a chance to go to a concert.",
  },
  {
    id: "q5",
    prompt: "I'm bored.",
    tokens: ["something", "do", "to", "I want"],
    answer: "I want something to do.",
  },
  {
    id: "q6",
    prompt: "It's very hot today.",
    tokens: ["something", "drink", "cold", "to", "I need"],
    answer: "I need something cold to drink.",
  },
  {
    id: "q7",
    prompt: "I have an exam tomorrow.",
    tokens: ["a lot of things", "study", "to", "I have"],
    answer: "I have a lot of things to study.",
  },
  {
    id: "q8",
    prompt: "I'm lonely.",
    tokens: ["I need", "someone", "to", "talk", "to"],
    answer: "I need someone to talk to.",
  },
  {
    id: "q9",
    prompt: "The room is crowded.",
    tokens: ["no place", "sit", "to", "there is"],
    answer: "There is no place to sit.",
  },
  {
    id: "q10",
    prompt: "Minho is happy.",
    tokens: ["happy", "Minho", "playing soccer", "made"],
    answer: "Playing soccer made Minho happy.",
  },
  {
    id: "q11",
    prompt: "Elly is sleepy.",
    tokens: ["Elly", "sleepy", "studying late", "made"],
    answer: "Studying late made Elly sleepy.",
  },
  {
    id: "q12",
    prompt: "Josh is tired.",
    tokens: ["Josh", "tired", "cleaning the room", "made"],
    answer: "Cleaning the room made Josh tired.",
  },
  {
    id: "q13",
    prompt: "Hana is excited.",
    tokens: ["excited", "Hana", "watching a movie", "made"],
    answer: "Watching a movie made Hana excited.",
  },
  {
    id: "q14",
    prompt: "Minho is happy.",
    tokens: ["Minho", "happy", "listening to music", "made"],
    answer: "Listening to music made Minho happy.",
  },
  {
    id: "q15",
    prompt: "Josh is tired.",
    tokens: ["Josh", "tired", "exercising a lot", "made"],
    answer: "Exercising a lot made Josh tired.",
  },
  {
    id: "q16",
    prompt: "Elly is sleepy.",
    tokens: ["Elly", "sleepy", "listening to music", "made"],
    answer: "Listening to music made Elly sleepy.",
  },
];
