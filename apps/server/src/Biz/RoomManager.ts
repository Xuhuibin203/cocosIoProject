import Singleton from "../Base/Singleton";
import { ApiMsgEnum, IApiPlayerJoinReq } from "../Common";
import { Connection } from "../Core";
import { Player } from "./Player";
import { PlayerManager } from "./PlayerManager";
import { Room } from "./Room";

export class RoomManager extends Singleton {
    //Instance 方法在这里起到了获取和管理 PlayerManager 单例实例的作用，它是实现单例模式的关键部分。
    static get Instance() {
        return super.GetInstance<RoomManager>();
    }

    nextRoomId = 1;

    //哈希存储时间复杂度O1
    rooms: Set<Room> = new Set();
    idMapRoom: Map<number, Room> = new Map();

    //新建房间不需要参数
    createRoom() {
        const room = new Room(this.nextRoomId++);
        this.rooms.add(room);
        this.idMapRoom.set(room.id, room);
        return room;
    }

    joinRoom(rid: number, uid: number) {
        const room = this.idMapRoom.get(rid);
        if (room) {
            room.join(uid);
            return room;
        }
    }

    leaveRoom(rid: number, uid: number){
        const room = this.idMapRoom.get(rid);
        if(room){
            room.leave(uid);
        }
    }

    closeRoom(rid:number) {  
        const room = this.idMapRoom.get(rid);
        if(room){
            room.close();
            this.rooms.delete(room);
            this.idMapRoom.delete(room.id);
        }
    }

    startRoom(rid:number){
        const room = this.idMapRoom.get(rid);
        if(room){
            room.start();
        }
    }

    //构造步骤   common/Enum添加新元组->msg编写新元组的接口->model定一下结构
    syncRooms(){
        for (const player of PlayerManager.Instance.players) {
            player.connection.sendMsg(ApiMsgEnum.MsgRoomList,{list:this.getRoomsView(),});

        }
    }

    syncRoom(rid:number){
        const room = this.idMapRoom.get(rid);
        if(room){
            room.sync()
        }
    }

    getRoomsView(rooms: Set<Room> = this.rooms) {
        return [...rooms].map((p) => this.getRoomView(p));
    }

    getRoomView({ id, players }: Room) {
        return { id, players:PlayerManager.Instance.getplayersView(players) };
    }
}