import {createServer} from "net";
import {readFileSync} from "node:fs"


createServer(async (socket) => {
    socket.on("connect",()=>{
        console.log("Connected")
    })

    socket.on("close",(stream: any)=>{
        console.log("Connection closed")
    })

    let requestData = ""
    let method = null
    let protocol = null
    let path = null
    let requestHeaders = null
    let requestHeadersLength = null

    for await (let chunk of socket) {
        requestData += chunk.toString()
        if (!requestData.includes("\r\n\r\n")) {
            continue
        }

        if (requestHeaders === null) {
            let [headerData] = requestData.split('\r\n\r\n')
            
            requestHeadersLength = headerData.length

            let headerLines = headerData.split('\r\n')

            let startLine = headerLines[0].split(" ");
            
            method = startLine[0]
            path = startLine[1]
            protocol = startLine[2]

            headerLines.shift()
            
            requestHeaders = headerLines.reduce((acc,item)=>{
                let [key,value] = item.split(": ").map((part)=>part.trim())
                acc[key] = value
                return acc
            },{} as Record<any,String>)
            console.log({
                requestHeaders,
                method,
                path,
                protocol
            })
        }
        if (method==="GET") {
            if (path==="/") {
                const response = [
                    "HTTP/1.0 200 OK",
                    "Content-Type: text/html; charset=utf-8",
                ]
                socket.write(response.join("\r\n")+"\r\n\r\n")
                const data = readFileSync('./public/index.html', 'utf8');
                socket.write(data)
                socket.end()
                break
            } else {
                const response = [
                    "HTTP/1.0 200 OK",
                    "Content-Type: text/html; charset=utf-8",
                ]
                socket.write(response.join("\r\n")+"\r\n\r\n")
                const data = readFileSync("./public/404_page.html", 'utf-8');
                socket.write(data)
                socket.end()
            }
        } else {
            socket.end()
        }

    }
    
}).listen(3000)
