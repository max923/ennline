import request from 'superagent'
import { getConfig } from '../utils'
function definition(word: string): Promise<{
  word: string,
  zhTW: string,
} | null> {
  try {
    return (
      request
      .get(`${getConfig(process).Api.domain}/api/definition?word=${word}`)
      .then(({ body }) => body)
      .catch(() => null)
    )
  } catch (error) {    
    return new Promise((resolve) => resolve(null))
  }
}

function search(word: string): Promise<{
  word: string,
  examples: string[],
  voice: string,
  def: string,
} | null> {
  try {
    return (
      request
      .get(`${getConfig(process).Api.domain}/api/search?word=${word}`)
      .then(({ body }) => body)
      .catch(() => null)
    )
  } catch (error) {
    return new Promise((resolve) => resolve(null))
  }
}
export default {
  definition,
  search
}