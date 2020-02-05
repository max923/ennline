import { combineReducers } from 'redux'
import { Vocabulary } from '../src/type'
export enum actionType {
  updateQuestion = 'UPDATEQUESTION',
  resetQuestion = 'RESETQUESTION',
  enableUser = 'ENABLEUSER',
  setSearchStatus = 'SETSEARCHSTATUS',
  setDailyQuizStatus = 'SETDAILYQUIZSTATUS',
  updateDailyQuiz = 'UPDATEDAILYQUIZ',
  resetDailyQuiz = 'RESETDAILYQUIZ',
  resetStatus = 'RESETSTATUS'
}
const question = (state = {}, action: { type: string, payload?: Vocabulary }): Vocabulary | object =>{
  switch (action.type) {
    case 'UPDATEQUESTION':
      return action.payload || {}
    case 'RESETQUESTION':
    case 'RESETDAILYQUIZ':
      return state
    default:
      return state
  }
}
interface User{
  enabled: boolean,
  status: string,
}
const user = (state={ enabled: false, status: '' }, action: { type: string, payload?: string }): User => {
  switch (action.type) {
    case 'ENABLEUSER':
      return Object.assign(state, { enabled: true })
    case 'SETNOTENABLEUSER':
      return Object.assign(state, { enabled: false })
    case 'SETSEARCHSTATUS':
        return Object.assign(state, { status: 'search' })
    case 'SETDAILYQUIZSTATUS':
        return Object.assign(state, { status: 'dailyQuiz' })
    case 'RESETSTATUS':
    case 'RESETDAILYQUIZ':
        return Object.assign(state, { status: '' })
    default:
      return state
  }
}
const quiz = (state={ currentNum: 0, mistakes: [] }, action: { type: string, payload?: object }): any => {
  switch (action.type) {
    case 'UPDATEDAILYQUIZ':      
      return Object.assign(state, action.payload)
    case 'RESETDAILYQUIZ':
      return state
    default:
      return state
  }
}

export default combineReducers({
  question,
  user,
  quiz
})

