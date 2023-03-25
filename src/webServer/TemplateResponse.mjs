class TemplateResponse {
    constructor(layout, template){
        this.layout = layout
        this.template = template
    }
    static compile(template){
        return new Function('model', `return \`${template}\``)
    }
    render(model){
        let html = ''
        if(this.layout){
            html = TemplateResponse.compile(this.layout)({content: TemplateResponse.compile(this.template)(model)})
        } else {
            html = TemplateResponse.compile(this.template)(model)
        }
        return new Response(html, {
            status: 200,
            statusText: 'OK',
            headers: {
                'Content-Type': 'text/html'
            }
        })
    }
}

export default TemplateResponse