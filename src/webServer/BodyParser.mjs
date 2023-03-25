const parse = async (req, response, server) => {
    const {done, value} = await req.body.getReader().read()
    req.methodExtended = req.method
    if(value){
        const decoded = new TextDecoder().decode(value)
        let previousKey = null
        const obj = decoded.split('&').reduce((acc, current)=> {
            let [key, value] = current.split('=')
            value = decodeURIComponent(value)
            if(key == previousKey){
                acc[key] = [...acc[key], value]
            }else{
                acc[key] = value
            }
            previousKey = key
            return acc
        }, {})
        req.bodyParsed = obj
        req.methodExtended = req.bodyParsed?._method ?? req.method
    }
    return null
}

export {
    parse
}