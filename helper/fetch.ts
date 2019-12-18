import request from 'superagent'
import config from '../config'
function definition(word: string): Promise<any> {
  try {
    return (
      request
      .get(`${config.Api.domain}/api/definition?word=${word}`)
      .then(({ body }) => body)
      .catch(() => null)
    )
  } catch (error) {    
    return new Promise((resolve) => resolve(null))
  }

}
export default {
  definition
}