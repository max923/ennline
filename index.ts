import express from 'express'
import { Client, middleware } from '@line/bot-sdk'
import { createStore } from 'redux'
import reducers, { actionType } from './reducers/index'
import { get, isNil, isEmpty } from 'lodash'
import replyMessageTemplate from './replyMessage'
import firsebase from './firsebase/index'
import fetch from './helper/fetch'


enum messageMotion {
  random = '抽',
  search = '@search',
  exam = '@exam',
}
let client = {} as {
  replyMessage: Function
}
let store = createStore(reducers)

function isSearchFromDictionary(message: string): boolean {
  return message[0] === messageMotion.search ? true : false
}
interface LineConfig {
  channelId: string,
  channelSecret: string,
  channelAccessToken: string,
}
(async function(){
  // create Express app
  const app = express();
  if (process.env.NODE_ENV === 'production') {
    const config = {
      Line: {
        channelId: process.env.channelId,
        channelSecret: process.env.channelSecret,
        channelAccessToken: process.env.channelSecret,
      } as LineConfig
    }
    console.log('production config', config)
    // create LINE SDK client
    client = new Client(config.Line);
    app.post('/linewebhook', middleware(config.Line), (req: any, res: any) => {
      // req.body.events should be an array of events
      if (!Array.isArray(req.body.events))  return res.status(500).end();
      Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result));
    });
  } else {
    const config = await import('./config')
      .then(responsive => responsive) as {
        default: {
          Line: LineConfig
        }
      }
    // create LINE SDK client
    client = new Client(config.default.Line);
    app.post('/linewebhook', middleware(config.default.Line), (req: any, res: any) => {
      // req.body.events should be an array of events
      if (!Array.isArray(req.body.events))  return res.status(500).end();
      Promise
        .all(req.body.events.map(handleEvent))
        .then((result) => res.json(result));
    });
  }

  /**
   * Handle reply event
   * @param event 
   */
  async function handleEvent(event: {
    reply: Function
  }) {
    const message: string = get(event, 'message.text', '').trim()
    const userId: string = get(event, 'source.userId', null)
    const replyToken: string = get(event, 'replyToken', null)
    const state = store.getState()
    const db = firsebase(userId)
    if (replyToken && replyToken.match(/^(.)\1*$/)) {
      return console.log("Test hook recieved: " + JSON.stringify(message));
    }
    if(!state.user.enabled && !await db.isUserExist()) {
      return client.replyMessage(replyToken, replyMessageTemplate.text('User is not found'))
    } else {
      store.dispatch({ type: actionType.enableUser })
      /**
       *  Search from dictionary
       */
      const getSearchNode = async (message: string): Promise<{ isHave: boolean, node: any }> => {
        const node = await db.getWordNodeValue(message)
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
            if(Math.floor(Math.random() * 5) > 2) {
              return await db.getRandomNode().overWeightNode() || db.getRandomNode().oneWeight()
            }
            else return await db.getRandomNode().oneWeight() || db.getRandomNode().overWeightNode()
          case 'Incorrect':
            return db.getRandomNode().overWeightNode()
          default: 
            return new Promise((resolve) => resolve({}))
        }
      }
      /**
       *  Reply by mode
      */
      switch (state.user.status) {
        case 'search':
          (async function(){
            store.dispatch({ type: actionType.resetStatus })
            const { isHave, node } = await getSearchNode(message)
            if(isHave) return  client.replyMessage(replyToken, replyMessageTemplate.detail(node).reply)
            return isEmpty(node.zhTW) ? client.replyMessage(replyToken, replyMessageTemplate.text('抱歉 查無此單字'))
              : client.replyMessage(replyToken, replyMessageTemplate.text(node.zhTW))
          })()
          break;
        default:
          break;
      }
      /**
       *  Reply message
      */
      switch (message) {
        case messageMotion.random:
          (async function(){
            const setting = await db.getSetting() as { mode: string }
            const node = await getRandomNode(setting.mode) as { word: string }
            store.dispatch({ type: actionType.updateWord, payload: node.word })
            return client.replyMessage(replyToken, replyMessageTemplate.question(node).reply)
          })()
          break;
        case messageMotion.search:
            (async function(){
              store.dispatch({ type: actionType.setSearchStatus })
              return client.replyMessage(replyToken, replyMessageTemplate.text('請輸入單字'))
            })()
          break;
        case messageMotion.exam:
          break;
        default:
          if(state.word) {
            store.dispatch({ type: actionType.resetWord })
            if(state.word === message) return client.replyMessage(replyToken, replyMessageTemplate.text('✅ Bingo 🎉'))
            if(state.word !== message) return client.replyMessage(replyToken, replyMessageTemplate.text(`❎ Sorry, the answer is *${state.word}* 😢`))
          }
          break;
      } 
    }
  }

  const port: string | number = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`listening on ${port}`);
  });
})()