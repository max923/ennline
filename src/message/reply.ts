
import { TextMessage, ImageMessage, AudioMessage } from '@line/bot-sdk'
import { get, isEmpty } from 'lodash'

interface Node{
  word: string,
  zhTW: string,
  reply: Object[],
}

const singleText = (text: string): object =>({ type: 'text', text: text })

const respondAddButton = (node: { word: string, zhTW: string }) => ({
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
const respondDailyQuizStartButton = () => ({
  type: "button",
  style: "primary",
  margin: "sm",
  height: "sm",
  action: {
    type: "postback",
    label: 'Chick to start',
    data: `action=dailyQuiz&step=start`,
  }
})

const respondAddText = (node: Node) => ({
  type: "text",
  align: "center",
  text: node.word,
})

const respondBingoText = () => ({
  type: "text",
  align: "center",
  text: "✅ Bingo 🎉",
})

const respondMistakeText = (node: Node) => ({
  type: "text",
  align: "center",
  text: `❎ Sorry, the answer is *${node.word}* 😢`,
})

const respondFinishText = () => ({
  type: "text",
  align: "center",
  text: '恭喜完成測驗',
})

const respondFinishMistakes = (node: { mistakes: string[] }) => ({
  type: "text",
  align: "center",
  text: `答錯單字: *${[...new Set(Object.values(node.mistakes))]}*`,
})


const respondFlexBox = (node: { reply:object[] }) => ({
  reply: {
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
  }
})

const respondImage = (node: Node): ImageMessage | null => {
  const url = get(node, 'picture.url', '')
  return !isEmpty(url) ? {
    "type": "image",
    "originalContentUrl": url,
    "previewImageUrl": url
  } : null
}

const respondTranslate = (node: Node): TextMessage | null => {
  const zhTW = get(node, 'translate.zhTW', '')
  return !isEmpty(zhTW) ? {
    "type": "text",
    "text": zhTW,
  } : null
}

const respondDescription =  (node: Node): TextMessage | null => {
  const description = get(node, 'description', '')
  return !isEmpty(description) ? {
    "type": "text",
    "text": description,
  } : null
}

const respondExample = (node: Node): TextMessage | null => {
  const examples = get(node, 'ex', [])
  return !isEmpty(examples) ? {
    "type": "text",
    "text": `Ex: ${examples[0] || ''}\n\nEx: ${examples[1] || ''}`,
  } : null
}

const respondBlandFill = (node: Node): TextMessage | null => {
  const word = get(node, 'word', '')
  return !isEmpty(word) ? {
    "type": "text",
    "text": word.split('').reduce((a: string, b: string, i: number): string => i > 1 ? a + ' _ ' : a + b, ''),
  } : null
}

const respondAudio = (node: Node): AudioMessage | null => {
  const url = get(node, 'audio.url', '')
  return !isEmpty(url) ? {
    "type": "audio",
    "originalContentUrl": url,
    "duration": 6000,
  } : null
}

const respondNextQButton = () => ({
  type: "button",
  style: "primary",
  margin: "sm",
  height: "sm",
  action: {
    type: "postback",
    label: 'Chick to next',
    data: `action=dailyQuiz&step=next`,
  }
})

const respondExitQButton = () => ({
  type: "button",
  style: "secondary",
  margin: "sm",
  height: "sm",
  action: {
    type: "postback",
    label: 'Chick to exit',
    data: `action=dailyQuiz&step=exit`,
  }
})

export {
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
  respondBingoText,
  respondMistakeText,
  respondFinishText,
  respondFinishMistakes
}
