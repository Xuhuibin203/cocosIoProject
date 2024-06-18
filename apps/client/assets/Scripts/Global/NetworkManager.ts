import { _decorator, resources, Asset } from "cc";
import Singleton from "../Base/Singleton";
import { IModel } from "../Common";

interface IItem {
    cb: Function;
    ctx: unknown;
}

//接口,加了?之后代表这个值可选
//增加泛型
interface ICallApiRet<T> {
    success: boolean,
    res?: T,
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
    //为其增加一个泛型,keyof 拿到枚举，这样T就是ApiMagEnum类型,data 拼上T类型之后得到api具体的对象req,res
    callApi<T extends keyof IModel["api"]>(name: T, data: IModel["api"][T]["req"]): Promise<ICallApiRet<IModel["api"][T]["res"]>> {
        return new Promise((resolve) => {
            try {
                const timer = setTimeout(() => {
                    resolve({ success: false, error: new Error("Time out") });   //防止超时
                    this.unlistenMsg(name as any, cb, null);
                }, 5000)
                const cb = (res) => {
                    resolve(res);
                    clearTimeout(timer);
                    this.unlistenMsg(name as any, cb, null);
                }
                this.listenMsg(name as any, cb, null);
                this.sendMsg(name as any, data);
            } catch (error) {
                resolve({ success: false, error });
            }
        })
    }

    //Msg并没有响应请求之分
    sendMsg<T extends keyof IModel["msg"]>(name: T, data: IModel["msg"][T]) {
        const msg = {
            name, data,
        }
        this.ws.send(JSON.stringify(msg));
    }

    listenMsg<T extends keyof IModel["msg"]>(name: T, cb: (args: IModel["msg"][T]) => void, ctx: unknown) {
        if (this.map.has(name)) {
            this.map.get(name).push({ cb, ctx });
        } else {
            this.map.set(name, [{ cb, ctx }])
        }
    }

    unlistenMsg<T extends keyof IModel["msg"]>(name: T, cb: (args: IModel["msg"][T]) => void, ctx: unknown) {
        if (this.map.has(name)) {
            const index = this.map.get(name).findIndex((i) => cb === i.cb && ctx === i.ctx);
            index > -1 && this.map.get(name).splice(index, 1);
        }
    }
}