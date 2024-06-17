import Singleton from "../Base/Singleton";
import { Player } from "./Player";

export class PlayerManager extends Singleton {
    //Instance 方法在这里起到了获取和管理 PlayerManager 单例实例的作用，它是实现单例模式的关键部分。
    static get Instance() {
        return super.GetInstance<PlayerManager>();
    }

    nextPlayerId = 1;

    //哈希存储时间复杂度O1
    palyers: Set<Player> = new Set();
    idMapPlayer: Map<number, Player> = new Map();

    createPlayer({ nickname, conncetion }: any) {
        const player = new Player({ id: this.nextPlayerId++, nickname, conncetion });
        this.palyers.add(player);
        this.idMapPlayer.set(player.id,player);
        return player;
    }
    removePlayer(pid:number) {
        const player = this.idMapPlayer.get(pid);
        if(player){
            this.idMapPlayer.delete(player.id);
            this.palyers.delete(player);
        }
    }
    //前端不需要conncetion
    getPlayerView({id,nickname,rid}:Player){
        return {id,nickname,rid};
    }
}