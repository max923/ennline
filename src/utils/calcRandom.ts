/**
 * Giving a number for array length,
 * the array include the numbers with random by 1 or 0
 */
function caculateRandom(num: number): number[] {
  const result = []
  for(var i = 0; i < num; i++ ) {
    if(Math.floor(Math.random() * 5) > 2) result.push(0)
    else  result.push(1)
  }
  return result
}
export default caculateRandom