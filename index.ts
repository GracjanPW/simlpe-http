import {createServer} from "net";
import {existsSync, readdir, readdirSync, readFileSync, stat, statSync} from "node:fs"
import path from "path"

const publicDir = path.join(import.meta.dirname,"/public")

function searchResource(dir:string,itemPath:string){
    console.log({dir, itemPath})
    const files = readdirSync(dir)
    for (const file of files) {
        const filePath = path.join(dir,file)
        const fileStat =  statSync(filePath)
        if (fileStat.isDirectory()){
            const dirs = itemPath.split("/")
            const newDir = path.join(dir,dirs[0])
            console.log(dirs)
            if (filePath === newDir){
                dirs.shift()
                console.log(dirs)
                return searchResource(newDir,dirs.join("/"))
            }
        } else{
            if (itemPath===""){
                if (filePath.endsWith("index.html")){
                    return filePath
                }
            } else {
                if (filePath.endsWith(itemPath+".html")) {
                    return filePath
                }
            }
        }
            
    }
    return null
}

createServer(async (socket) => {
    socket.on("connect",()=>{
        console.log("Connected")
    })

    socket.on("close",(stream: any)=>{
        console.log(stream)
        console.log("Connection closed")
    })

    let requestData = ""
    let method = null
    let protocol = null
    let resourcePath = null
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
            resourcePath = startLine[1].split('/').filter(x=>x!=='').join("/")
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
                resourcePath,
                protocol
            })
        }
        if (method==="GET") {
            
            const filePath = searchResource(publicDir,resourcePath!)
            console.log(filePath)
            if (filePath!==null) {
                const response = [
                    "HTTP/1.0 200 OK",
                    "Content-Type: text/html; charset=utf-8",
                ]
                socket.write(response.join("\r\n")+"\r\n\r\n")
                const data = readFileSync(filePath!, 'utf8');
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
                break
            }
        } else {
            socket.end()
            break
        }

    }
    
}).listen(3000)
