export default (...funcs: Function[]) => (value: any) => funcs.reduce((a,b) => b(a), value)
