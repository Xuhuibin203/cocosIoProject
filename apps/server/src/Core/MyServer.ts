import { WebSocketServer,WebSocket } from "ws";
import { Connection } from "./Connection";
import { ApiMsgEnum } from "../Common";
import { EventEmitter } from "stream";

export class MyServer extends EventEmitter{
    wss:WebSocketServer;
    port:number;

    apiMap:Map<ApiMsgEnum,Function> = new Map();
    connections:Set<Connection > = new Set();
    constructor({port}:{port:number}){
        super();    //父类构造函数
        this.port = port;
    }
    //核心代码，不应该写业务逻辑，使用事件中心的方式，当有用户断开链接的时候，就发出一个事件，调出入口文件index去做逻辑
    start(){
        return new Promise((resolve,reject) => {
            this.wss = new WebSocketServer({ port: 9876 });
            this.wss.on("listening",()=>{resolve(true)});
            this.wss.on("close",()=>{reject(false)});
            this.wss.on("error",(e)=>{reject(e)});
            this.wss.on("connection",(ws:WebSocket)=>{
                const connection = new Connection(this,ws);
                this.connections.add(connection);
                this.emit("connection",connection);
                // console.log("wo lai le !",this.connections.size);
                connection.on("close",()=>{
                    this.connections.delete(connection);
                    this.emit("disconnection",connection);
                    // console.log("mo zou le !",this.connections.size);    //将这句话封装成事件了
                })
            });
        })
    } 

    //ApiMsgEnum即用在API服务，也用在MSG服务
    //其调用在index入口文件调用
    setApi(name:ApiMsgEnum,cb:Function){
        this.apiMap.set(name,cb);
    }
}