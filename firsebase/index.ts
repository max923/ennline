import firebase from 'firebase'
import { isEmpty } from 'lodash'
import { calcRandom, today } from '../src/utils'
import { getConfig } from '../helper'
import { _self, Snapshot, Vocabulary, DailyQuiz } from '../src/type'
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

function getUserDailyQuiz(
  this: _self,
):Promise<DailyQuiz> {  
  return new Promise((resolve, reject) => {
    try {
      this.db.ref(`/dailyQuiz/${this.userId}`).once('value', (snapshot: Snapshot) => {
        resolve(snapshot.val())
      });
    } catch (error) {
      reject(error)
    }
  })
}

function getNodeValueByWord(
  this: _self,
  word: string
):Promise<any> {
  return new Promise((resolve, reject) => {    
    try {
      this.db.ref(`${this.userRootNode}/${word}`).once('value', (snapshot: Snapshot) => {
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
function updateUserDailyQuiz(
  this: _self,
  data: any
): Promise<DailyQuiz>{
  return new Promise((resolve, reject) => {
    try {
      this.db.ref(`/dailyQuiz/${this.userId}`).once('value', (snapshot: Snapshot) => {
        snapshot.ref.update(data, () => {
          resolve(this.getUserDailyQuiz())
        })
      });
    } catch (error) {
      reject(error)
    }
  })
}

function pushUserDailyQuizMistakes(
  this: _self,
  data: string
) {
  return new Promise((resolve, reject) => {
    try {
      this.db.ref(`/dailyQuiz/${this.userId}/mistakes`).once('value', (snapshot: Snapshot) => {
        snapshot.ref.push(data, () => {
          resolve('SUCCESS')
        })
      });
    } catch (error) {
      reject(error)
    }
  })
}

function updateWordNode(
  this: _self,
  word: string,
  callback: Function
) {
  return new Promise((resolve, reject) => {
    try {
      this.db.ref(`/${this.userId}/${word}`).once('value', (snapshot: any) => {
        const updateData = callback(snapshot.val())
        snapshot.ref.update(updateData, () => {
          resolve(this.getNodeValueByWord(word))
        })
      });
    } catch (error) {
      reject(error)
    }
  })
}

function updateAllNode(
  this: _self,
  callback: Function
):Promise<any> {
  return new Promise((resolve, reject) => {
    try {
      this.db.ref(`/${this.userId}`).once('value', (snapshot: any) => {
        snapshot.forEach(function (snapshot1: Snapshot) {
          snapshot1.ref.update(callback(snapshot1.val()), () => {
            resolve('SUCESS')
          })
        })
      });
    } catch (error) {
      reject(error)
    }
  })
}
/**
 * Set the user daily quiz
 */
function setUserDailyQuiz(
  this: _self,
  quantity: number
):Promise<DailyQuiz>{  
  const todayQuestions = (count: number) => {
    const nodeList = calcRandom(count).map(num => num === 0 ? this.getRandomNode().overWeightNode(): this.getRandomNode().oneWeight())
    return Promise.all(nodeList)
  }
  const todayQuizData = async (quantity: number) => {
    return {
      currentNum: 0,
      date: today(),
      mistakes: [''],
      questions: await todayQuestions(quantity),
    }
  }
  return new Promise(async (resolve, reject) => {
    try {
      this.db.ref(`/dailyQuiz/${this.userId}`).set(await todayQuizData(quantity), function(snapshot: Snapshot) {
        resolve(todayQuizData(quantity))
      })
    } catch (error) {
      reject(error)
    }
  })
}
function isExpiredDailyQuiz(
  this: _self,
):Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      this.db.ref(`/dailyQuiz/${this.userId}`).once('value', (snapshot: Snapshot) => {
        resolve(snapshot.val() && snapshot.val().date !== today())
      });
    } catch (error) {
      reject(error)
    }
  })
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
  firebase.initializeApp(getConfig(process).Firsebase);
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
      getUserDailyQuiz,
      getRandomNode,
      isExpiredDailyQuiz,
      setUserDailyQuiz,
      setNewWord,
      pushUserDailyQuizMistakes,
      updateUserDailyQuiz,
      updateAllNode,
      updateWordNode,
    }
  }
}
export default createFirsebase()