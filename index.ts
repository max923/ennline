import express from 'express'
import { Client, middleware } from '@line/bot-sdk'
import { createStore } from 'redux'
import reducers, { actionType } from './reducers/index'
import { get, isNil, isEmpty } from 'lodash'
import replyMessageTemplate from './src/message'
import firsebase from './firsebase/index'
import { fetch, getConfig } from './helper'
import { calcRandom, paramsToObject } from './src/utils'
import messageMotion from './const'

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

      const isCorrectAnswer = (a: string, b: string): boolean => a === b
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
          case 'dailyQuiz':
            const quizQuantity = 30
            const isExpiredDailyQuiz = await db.isExpiredDailyQuiz()
            const { currentNum, questions } = isExpiredDailyQuiz ? await db.setUserDailyQuiz(quizQuantity) : await db.getUserDailyQuiz()
            // Step - > exit            
            if(postback.step === 'exit') {
              store.dispatch({ type: actionType.resetDailyQuiz })
              return client.replyMessage(replyToken, replyMessageTemplate.singleText('Success'))
            }
            // Step - > start
            if(postback.step === 'start') {
              store.dispatch({ type: actionType.setDailyQuizStatus })
              store.dispatch({ type: actionType.updateQuestion, payload: questions[currentNum] })
              return client.replyMessage(
                replyToken,
                [replyMessageTemplate.singleText(`Q${currentNum + 1}: `)].concat(replyMessageTemplate.question(questions[currentNum]).reply)
              )
            } 
            // Step - > next
            if(postback.step === 'next') {
              const nextQuestion = await db.updateUserDailyQuiz({
                currentNum: currentNum + 1,
              })
              if(nextQuestion.currentNum === quizQuantity) {
                store.dispatch({ type: actionType.resetDailyQuiz })
                db.updateUserDailyQuiz({
                  currentNum: 0,
                })
                return client.replyMessage(replyToken, replyMessageTemplate.singleText('恭喜完成測驗'))
              } 
              store.dispatch({ type: actionType.updateQuestion, payload: nextQuestion.questions[nextQuestion.currentNum] })
              return client.replyMessage(
                replyToken,
                [replyMessageTemplate.singleText(`Q${nextQuestion.currentNum + 1}: `)].concat(replyMessageTemplate.question(nextQuestion.questions[nextQuestion.currentNum]).reply)
              )
            }
            break;
        }
        
      }
      /**
       *  Handle by status
      */
      switch (state.user.status) {
        case 'search':
          // Reset status while is searching already.
          store.dispatch({ type: actionType.resetStatus })
          const { isHave, node } = await getSearchNode(message)
          if(isHave) return  client.replyMessage(replyToken, replyMessageTemplate.detail(node).reply)
          return isEmpty(node.zhTW) ? client.replyMessage(replyToken, replyMessageTemplate.singleText('抱歉 查無此單字'))
            : client.replyMessage(replyToken, [replyMessageTemplate.singleText(node.zhTW), replyMessageTemplate.add(node).reply])
        case 'dailyQuiz':
          if(get(state, 'question.word')) {
            store.dispatch({ type: actionType.resetQuestion })
            // Correct respond
            if(isCorrectAnswer(get(state, 'question.word'), message)) return client.replyMessage(replyToken,[
              replyMessageTemplate.singleText('✅ Bingo 🎉'),
              replyMessageTemplate.dailyQuiz.next().reply
            ])
            // Wrong respond
            else {
              return client.replyMessage(replyToken, [
                replyMessageTemplate.singleText(`❎ Sorry, the answer is *${get(state, 'question.word')}* 😢`),
                replyMessageTemplate.dailyQuiz.next().reply
              ])
            }
          }
          break;
        default:
          store.dispatch({ type: actionType.resetStatus })
          break;
      }
      /**
       *  Handle by message
      */
      switch (message) {
        case messageMotion.random:
          const node = await getQuizQuestion()
          store.dispatch({ type: actionType.updateQuestion, payload: node })
          return client.replyMessage(replyToken, replyMessageTemplate.question(node).reply)
        case messageMotion.search:
          store.dispatch({ type: actionType.setSearchStatus })
          return client.replyMessage(replyToken, replyMessageTemplate.singleText('請輸入單字'))
        case messageMotion.dailyQuiz:
          return client.replyMessage(replyToken, replyMessageTemplate.dailyQuiz.start().reply)
        default:
          if(get(state, 'question.word')) {
            store.dispatch({ type: actionType.resetQuestion })
            if(isCorrectAnswer(get(state, 'question.word'), message))return client.replyMessage(replyToken, replyMessageTemplate.singleText('✅ Bingo 🎉'))
            else return client.replyMessage(replyToken, replyMessageTemplate.singleText(`❎ Sorry, the answer is *${get(state, 'question.word')}* 😢`))
          }
          break;
      } 
    }
  }

  const port: string | number = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`listening on ${port}`);
  });