import firebase from 'firebase'
import request from 'superagent'
import { isEmpty, get } from 'lodash'
import config from '../config'

interface _self {
  db: any;
  userRootNode: string;
  userId: string
}
interface Snapshot {
  val(): {
    [key: string]: any
  },
  numChildren(): number,
}

function getWordNodeValue(
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
 * 
 * @param db A firsebase Databse
 * @param userId A user unique string id from Line chat room
 */
function getUserNodeValue(
  db: any,
  userRootNode: string
):Promise<object> {
  return new Promise((resolve, reject) => {
    try {
      db.ref(userRootNode).once('value', (snapshot: Snapshot) => {
        resolve(snapshot.val())
      });
    } catch (error) {
      reject(error)
    }
  })
}
function createFirsebase() {
  /**
   * Init firsebase
  */
  firebase.initializeApp(config.Firsebase);
  const db = firebase.database();

  return function(userId: string) {
    /**
     * Check the user is in the DB
    */
    const userRootNode = `/${userId}`
    async function isUserExist (
      this: _self
    ): Promise<boolean> {
      const userNodeValue = await getUserNodeValue(this.db, this.userRootNode)
      return !isEmpty(userNodeValue)
    }
    return {
      db,
      userId,
      userRootNode,
      isUserExist,
      getWordNodeValue,
      getSetting,
      getRandomNode,
    }
  }
}
export default createFirsebase()