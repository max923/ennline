import compose from './utils/compose'
import { TextMessage, ImageMessage, AudioMessage } from '@line/bot-sdk'
import _ from 'lodash'

interface Node {
  word: string,
  reply: object[]
}
function Message(): {
  question: Function,
  detail: Function,
  text: Function
} {
  const handleImage = (node: object) => {
    const previous = _.get(node, 'reply', [])
    const picUrl = _.get(node, 'picture.url', '')
    return picUrl ? Object.assign(node,{reply: [...previous, {
      "type": "image",
      "originalContentUrl": picUrl,
      "previewImageUrl": picUrl
    }]}): node  as ImageMessage
  }
  const handleTranslate = (node: object) => {
    const previous = _.get(node, 'reply', [])
    return Object.assign(node,{reply: [...previous, {
      "type": "text",
      "text": _.get(node, 'translate.zhTW', ''),
    }]}) as TextMessage
  }
  const handleDescription = (node: object) => {
    const previous = _.get(node, 'reply', [])
    const description = _.get(node, 'description', '')
    return !_.isEmpty(description) ? Object.assign(node,{reply: [...previous, {
      "type": "text",
      "text": description,
    }]}) : node as TextMessage
  }
  const handleExample = (node: object) => {
    const previous = _.get(node, 'reply', [])
    const examples = _.get(node, 'ex', [])
    return !_.isEmpty(examples) ? Object.assign(node,{reply: [...previous, {
      "type": "text",
      "text": `Ex: ${examples[0]}\nEx: ${examples[1]}`,
    }]}): node as TextMessage
  }
  const handleAudio = (node: object) => {
    const previous = _.get(node, 'reply', [])
    return Object.assign(node,{reply: [...previous, {
      "type": "audio",
      "originalContentUrl": _.get(node, 'audio.url', ''),
      "duration": 6000,
    }]}) as AudioMessage
  }
  const handleBlandFill = (node: Node) => {
    const previous = _.get(node, 'reply', [])
    const blandWord = node.word.split('').reduce((a: string, b: string, i: number): string => i > 1 ? a + ' _ ' : a + b, '')
    return Object.assign(node,{reply: [...previous, {
      "type": "text",
      "text": blandWord,
    }]})
  }
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
  const text = (text: string): object =>({ type: 'text', text: text })
  return {
    question,
    detail,
    text,
  }
}
export default Message()