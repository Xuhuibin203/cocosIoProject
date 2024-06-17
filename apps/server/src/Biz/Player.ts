import { Connection } from "../Core";

export class Player {
    id: number
    nickname: string
    conncetion: Connection
    rid: number //房间号

    constructor({id,nickname,conncetion} : Pick<Player,'id' | 'nickname' | 'conncetion'>){
        this.id = id;
        this.conncetion = conncetion;
        this.nickname = nickname;
    }
}