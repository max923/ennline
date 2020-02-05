interface Obj {
  [key: string]: string;
}
function paramsToObject(queryString: string): Obj {
  const obj = {} as Obj;
  const pairs = queryString.split('&');
  for(const i in pairs){
    var split = pairs[i].split('=');
    obj[decodeURIComponent(split[0])] = decodeURIComponent(split[1]);
  }
  return obj
}
export default paramsToObject