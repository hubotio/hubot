const parse = async (req, response, server) => {
    req.methodExtended = req.method
    if(req.bodyUsed) return null
    if(req.methodExtended.toLowerCase() == 'post'){
        const contentType = req.headers.get('content-type')?.toLowerCase()
        if(contentType == 'application/x-www-form-urlencoded'){
            const data = await req.formData()
            req.bodyParsed = {}
            for(const [key, value] of data){
                req.bodyParsed[key] = value
            }
            req.methodExtended = req.bodyParsed?._method ?? req.method
        }

        if(contentType == 'application/json'){
            req.bodyParsed = await req.json()
            req.methodExtended = req.bodyParsed?._method ?? req.method
        }
    }
    return null
}

export {
    parse
}