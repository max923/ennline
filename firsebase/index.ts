import firebase from 'firebase'
import { isEmpty, get } from 'lodash'
import { getConfig, calcRandom } from '../utils'
import { _self, Snapshot, Vocabulary } from './interface'
import today from './helper/today'
/**
 * Check the user whether is in the DB
*/
function isUserExist(
  this: _self,
):Promise<boolean> {
  const getUserNodeValue = () => {
    return new Promise((resolve, reject) => {
      try {
        this.db.ref(this.userRootNode).once('value', (snapshot: Snapshot) => {
          resolve(snapshot.val())
        });
      } catch (error) {
        reject(error)
      }
    })
  }
  const result = async () => !isEmpty(await getUserNodeValue())
  return result()
}

function getNodeValueByWord(
  this: _self,
  vocabulary: string
):Promise<any> {
  return new Promise((resolve, reject) => {    
    try {
      this.db.ref(`${this.userRootNode}/${vocabulary}`).once('value', (snapshot: Snapshot) => {
        resolve(snapshot.val())
      });
    } catch (error) {
      reject(error)
    }
  })
}
function getSetting(
  this: _self,
):Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      this.db.ref(`/setting/${this.userId}`).once('value', (snapshot: Snapshot) => {
        resolve(snapshot.val())
      })
    } catch (error) {
      reject(error)
    }
  })
}

function getRandomNode(
  this: _self,
): {
  overWeightNode(): Promise<any>,
  oneWeight(): Promise<any>,
} {
  function randomNodeValue(snapshot: Snapshot, randomNum: number): any {
    const vocabulary = snapshot.val()
    const length = snapshot.numChildren()
    if(length === 0) return null
    const randomWord = Object.keys(vocabulary)[Math.floor(randomNum * length)]
    const result = vocabulary[randomWord]
    return result
  }
  /**
   * Get the random vocabulary by the weight over than one
  */
  const getByOverWeight = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      try {
        this.db.ref("/" + this.userId).orderByChild("weight").startAt(2).once("value", (snapshot: Snapshot) => {
          resolve(randomNodeValue(snapshot, Math.random()))
        });
      } catch (error) {
        reject(error)
      }
    })
  }
  /**
   * Get the random vocabulary by the weight euqal to one
   */
  const getByOneWeight = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      try {
        this.db.ref("/" + this.userId).orderByChild("weight").equalTo(1).once("value", (snapshot: Snapshot) => {
          resolve(randomNodeValue(snapshot, Math.random()))
        })
      } catch (error) {
        reject(error)
      }
    })
  }
  return {
    overWeightNode: getByOverWeight,
    oneWeight: getByOneWeight
  }
}
/**
 * Set the user daily quiz
 */
function setUserDailyQuiz(
  this: _self,
):Promise<any>{
  const todayQuestions = (count: number) => {
    const nodeList = calcRandom(count).map(num => num === 0 ? this.getRandomNode().overWeightNode(): this.getRandomNode().oneWeight())
    return Promise.all(nodeList)
  }
  const todayQuizData = async (date: string) => {
    return {
      [date]: {
        questions: await todayQuestions(20),
        currentNum: 0,
        score: 0
      }
    }
  }
  return new Promise(async (resolve, reject) => {
    try {
      this.db.ref(`/dailyQuiz/${this.userId}`).set(await todayQuizData(today()), function() {
        resolve(todayQuizData(today()))
      })
    } catch (error) {
      reject(error)
    }
  })
}
function isDailyQuizExist(
  this: _self,
):Promise<boolean> {
  const getUserDailyQuizValue = () => {
    return new Promise((resolve, reject) => {
      try {
        this.db.ref(`/dailyQuiz/${this.userId}/${today()}`).once('value', (snapshot: Snapshot) => {
          resolve(snapshot.val())
        });
      } catch (error) {
        reject(error)
      }
    })
  }
  const result = async () => !isEmpty(await getUserDailyQuizValue())
  return result()
}
function setNewWord(
  this: _self,
  data: Vocabulary
):Promise<any> {
  return new Promise((resolve, reject) => {
    const { word, def, zhTW, voice, examples } = data
    try {
      this.db.ref(`${this.userRootNode}/${word}`).set({
        word,
        description: def,
        ex: examples,
        translate: {  zhTW },
        audio: {  url: voice },
        weight: 1,
        time: +new Date()
      })
      resolve({
        data,
        status: 'SUCCESS'
      })
    } catch (error) {
      reject(error)
    }
  })
}

function createFirsebase() {
  /**
   * Init firsebase
  */ 
  firebase.initializeApp(getConfig().Firsebase);
  const db = firebase.database();

  return function(userId: string) {
    const userRootNode = `/${userId}`
    return {
      db,
      userId,
      userRootNode,
      isUserExist,
      getNodeValueByWord,
      getSetting,
      getRandomNode,
      isDailyQuizExist,
      setUserDailyQuiz,
      setNewWord,
    }
  }
}
export default createFirsebase()