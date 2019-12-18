import { combineReducers } from 'redux'
export enum actionType {
  updateWord = 'UPDATEWORD',
  resetWord = 'RESETWORD',
  enableUser = 'ENABLEUSER',
  setSearchStatus = 'SETSEARCHSTATUS',
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
    case 'RESETSTATUS':
        return Object.assign(state, { status: '' })
    default:
      return state
  }
}


export default combineReducers({
  word,
  user,
})

