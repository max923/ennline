import express from 'express'
import { Client, middleware } from '@line/bot-sdk'
import { createStore } from 'redux'
import reducers, { actionType } from './reducers/index'
import { get, isNil, isEmpty } from 'lodash'
import replyMessageTemplate from './replyMessage'
import firsebase from './firsebase/index'
import fetch from './helper/fetch'
import { calcRandom, paramsToObject } from './utils/index'
import __config, { LineConfig } from './config'
import messageMotion from './const'

function getConfig(process: any) {
  if(process.NODE_ENV === 'production') {
    const {channelId, channelSecret, channelAccessToken} = process.env
    const config = {
      Line: {
        channelId,
        channelSecret,
        channelAccessToken,
      } as LineConfig
    }
    return config
  }
  return __config
}


// create Express app
const app = express();
const store = createStore(reducers)
const config = getConfig(process)

app.post('/linewebhook', middleware(config.Line), (req: any, res: any) => {
  // req.body.events should be an array of events
  if (!Array.isArray(req.body.events))  return res.status(500).end();
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result));
});


  /**
   * Handle reply event
   * @param event 
   */
  async function handleEvent(event: any) {
    const postback = isNil(get(event, 'postback.data')) ? {} : paramsToObject(event.postback.data)
    const message: string = get(event, 'message.text', '').trim()
    const userId: string = get(event, 'source.userId', null)
    const replyToken: string = get(event, 'replyToken', null)
    const state = store.getState()
    const db = firsebase(userId)
    const client = new Client(config.Line);
    if (replyToken && replyToken.match(/^(.)\1*$/)) {
      return console.log("Test hook recieved: " + JSON.stringify(message));
    }
    if(!state.user.enabled && !await db.isUserExist()) {
      return client.replyMessage(replyToken, replyMessageTemplate.singleText('User is not found'))
    } else {
      store.dispatch({ type: actionType.enableUser })
      /**
       *  Search from dictionary
       */
      const getSearchNode = async (message: string): Promise<{ isHave: boolean, node: any }> => {
        const node = await db.getNodeValueByWord(message)        
        if(isNil(node)) {
          return { isHave: false, node: await fetch.definition(message) }
        }
        return { isHave: true, node }
      }
      /**
       *  Get the random node, according to user mode
      */
      const getRandomNode = async (mode: string): Promise<any> => {
        switch (mode) {
          case 'Normal':
            if(calcRandom(1)[0] === 0) return await db.getRandomNode().overWeightNode() || db.getRandomNode().oneWeight()
            else return await db.getRandomNode().oneWeight() || db.getRandomNode().overWeightNode()
          case 'Incorrect':
            return db.getRandomNode().overWeightNode()
          default: 
            return new Promise((resolve) => resolve({}))
        }
      }

      const getQuizQuestion = async () => {
        const setting = await db.getSetting() as { mode: string }
        const node = await getRandomNode(setting.mode) as { word: string }
        return node
      }
      /**
       * Handle by postback 
       */
      if(!isEmpty(postback)) {
        switch (postback.action) {
          case 'add':
            const searchRes = await fetch.search(postback.word)
            if(searchRes) {
              const response = await db.setNewWord(Object.assign({}, searchRes, { zhTW: postback.zhTW }))
              return response.status === 'SUCCESS' ? client.replyMessage(replyToken, replyMessageTemplate.singleText('Success'))
                : client.replyMessage(replyToken, replyMessageTemplate.singleText('Fail'))
            }
            break;
        }
        
      }
      /**
       *  Handle by status
      */
      switch (state.user.status) {
        case 'search':
          store.dispatch({ type: actionType.resetStatus })
          const { isHave, node } = await getSearchNode(message)
          if(isHave) return  client.replyMessage(replyToken, replyMessageTemplate.detail(node).reply)
          return isEmpty(node.zhTW) ? client.replyMessage(replyToken, replyMessageTemplate.singleText('抱歉 查無此單字'))
            : client.replyMessage(replyToken, [replyMessageTemplate.singleText(node.zhTW), replyMessageTemplate.add(node).reply])
        default:
          break;
      }
      /**
       *  Handle by message
      */

      switch (message) {
        case messageMotion.random:
          const node = await getQuizQuestion()
          store.dispatch({ type: actionType.updateWord, payload: node.word })
          return client.replyMessage(replyToken, replyMessageTemplate.question(node).reply)
        case messageMotion.search:
          store.dispatch({ type: actionType.setSearchStatus })
          return client.replyMessage(replyToken, replyMessageTemplate.singleText('請輸入單字'))
        default:
          if(state.word) {
            store.dispatch({ type: actionType.resetWord })
            if(state.word === message) return client.replyMessage(replyToken, replyMessageTemplate.singleText('✅ Bingo 🎉'))
            if(state.word !== message) return client.replyMessage(replyToken, replyMessageTemplate.singleText(`❎ Sorry, the answer is *${state.word}* 😢`))
          }
          break;
      } 
    }
  }

  const port: string | number = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`listening on ${port}`);
  });