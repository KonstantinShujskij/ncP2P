const OpenAI = require('openai')
const path = require('path')
const fs = require('fs')

const config = require('config')
const Pdf = require('./pdf.utils')


const extractFunction = {
    type: "function",
    function: {
        name: "extract_invoice_data",
        description: "Extracts specific data from an invoice image",
        parameters: {
            type: "object",
            required: [
                "invoice_image",
                "invoice_number",
                "invoice_date",
                "amount",
                "recipient_card",
            ],
            // properties: {
            //     amount: { type: "number", description: "Total amount stated on the invoice" },
            //     invoice_date: { type: "string", description: "Invoice date in YYYY-MM-DD hh-mm-ss format" },
            //     invoice_image: { type: "string", description: "Base64 encoded string of the invoice image" },
            //     invoice_number: { type: "string", description: "Invoice number extracted from the image" },
            //     recipient_card: { type: "string", description: "Recipient's card information" },
            // },
            properties: {
                amount: { type: "number", description: "Сума переказу або сума операції або сума" },
                invoice_date: { type: "string", description: "Дата переказу в форматі YYYY-MM-DD hh-mm-ss " },
                invoice_image: { type: "string", description: "Base64 encoded string of the invoice image" },
                invoice_number: { type: "string", description: "Номер квитанції або номер інструкції або номер переказу" },
                recipient_card: { type: "string", description: "Намер картки отримувача або отримувач або картка отримувача" },
            },
            additionalProperties: false,
        },
    },
} 

function encodeImageToBase64(fileName) {
    const filePath = path.join(__dirname, `../static/kvits/${fileName}`)
    
    const imageBuffer = fs.readFileSync(filePath)
    return imageBuffer.toString("base64")
}

async function getData(messages) {
    console.log(messages);

    try {
        const apiKey = config.get('gptApiKey')
        const openai = new OpenAI({ apiKey })

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages,
            tools: [ extractFunction ],
            tool_choice: "auto", 
        })        

        const toolCalls = completion.choices[0]?.message?.tool_calls;
        if(toolCalls) { return JSON.parse(toolCalls[0].function.arguments) } 
    
        return null
    } 
    catch (error) {
        console.error("GPT Error:", error)

        return null
    }
}

async function getImageData(fileName) {
    const base64Image = encodeImageToBase64(fileName)      
    if(!base64Image) { return null }  

    const messages = [
        { role: "user", content: "Треба знайти на зображенні такі данні: Номер квитнації, дата квитанції, сума переказу, картка отримувача." },
        { 
            role: "user", 
            content: [{ type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }] 
        }
    ]

    return await getData(messages)
}

async function getPdfData(fileName) {    
    const text = await Pdf.getKvitText(fileName)
    if(!text) { return null }

    const messages = [
        { role: "user", content: "Extract data from this invoice PDF." },
        { role: "user", content: text } 
    ]

    return await getData(messages)
}


module.exports = {
    getData,
    getImageData,
    getPdfData
}
