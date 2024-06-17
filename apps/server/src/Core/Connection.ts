import { EventEmitter } from "stream";
import { MyServer } from "./MyServer";
import { WebSocketServer, WebSocket } from "ws";
import { Console } from "console";

interface IItem {
    cb: Function;
    ctx: unknown;
}

export class Connection extends EventEmitter {

    private msgMap: Map<string, Array<IItem>> = new Map();

    // playerId属于业务逻辑，不应该写在核心代码中
    // playerId:number;


    constructor(private server: MyServer, private ws: WebSocket) {
        super();
        this.ws.on("close", () => {
            this.emit("close")
        })
        this.ws.on("message", (buffer) => {
            const str = buffer.toString();
            try {
                const msg = JSON.parse(str);
                const { name, data } = msg;
                //如果没有API服务就执行MSG服务
                if (this.server.apiMap.has(name)) {
                    //得到结果以后又重新发回给客户端
                    try {
                        const cb = this.server.apiMap.get(name);
                        const res = cb.call(null, this, data);
                        this.sendMsg(name, {
                            success: true,
                            res,    //NetworkManager的callApi事件中需要的参数   
                        })
                    } catch (e) {
                        this.sendMsg(name, {
                            success: false,
                            error: e.message,    //NetworkManager的callApi事件中需要的参数   
                        })
                    }
                } else {
                    try {
                        if (this.msgMap.has(name)) {
                            this.msgMap.get(name).forEach(({ cb, ctx }) => {
                                cb.call(ctx, data);
                            })
                        }
                    } catch (e) {
                        console.log(e)
                    }

                }

            } catch (e) {
                console.log(e);
            }
        })
    }


    sendMsg(name: string, data) {
        const msg = {
            name, data,
        }
        this.ws.send(JSON.stringify(msg));
    }

    listenMsg(name: string, cb: Function, ctx: unknown) {
        if (this.msgMap.has(name)) {
            this.msgMap.get(name).push({ cb, ctx });
        } else {
            this.msgMap.set(name, [{ cb, ctx }])
        }
    }

    unlistenMsg(name: string, cb: Function, ctx: unknown) {
        if (this.msgMap.has(name)) {
            const index = this.msgMap.get(name).findIndex((i) => cb === i.cb && ctx === i.ctx);
            index > -1 && this.msgMap.get(name).splice(index, 1);
        }
    }
}