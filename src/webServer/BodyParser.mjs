const parse = async (req, response, server) => {
    req.methodExtended = req.method
    console.log('content type', req.methodExtended, req.headers.get('content-type'))
    if(req.bodyUsed) return null

    if(req.methodExtended.toLowerCase() == 'post'){
        const contentType = req.headers.get('content-type')?.toLowerCase()
        if(contentType == 'application/x-www-form-urlencoded'){
            const data = await req.formData()
            req.bodyParsed = {}
            for(const [key, value] of data){
                req.bodyParsed[key] = value
                console.log(`key: ${key}, value: ${value}`)
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