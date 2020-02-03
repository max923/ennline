import compose from './utils/compose'
import { TextMessage, ImageMessage, AudioMessage } from '@line/bot-sdk'
import { get, isEmpty } from 'lodash'


interface Node{
  word: string,
  zhTW: string,
  reply: Object[],
}

const singleText = (text: string): object =>({ type: 'text', text: text })

const handleAddButton = (node: { word: string, zhTW: string }) => ({
  type: "button",
  style: "primary",
  margin: "sm",
  height: "sm",
  action: {
    type: "postback",
    label: 'Click to add',
    data: `action=add&word=${node.word}&zhTW=${node.zhTW}`,
  }
})
const handleDailyQuizStartButton = () => ({
  type: "button",
  style: "primary",
  margin: "sm",
  height: "sm",
  action: {
    type: "postback",
    label: 'Chick to start',
    data: `action=dailyQuiz`,
  }
})

const handleAddText = (node: Node) => ({
  type: "text",
  align: "center",
  text: node.word,
})

const handleFlexBox = (node: { reply:object[] }) => ({
  type: 'flex',
  altText: 'This is a flex message',
  contents: {
    "type": "bubble",
    "size": "kilo",
    "body": {
      "type": "box",
      "layout": "vertical",
      "paddingAll": "8px",
      "paddingStart": "15px",
      "paddingEnd": "15px",
      "contents": [...node.reply]
    }
  }
})

const handleImage = (node: Node): ImageMessage | null => {
  const url = get(node, 'picture.url', '')
  return !isEmpty(url) ? {
    "type": "image",
    "originalContentUrl": url,
    "previewImageUrl": url
  } : null
}

const handleTranslate = (node: Node): TextMessage | null => {
  const zhTW = get(node, 'translate.zhTW', '')
  return !isEmpty(zhTW) ? {
    "type": "text",
    "text": zhTW,
  } : null
}

const handleDescription =  (node: Node): TextMessage | null => {
  const description = get(node, 'description', '')
  return !isEmpty(description) ? {
    "type": "text",
    "text": description,
  } : null
}

const handleExample = (node: Node): TextMessage | null => {
  const examples = get(node, 'ex', [])
  return !isEmpty(examples) ? {
    "type": "text",
    "text": `Ex: ${examples[0]}\nEx: ${examples[1]}`,
  } : null
}

const handleBlandFill = (node: Node): TextMessage | null => {
  const word = get(node, 'word', '')
  return !isEmpty(word) ? {
    "type": "text",
    "text": word.split('').reduce((a: string, b: string, i: number): string => i > 1 ? a + ' _ ' : a + b, ''),
  } : null
}

const handleAudio = (node: Node): AudioMessage | null => {
  const url = get(node, 'audio.url', '')
  return !isEmpty(url) ? {
    "type": "audio",
    "originalContentUrl": url,
    "duration": 6000,
  } : null
}

const replyPipe = (createMessage: Function) => <T>(node: T) => {
  const previous = get(node, 'reply', [])
  return createMessage(node) ? Object.assign({}, node, {reply: [...previous, createMessage(node)]})
    : node
}

const ButtonType = compose(replyPipe)
const TextType = compose(replyPipe)
const ImageType = compose(replyPipe)
const AudioType = compose(replyPipe)
const createFlexBoxType = compose(handleFlexBox)

function Message(): {
  question: Function,
  detail: Function,
  singleText: Function,
  dailyQuiz: {
    start: Function
  },
  add: Function,
} {
  const question = <T>(node: T): T => compose(
    ImageType(handleImage),
    TextType(handleTranslate),
    TextType(handleBlandFill),
    AudioType(handleAudio)
  )(node)

  const detail = <T>(node: T): T => compose(
    ImageType(handleImage),
    TextType(handleTranslate),
    TextType(handleDescription),
    ImageType(handleExample),
    AudioType(handleAudio)
  )(node)
  
  const add = <T>(node: T): T => compose(
    TextType(handleAddText),
    ButtonType(handleAddButton),
    createFlexBoxType,
  )(node)

  return {
    question,
    detail,
    singleText,
    dailyQuiz: {
      start: () => compose(
          ButtonType(handleDailyQuizStartButton),
          createFlexBoxType
        )({})
    },
    add,
  }
}
export default Message()
