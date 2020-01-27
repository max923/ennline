import { combineReducers } from 'redux'
export enum actionType {
  updateWord = 'UPDATEWORD',
  resetWord = 'RESETWORD',
  enableUser = 'ENABLEUSER',
  setSearchStatus = 'SETSEARCHSTATUS',
  setDailyQuizStatus = 'SETDAILYQUIZSTATUS',
  updateDailyQuizNum = 'UPDATEDAILYQUIZNUM',
  updatDailyQuizWord = 'UPDATEDAILYQUIZWORD',
  resetStatus = 'RESETSTATUS'
}
const word = (state = '', action: { type: string, payload?: string }): string =>{
  switch (action.type) {
    case 'UPDATEWORD':
      return action.payload || ''
    case 'RESETWORD':
      return ''
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
        return Object.assign(state, { status: '' })
    default:
      return state
  }
}
const quiz = (state={ num: 0, word: '' }, action: { type: string, payload?: string }): any => {
  switch (action.type) {
    case 'UPDATEDAILYQUIZNUM':
      return Object.assign(state, { num: state.num + 1 })
    case 'UPDATEDAILYQUIZWORD':
      return Object.assign(state, { word: action.payload })
    default:
      return state
  }
}

export default combineReducers({
  word,
  user,
  quiz
})

