import { get } from 'lodash'
import compose from '../utils/compose'
import {
  singleText,
  respondAddButton,
  respondDailyQuizStartButton,
  respondAddText,
  respondFlexBox,
  respondImage,
  respondTranslate,
  respondDescription,
  respondExample,
  respondBlandFill,
  respondAudio,
  respondNextQButton,
  respondExitQButton,
  respondBingoText
} from './reply'

const replyPipe = (createMessage: Function) => <T>(node: T) => {
  const previous = get(node, 'reply', [])
  return createMessage(node) ? Object.assign({}, node, {reply: [...previous, createMessage(node)]})
    : node
}

const ButtonType = compose(replyPipe)
const TextType = compose(replyPipe)
const ImageType = compose(replyPipe)
const AudioType = compose(replyPipe)
const createFlexBoxType = compose(respondFlexBox)

function Message(): {
  question: Function,
  detail: Function,
  singleText: Function,
  dailyQuiz: {
    start: Function,
    next: Function,
    correct: Function
  },
  add: Function,
} {
  const question = <T>(node: T): T => compose(
    ImageType(respondImage),
    TextType(respondTranslate),
    TextType(respondBlandFill),
    AudioType(respondAudio)
  )(node)

  const detail = <T>(node: T): T => compose(
    ImageType(respondImage),
    TextType(respondTranslate),
    TextType(respondDescription),
    TextType(respondExample),
    AudioType(respondAudio)
  )(node)
  
  const add = <T>(node: T): T => compose(
    TextType(respondAddText),
    ButtonType(respondAddButton),
    createFlexBoxType,
  )(node)

  return {
    question,
    detail,
    singleText,
    dailyQuiz: {
      start: () => compose(
          ButtonType(respondDailyQuizStartButton),
          ButtonType(respondExitQButton),
          createFlexBoxType
        )({}),
      next: () => compose(
        ButtonType(respondNextQButton),
        ButtonType(respondExitQButton),
        createFlexBoxType
      )({}),
      correct: <T>(node: T): T => compose(
        TextType(respondExample),
        TextType(respondBingoText),
      )(node)
    },
    add,
  }
}
export default Message()
