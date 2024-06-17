import { _decorator, resources, Asset } from "cc";
import Singleton from "../Base/Singleton";

interface IItem {
    cb: Function;
    ctx: unknown;
}

//接口,加了?之后代表这个值可选
interface ICallApiRet {
    success: boolean,
    res?: any,
    error?: Error,
}

export class NetworkManager extends Singleton {
    static get Instance() {
        return super.GetInstance<NetworkManager>();
    }

    isConnected = false;    //是否连接成功
    port = 9876;
    ws: WebSocket;
    private map: Map<string, Array<IItem>> = new Map();

    connect() {
        return new Promise((resolve, reject) => {
            if (this.isConnected) {
                resolve(true);
                return;
            }
            this.ws = new WebSocket(`ws://localhost:${this.port}`);
            // this.ws = new WebSocket("ws://localhost:${this.port}");

            this.ws.onopen = () => {
                this.isConnected = true;
                resolve(true);
            }

            this.ws.onclose = () => {
                this.isConnected = false;
                reject(false);
            }

            this.ws.onerror = (e) => {
                this.isConnected = false;
                console.log(e);
                reject(false);
            }

            this.ws.onmessage = (e) => {
                try {
                    console.log("onmessage", e.data);
                    const josn = JSON.parse(e.data);
                    const { name, data } = josn;
                    if (this.map.has(name)) {
                        this.map.get(name).forEach(({ cb, ctx }) => {
                            cb.call(ctx, data);
                        })
                    }
                } catch (e) {
                    console.log(e);
                }
            }
        })
    }

    //通过Promise来封装发布订阅的模式
    //在BattleManager里调用这个方法
    callApi(name: string, data): Promise<ICallApiRet> {
        return new Promise((resolve) => {
            try {
                const timer = setTimeout(() => {
                    resolve({ success: false, error: new Error("Time out") });   //防止超时
                    this.unlistenMsg(name, cb, null);
                }, 5000)
                const cb = (res) => {
                    resolve(res);
                    clearTimeout(timer);
                    this.unlistenMsg(name, cb, null);
                }
                this.listenMsg(name, cb, null);
                this.sendMsg(name, data);
            } catch (error) {
                resolve({ success: false, error });
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
        if (this.map.has(name)) {
            this.map.get(name).push({ cb, ctx });
        } else {
            this.map.set(name, [{ cb, ctx }])
        }
    }

    unlistenMsg(name: string, cb: Function, ctx: unknown) {
        if (this.map.has(name)) {
            const index = this.map.get(name).findIndex((i) => cb === i.cb && ctx === i.ctx);
            index > -1 && this.map.get(name).splice(index, 1);
        }
    }
}