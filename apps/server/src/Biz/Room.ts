import { ApiMsgEnum, EntityTypeEnum, IClienInput, IMsgClientSync, IState, InputTypeEnum } from "../Common";
import { Connection } from "../Core";
import { Player } from "./Player";
import { PlayerManager } from "./PlayerManager";
import { RoomManager } from "./RoomManager";

export class Room {
    id: number
    players: Set<Player> = new Set();

    lastTime: number;
    pendingInput: IClienInput[] = [];

    constructor(rid: number) {
        this.id = rid;
    }

    join(uid: number) {
        const player = PlayerManager.Instance.idMapPlayer.get(uid);
        if (player) {
            player.rid = this.id;
            this.players.add(player);
        }
    }

    leave(uid: number) {
        const player = PlayerManager.Instance.idMapPlayer.get(uid);
        if (player) {
            player.rid = undefined;
            this.players.delete(player);
            if (!this.players.size) {
                RoomManager.Instance.closeRoom(this.id);
            }
        }
    }

    close() {
        this.players.clear();
    }

    start() {
        const state: IState = {
            actors: [...this.players].map((player, index) => ({
                id: player.id,
                nickname: player.nickname,
                hp: 100,
                type: EntityTypeEnum.Actor1,	//角色渲染
                weaponType: EntityTypeEnum.Weapon1,	//武器渲染
                bulletType: EntityTypeEnum.Bullet2,	//子弹渲染
                position: { x: -150 + index * 300, y: -150 + index * 300 },
                direction: { x: 1, y: 0 }
            })),
            bullets: [],
            nextBulletId: 1,
        }
        console.log("debug", this.players.size);
        for (const player of this.players) {
            player.connection.sendMsg(ApiMsgEnum.MsgGameStart, {
                state,
            })
            player.connection.listenMsg(ApiMsgEnum.MsgClientSync, this.getClientMsg, this);
        }

        //定时器
        const timer1 = setInterval(() => {
            this.sendSeverMsg()
        }, 100);
        
        const timer2 = setInterval(() => {
            this.timePast()
        }, 16);
    }

    sync() {
        for (const player of this.players) {
            player.connection.sendMsg(ApiMsgEnum.MsgRoom, {
                room: RoomManager.Instance.getRoomView(this),
            })
        }
    }

    getClientMsg(connection, { input, frameId }: IMsgClientSync) {
        this.pendingInput.push(input);
    }

    sendSeverMsg() {
        const inputs = this.pendingInput;
        this.pendingInput = [];
        for (const player of this.players) {
            player.connection.sendMsg(ApiMsgEnum.MsgServerSync, {
                lastFrameId: 0,
                inputs,
            })
        }
    }

    timePast() {
        //如何获取dt?首先获取当前的时间,则会个方法会返回node进程的运行时间
        const now = process.uptime();
        const dt = now - (this.lastTime ?? now);
        this.pendingInput.push({
            type: InputTypeEnum.TimePast,
            dt,
        });
        this.lastTime = now; 
    }
}