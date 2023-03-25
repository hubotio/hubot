import path from 'path'
import MediaTypes from './MediaTypes.mjs'
import { fileURLToPath } from 'url'

const root = path.dirname(fileURLToPath(import.meta.url)).replace('src/webServer', '')
const fileServer = folder => async (req, response, server)=>{
    const url = req.urlParsed
    if(url.pathname == '/') url.pathname = '/index.html'
    let fileName = path.join(root, folder, url.pathname)
    const fileExtension = path.extname(fileName).replace('.', '')
    const mediaType = MediaTypes[fileExtension]
    const file = Bun.file(fileName)
    if(file.size == 0){
        return response
    }

    const headers = {
        'Content-Type': mediaType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,PUT,POST,DELETE',
        'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept'
    }
    if(response.headers.count > 0){
        response.headers.forEach((value, key) => {
            headers[key] = value
        })
    }
    return new Response(file.stream(), {
        status: 200,
        ok: true,
        url: req.url,
        statusText: 'OK',
        headers
    })
}
 
export {
    fileServer
}