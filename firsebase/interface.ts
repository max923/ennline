export interface _self {
  db: any;
  userRootNode: string;
  userId: string,
  isUserExist: Function,
  getRandomNode: Function,
  getSetting: Function,
  getNodeValueByWord: Function,
  setUserDailyQuiz: Function,
}
export interface Snapshot{
  val(): {
    [key: string]: any
  },
  numChildren(): number,
}
export interface Vocabulary {
  word: string,
  def: string,
  examples: string[],
  zhTW: string,
  voice: string,
}
