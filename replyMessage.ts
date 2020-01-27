import compose from './utils/compose'
import { TextMessage, ImageMessage, AudioMessage } from '@line/bot-sdk'
import { get, isEmpty } from 'lodash'

interface Node {
  word: string,
  reply: object[]
}

const ButtonType = (createButton: Function) => <T>(node: T) => {
  const previous = get(node, 'reply', [])
  return Object.assign({}, node, {reply: [...previous, createButton(node)]})
}

const TextType = (createText: Function) => <T>(node: T) => {
  const previous = get(node, 'reply', [])
  return Object.assign({}, node, {
    reply: [...previous, createText(node)]
  })
}

const singleText = (text: string): object =>({ type: 'text', text: text })

const handleImage = <T>(node: T): ImageMessage | T => {
  const previous = get(node, 'reply', [])
  const picUrl = get(node, 'picture.url', '')
  return !isEmpty(picUrl) ? Object.assign({}, node, {reply: [...previous, {
    "type": "image",
    "originalContentUrl": picUrl,
    "previewImageUrl": picUrl
  }]}) : node
}

const handleTranslate = <T>(node: T): T | TextMessage => {
  const previous = get(node, 'reply', [])
  const zhTW = get(node, 'translate.zhTW', '')
  return !isEmpty(zhTW) ? Object.assign({} ,node, {reply: [...previous, {
    "type": "text",
    "text": zhTW,
  }]}) : node
}

const handleDescription =  <T>(node: T): T | TextMessage => {
  const previous = get(node, 'reply', [])
  const description = get(node, 'description', '')
  return !isEmpty(description) ? Object.assign({}, node, {reply: [...previous, {
    "type": "text",
    "text": description,
  }]}) : node
}

const handleExample = <T>(node: T): T | TextMessage => {
  const previous = get(node, 'reply', [])
  const examples = get(node, 'ex', [])
  return !isEmpty(examples) ? Object.assign({}, node, {reply: [...previous, {
    "type": "text",
    "text": `Ex: ${examples[0]}\nEx: ${examples[1]}`,
  }]}) : node
}

const handleAudio =  <T>(node: T): T | AudioMessage => {
  const previous = get(node, 'reply', [])
  const url = get(node, 'audio.url', '')
  return !isEmpty(url) ? Object.assign({}, node, {reply: [...previous, {
    "type": "audio",
    "originalContentUrl": get(node, 'audio.url', ''),
    "duration": 6000,
  }]}) : node
}

const handleBlandFill = <T>(node: T): T | TextMessage => {
  const previous = get(node, 'reply', [])
  const word = get(node, 'word', '')
  if(isEmpty(word)) return node
  const blandText = word.split('').reduce((a: string, b: string, i: number): string => i > 1 ? a + ' _ ' : a + b, '')
  return Object.assign({}, node, {reply: [...previous, {
    "type": "text",
    "text": blandText,
  }]})
}

const createByFlexBox = <T>(node: T) => {
  const previous = get(node, 'reply', [])
  return Object.assign({}, node, {reply:{
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
        "contents": [...previous]
      }
    }
  }})
}
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
const handleAddText = (node: Node) => ({
  type: "text",
  align: "center",
  text: node.word,
})

function Message(): {
  question: Function,
  detail: Function,
  singleText: Function,
  dailyQuiz: Function,
  add: Function,
} {
  const question = <T>(node: T): T => compose(
    handleImage,
    handleTranslate,
    handleBlandFill,
    handleAudio
  )(node)

  const detail = <T>(node: T): T => compose(
    handleImage,
    handleDescription,
    handleExample,
    handleTranslate,
    handleAudio
  )(node)

  const dailyQuiz = <T>(node: T): T => compose(
    handleTranslate,
    handleBlandFill,
  )(node)
  
  const add = <T>(node: T): T => compose(
    TextType(handleAddText),
    ButtonType(handleAddButton),
    createByFlexBox,
  )(node)

  return {
    question,
    detail,
    singleText,
    dailyQuiz,
    add,
  }
}
export default Message()

// const flexCompositon= () => {
//   return {
//     type: 'flex',
//     altText: 'This is a flex message',
//     contents: {
//       "type": "bubble",
//       "size": "kilo",
//       "body": {
//         "type": "box",
//         "layout": "vertical",
//         "paddingAll": "8px",
//         "paddingStart": "15px",
//         "paddingEnd": "15px",
//         "contents": [
//           {
//             type: 'text',
//             text: 'abandon',
//             align: 'center',
//           },
//           {
//             "type": "button",
//             "style": "primary",
//             "margin": "sm",
//             "height": "sm",
//             "action": {
//               "type": "uri",
//               "label": "Click to add",
//               "uri": "https://example.com"
//             }
//           },
//         ]
//       }
//     }
//   }
// }