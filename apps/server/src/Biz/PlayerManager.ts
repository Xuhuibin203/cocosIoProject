import Singleton from "../Base/Singleton";
import { ApiMsgEnum, IApiPlayerJoinReq } from "../Common";
import { Connection } from "../Core";
import { Player } from "./Player";
import { RoomManager } from "./RoomManager";

export class PlayerManager extends Singleton {
    //Instance 方法在这里起到了获取和管理 PlayerManager 单例实例的作用，它是实现单例模式的关键部分。
    static get Instance() {
        return super.GetInstance<PlayerManager>();
    }

    nextPlayerId = 1;

    //哈希存储时间复杂度O1
    players: Set<Player> = new Set();
    idMapPlayer: Map<number, Player> = new Map();

    createPlayer({ nickname, connection }: IApiPlayerJoinReq & { connection: Connection }) {
        const player = new Player({ id: this.nextPlayerId++, nickname, connection });
        this.players.add(player);
        this.idMapPlayer.set(player.id, player);
        return player;
    }
    removePlayer(pid: number) {
        const player = this.idMapPlayer.get(pid);
        if (player) {
            //移除房间的同时需要判断一下玩家是否在房间里
            const rid = player.rid;
            if (rid) {
                RoomManager.Instance.leaveRoom(rid, player.id);
                RoomManager.Instance.syncRooms();   //把房间信息同步给所有玩家
                RoomManager.Instance.syncRoom(rid);   //把进入房间后信息同步给所有玩家
            }
            this.idMapPlayer.delete(player.id);
            this.players.delete(player);
        }
    }

    //构造步骤   common/Enum添加新元组->msg编写新元组的接口->model定一下结构
    syncPlayers() {
        for (const player of this.players) {
            player.connection.sendMsg(ApiMsgEnum.MsgPlayerList, { list: this.getplayersView(), });

        }
    }

    getplayersView(players: Set<Player> = this.players) {
        return [...players].map((p) => this.getPlayerView(p));
    }

    //前端不需要conncetion
    getPlayerView({ id, nickname, rid }: Player) {
        return { id, nickname, rid };
    }
}