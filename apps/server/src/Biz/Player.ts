import { Connection } from "../Core";

export class Player {
    id: number
    nickname: string
    connection: Connection
    rid: number //房间号

    constructor({id,nickname,connection} : Pick<Player,'id' | 'nickname' | 'connection'>){
        this.id = id;
        this.connection = connection;
        this.nickname = nickname;
    }
}