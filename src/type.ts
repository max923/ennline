export interface _self {
  db: any;
  userRootNode: string;
  userId: string,
  isUserExist: Function,
  getRandomNode: Function,
  getSetting: Function,
  getNodeValueByWord: Function,
  getUserDailyQuiz: Function,
  setUserDailyQuiz: Function,
  isExpiredDailyQuiz: Function,
  updateUserDailyQuiz: Function,
}
export interface Snapshot{
  val(): any,
  numChildren(): number,
  ref: {
    update: Function,
    push: Function
  }
}
export interface Vocabulary {
  word: string,
  def: string,
  examples: string[],
  zhTW: string,
  voice: string,
}
export interface DailyQuiz {
  currentNum: number,
  date?: string,
  mistakes: string[],
  questions: Vocabulary[],
}
